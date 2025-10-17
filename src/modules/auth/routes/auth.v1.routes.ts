import { Router } from "express";
import validateResource from "@middlewares/validators";
import { signupSchema } from "../auth.validators";
import { signupOrganizationOwner } from "../auth.controller";

const authRouter = Router();

authRouter.post(
  "/signup",
  validateResource(signupSchema),
  signupOrganizationOwner,
);

export default authRouter;
