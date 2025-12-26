import { z } from "zod";

export const signupSchema = z
  .object({
    firstName: z.string().min(2, "Name must be at least 2 characters long"),
    lastName: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
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
