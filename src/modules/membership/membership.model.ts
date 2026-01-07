import mongoose, { Schema } from "mongoose";
import { IMembership } from "./membership.types";

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
      enum: ["OWNER", "MANAGER", "MEMBER", "VIEWER"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DISABLED", "PENDING"],
      default: "ACTIVE",
    },
    invitationToken: {
      type: String,
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
