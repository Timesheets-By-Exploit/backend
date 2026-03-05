import mongoose from "mongoose";
import { GlobalStatus } from "@constants";

export interface TagBase {
  name: string;
  color?: string | undefined;
  orgId: mongoose.Types.ObjectId;
  status: GlobalStatus;
}

export interface ITag extends TagBase, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface TagOutput {
  id: string;
  name: string;
  color?: string | undefined;
  orgId: string;
  status: GlobalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTagInput {
  name: string;
  color?: string;
  orgId: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
  status?: GlobalStatus;
}
