import { signupSchema } from "./auth.validators";
import { z } from "zod";

export type SignupInput = z.infer<typeof signupSchema>;

export type SignupOutput = {
  organizationId: string;
  userId: string;
  emailSent: boolean;
};

export type EmailVerificationOutput = { emailSent: boolean };
