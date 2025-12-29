import mongoose, { model } from "mongoose";
import { IOrganization } from "./organization.types";
import { slugify } from "@utils/index";

const organizationSchema = new mongoose.Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    slug: { type: String, required: true, unique: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    domain: { type: String, lowercase: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
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

organizationSchema.pre("validate", async function (next) {
  if (!this.isModified("name")) return next();

  const baseSlug = slugify(this.name);
  let slug = baseSlug;
  let counter = 1;

  while (await model("Organization").exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = slug;
  next();
});

const OrganizationModel = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema,
);

export default OrganizationModel;
