import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

export const signupSchema = z
  .object({
    firstName: z.string().min(2, "Name must be at least 2 characters long"),
    lastName: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email format"),
    password: passwordSchema,
    createOrg: z.boolean().optional().default(false),
    organizationName: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .optional(),
    organizationSize: z.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.createOrg) {
      if (!data.organizationName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Organization name is required when createOrg is true",
          path: ["organizationName"],
        });
      }
      if (data.organizationSize === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Organization size is required when createOrg is true",
          path: ["organizationSize"],
        });
      }
    }
  });

export const verifyEmailSchema = z.object({
  emailVerificationCode: z
    .string()
    .length(6, "Email verification code must be a 6 digit number"),
  email: z.string().email(),
});

export const resendEmailVerificationCodeSchema = z.object({
  email: z.string().email(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });
