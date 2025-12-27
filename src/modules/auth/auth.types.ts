import mongoose from "mongoose";
import {
  loginSchema,
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
  organizationId?: string;
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

export type LoginOutput = {
  user: {
    email: string;
    isEmailVerified: boolean;
    id: string;
    name: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
};
export type loginInput = z.infer<typeof loginSchema>;

export interface AccessPayload {
  id: string;
  email: string;
}

export type GetMeOutput = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
