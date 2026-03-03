import mongoose from "mongoose";
import TimeEntryModel from "./time-entry.model";
import UserModel from "@modules/user/user.model";
import {
  ITimeEntry,
  CreateTimeEntryInput,
  StartTimeEntryInput,
  UpdateTimeEntryInput,
  TimeEntryOutput,
  TimeEntryBase,
} from "./time-entry.types";
import { ISuccessPayload, IErrorPayload, Mappable } from "src/types";

const mapToOutput = (doc: TimeEntryBase & Mappable): TimeEntryOutput => {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    orgId: doc.orgId.toString(),
    projectId: doc.projectId?.toString(),
    taskId: doc.taskId?.toString(),
    description: doc.description,
    startTime: doc.startTime,
    endTime: doc.endTime ?? null,
    duration: doc.duration,
    isBillable: doc.isBillable,
    isManual: doc.isManual,
    tags: doc.tags?.map((t) => t.toString()) || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const TimeEntryService = {
  /**
   * Start a new timer.
   * If an active timer already exists, it stops it first.
   */
  startTimeEntry: async (
    userId: string,
    orgId: string,
    input: StartTimeEntryInput,
  ): Promise<ISuccessPayload<TimeEntryOutput> | IErrorPayload> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await UserModel.findById(userId).session(session);
      if (!user) throw new Error("User not found");

      // Auto-stop previous timer if exists
      if (user.activeTimerId) {
        await TimeEntryModel.findByIdAndUpdate(
          user.activeTimerId,
          { endTime: new Date() },
          { session },
        );
      }

      const startTime = input.startTime
        ? new Date(input.startTime)
        : new Date();

      const timeEntry = new TimeEntryModel({
        userId,
        orgId,
        projectId: input.projectId,
        taskId: input.taskId,
        description: input.description,
        startTime,
        endTime: null,
        isBillable: input.isBillable ?? true,
        isManual: false,
        tags: input.tags,
      });

      await timeEntry.save({ session });

      user.activeTimerId = timeEntry._id as mongoose.Types.ObjectId;
      await user.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        data: mapToOutput(timeEntry as unknown as TimeEntryBase & Mappable),
      };
    } catch (err) {
      if (session.inTransaction()) await session.abortTransaction();
      return { success: false, error: (err as Error).message };
    } finally {
      session.endSession();
    }
  },

  /**
   * Stop the currently active timer.
   */
  stopTimeEntry: async (
    userId: string,
  ): Promise<ISuccessPayload<TimeEntryOutput> | IErrorPayload> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await UserModel.findById(userId).session(session);
      if (!user || !user.activeTimerId) {
        throw new Error("No active timer found");
      }

      const timeEntry = await TimeEntryModel.findById(
        user.activeTimerId,
      ).session(session);
      if (!timeEntry) throw new Error("Active time entry not found");

      timeEntry.endTime = new Date();
      await timeEntry.save({ session });

      user.activeTimerId = null;
      await user.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        data: mapToOutput(timeEntry as unknown as TimeEntryBase & Mappable),
      };
    } catch (err) {
      if (session.inTransaction()) await session.abortTransaction();
      return { success: false, error: (err as Error).message };
    } finally {
      session.endSession();
    }
  },

  /**
   * Create a manual time entry (already completed).
   */
  createManualEntry: async (
    userId: string,
    orgId: string,
    input: CreateTimeEntryInput,
  ): Promise<ISuccessPayload<TimeEntryOutput> | IErrorPayload> => {
    try {
      const timeEntry = new TimeEntryModel({
        userId,
        orgId,
        projectId: input.projectId,
        taskId: input.taskId,
        description: input.description,
        startTime: new Date(input.startTime),
        endTime: input.endTime ? new Date(input.endTime) : new Date(),
        isBillable: input.isBillable ?? true,
        isManual: true,
        tags: input.tags,
      });

      await timeEntry.save();

      return {
        success: true,
        data: mapToOutput(timeEntry as unknown as TimeEntryBase & Mappable),
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },

  /**
   * Get the active time entry for a user.
   */
  getActiveEntry: async (userId: string): Promise<TimeEntryOutput | null> => {
    const user = await UserModel.findById(userId)
      .select("activeTimerId")
      .lean();
    if (!user?.activeTimerId) return null;

    const entry = await TimeEntryModel.findById(user.activeTimerId).lean();
    return entry
      ? mapToOutput(entry as unknown as TimeEntryBase & Mappable)
      : null;
  },

  /**
   * List time entries with filters.
   */
  listEntries: async (
    userId: string,
    orgId: string,
    filters: {
      projectId?: string | undefined;
      startDate?: Date | undefined;
      endDate?: Date | undefined;
    } = {},
  ): Promise<TimeEntryOutput[]> => {
    const query: mongoose.FilterQuery<ITimeEntry> = { userId, orgId };

    if (filters.projectId)
      query.projectId = new mongoose.Types.ObjectId(filters.projectId);
    if (filters.startDate || filters.endDate) {
      query.startTime = {};
      if (filters.startDate) query.startTime.$gte = filters.startDate;
      if (filters.endDate) query.startTime.$lte = filters.endDate;
    }

    const entries = await TimeEntryModel.find(query)
      .sort({ startTime: -1 })
      .lean();
    return entries.map((doc) =>
      mapToOutput(doc as unknown as TimeEntryBase & Mappable),
    );
  },

  getEntryById: async (id: string): Promise<ITimeEntry | null> => {
    return await TimeEntryModel.findById(id);
  },

  updateEntry: async (
    id: string,
    input: UpdateTimeEntryInput,
  ): Promise<ISuccessPayload<TimeEntryOutput> | IErrorPayload> => {
    try {
      const timeEntry = await TimeEntryModel.findById(id);
      if (!timeEntry) return { success: false, error: "Time entry not found" };

      if (input.projectId !== undefined) {
        timeEntry.projectId =
          input.projectId as unknown as mongoose.Types.ObjectId;
      }
      if (input.taskId !== undefined) {
        timeEntry.taskId = input.taskId as unknown as mongoose.Types.ObjectId;
      }
      if (input.description !== undefined) {
        timeEntry.description = input.description;
      }
      if (input.startTime !== undefined) {
        timeEntry.startTime = new Date(input.startTime);
      }
      if (input.endTime !== undefined) {
        timeEntry.endTime = input.endTime ? new Date(input.endTime) : null;
      }
      if (input.isBillable !== undefined) {
        timeEntry.isBillable = input.isBillable;
      }
      if (input.tags !== undefined) {
        timeEntry.tags = input.tags as unknown as mongoose.Types.ObjectId[];
      }

      await timeEntry.save();

      return {
        success: true,
        data: mapToOutput(timeEntry as unknown as TimeEntryBase & Mappable),
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },

  deleteEntry: async (
    id: string,
  ): Promise<ISuccessPayload<null> | IErrorPayload> => {
    try {
      const result = await TimeEntryModel.findByIdAndDelete(id);
      if (!result) return { success: false, error: "Time entry not found" };

      return { success: true, data: null };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },
};

export default TimeEntryService;
