import { Request, Response, NextFunction } from "express";
import MembershipService from "./membership.service";
import {
  CreateMembershipInput,
  CreateMembershipOutput,
} from "./membership.types";
import AppError from "@utils/AppError";
import { IErrorPayload, ISuccessPayload } from "src/types";
import { routeTryCatcher } from "@utils/routeTryCatcher";

export const createMembership = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const input: CreateMembershipInput = req.body;

    const result = await MembershipService.createMembership(input);

    if ((result as IErrorPayload).error)
      return next(
        AppError.badRequest(
          (result as IErrorPayload).error || "Membership creation failed",
        ),
      );

    return res.status(201).json({
      success: true,
      message: "Membership created successfully",
      data: (result as ISuccessPayload<CreateMembershipOutput>).data,
    });
  },
);
