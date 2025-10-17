import UserModel from "@modules/user/user.model";
import { IErrorPayload, ISignupPayload, SignupInput } from "./auth.types";
import OrganizationModel from "@modules/organization/organization.model";
import mongoose from "mongoose";

const AuthService = {
  signupOwner: async (
    input: SignupInput,
  ): Promise<ISignupPayload | IErrorPayload> => {
    const { name, email, password, organizationName, organizationSize } = input;
    const existingUser = await UserModel.exists({ email });
    if (existingUser) return { success: false, error: "User already exists" };

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const createdUser = new UserModel({
        name,
        email,
        password,
        role: "owner",
      });
      const organization = new OrganizationModel({
        name: organizationName,
        owner: createdUser._id,
        size: organizationSize,
      });
      createdUser.organization = organization._id;
      await createdUser.save({ session });
      await organization.save({ session });
      await session.commitTransaction();
      session.endSession();
      return {
        success: true,
        data: { userId: createdUser._id, organizationId: organization._id },
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  },
};

export default AuthService;
