import { z } from "zod";
import { zObjectId } from "@utils/validators";

export const createTimeEntrySchema = z
  .object({
    projectId: zObjectId,
    taskId: zObjectId,
    description: z.string().max(500).optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional().nullable(),
    isBillable: z.boolean().optional(),
    tags: z.array(zObjectId).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export const startTimeEntrySchema = z.object({
  projectId: zObjectId,
  taskId: zObjectId,
  description: z.string().max(500).optional(),
  startTime: z.string().datetime().optional(),
  isBillable: z.boolean().optional(),
  tags: z.array(zObjectId).optional(),
});

export const updateTimeEntrySchema = z
  .object({
    projectId: zObjectId.optional(),
    taskId: zObjectId.optional(),
    description: z.string().max(500).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional().nullable(),
    isBillable: z.boolean().optional(),
    tags: z.array(zObjectId).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );
