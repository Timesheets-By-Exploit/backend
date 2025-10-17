import { Request, Response, NextFunction } from "express";
import AuthService from "./auth.service";
import { IErrorPayload, ISignupPayload, SignupInput } from "./auth.types";
import AppError from "@utils/AppError";

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
      data: (result as ISignupPayload).data,
    });
  } catch (err) {
    next(err);
  }
};
