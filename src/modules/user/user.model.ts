import mongoose, { CallbackError, Schema } from "mongoose";
import { IUser } from "./user.types";
import { hashWithBcrypt, hashWithCrypto } from "@utils/encryptors";
import { convertTimeToMilliseconds } from "@utils/index";

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String, default: null },
    emailVerificationCodeExpiry: { type: Date, default: null },
    passwordResetCode: { type: String, default: null },
    passwordResetCodeExpiry: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  const thisObj = this as IUser;

  if (!this.isModified("password")) return next();

  try {
    thisObj.password = await hashWithBcrypt(thisObj.password);
    return next();
  } catch (e) {
    return next(e as CallbackError);
  }
});

userSchema.pre("save", async function (next) {
  const thisObj = this as IUser;
  if (!this.isModified("emailVerificationCode")) return next();
  if (thisObj.emailVerificationCode === null) {
    thisObj.emailVerificationCodeExpiry = null;
    return next();
  }
  thisObj.emailVerificationCodeExpiry = new Date(
    Date.now() + convertTimeToMilliseconds(30, "minutes"),
  );
  next();
});

userSchema.pre("save", async function (next) {
  const thisObj = this as IUser;
  if (!this.isModified("passwordResetCode")) return next();
  if (thisObj.passwordResetCode === null) {
    thisObj.passwordResetCodeExpiry = null;
    return next();
  }
  thisObj.passwordResetCodeExpiry = new Date(
    Date.now() + convertTimeToMilliseconds(30, "minutes"),
  );
  next();
});

function generateAndHashSixDigitCode(): { code: string; hashedCode: string } {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = hashWithCrypto(code);
  return { code, hashedCode };
}

userSchema.methods.generateEmailVerificationCode = function (): string {
  const { code, hashedCode } = generateAndHashSixDigitCode();
  this.emailVerificationCode = hashedCode;
  return code;
};

userSchema.methods.verifyEmailVerificationCode = function (
  code: string,
): boolean {
  const isCorrectCode = hashWithCrypto(code) === this.emailVerificationCode;
  const isNotExpiredCode =
    new Date(this.emailVerificationCodeExpiry).getTime() > Date.now();
  if (isCorrectCode && isNotExpiredCode) this.isEmailVerified = true;
  return isCorrectCode && isNotExpiredCode;
};

userSchema.methods.clearEmailVerificationData = async function () {
  this.emailVerificationCode = null;
  this.emailVerificationCodeExpiry = null;
  await this.save();
};

userSchema.methods.generatePasswordResetCode = function (): string {
  const { code, hashedCode } = generateAndHashSixDigitCode();
  this.passwordResetCode = hashedCode;
  return code;
};

userSchema.methods.verifyPasswordResetCode = function (code: string): boolean {
  const isCorrectCode = hashWithCrypto(code) === this.passwordResetCode;
  const isNotExpiredCode =
    this.passwordResetCodeExpiry &&
    new Date(this.passwordResetCodeExpiry).getTime() > Date.now();
  return isCorrectCode && !!isNotExpiredCode;
};

userSchema.methods.clearPasswordResetData = async function () {
  this.passwordResetCode = null;
  this.passwordResetCodeExpiry = null;
  await this.save();
};

const UserModel = mongoose.model<IUser>("User", userSchema);

export default UserModel;
