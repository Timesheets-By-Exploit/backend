import { Request, Response, NextFunction } from "express";
import AuthService from "./auth.service";
import { SignupInput, SignupOutput } from "./auth.types";
import AppError from "@utils/AppError";
import { IErrorPayload, ISuccessPayload } from "src/types";

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
