import { Router } from "express";
import validateResource from "@middlewares/validators";
import authenticate from "@middlewares/authenticate";
import {
  changePasswordSchema,
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
  logoutUser,
  changePassword,
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
authRouter.post("/logout", logoutUser);
authRouter.post(
  "/change-password",
  authenticate,
  validateResource(changePasswordSchema),
  changePassword,
);

export default authRouter;
