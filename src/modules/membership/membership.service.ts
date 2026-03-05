import mongoose from "mongoose";
import MembershipModel from "./membership.model";
import {
  CreateMembershipInput,
  CreateMembershipOutput,
  IMembership,
} from "./membership.types";
import { ISuccessPayload, IErrorPayload } from "src/types";

const MembershipService = {
  createMembership: async (
    input: CreateMembershipInput,
    session?: mongoose.ClientSession,
  ): Promise<ISuccessPayload<CreateMembershipOutput> | IErrorPayload> => {
    try {
      const membershipData: {
        orgId: string;
        userId?: string;
        email?: string;
        role: string;
        status: string;
        inviteTokenHash?: string;
        inviteExpiresAt?: Date;
        invitedBy?: string;
      } = {
        orgId: input.orgId,
        role: input.role,
        status: input.status || "ACTIVE",
      };

      if (input.userId) {
        membershipData.userId = input.userId;
      } else if (input.email) {
        membershipData.email = input.email;
      }

      if (input.inviteTokenHash) {
        membershipData.inviteTokenHash = input.inviteTokenHash;
      }
      if (input.inviteExpiresAt) {
        membershipData.inviteExpiresAt = input.inviteExpiresAt;
      }
      if (input.invitedBy) {
        membershipData.invitedBy = input.invitedBy;
      }

      const membership = new MembershipModel(membershipData);

      await membership.save({ session: session || null });

      return {
        success: true,
        data: {
          membershipId: membership._id.toString(),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },

  getPendingMembershipByHash: async (
    input: string,
    session?: mongoose.ClientSession | null,
  ): Promise<IMembership | null> => {
    return await MembershipModel.findOne({
      inviteTokenHash: input,
      status: "PENDING",
    }).session(session || null);
  },

  getMembershipById: async (id: string): Promise<IMembership | null> => {
    return await MembershipModel.findById(id);
  },

  getMembershipsByUser: async (userId: string): Promise<IMembership[]> => {
    return await MembershipModel.find({
      userId: new mongoose.Types.ObjectId(userId),
    });
  },

  getMembershipByUserAndOrg: async (
    userId: string,
    orgId: string,
    options?: { select: string },
  ): Promise<IMembership | null> => {
    return MembershipModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      orgId: new mongoose.Types.ObjectId(orgId),
    }).select(options?.select || "");
  },

  getMembershipsByOrg: async (orgId: string): Promise<IMembership[]> => {
    return await MembershipModel.find({
      orgId: new mongoose.Types.ObjectId(orgId),
    })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: 1 });
  },
  getMembershipByEmailAndOrg: async (
    email: string,
    orgId: string,
  ): Promise<IMembership | null> => {
    return await MembershipModel.findOne({
      email,
      orgId: new mongoose.Types.ObjectId(orgId),
    });
  },
};

export default MembershipService;
