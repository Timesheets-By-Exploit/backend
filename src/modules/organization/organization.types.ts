import mongoose from "mongoose";
import { z } from "zod";
import {
  createOrganizationSchema,
  acceptInviteSchema,
} from "./organization.validators";
import { OrgStatus, UserRole } from "@constants";

export interface IOrganization extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  domain?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  status: OrgStatus;
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
    status: OrgStatus;
    size: number;
    settings: {
      timezone: string;
      workHours: number;
    };
    createdAt: Date;
    updatedAt: Date;
  };
  role: string | UserRole;
};

export type OrganizationMember = {
  membershipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: string;
  joinedAt: Date;
};

export type GetOrganizationMembersOutput = {
  members: OrganizationMember[];
};

export type InviteMemberInput = {
  email: string;
  role: UserRole;
};

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export type AcceptInviteOutput = {
  membershipId: string;
  orgId: string;
};

export type InviteMemberOutput = {
  invitationId: string;
  emailSent: boolean;
};

export type GetUserOrganizationOutput = {
  organization: IOrganization;
  role: string | UserRole;
};

export type PendingMembershipData = {
  orgId: string;
  userId?: string;
  email?: string;
  role: UserRole;
  status: "PENDING";
  inviteTokenHash: string;
  inviteExpiresAt: Date;
  invitedBy: string;
};
