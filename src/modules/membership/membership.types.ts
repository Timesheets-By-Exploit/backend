import mongoose from "mongoose";

export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type MembershipStatus = "ACTIVE" | "DISABLED" | "PENDING";

export interface IMembership extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateMembershipInput = {
  orgId: string;
  userId: string;
  role: MembershipRole;
  status?: MembershipStatus;
};

export type CreateMembershipOutput = {
  membershipId: string;
};
