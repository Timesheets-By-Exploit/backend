import mongoose from "mongoose";
import { z } from "zod";
import { createOrganizationSchema } from "./organization.validators";

type Status = "ACTIVE" | "INACTIVE";

export interface IOrganization extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  domain?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  status: Status;
  size: number;
  settings: {
    timezone: string;
    workHours: number;
  };
}

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export type CreateOrganizationOutput = {
  organizationId: string;
  membershipId: string;
};
