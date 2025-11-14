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

export const signupOrganizationOwner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

export const verifyEmailVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

export const resendEmailVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
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
  } catch (err) {
    next(err);
  }
};
