import mongoose from "mongoose";
import { GlobalStatus } from "@constants";

export interface ClientBase {
  name: string;
  email?: string | undefined;
  address?: string | undefined;
  currency: string;
  orgId: mongoose.Types.ObjectId;
  status: GlobalStatus;
}

export interface IClient extends ClientBase, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientOutput {
  id: string;
  name: string;
  email?: string | undefined;
  address?: string | undefined;
  currency: string;
  orgId: string;
  status: GlobalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientInput {
  name: string;
  email?: string;
  address?: string;
  currency?: string;
  orgId: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  address?: string;
  currency?: string;
  status?: GlobalStatus;
}
