import { Tspec } from "tspec";
import {
  EmailVerificationInput,
  EmailVerificationOutput,
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
          400: IErrorPayload & { details?: string };
        };
      };
    };
    "/verify-email": {
      post: {
        summary: "Verify a user's email with 6 digit code";
        body: EmailVerificationInput;
        responses: {
          201: ISuccessPayload<EmailVerificationOutput>;
          400: IErrorPayload & { details?: string };
        };
      };
    };
  };
}>;
