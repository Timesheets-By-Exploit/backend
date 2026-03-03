import { Router } from "express";
import ProjectController from "../project.controller";
import authenticate from "@middlewares/authenticate";
import validate from "@middlewares/validators";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../project.validators";
import requireRole from "@middlewares/requireRole";
import { USER_ROLES } from "@constants";

const projectRouter = Router();

projectRouter.use(authenticate);

projectRouter.post(
  "/",
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  validate(createProjectSchema),
  ProjectController.createProject,
);
projectRouter.get(
  "/",
  requireRole([
    USER_ROLES.OWNER,
    USER_ROLES.MANAGER,
    USER_ROLES.MEMBER,
    USER_ROLES.VIEWER,
  ]),
  ProjectController.getProjects,
);
projectRouter.patch(
  "/:id",
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  validate(updateProjectSchema),
  ProjectController.updateProject,
);
projectRouter.delete(
  "/:id",
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  ProjectController.deleteProject,
);

export default projectRouter;
