import { z } from "zod";

export const signupSchema = z.object({
  firstName: z.string().min(2, "Name must be at least 2 characters long"),
  lastName: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters"),
  organizationSize: z.number().int().min(1),
});

export const verifyEmailSchema = z.object({
  emailVerificationCode: z
    .string()
    .length(6, "Email verification code must be a 6 digit number"),
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
});
