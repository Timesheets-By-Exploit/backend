import mongoose, { Schema } from "mongoose";
import { ITask } from "./task.types";
import { TASK_STATUS } from "@constants";

const taskSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    isBillable: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.TODO,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure task name is unique within the same project
taskSchema.index({ name: 1, projectId: 1 }, { unique: true });

const TaskModel = mongoose.model<ITask>("Task", taskSchema);

export default TaskModel;
