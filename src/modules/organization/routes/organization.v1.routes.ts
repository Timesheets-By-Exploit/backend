import { Router } from "express";
import validateResource from "@middlewares/validators";
import authenticate from "@middlewares/authenticate";
import requireRole from "@middlewares/requireRole";
import { USER_ROLES } from "@constants";

import {
  createOrganizationSchema,
  inviteMemberSchema,
  acceptInviteSchema,
  updateOrganizationSchema,
} from "../organization.validators";
import {
  createOrganization,
  getOrganization,
  getOrganizationMembers,
  inviteMember,
  acceptInvite,
  updateOrganization,
} from "../organization.controller";

const organizationRouter = Router();

organizationRouter.post(
  "/",
  authenticate,
  validateResource(createOrganizationSchema),
  createOrganization,
);

organizationRouter.get("/", authenticate, getOrganization);

organizationRouter.put(
  "/",
  authenticate,
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  validateResource(updateOrganizationSchema),
  updateOrganization,
);

organizationRouter.get(
  "/members",
  authenticate,
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  getOrganizationMembers,
);

organizationRouter.post(
  "/invite",
  authenticate,
  requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]),
  validateResource(inviteMemberSchema),
  inviteMember,
);

organizationRouter.post(
  "/invite/accept",
  authenticate,
  validateResource(acceptInviteSchema),
  acceptInvite,
);

export default organizationRouter;
