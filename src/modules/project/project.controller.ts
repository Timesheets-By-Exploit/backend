import { Request, Response } from "express";
import ProjectService from "./project.service";
import AppError from "@utils/AppError";
import { IErrorPayload } from "src/types";
import { routeTryCatcher } from "@utils/routeTryCatcher";

export const createProject = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { name, clientId, color, isBillable, orgId } = req.body;
    const userOrg = req.userOrg!;

    if (userOrg._id.toString() !== orgId) {
      throw AppError.forbidden(
        "You can only create projects for your own organization",
      );
    }

    const result = await ProjectService.createProject({
      name,
      clientId,
      color,
      isBillable,
      orgId,
    });

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(201).json(result);
  },
);

export const getProjects = routeTryCatcher(
  async (req: Request, res: Response) => {
    const userOrg = req.userOrg!;
    const projects = await ProjectService.getProjectsByOrgId(
      userOrg._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: projects,
    });
  },
);

export const updateProject = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userOrg = req.userOrg!;

    if (!id) throw AppError.badRequest("Project ID is required");

    const project = await ProjectService.getProjectById(id);
    if (!project) throw AppError.notFound("Project not found");

    if (userOrg._id.toString() !== project.orgId.toString()) {
      throw AppError.forbidden(
        "You do not have permission to update this project",
      );
    }

    const result = await ProjectService.updateProject(id, req.body);

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(200).json(result);
  },
);

export const deleteProject = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userOrg = req.userOrg!;

    if (!id) throw AppError.badRequest("Project ID is required");

    const project = await ProjectService.getProjectById(id);
    if (!project) throw AppError.notFound("Project not found");

    if (userOrg._id.toString() !== project.orgId.toString()) {
      throw AppError.forbidden(
        "You do not have permission to delete this project",
      );
    }

    const result = await ProjectService.deleteProject(id);

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(200).json(result);
  },
);

export default {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
};
