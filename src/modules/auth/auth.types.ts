import mongoose from "mongoose";
import { signupSchema } from "./auth.validators";
import { z } from "zod";

export type SignupInput = z.infer<typeof signupSchema>;

export interface IErrorPayload {
  success: boolean;
  error: string;
}
export interface ISignupPayload {
  success: boolean;
  data: {
    userId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
  };
}
