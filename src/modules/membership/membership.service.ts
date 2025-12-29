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
      const membership = new MembershipModel({
        orgId: input.orgId,
        userId: input.userId,
        role: input.role,
        status: input.status || "ACTIVE",
      });

      if (session) await membership.save({ session });
      else await membership.save();

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
  ): Promise<IMembership | null> => {
    return await MembershipModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      orgId: new mongoose.Types.ObjectId(orgId),
    });
  },

  getMembershipsByOrg: async (orgId: string): Promise<IMembership[]> => {
    return await MembershipModel.find({
      orgId: new mongoose.Types.ObjectId(orgId),
    })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: 1 });
  },
};

export default MembershipService;
