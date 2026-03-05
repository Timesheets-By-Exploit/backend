import { z } from "zod";
import { emailSchema } from "@modules/auth/auth.validators";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters long")
    .max(100, "Organization name must not exceed 100 characters"),
  size: z.number().int().min(1, "Organization size must be at least 1"),
  domain: z.string().optional(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(["OWNER", "MANAGER", "MEMBER", "VIEWER"], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
});

export const acceptInviteSchema = z.object({
  token: z.string({ required_error: "Token is required" }),
});
