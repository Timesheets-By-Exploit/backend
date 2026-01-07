import mongoose from "mongoose";
import OrganizationModel from "./organization.model";
import MembershipService from "@modules/membership/membership.service";
import UserService from "@modules/user/user.service";
import { IUser } from "@modules/user/user.types";
import {
  CreateOrganizationInput,
  CreateOrganizationOutput,
  IOrganization,
  InviteMemberInput,
  InviteMemberOutput,
  GetUserOrganizationOutput,
  PendingMembershipData,
} from "./organization.types";
import { ISuccessPayload, IErrorPayload } from "src/types";
import { generateRandomTokenWithCrypto } from "@utils/generators";
import { hashWithCrypto } from "@utils/encryptors";
import { convertTimeToMilliseconds } from "@utils/index";
import { sendInvitationEmail } from "./utils/invitationEmail";
import { IMembership } from "@modules/membership/membership.types";

const OrganizationService = {
  createOrganization: async (
    user: IUser,
    input: CreateOrganizationInput,
  ): Promise<ISuccessPayload<CreateOrganizationOutput> | IErrorPayload> => {
    const existingMembership = await MembershipService.getMembershipsByUser(
      user._id.toString(),
    );

    if (existingMembership.length > 0) {
      return {
        success: false,
        error: "User already has an organization",
      };
    }

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

  getUserOrganization: async (
    userId: string,
  ): Promise<ISuccessPayload<GetUserOrganizationOutput> | IErrorPayload> => {
    try {
      const memberships = await MembershipService.getMembershipsByUser(userId);

      if (memberships.length === 0) {
        return {
          success: false,
          error: "User does not have an organization",
        };
      }

      const membership = memberships[0];
      if (!membership)
        return {
          success: false,
          error: "User does not have an organization",
        };

      const organization = await OrganizationModel.findById(membership.orgId);

      if (!organization)
        return {
          success: false,
          error: "Organization not found",
        };

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

  getOrganizationMembers: async (
    userId: string,
  ): Promise<
    | ISuccessPayload<{
        members: Array<{
          membershipId: string;
          userId: string;
          firstName: string;
          lastName: string;
          email: string;
          role: string;
          status: string;
          joinedAt: Date;
        }>;
      }>
    | IErrorPayload
  > => {
    try {
      const orgResult = await OrganizationService.getUserOrganization(userId);

      if (!orgResult.success) {
        return {
          success: false,
          error: "User does not have an organization",
        };
      }

      const organization = (
        orgResult as ISuccessPayload<GetUserOrganizationOutput>
      ).data.organization;

      const memberships = await MembershipService.getMembershipsByOrg(
        organization._id.toString(),
      );

      const members = memberships.map((membership) => {
        const user = membership.userId as unknown as IUser;
        return {
          membershipId: membership._id.toString(),
          userId: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: membership.role,
          status: membership.status,
          joinedAt: membership.createdAt,
        };
      });

      return {
        success: true,
        data: { members },
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },

  inviteMember: async (
    inviter: IUser,
    input: InviteMemberInput,
  ): Promise<ISuccessPayload<InviteMemberOutput> | IErrorPayload> => {
    try {
      const memberships = await MembershipService.getMembershipsByUser(
        inviter._id.toString(),
      );

      if (memberships.length === 0)
        return {
          success: false,
          error: "User does not have an organization",
        };

      const inviterMembership = memberships[0];
      const organization = await OrganizationService.getOrganizationById(
        inviterMembership?.orgId?.toString() || "",
      );

      if (!organization)
        return {
          success: false,
          error: "Organization not found",
        };

      const existingUser = await UserService.getUserByEmail(input.email);

      let existingMembership: IMembership | null = null;
      if (existingUser) {
        existingMembership = await MembershipService.getMembershipByUserAndOrg(
          existingUser._id.toString(),
          organization._id.toString(),
        );
      }

      if (!existingMembership) {
        existingMembership = await MembershipService.getMembershipByEmailAndOrg(
          input.email,
          organization._id.toString(),
        );
      }

      if (existingMembership) {
        if (existingMembership.status !== "PENDING")
          return {
            success: false,
            error: "User is already a member of this organization",
          };
        return {
          success: false,
          error: "An invitation has already been sent to this email",
        };
      }

      const invitationToken = generateRandomTokenWithCrypto(32);
      const inviteTokenHash = hashWithCrypto(invitationToken);
      const inviteExpiresAt = new Date(
        Date.now() + convertTimeToMilliseconds(168, "hours"),
      );

      const membershipData: PendingMembershipData = {
        orgId: organization._id.toString(),
        role: input.role,
        status: "PENDING",
        inviteTokenHash, // Store hash
        inviteExpiresAt, // Store expiration
        invitedBy: inviter._id.toString(),
      };

      if (existingUser) {
        membershipData.userId = existingUser._id.toString();
      } else {
        membershipData.email = input.email;
      }

      const membershipResult =
        await MembershipService.createMembership(membershipData);

      if (!membershipResult.success) {
        return {
          success: false,
          error:
            (membershipResult as IErrorPayload).error ||
            "Failed to create membership invitation",
        };
      }

      const membershipId = (
        membershipResult as ISuccessPayload<{ membershipId: string }>
      ).data.membershipId;

      const owner = await UserService.getUserById(
        organization.owner.toString(),
      );
      const ownersName = owner
        ? `${owner.firstName} ${owner.lastName}`
        : "Organization Owner";

      const emailSentResponse = await sendInvitationEmail({
        email: input.email,
        role: input.role,
        organization,
        invitationToken,
        ownersName,
      });

      return {
        success: true,
        data: {
          invitationId: membershipId,
          emailSent: emailSentResponse.emailSent || false,
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
