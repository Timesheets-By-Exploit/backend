import mongoose from "mongoose";
import OrganizationModel from "./organization.model";
import MembershipService from "@modules/membership/membership.service";
import { IUser } from "@modules/user/user.types";
import {
  CreateOrganizationInput,
  CreateOrganizationOutput,
  IOrganization,
} from "./organization.types";
import { ISuccessPayload, IErrorPayload } from "src/types";

const OrganizationService = {
  createOrganization: async (
    user: IUser,
    input: CreateOrganizationInput,
  ): Promise<ISuccessPayload<CreateOrganizationOutput> | IErrorPayload> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const organization = new OrganizationModel({
        name: input.name,
        owner: user._id,
        size: input.size,
        domain: input.domain,
        description: input.description,
      });

      await organization.save({ session });

      const membershipResult = await MembershipService.createMembership(
        {
          orgId: organization._id.toString(),
          userId: user._id.toString(),
          role: "OWNER",
          status: "ACTIVE",
        },
        session,
      );

      if (!membershipResult.success) {
        throw new Error(
          (membershipResult as IErrorPayload).error ||
            "Failed to create membership",
        );
      }

      await session.commitTransaction();

      return {
        success: true,
        data: {
          organizationId: organization._id.toString(),
          membershipId: (
            membershipResult as ISuccessPayload<{
              membershipId: string;
            }>
          ).data.membershipId,
        },
      };
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      return {
        success: false,
        error: (err as Error).message,
      };
    } finally {
      session.endSession();
    }
  },

  getOrganizationById: async (id: string): Promise<IOrganization | null> => {
    return await OrganizationModel.findById(id);
  },

  getOrganizationsByOwner: async (
    ownerId: string,
  ): Promise<IOrganization[]> => {
    return await OrganizationModel.find({
      owner: new mongoose.Types.ObjectId(ownerId),
    });
  },

  getOrganizationWithUserRole: async (
    orgId: string,
    userId: string,
  ): Promise<
    | ISuccessPayload<{
        organization: IOrganization;
        role: string;
      }>
    | IErrorPayload
  > => {
    try {
      const organization = await OrganizationModel.findById(orgId);
      if (!organization) {
        return {
          success: false,
          error: "Organization not found",
        };
      }

      const membership = await MembershipService.getMembershipByUserAndOrg(
        userId,
        orgId,
      );

      if (!membership) {
        return {
          success: false,
          error: "User is not a member of this organization",
        };
      }

      return {
        success: true,
        data: {
          organization,
          role: membership.role,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },
};

export default OrganizationService;
