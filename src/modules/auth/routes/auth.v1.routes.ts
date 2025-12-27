import { Router } from "express";
import validateResource from "@middlewares/validators";
import authenticate from "@middlewares/authenticate";
import {
  loginSchema,
  resendEmailVerificationCodeSchema,
  signupSchema,
  verifyEmailSchema,
} from "../auth.validators";
import {
  signupOrganizationOwner,
  verifyEmailVerificationCode,
  resendEmailVerificationCode,
  loginUser,
  refreshToken,
  getCurrentUser,
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
authRouter.post("/login", validateResource(loginSchema), loginUser);
authRouter.get("/refresh", refreshToken);
authRouter.get("/me", authenticate, getCurrentUser);

export default authRouter;
