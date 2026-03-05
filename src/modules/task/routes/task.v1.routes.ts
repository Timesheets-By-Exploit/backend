import { Router } from "express";
import TaskController from "../task.controller";
import authenticate from "@middlewares/authenticate";
import validate from "@middlewares/validators";
import { createTaskSchema, updateTaskSchema } from "../task.validators";
import requireRole from "@middlewares/requireRole";
import { USER_ROLES } from "@constants";

const taskRouter = Router();

taskRouter.use(authenticate);

taskRouter.post(
  "/",
  requireRole([USER_ROLES.MANAGER, USER_ROLES.OWNER]),
  validate(createTaskSchema),
  TaskController.createTask,
);
taskRouter.get(
  "/",
  requireRole([
    USER_ROLES.MANAGER,
    USER_ROLES.OWNER,
    USER_ROLES.MEMBER,
    USER_ROLES.VIEWER,
  ]),
  TaskController.getTasks,
);
taskRouter.patch(
  "/:id",
  requireRole([USER_ROLES.MANAGER, USER_ROLES.OWNER]),
  validate(updateTaskSchema),
  TaskController.updateTask,
);
taskRouter.delete(
  "/:id",
  requireRole([USER_ROLES.MANAGER, USER_ROLES.OWNER]),
  TaskController.deleteTask,
);

export default taskRouter;
