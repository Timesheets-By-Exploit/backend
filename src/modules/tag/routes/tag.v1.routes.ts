import { Router } from "express";
import TagController from "../tag.controller";
import authenticate from "@middlewares/authenticate";
import validate from "@middlewares/validators";
import { createTagSchema, updateTagSchema } from "../tag.validators";
import requireRole from "@middlewares/requireRole";
import { USER_ROLES } from "@constants";

const tagRouter = Router();

tagRouter.use(authenticate);

tagRouter.post(
  "/",
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  validate(createTagSchema),
  TagController.createTag,
);
tagRouter.get(
  "/",
  requireRole([
    USER_ROLES.OWNER,
    USER_ROLES.MANAGER,
    USER_ROLES.MEMBER,
    USER_ROLES.VIEWER,
  ]),
  TagController.getTags,
);
tagRouter.patch(
  "/:id",
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  validate(updateTagSchema),
  TagController.updateTag,
);
tagRouter.delete(
  "/:id",
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  TagController.deleteTag,
);

export default tagRouter;
