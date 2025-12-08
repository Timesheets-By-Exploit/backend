import mongoose, { Schema } from "mongoose";
import { IRefreshTokenDoc } from "./auth.types";

const RefreshTokenSchema = new Schema<IRefreshTokenDoc>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tokenHash: { type: String, required: true, index: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: () => new Date() },
  createdByIp: { type: String },
  userAgent: { type: String },
  revokedAt: { type: Date, default: null },
  revokedByIp: { type: String, default: null },
  replacedByToken: {
    type: Schema.Types.ObjectId,
    ref: "RefreshToken",
    default: null,
  },
  reason: { type: String, default: null },
});

export const RefreshTokenModel = mongoose.model<IRefreshTokenDoc>(
  "RefreshToken",
  RefreshTokenSchema,
);
