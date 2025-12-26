import { Request, Response, NextFunction } from "express";
import AuthService from "./auth.service";
import {
  EmailVerificationOutput,
  LoginOutput,
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
import { setAuthCookies } from "./utils/auth.cookies";

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
      message: "Owner signup successful",
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
