import mongoose from "mongoose";

export type MembershipRole = "OWNER" | "MANAGER" | "MEMBER" | "VIEWER";
export type MembershipStatus = "ACTIVE" | "DISABLED" | "PENDING";

export interface IMembership extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
  email?: string | null;
  role: MembershipRole;
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
  role: MembershipRole;
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
