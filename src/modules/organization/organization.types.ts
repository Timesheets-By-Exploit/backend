import mongoose from "mongoose";

type Status = "active" | "inactive";

export interface IOrganization extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  owner: mongoose.Schema.Types.ObjectId;
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
