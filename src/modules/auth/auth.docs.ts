import { Tspec } from "tspec";
import { IErrorPayload, ISignupPayload } from "./auth.types";
import { SignupInput } from "./auth.validators";

export type AuthApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/auth";
  tags: ["Authentication"];
  paths: {
    "/signup": {
      post: {
        summary: "Signup an organization owner";
        path: { id: number };
        body: SignupInput;
        responses: {
          201: ISignupPayload;
          400: IErrorPayload & { details?: string };
        };
      };
    };
  };
}>;
