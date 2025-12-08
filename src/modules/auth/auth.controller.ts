import { Request, Response, NextFunction } from "express";
import AuthService from "./auth.service";
import {
  EmailVerificationOutput,
  SendEmailVerificationCodeOutput,
  SignupInput,
  SignupOutput,
} from "./auth.types";
import AppError from "@utils/AppError";
import { IErrorPayload, ISuccessPayload } from "src/types";
import UserService from "@modules/user/user.service";
import { routeTryCatcher } from "@utils/routeTryCatcher";
import { compareHashedBcryptString } from "@utils/encryptors";
import { convertTimeToMilliseconds } from "@utils/index";
import { serializeUser } from "@modules/user/user.utils";

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
    if (user.isEmailVerified !== true) {
      await AuthService.sendVerificationEmail(user);
      return next(AppError.forbidden("Please verify your email"));
    }
    const ip = req.ip;
    const userAgent = req.get("User-Agent") || "";
    const result = await AuthService.createTokensForUser(
      user,
      String(req.body.rememberMe) === "true",
      { ip, userAgent },
    );

    const secure = process.env.NODE_ENV === "production";

    res.cookie("access_token", result.data.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      maxAge: convertTimeToMilliseconds(15, "min"),
      path: "/",
    });

    res.cookie("refresh_token", result.data.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      maxAge: Math.max(0, result.data.expiresAt.getTime() - Date.now()),
      path: "/auth/refresh",
    });
    return res.json({
      success: true,
      user: serializeUser(user),
    });
  },
);
