import UserModel from "@modules/user/user.model";
import {
  EmailVerificationOutput,
  SendEmailVerificationCodeOutput,
  SignupInput,
  SignupOutput,
} from "./auth.types";
import OrganizationModel from "@modules/organization/organization.model";
import mongoose from "mongoose";
import { IUser } from "@modules/user/user.types";
import { sendEmailWithTemplate } from "@services/email.service";
import { ISuccessPayload, IErrorPayload } from "src/types";

const AuthService = {
  signupOwner: async (
    input: SignupInput,
  ): Promise<ISuccessPayload<SignupOutput> | IErrorPayload> => {
    const {
      firstName,
      lastName,
      email,
      password,
      organizationName,
      organizationSize,
    } = input;
    const existingUser = await UserModel.exists({ email });
    if (existingUser) return { success: false, error: "User already exists" };

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const createdUser = new UserModel({
        firstName,
        lastName,
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
      const res = await AuthService.sendVerificationEmail(createdUser);

      return {
        success: true,
        data: {
          userId: createdUser._id.toString(),
          organizationId: organization._id.toString(),
          emailSent: res.success
            ? (res as ISuccessPayload<SendEmailVerificationCodeOutput>).data
                .emailSent
            : false,
        },
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
  sendVerificationEmail: async (
    user: IUser,
  ): Promise<
    ISuccessPayload<SendEmailVerificationCodeOutput> | IErrorPayload
  > => {
    try {
      const code = user.generateEmailVerificationCode();
      await user.save();
      let emailSentResponse = await sendEmailWithTemplate({
        to: [
          {
            email_address: {
              address: user.email,
              name: `${user.firstName} ${user.lastName}`,
            },
          },
        ],
        merge_info: {
          emailVerificationCode: code,
          emailVerificationExpiry: "30 minutes",
          name: user.firstName,
        },
        subject: "Verify your email",
        mail_template_key:
          "2d6f.45d8a1809f293f51.k1.46541e40-afd8-11f0-a465-fae9afc80e45.19a0fb93624",
        template_alias: "email-verification",
      });
      return {
        success: emailSentResponse.success,
        data: { emailSent: emailSentResponse.emailSent || false },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
  verifyEmailVerificationCode: async (
    code: string,
    email: string,
  ): Promise<ISuccessPayload<EmailVerificationOutput> | IErrorPayload> => {
    const user = await UserModel.findOne({
      email: email,
    });
    if (!user)
      return {
        success: false,
        error:
          "If this email exists in our system, a verification email has been sent",
      };
    if (user.isEmailVerified === true)
      return {
        success: false,
        error:
          "If this email exists in our system, a verification email has been sent",
      };
    const isVerified = user.verifyEmailVerificationCode(code);
    if (!isVerified)
      return {
        success: false,
        error: "Verification failed. Please check your email and try again",
      };
    await user.clearEmailVerificationData();
    return { success: true, data: { email, isEmailVerified: true } };
  },
};

export default AuthService;
