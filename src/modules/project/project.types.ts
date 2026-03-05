import mongoose from "mongoose";
import { GlobalStatus } from "@constants";

export interface ProjectBase {
  name: string;
  clientId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  color: string;
  isBillable: boolean;
  status: GlobalStatus;
}

export interface IProject extends ProjectBase, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectOutput {
  id: string;
  name: string;
  clientId: string;
  orgId: string;
  color: string;
  isBillable: boolean;
  status: GlobalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  clientId: string;
  orgId: string;
  color?: string;
  isBillable?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  clientId?: string;
  color?: string;
  isBillable?: boolean;
  status?: GlobalStatus;
}
