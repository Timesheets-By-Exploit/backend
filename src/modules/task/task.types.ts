import mongoose from "mongoose";
import { TaskStatus } from "@constants";

export interface TaskBase {
  name: string;
  projectId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  isBillable: boolean;
  status: TaskStatus;
}

export interface ITask extends TaskBase, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskOutput {
  id: string;
  name: string;
  projectId: string;
  orgId: string;
  isBillable: boolean;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  name: string;
  projectId: string;
  orgId: string;
  isBillable?: boolean;
}

export interface UpdateTaskInput {
  name?: string;
  projectId?: string;
  isBillable?: boolean;
  status?: TaskStatus;
}
