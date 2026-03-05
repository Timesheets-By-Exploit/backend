import mongoose, { Schema } from "mongoose";
import { IMembership } from "./membership.types";
import { USER_ROLES, MEMBERSHIP_STATUS } from "@constants";

const membershipSchema = new Schema<IMembership>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function (this: IMembership) {
        return this.status !== "PENDING";
      },
    },
    email: {
      type: String,
      required: function (this: IMembership) {
        return this.status === "PENDING" && !this.userId;
      },
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.ACTIVE,
    },
    inviteTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

const MembershipModel = mongoose.model<IMembership>(
  "Membership",
  membershipSchema,
);

export default MembershipModel;
