import UserModel from "@modules/user/user.model";
import {
  EmailVerificationOutput,
  ForgotPasswordOutput,
  ResetPasswordOutput,
  SendEmailVerificationCodeOutput,
  SignupInput,
  SignupOutput,
} from "./auth.types";
import OrganizationModel from "@modules/organization/organization.model";
import mongoose from "mongoose";
import { IUser } from "@modules/user/user.types";
import { sendEmailWithTemplate } from "@services/email.service";
import { ISuccessPayload, IErrorPayload } from "src/types";
import { hashWithCrypto } from "@utils/encryptors";
import { RefreshTokenModel } from "./refreshToken.model";
import { DEFAULT_REFRESH_DAYS } from "@config/constants";
import { generateRandomTokenWithCrypto } from "@utils/generators";
import {
  EMAIL_VERIFICATION_TEMPLATE_KEY,
  PASSWORD_RESET_TEMPLATE_KEY,
} from "@config/env";
import {
  generateAccessToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from "./utils/auth.tokens";

const AuthService = {
  signupOwner: async (
    input: SignupInput,
  ): Promise<ISuccessPayload<SignupOutput> | IErrorPayload> => {
    const {
      firstName,
      lastName,
      email,
      password,
      createOrg = false,
      organizationName,
      organizationSize,
    } = input;
    const existingUser = await UserModel.exists({ email });
    if (existingUser) return { success: false, error: "User already exists" };
    let createdUser;
    let organization;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      createdUser = new UserModel({
        firstName,
        lastName,
        email,
        password,
        role: "owner",
      });

      if (createOrg) {
        if (!organizationName || organizationSize === undefined) {
          throw new Error("Organization name and size are required");
        }
        organization = new OrganizationModel({
          name: organizationName,
          owner: createdUser._id,
          size: organizationSize,
        });
        createdUser.organization = organization._id;
        await organization.save({ session });
      }

      await createdUser.save({ session });
      await session.commitTransaction();
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
    const res = await AuthService.sendVerificationEmail(createdUser);

    return {
      success: true,
      data: {
        userId: createdUser._id.toString(),
        ...(organization && { organizationId: organization._id.toString() }),
        emailSent: res.success
          ? (res as ISuccessPayload<SendEmailVerificationCodeOutput>).data
              .emailSent
          : false,
      },
    };
  },
  sendVerificationEmail: async (
    user: IUser,
  ): Promise<
    ISuccessPayload<SendEmailVerificationCodeOutput> | IErrorPayload
  > => {
    try {
      const code = user.generateEmailVerificationCode();
      await user.save();
      const emailSentResponse = await sendEmailWithTemplate({
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
        mail_template_key: EMAIL_VERIFICATION_TEMPLATE_KEY,
        template_alias: "email-verification",
      });
      return {
        success: emailSentResponse.success,
        data: { emailSent: emailSentResponse.emailSent || false },
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
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
  createTokensForUser: async (
    user: IUser,
    rememberMe = false,
    metaData?: {
      ip?: string | undefined;
      userAgent?: string | undefined;
    },
  ) => {
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const rawRefreshToken = generateRandomTokenWithCrypto(
      Number(process.env.REFRESH_TOKEN_BYTES || 64),
    );
    const tokenHash = hashWithCrypto(rawRefreshToken);

    const expiresAt = new Date(
      Date.now() +
        (rememberMe ? DEFAULT_REFRESH_DAYS : 7) * 24 * 60 * 60 * 1000,
    );

    const refreshDoc = await RefreshTokenModel.create({
      user: user._id,
      tokenHash,
      expiresAt,
      createdByIp: metaData?.ip,
      userAgent: metaData?.userAgent,
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        refreshTokenId: refreshDoc._id,
        expiresAt,
      },
    };
  },
  rotateRefreshToken: async (
    rawRefreshToken: string,
    ip?: string,
  ): Promise<
    | {
        success: true;
        data: {
          refreshToken: string;
          refreshTokenId: string | undefined;
          accessToken: string;
          expiresAt: Date;
        };
      }
    | { success: false; error: string }
  > => {
    try {
      const { refreshToken, refreshTokenId, expiresAt, accessToken } =
        await rotateRefreshToken(rawRefreshToken, ip);

      return {
        success: true,
        data: {
          refreshToken,
          refreshTokenId: refreshTokenId?.toString(),
          accessToken,
          expiresAt,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: (err as unknown as Error).message,
      };
    }
  },
  logout: async (
    rawRefreshToken: string | null,
    ip?: string,
  ): Promise<ISuccessPayload<{ message: string }> | IErrorPayload> => {
    try {
      await revokeRefreshToken(rawRefreshToken, ip);
      return {
        success: true,
        data: { message: "Logged out successfully" },
      };
    } catch (err) {
      return {
        success: false,
        error: (err as unknown as Error).message,
      };
    }
  },
  changePassword: async (
    user: IUser,
    currentPassword: string,
    newPassword: string,
  ): Promise<ISuccessPayload<{ message: string }> | IErrorPayload> => {
    try {
      const { compareHashedBcryptString } = await import("@utils/encryptors");
      const isValidPassword = await compareHashedBcryptString(
        currentPassword,
        user.password,
      );

      if (!isValidPassword)
        return {
          success: false,
          error: "Current password is incorrect",
        };

      user.password = newPassword;
      await user.save();

      return {
        success: true,
        data: { message: "Password changed successfully" },
      };
    } catch (err) {
      return {
        success: false,
        error: (err as unknown as Error).message,
      };
    }
  },
  sendPasswordResetEmail: async (
    email: string,
  ): Promise<ISuccessPayload<ForgotPasswordOutput> | IErrorPayload> => {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return {
          success: true,
          data: {
            emailSent: true,
            message: "Password reset email sent successfully",
          },
        };
      }

      const code = user.generatePasswordResetCode();
      await user.save();

      const emailSentResponse = await sendEmailWithTemplate({
        to: [
          {
            email_address: {
              address: user.email,
              name: `${user.firstName} ${user.lastName}`,
            },
          },
        ],
        merge_info: {
          passwordResetCode: code,
          passwordResetExpiry: "30 minutes",
          name: user.firstName,
        },
        subject: "Reset your password",
        mail_template_key: PASSWORD_RESET_TEMPLATE_KEY,
        template_alias: "password-reset",
      });

      if (!emailSentResponse.success) {
        return {
          success: false,
          error:
            emailSentResponse.error || "Failed to send password reset email",
        };
      }

      return {
        success: true,
        data: {
          emailSent: emailSentResponse.emailSent || false,
          message: "Password reset email sent successfully",
        },
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },
  resetPassword: async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<ISuccessPayload<ResetPasswordOutput> | IErrorPayload> => {
    try {
      const user = await UserModel.findOne({ email });
      if (!user)
        return {
          success: false,
          error: "Invalid or expired password reset code",
        };

      const isValidCode = user.verifyPasswordResetCode(code);
      if (!isValidCode)
        return {
          success: false,
          error: "Invalid or expired password reset code",
        };

      await user.clearPasswordResetData();
      user.password = newPassword;
      await user.save();

      return {
        success: true,
        data: { message: "Password reset successfully" },
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },
};

export default AuthService;
