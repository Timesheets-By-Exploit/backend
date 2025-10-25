import { Router } from "express";
import validateResource from "@middlewares/validators";
import { signupSchema, verifyEmailSchema } from "../auth.validators";
import { signupOrganizationOwner, verifyEmailVerificationCode } from "../auth.controller";

const authRouter = Router();

authRouter.post(
  "/signup",
  validateResource(signupSchema),
  signupOrganizationOwner,
);
authRouter.post(
  "/verify-email",
  validateResource(verifyEmailSchema),
  verifyEmailVerificationCode,
);

export default authRouter;
