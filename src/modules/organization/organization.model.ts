import mongoose from "mongoose";
import { IOrganization } from "./organization.types";

const organizationSchema = new mongoose.Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, "An organization must have a name"],
      unique: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    domain: { type: String, lowercase: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    size: {
      type: Number,
      required: [true, "Please specify the size of your organization"],
    },
    settings: {
      timezone: { type: String, default: "UTC" },
      workHours: { type: Number, default: 8 },
    },
  },
  { timestamps: true },
);

const OrganizationModel = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema,
);

export default OrganizationModel;
