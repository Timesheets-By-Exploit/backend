import mongoose, { Schema } from "mongoose";
import { IClient } from "./client.types";
import { GLOBAL_STATUS } from "@constants";

const clientSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
    },
    currency: {
      type: String,
      default: "USD",
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(GLOBAL_STATUS),
      default: GLOBAL_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure name is unique within the same organization
clientSchema.index({ name: 1, orgId: 1 }, { unique: true });

const ClientModel = mongoose.model<IClient>("Client", clientSchema);

export default ClientModel;
