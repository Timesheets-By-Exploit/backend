import { Router } from "express";
import validateResource from "@middlewares/validators";
import {
  resendEmailVerificationCodeSchema,
  signupSchema,
  verifyEmailSchema,
} from "../auth.validators";
import {
  signupOrganizationOwner,
  verifyEmailVerificationCode,
  resendEmailVerificationCode,
} from "../auth.controller";

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
authRouter.post(
  "/resend-verification-email",
  validateResource(resendEmailVerificationCodeSchema),
  resendEmailVerificationCode,
);

export default authRouter;
