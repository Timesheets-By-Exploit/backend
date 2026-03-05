import mongoose, { Schema } from "mongoose";
import { IProject } from "./project.types";
import { GLOBAL_STATUS } from "@constants";

const projectSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    color: {
      type: String,
      default: "#808080",
    },
    isBillable: {
      type: Boolean,
      default: true,
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
projectSchema.index({ name: 1, orgId: 1 }, { unique: true });

const ProjectModel = mongoose.model<IProject>("Project", projectSchema);

export default ProjectModel;
