import mongoose from "mongoose";

export interface TimeEntryBase {
  userId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  description: string;
  startTime: Date;
  endTime?: Date | null;
  duration?: number;
  isBillable: boolean;
  isManual: boolean;
  tags: mongoose.Types.ObjectId[];
}

export interface ITimeEntry extends TimeEntryBase, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntryOutput {
  id: string;
  userId: string;
  orgId: string;
  projectId?: string | undefined;
  taskId?: string | undefined;
  description: string;
  startTime: Date;
  endTime?: Date | null | undefined;
  duration?: number | undefined;
  isBillable: boolean;
  isManual: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTimeEntryInput {
  projectId: string;
  taskId: string;
  description?: string;
  startTime: string; // ISO String
  endTime?: string; // ISO String
  isBillable?: boolean;
  tags?: string[];
}

export interface StartTimeEntryInput {
  projectId: string;
  taskId: string;
  description?: string;
  startTime?: string; // ISO String, defaults to now
  isBillable?: boolean;
  tags?: string[];
}

export interface UpdateTimeEntryInput {
  projectId?: string;
  taskId?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  isBillable?: boolean;
  tags?: string[];
}
