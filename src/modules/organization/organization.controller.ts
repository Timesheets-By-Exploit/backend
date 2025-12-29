import { Request, Response, NextFunction } from "express";
import OrganizationService from "./organization.service";
import {
  CreateOrganizationInput,
  CreateOrganizationOutput,
} from "./organization.types";
import AppError from "@utils/AppError";
import { IErrorPayload, ISuccessPayload } from "src/types";
import { routeTryCatcher } from "@utils/routeTryCatcher";
import { IUser } from "@modules/user/user.types";

export const createOrganization = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const input: CreateOrganizationInput = req.body;

    const result = await OrganizationService.createOrganization(
      req.user as IUser,
      input,
    );

    if ((result as IErrorPayload).error)
      return next(
        AppError.badRequest(
          (result as IErrorPayload).error || "Organization creation failed",
        ),
      );

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: (result as ISuccessPayload<CreateOrganizationOutput>).data,
    });
  },
);
