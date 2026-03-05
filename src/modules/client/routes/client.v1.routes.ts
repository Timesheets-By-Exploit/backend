import { Router } from "express";
import ClientController from "../client.controller";
import authenticate from "@middlewares/authenticate";
import validate from "@middlewares/validators";
import { createClientSchema, updateClientSchema } from "../client.validators";
import requireRole from "@middlewares/requireRole";
import { USER_ROLES } from "@constants";

const clientRouter = Router();

clientRouter.use(authenticate);

clientRouter.post(
  "/",
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  validate(createClientSchema),
  ClientController.createClient,
);
clientRouter.get(
  "/",
  requireRole([
    USER_ROLES.OWNER,
    USER_ROLES.MANAGER,
    USER_ROLES.MEMBER,
    USER_ROLES.VIEWER,
  ]),
  ClientController.getClients,
);
clientRouter.patch(
  "/:id",
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  validate(updateClientSchema),
  ClientController.updateClient,
);
clientRouter.delete(
  "/:id",
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  ClientController.deleteClient,
);

export default clientRouter;
