import { Request, Response, NextFunction } from "express";
import TimeEntryService from "./time-entry.service";
import { routeTryCatcher } from "@utils/routeTryCatcher";
import { IUser } from "@modules/user/user.types";
import { IOrganization } from "@modules/organization/organization.types";
import AppError from "@utils/AppError";
import { IErrorPayload, ISuccessPayload } from "src/types";
import { TimeEntryOutput } from "./time-entry.types";

export const startTimeEntry = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    const org = req.userOrg as IOrganization;

    const result = await TimeEntryService.startTimeEntry(
      user._id.toString(),
      org._id.toString(),
      req.body,
    );

    if ((result as IErrorPayload).error) {
      return next(
        AppError.badRequest(
          (result as IErrorPayload).error || "Failed to start timer",
        ),
      );
    }

    return res.status(201).json({
      success: true,
      message: "Timer started successfully",
      data: (result as ISuccessPayload<TimeEntryOutput>).data,
    });
  },
);

export const stopTimeEntry = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;

    const result = await TimeEntryService.stopTimeEntry(user._id.toString());

    if ((result as IErrorPayload).error) {
      const error = (result as IErrorPayload).error;
      if (error === "No active timer found") {
        return next(AppError.notFound(error));
      }
      return next(AppError.badRequest(error || "Failed to stop timer"));
    }

    return res.status(200).json({
      success: true,
      message: "Timer stopped successfully",
      data: (result as ISuccessPayload<TimeEntryOutput>).data,
    });
  },
);

export const createManualEntry = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    const org = req.userOrg as IOrganization;

    const result = await TimeEntryService.createManualEntry(
      user._id.toString(),
      org._id.toString(),
      req.body,
    );

    if ((result as IErrorPayload).error) {
      return next(
        AppError.badRequest(
          (result as IErrorPayload).error || "Failed to create manual entry",
        ),
      );
    }

    return res.status(201).json({
      success: true,
      message: "Manual time entry created successfully",
      data: (result as ISuccessPayload<TimeEntryOutput>).data,
    });
  },
);

export const getActiveEntry = routeTryCatcher(
  async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const activeEntry = await TimeEntryService.getActiveEntry(
      user._id.toString(),
    );

    return res.status(200).json({
      success: true,
      message: "Active entry retrieved successfully",
      data: activeEntry,
    });
  },
);

export const listEntries = routeTryCatcher(
  async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const org = req.userOrg as IOrganization;
    const { projectId, startDate, endDate } = req.query;

    const entries = await TimeEntryService.listEntries(
      user._id.toString(),
      org._id.toString(),
      {
        projectId: projectId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Time entries retrieved successfully",
      data: entries,
    });
  },
);

export const updateEntry = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) return next(AppError.badRequest("Entry ID is required"));

    const result = await TimeEntryService.updateEntry(id, req.body);

    if ((result as IErrorPayload).error) {
      const error = (result as IErrorPayload).error;
      if (error === "Time entry not found") {
        return next(AppError.notFound(error));
      }
      return next(AppError.badRequest(error || "Failed to update entry"));
    }

    return res.status(200).json({
      success: true,
      message: "Time entry updated successfully",
      data: (result as ISuccessPayload<TimeEntryOutput>).data,
    });
  },
);

export const deleteEntry = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) return next(AppError.badRequest("Entry ID is required"));

    const result = await TimeEntryService.deleteEntry(id);

    if ((result as IErrorPayload).error) {
      const error = (result as IErrorPayload).error;
      if (error === "Time entry not found") {
        return next(AppError.notFound(error));
      }
      return next(AppError.badRequest(error || "Failed to delete entry"));
    }

    return res.status(200).json({
      success: true,
      message: "Time entry deleted successfully",
      data: null,
    });
  },
);
