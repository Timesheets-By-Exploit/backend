import { z } from "zod";
import { TASK_STATUS } from "@constants";
import { zObjectId } from "@utils/validators";

export const createTaskSchema = z.object({
  name: z.string().min(1).max(100),
  projectId: zObjectId,
  orgId: zObjectId,
  isBillable: z.boolean().optional(),
});

export const updateTaskSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  projectId: zObjectId.optional(),
  isBillable: z.boolean().optional(),
  status: z
    .enum(Object.values(TASK_STATUS) as [string, ...string[]])
    .optional(),
});
