import mongoose from "mongoose";

export type Role = "owner" | "admin" | "member" | "viewer";

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  permissions: string[];
  organization: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isEmailVerified: boolean;
  emailVerificationCode?: string | null;
  emailVerificationCodeExpiry?: Date | null;
  generateEmailVerificationCode: () => string;
  verifyEmailVerificationCode: (code: string) => boolean;
}
