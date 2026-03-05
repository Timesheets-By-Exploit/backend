import { z } from "zod";
import { GLOBAL_STATUS } from "@constants";
import { zObjectId } from "@utils/validators";

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  orgId: zObjectId,
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  status: z
    .enum(Object.values(GLOBAL_STATUS) as [string, ...string[]])
    .optional(),
});
