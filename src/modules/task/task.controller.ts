import { Request, Response } from "express";
import TaskService from "./task.service";
import ProjectService from "@modules/project/project.service";
import AppError from "@utils/AppError";
import { IErrorPayload } from "src/types";
import { routeTryCatcher } from "@utils/routeTryCatcher";

export const createTask = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { name, projectId, isBillable, orgId } = req.body;
    const userOrg = req.userOrg!;

    if (userOrg._id.toString() !== orgId) {
      throw AppError.forbidden(
        "You can only create tasks for your own organization",
      );
    }

    // Verify project belongs to organization
    const project = await ProjectService.getProjectById(projectId);
    if (!project || project.orgId.toString() !== userOrg._id.toString()) {
      throw AppError.badRequest(
        "Invalid project or project does not belong to your organization",
      );
    }

    const result = await TaskService.createTask({
      name,
      projectId,
      isBillable,
      orgId,
    });

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(201).json(result);
  },
);

export const getTasks = routeTryCatcher(async (req: Request, res: Response) => {
  const userOrg = req.userOrg!;
  const tasks = await TaskService.getTasksByOrgId(userOrg._id.toString());

  res.status(200).json({
    success: true,
    data: tasks,
  });
});

export const updateTask = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userOrg = req.userOrg!;

    if (!id) throw AppError.badRequest("Task ID is required");

    const task = await TaskService.getTaskById(id);
    if (!task) throw AppError.notFound("Task not found");

    if (userOrg._id.toString() !== task.orgId.toString()) {
      throw AppError.forbidden(
        "You do not have permission to update this task",
      );
    }

    const result = await TaskService.updateTask(id, req.body);

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(200).json(result);
  },
);

export const deleteTask = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userOrg = req.userOrg!;

    if (!id) throw AppError.badRequest("Task ID is required");

    const task = await TaskService.getTaskById(id);
    if (!task) throw AppError.notFound("Task not found");

    if (userOrg._id.toString() !== task.orgId.toString()) {
      throw AppError.forbidden(
        "You do not have permission to delete this task",
      );
    }

    const result = await TaskService.deleteTask(id);

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(200).json(result);
  },
);

export default {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
