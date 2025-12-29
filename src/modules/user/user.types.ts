import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  isEmailVerified: boolean;
  emailVerificationCode?: string | null;
  emailVerificationCodeExpiry?: Date | null;
  passwordResetCode?: string | null;
  passwordResetCodeExpiry?: Date | null;
  generateEmailVerificationCode: () => string;
  verifyEmailVerificationCode: (code: string) => boolean;
  clearEmailVerificationData: () => Promise<void>;
  generatePasswordResetCode: () => string;
  verifyPasswordResetCode: (code: string) => boolean;
  clearPasswordResetData: () => Promise<void>;
}
