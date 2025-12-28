import { Request, Response, NextFunction } from "express";
import AuthService from "./auth.service";
import {
  ChangePasswordOutput,
  EmailVerificationOutput,
  ForgotPasswordOutput,
  GetMeOutput,
  LoginOutput,
  LogoutOutput,
  ResetPasswordOutput,
  SendEmailVerificationCodeOutput,
  SignupInput,
  SignupOutput,
} from "./auth.types";
import AppError from "@utils/AppError";
import { IErrorPayload, ISuccessPayload } from "src/types";
import UserService from "@modules/user/user.service";
import { routeTryCatcher } from "@utils/routeTryCatcher";
import { compareHashedBcryptString } from "@utils/encryptors";
import { serializeUser } from "@modules/user/user.utils";
import { setAuthCookies, clearAuthCookies } from "./utils/auth.cookies";

export const signupOrganizationOwner = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const input: SignupInput = req.body;

    const result = await AuthService.signupOwner(input);

    if ((result as IErrorPayload).error)
      return next(
        AppError.badRequest((result as IErrorPayload).error || "Signup failed"),
      );

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      data: (result as ISuccessPayload<SignupOutput>).data,
    });
  },
);

export const verifyEmailVerificationCode = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.verifyEmailVerificationCode(
      req.body.emailVerificationCode,
      req.body.email,
    );
    if (!result.success)
      return next(
        AppError.badRequest(
          (result as IErrorPayload).error || "Email verification failed",
        ),
      );
    return res
      .status(200)
      .json(result as ISuccessPayload<EmailVerificationOutput>);
  },
);

export const resendEmailVerificationCode = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserService.getUserByEmail(req.body.email);
    if (!user) return next(AppError.badRequest("User not found"));
    const result = await AuthService.sendVerificationEmail(user);
    if (!result.success)
      return next(
        AppError.badRequest(
          (result as IErrorPayload).error ||
            "Failed to resend email verification code",
        ),
      );
    return res
      .status(200)
      .json(result as ISuccessPayload<SendEmailVerificationCodeOutput>);
  },
);

export const loginUser = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserService.getUserByEmail(req.body.email);
    if (!user) return next(AppError.badRequest("Invalid credentials"));
    const isValidPassword = await compareHashedBcryptString(
      req.body.password,
      user.password,
    );
    if (!isValidPassword)
      return next(AppError.badRequest("Invalid credentials"));
    if (user.isEmailVerified !== true)
      return next(AppError.forbidden("Email not verified"));
    const ip = req.ip;
    const userAgent = req.get("User-Agent") || "";
    const result = await AuthService.createTokensForUser(
      user,
      String(req.body.rememberMe) === "true",
      { ip, userAgent },
    );

    setAuthCookies({
      res,
      refreshToken: result.data.refreshToken,
      refreshTokenExpiresAt: result.data.expiresAt,
      accessToken: result.data.accessToken,
    });

    return res.json({
      success: true,
      data: {
        user: serializeUser(user),
      },
    } as ISuccessPayload<LoginOutput>);
  },
);

export const refreshToken = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.signedCookies?.refresh_token;
    if (!token) return next(AppError.unauthorized("Unauthenticated"));

    const result = await AuthService.rotateRefreshToken(token, req.ip);
    if (!result.success) {
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
      return next(AppError.unauthorized(result.error || "Session expired"));
    }

    setAuthCookies({
      res,
      refreshToken: result.data.refreshToken,
      refreshTokenExpiresAt: result.data.expiresAt,
      accessToken: result.data.accessToken,
    });

    return res.json({ success: true });
  },
);

export const getCurrentUser = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(AppError.unauthorized("User not found"));
    }

    return res.json({
      success: true,
      data: {
        user: serializeUser(user),
      },
    } as ISuccessPayload<GetMeOutput>);
  },
);

export const logoutUser = routeTryCatcher(
  async (req: Request, res: Response) => {
    const token = req.signedCookies?.refresh_token;
    clearAuthCookies(res);
    if (!token) {
      return res.json({
        success: true,
        data: { message: "Logged out successfully" },
      } as ISuccessPayload<LogoutOutput>);
    }

    const result = await AuthService.logout(token, req.ip);
    if (!result.success) {
      return res.json({
        success: true,
        data: { message: "Logged out successfully" },
      } as ISuccessPayload<LogoutOutput>);
    }
    return res.json({
      success: true,
      data: (result as ISuccessPayload<LogoutOutput>).data,
    } as ISuccessPayload<LogoutOutput>);
  },
);

export const changePassword = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) return next(AppError.unauthorized("User not found"));

    const result = await AuthService.changePassword(
      user,
      req.body.currentPassword,
      req.body.newPassword,
    );

    if (!result.success)
      return next(
        AppError.badRequest(
          (result as IErrorPayload).error || "Password change failed",
        ),
      );

    return res.json({
      success: true,
      data: (result as ISuccessPayload<ChangePasswordOutput>).data,
    } as ISuccessPayload<ChangePasswordOutput>);
  },
);

export const forgotPassword = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.sendPasswordResetEmail(req.body.email);
    if (!result.success)
      return next(
        AppError.badRequest(
          (result as IErrorPayload).error ||
            "Failed to send password reset email",
        ),
      );
    return res
      .status(200)
      .json(result as ISuccessPayload<ForgotPasswordOutput>);
  },
);

export const resetPassword = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.resetPassword(
      req.body.email,
      req.body.passwordResetCode,
      req.body.newPassword,
    );
    if (!result.success)
      return next(
        AppError.badRequest(
          (result as IErrorPayload).error || "Password reset failed",
        ),
      );
    return res.json({
      success: true,
      data: (result as ISuccessPayload<ResetPasswordOutput>).data,
    } as ISuccessPayload<ResetPasswordOutput>);
  },
);
