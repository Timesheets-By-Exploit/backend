import mongoose from "mongoose";
import { UserRole, MembershipStatus } from "@constants";

export interface IMembership extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
  email?: string | null;
  role: UserRole;
  status: MembershipStatus;
  inviteTokenHash?: string | null;
  inviteExpiresAt?: Date | null;
  acceptedAt?: Date | null;
  joinedAt?: Date | null;
  invitedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateMembershipInput = {
  orgId: string;
  userId?: string;
  email?: string;
  role: UserRole;
  status?: MembershipStatus;
  inviteTokenHash?: string;
  inviteExpiresAt?: Date;
  invitedBy?: string;
};

export type CreateMembershipOutput = {
  membershipId: string;
};

export type MembershipData = {
  orgId: string;
  userId?: string;
  email?: string;
  role: string;
  status: string;
  inviteTokenHash?: string;
  inviteExpiresAt?: Date;
  invitedBy?: string;
};
