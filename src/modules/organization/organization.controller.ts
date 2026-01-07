import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import OrganizationService from "./organization.service";
import MembershipService from "@modules/membership/membership.service";
import { hashWithCrypto } from "@utils/encryptors";
import {
  CreateOrganizationInput,
  CreateOrganizationOutput,
  GetOrganizationOutput,
  GetOrganizationMembersOutput,
  InviteMemberOutput,
  GetUserOrganizationOutput,
} from "./organization.types";
import AppError from "@utils/AppError";
import { IErrorPayload, ISuccessPayload } from "src/types";
import { routeTryCatcher } from "@utils/routeTryCatcher";
import { IUser } from "@modules/user/user.types";
import { IMembership } from "@modules/membership/membership.types";

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
      result as ISuccessPayload<GetUserOrganizationOutput>
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

export const getOrganizationMembers = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    if (!user) return next(AppError.unauthorized("User not found"));

    const result = await OrganizationService.getOrganizationMembers(
      user._id.toString(),
    );

    if ((result as IErrorPayload).error) {
      const error = (result as IErrorPayload).error;
      if (error === "User does not have an organization") {
        return next(AppError.notFound(error));
      }
      return next(AppError.badRequest(error));
    }

    const output: GetOrganizationMembersOutput = (
      result as ISuccessPayload<GetOrganizationMembersOutput>
    ).data;

    return res.status(200).json({
      success: true,
      message: "Organization members retrieved successfully",
      data: output,
    });
  },
);

export const inviteMember = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;

    const result = await OrganizationService.inviteMember(user, req.body);

    if ((result as IErrorPayload).error) {
      const error = (result as IErrorPayload).error;
      if (error === "User does not have an organization")
        return next(AppError.notFound(error));
      return next(AppError.badRequest(error || "Failed to send invitation"));
    }

    const output: InviteMemberOutput = (
      result as ISuccessPayload<InviteMemberOutput>
    ).data;

    return res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
      data: output,
    });
  },
);

export const acceptInvite = routeTryCatcher(
  async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { token } = req.body;
      const user = req.user as IUser;

      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return next(AppError.unauthorized("Authentication required"));
      }

      const existingMemberships = await MembershipService.getMembershipsByUser(
        user._id.toString(),
      );
      const activeMembership = existingMemberships.find(
        (m: IMembership) => m.status === "ACTIVE",
      );

      if (activeMembership) {
        await session.abortTransaction();
        session.endSession();
        return next(
          AppError.conflict("User already belongs to an organization"),
        );
      }

      const inviteTokenHash = hashWithCrypto(token);

      const membership = await MembershipService.getPendingMembershipByHash(
        inviteTokenHash,
        session,
      );

      if (!membership) {
        await session.abortTransaction();
        session.endSession();
        return next(AppError.notFound("Invite not found"));
      }

      if (
        membership.inviteExpiresAt &&
        new Date() > membership.inviteExpiresAt
      ) {
        await session.abortTransaction();
        session.endSession();
        return next(new AppError("Invite expired", 410));
      }

      if (
        membership.email &&
        membership.email.toLowerCase() !== user.email.toLowerCase()
      ) {
        await session.abortTransaction();
        session.endSession();
        return next(AppError.forbidden("Invite email mismatch"));
      }

      membership.status = "ACTIVE";
      membership.userId = user._id;
      membership.acceptedAt = new Date();
      membership.joinedAt = new Date();
      membership.inviteTokenHash = null;
      membership.inviteExpiresAt = null;

      await membership.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Invitation accepted successfully",
        data: {
          membershipId: membership._id,
          orgId: membership.orgId,
        },
      });
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      return next(AppError.internal((err as Error).message));
    } finally {
      session.endSession();
    }
  },
);
