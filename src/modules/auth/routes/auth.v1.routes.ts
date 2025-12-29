import { Router } from "express";
import validateResource from "@middlewares/validators";
import authenticate from "@middlewares/authenticate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resendEmailVerificationCodeSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from "../auth.validators";
import {
  signup,
  verifyEmailVerificationCode,
  resendEmailVerificationCode,
  loginUser,
  refreshToken,
  getCurrentUser,
  logoutUser,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../auth.controller";

const authRouter = Router();

authRouter.post("/signup", validateResource(signupSchema), signup);
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
authRouter.post(
  "/forgot-password",
  validateResource(forgotPasswordSchema),
  forgotPassword,
);
authRouter.post(
  "/reset-password",
  validateResource(resetPasswordSchema),
  resetPassword,
);

export default authRouter;
