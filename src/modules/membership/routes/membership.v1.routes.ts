import { Router } from "express";
import validateResource from "@middlewares/validators";
import authenticate from "@middlewares/authenticate";
import { createMembershipSchema } from "../membership.validators";
import { createMembership } from "../membership.controller";

const membershipRouter = Router();

membershipRouter.post(
  "/",
  authenticate,
  validateResource(createMembershipSchema),
  createMembership,
);

export default membershipRouter;
