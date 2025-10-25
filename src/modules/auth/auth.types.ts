import { signupSchema, verifyEmailSchema } from "./auth.validators";
import { z } from "zod";

export type SignupInput = z.infer<typeof signupSchema>;

export type SignupOutput = {
  organizationId: string;
  userId: string;
  emailSent: boolean;
};

export type SendEmailVerificationCodeOutput = { emailSent: boolean };

export type EmailVerificationInput = z.infer<typeof verifyEmailSchema>;

export type EmailVerificationOutput = {
  userId: string;
  isEmailVerified: boolean;
};
