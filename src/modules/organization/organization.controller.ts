import { Request, Response, NextFunction } from "express";
import OrganizationService from "./organization.service";
import {
  CreateOrganizationInput,
  CreateOrganizationOutput,
  GetOrganizationOutput,
  IOrganization,
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

    if ((result as IErrorPayload).error) {
      const error = (result as IErrorPayload).error;
      if (error === "User already has an organization") {
        return next(AppError.conflict(error));
      }
      return next(AppError.badRequest(error || "Organization creation failed"));
    }

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: (result as ISuccessPayload<CreateOrganizationOutput>).data,
    });
  },
);

export const getOrganization = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    const result = await OrganizationService.getUserOrganization(
      user._id.toString(),
    );

    if ((result as IErrorPayload).error) {
      const error = (result as IErrorPayload).error;
      if (error === "User does not have an organization") {
        return next(AppError.notFound(error));
      }
      if (error === "Organization not found") {
        return next(AppError.notFound(error));
      }
      return next(AppError.badRequest(error));
    }

    const { organization, role } = (
      result as ISuccessPayload<{
        organization: IOrganization;
        role: string;
      }>
    ).data;

    const output: GetOrganizationOutput = {
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        ...(organization.domain && { domain: organization.domain }),
        ...(organization.description && {
          description: organization.description,
        }),
        status: organization.status,
        size: organization.size,
        settings: organization.settings,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },
      role,
    };

    return res.status(200).json({
      success: true,
      message: "Organization retrieved successfully",
      data: output,
    });
  },
);
