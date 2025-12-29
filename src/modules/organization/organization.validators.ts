import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(50, "Organization name must be at most 50 characters"),
  size: z.number().int().min(1, "Organization size must be at least 1"),
  domain: z.string().optional(),
  description: z.string().optional(),
});
