import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskOutput,
  TaskBase,
} from "./task.types";
import TaskModel from "./task.model";
import { ISuccessPayload, IErrorPayload, Mappable } from "src/types";

const mapToOutput = (doc: TaskBase & Mappable): TaskOutput => {
  const projectId = doc.projectId as unknown as
    | { _id?: { toString(): string } }
    | { toString(): string };
  return {
    id: doc._id.toString(),
    name: doc.name,
    projectId:
      ("_id" in projectId ? projectId._id?.toString() : projectId.toString()) ||
      "",
    orgId: doc.orgId.toString(),
    isBillable: doc.isBillable,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const TaskService = {
  createTask: async (
    input: CreateTaskInput,
  ): Promise<ISuccessPayload<TaskOutput> | IErrorPayload> => {
    try {
      const existingTask = await TaskModel.findOne({
        name: input.name,
        projectId: input.projectId,
      });

      if (existingTask) {
        return {
          success: false,
          error: "Task with this name already exists in the project",
        };
      }

      const task = new TaskModel(input);
      await task.save();

      return {
        success: true,
        data: mapToOutput(task as unknown as TaskBase & Mappable),
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },

  getTasksByOrgId: async (orgId: string): Promise<TaskOutput[]> => {
    const tasks = await TaskModel.find({
      orgId,
      status: { $ne: "ARCHIVED" },
    }).populate("projectId");
    return tasks.map((doc) =>
      mapToOutput(doc as unknown as TaskBase & Mappable),
    );
  },

  getTaskById: async (id: string): Promise<TaskOutput | null> => {
    const task = await TaskModel.findById(id).populate("projectId");
    return task ? mapToOutput(task as unknown as TaskBase & Mappable) : null;
  },

  updateTask: async (
    id: string,
    input: UpdateTaskInput,
  ): Promise<ISuccessPayload<TaskOutput> | IErrorPayload> => {
    try {
      const task = await TaskModel.findById(id);
      if (!task) {
        return {
          success: false,
          error: "Task not found",
        };
      }

      Object.assign(task, input);
      await task.save();

      return {
        success: true,
        data: mapToOutput(task as unknown as TaskBase & Mappable),
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },

  deleteTask: async (
    id: string,
  ): Promise<ISuccessPayload<{ message: string }> | IErrorPayload> => {
    try {
      const task = await TaskModel.findById(id);
      if (!task) {
        return {
          success: false,
          error: "Task not found",
        };
      }

      await TaskModel.findByIdAndDelete(id);

      return {
        success: true,
        data: { message: "Task deleted successfully" },
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },
};

export default TaskService;
