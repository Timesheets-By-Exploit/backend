import mongoose from "mongoose";
import {
  resendEmailVerificationCodeSchema,
  signupSchema,
  verifyEmailSchema,
} from "./auth.validators";
import { z } from "zod";

export interface IRefreshTokenDoc extends Document {
  user: mongoose.Types.ObjectId;
  tokenHash: string; // sha256(token)
  expiresAt: Date;
  createdAt: Date;
  createdByIp?: string;
  userAgent?: string;
  revokedAt?: Date | null;
  revokedByIp?: string | null;
  replacedByToken?: string | null;
  reason?: string | null;
}

export type SignupInput = z.infer<typeof signupSchema>;

export type SignupOutput = {
  organizationId: string;
  userId: string;
  emailSent: boolean;
};

export type SendEmailVerificationCodeOutput = { emailSent: boolean };

export type EmailVerificationInput = z.infer<typeof verifyEmailSchema>;

export type EmailVerificationOutput = {
  email: string;
  isEmailVerified: boolean;
};

export type resendEmailVerificationCodeInput = z.infer<
  typeof resendEmailVerificationCodeSchema
>;

export interface AccessPayload {
  id: string;
  email: string;
}
