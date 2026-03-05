import mongoose, { Schema } from "mongoose";
import { ITag } from "./tag.types";
import { GLOBAL_STATUS } from "@constants";

const tagSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#808080", // Default gray
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
tagSchema.index({ name: 1, orgId: 1 }, { unique: true });

const TagModel = mongoose.model<ITag>("Tag", tagSchema);

export default TagModel;
