import { z } from "zod";
import { GLOBAL_STATUS } from "@constants";
import { zObjectId } from "@utils/validators";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  clientId: zObjectId,
  orgId: zObjectId,
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  isBillable: z.boolean().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  clientId: zObjectId.optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  isBillable: z.boolean().optional(),
  status: z
    .enum(Object.values(GLOBAL_STATUS) as [string, ...string[]])
    .optional(),
});
