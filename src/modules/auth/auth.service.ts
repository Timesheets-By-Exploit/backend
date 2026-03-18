import UserService from "@modules/user/user.service";
import {
  SignupInput,
  SignupOutput,
  SendEmailVerificationCodeOutput,
  EmailVerificationOutput,
  ForgotPasswordOutput,
  ResetPasswordOutput,
} from "./auth.types";
import { IUser } from "@modules/user/user.types";
import { sendEmailWithTemplate } from "@services/email.service";
import { ISuccessPayload, IErrorPayload } from "src/types";
import { RefreshTokenModel } from "./refreshToken.model";
import {
  EMAIL_VERIFICATION_TEMPLATE_KEY,
  PASSWORD_RESET_TEMPLATE_KEY,
} from "@config/env";
import {
  createTokensForUser,
  rotateRefreshToken,
  revokeRefreshToken,
} from "./utils/auth.tokens";

const AuthService = {
  signup: async (
    input: SignupInput,
  ): Promise<ISuccessPayload<SignupOutput> | IErrorPayload> => {
    const existingUser =
      (await UserService.getUserByEmail(input.email)) !== null;
    if (existingUser) return { success: false, error: "User already exists" };

    const createdUser = await UserService.createUser(input);

    await createdUser.save();
    const res = await AuthService.sendVerificationEmail(createdUser);

    return {
      success: true,
      data: {
        userId: createdUser._id.toString(),
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
      if (!emailSentResponse.success) {
        return { success: false, error: "Failed to send verification email" };
      }
      return {
        success: true,
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
    const user = await UserService.getUserByEmail(email);
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
    const { accessToken, refreshToken, refreshTokenId, expiresAt } =
      await createTokensForUser(
        user,
        rememberMe,
        metaData?.ip,
        metaData?.userAgent,
      );

    return {
      success: true,
      data: { accessToken, refreshToken, refreshTokenId, expiresAt },
    };
  },
  rotateRefreshToken: async (
    rawRefreshToken: string,
    ip?: string,
    userAgent?: string,
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
        await rotateRefreshToken(rawRefreshToken, ip, userAgent);

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

      // Invalidate all active sessions so a compromised token can't be reused.
      await RefreshTokenModel.updateMany(
        { user: user._id, revokedAt: null },
        { revokedAt: new Date(), reason: "password_changed" },
      );

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
      const user = await UserService.getUserByEmail(email);
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
      const user = await UserService.getUserByEmail(email);
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

      // Invalidate all active sessions so a compromised token can't be reused.
      await RefreshTokenModel.updateMany(
        { user: user._id, revokedAt: null },
        { revokedAt: new Date(), reason: "password_reset" },
      );

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
