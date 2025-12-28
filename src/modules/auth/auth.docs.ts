import { Tspec } from "tspec";
import {
  ChangePasswordInput,
  ChangePasswordOutput,
  EmailVerificationInput,
  EmailVerificationOutput,
  ForgotPasswordInput,
  ForgotPasswordOutput,
  GetMeOutput,
  loginInput,
  LoginOutput,
  LogoutOutput,
  resendEmailVerificationCodeInput,
  ResetPasswordInput,
  ResetPasswordOutput,
  SignupInput,
} from "./auth.types";
import { ISuccessPayload, IErrorPayload } from "src/types";
import { SignupOutput } from "./auth.types";

export type AuthApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/auth";
  tags: ["Authentication"];
  paths: {
    "/signup": {
      post: {
        summary: "Signup an organization owner";
        body: SignupInput;
        responses: {
          201: ISuccessPayload<SignupOutput>;
          400: IErrorPayload;
        };
      };
    };
    "/verify-email": {
      post: {
        summary: "Verify a user's email with 6 digit code";
        body: EmailVerificationInput;
        responses: {
          200: ISuccessPayload<EmailVerificationOutput>;
          400: IErrorPayload;
        };
      };
    };
    "/resend-verification-email": {
      post: {
        summary: "Resend verification email";
        body: resendEmailVerificationCodeInput;
        responses: {
          200: ISuccessPayload<EmailVerificationOutput>;
          400: IErrorPayload;
        };
      };
    };
    "/login": {
      post: {
        summary: "Login User";
        body: loginInput;
        responses: {
          200: ISuccessPayload<LoginOutput>;
          400: IErrorPayload;
          403: IErrorPayload;
        };
      };
    };
    "/refresh": {
      get: {
        summary: "Refresh token";
        body: Record<string, string>;
        responses: {
          200: ISuccessPayload<Record<string, string>>;
          401: IErrorPayload;
        };
      };
    };
    "/me": {
      get: {
        summary: "Get current authenticated user";
        responses: {
          200: ISuccessPayload<GetMeOutput>;
          401: IErrorPayload;
        };
      };
    };
    "/logout": {
      post: {
        summary: "Logout user";
        responses: {
          200: ISuccessPayload<LogoutOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
        };
      };
    };
    "/change-password": {
      post: {
        summary: "Change user password";
        body: ChangePasswordInput;
        responses: {
          200: ISuccessPayload<ChangePasswordOutput>;
          400: IErrorPayload & { details?: string };
          401: IErrorPayload & { details?: string };
        };
      };
    };
    "/forgot-password": {
      post: {
        summary: "Send password reset email";
        body: ForgotPasswordInput;
        responses: {
          200: ISuccessPayload<ForgotPasswordOutput>;
          400: IErrorPayload;
        };
      };
    };
    "/reset-password": {
      post: {
        summary: "Reset password with reset code";
        body: ResetPasswordInput;
        responses: {
          200: ISuccessPayload<ResetPasswordOutput>;
          400: IErrorPayload;
        };
      };
    };
  };
}>;
