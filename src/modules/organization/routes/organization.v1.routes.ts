import { Router } from "express";
import validateResource from "@middlewares/validators";
import authenticate from "@middlewares/authenticate";
import requireRole from "@middlewares/requireRole";
import { createOrganizationSchema } from "../organization.validators";
import {
  createOrganization,
  getOrganization,
  getOrganizationMembers,
} from "../organization.controller";

const organizationRouter = Router();

organizationRouter.post(
  "/",
  authenticate,
  validateResource(createOrganizationSchema),
  createOrganization,
);

organizationRouter.get("/", authenticate, getOrganization);

organizationRouter.get(
  "/members",
  authenticate,
  requireRole(["OWNER", "ADMIN"]),
  getOrganizationMembers,
);

export default organizationRouter;
