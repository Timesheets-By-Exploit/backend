// src/modules/auth/auth.model.ts
import mongoose, { CallbackError, Schema } from "mongoose";
import { IUser } from "./user.types";
import bcrypt from "bcryptjs";

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
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  const thisObj = this as IUser;

  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    thisObj.password = await bcrypt.hash(thisObj.password, salt);
    return next();
  } catch (e) {
    return next(e as CallbackError);
  }
});

const UserModel = mongoose.model<IUser>("User", userSchema);

export default UserModel;
