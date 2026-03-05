import mongoose, { Schema } from "mongoose";
import { ITimeEntry } from "./time-entry.types";

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    isBillable: {
      type: Boolean,
      default: true,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Compound index for fast retrieval of recent entries for a specific user
timeEntrySchema.index({ userId: 1, startTime: -1 });

// Pre-save hook to calculate duration in milliseconds
timeEntrySchema.pre("save", function (next) {
  const self = this as unknown as ITimeEntry;
  if (self.endTime && self.startTime) {
    self.duration =
      new Date(self.endTime).getTime() - new Date(self.startTime).getTime();
  } else {
    self.duration = 0;
  }
  next();
});

const TimeEntryModel = mongoose.model<ITimeEntry>("TimeEntry", timeEntrySchema);

export default TimeEntryModel;
