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
      required: true,
    },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DISABLED", "PENDING"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

membershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });

const MembershipModel = mongoose.model<IMembership>(
  "Membership",
  membershipSchema,
);

export default MembershipModel;
