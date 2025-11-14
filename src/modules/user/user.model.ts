// src/modules/auth/auth.model.ts
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
    role: {
      type: String,
      enum: ["owner", "admin", "member", "viewer"],
      default: "member",
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: function () {
        return this.role === "member";
      },
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String, default: null },
    emailVerificationCodeExpiry: { type: Date, default: null },
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
  thisObj.emailVerificationCodeExpiry = new Date(
    Date.now() + convertTimeToMilliseconds(30, "minutes"),
  );
});

userSchema.methods.generateEmailVerificationCode = function (): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationCode = hashWithCrypto(code);
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

const UserModel = mongoose.model<IUser>("User", userSchema);

export default UserModel;
