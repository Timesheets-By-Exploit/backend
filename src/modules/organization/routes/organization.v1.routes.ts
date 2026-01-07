import { Router } from "express";
import validateResource from "@middlewares/validators";
import authenticate from "@middlewares/authenticate";
import requireRole from "@middlewares/requireRole";
import {
  createOrganizationSchema,
  inviteMemberSchema,
} from "../organization.validators";
import {
  createOrganization,
  getOrganization,
  getOrganizationMembers,
  inviteMember,
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
  requireRole(["OWNER", "MANAGER"]),
  getOrganizationMembers,
);

organizationRouter.post(
  "/invite",
  authenticate,
  requireRole(["OWNER", "MANAGER"]),
  validateResource(inviteMemberSchema),
  inviteMember,
);

export default organizationRouter;
