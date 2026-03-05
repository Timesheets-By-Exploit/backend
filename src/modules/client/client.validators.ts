import { z } from "zod";
import { GLOBAL_STATUS } from "@constants";
import { zObjectId } from "@utils/validators";

export const createClientSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  currency: z.string().min(1).max(10).optional(),
  orgId: zObjectId,
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  currency: z.string().min(1).max(10).optional(),
  status: z
    .enum(Object.values(GLOBAL_STATUS) as [string, ...string[]])
    .optional(),
});
