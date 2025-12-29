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

export type GetOrganizationOutput = {
  organization: {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    description?: string;
    status: string;
    size: number;
    settings: {
      timezone: string;
      workHours: number;
    };
    createdAt: Date;
    updatedAt: Date;
  };
  role: string;
};

export type OrganizationMember = {
  membershipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  joinedAt: Date;
};

export type GetOrganizationMembersOutput = {
  members: OrganizationMember[];
};
