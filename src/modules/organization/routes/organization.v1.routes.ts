import { Router } from "express";
import validateResource from "@middlewares/validators";
import authenticate from "@middlewares/authenticate";
import {
  createOrganizationSchema,
  getOrganizationSchema,
} from "../organization.validators";
import {
  createOrganization,
  getOrganization,
} from "../organization.controller";

const organizationRouter = Router();

organizationRouter.post(
  "/",
  authenticate,
  validateResource(createOrganizationSchema),
  createOrganization,
);

organizationRouter.get(
  "/",
  authenticate,
  validateResource(getOrganizationSchema, "query"),
  getOrganization,
);

export default organizationRouter;
