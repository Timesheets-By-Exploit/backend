import { Tspec } from "tspec";
import { SignupInput } from "./auth.validators";
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
  };
}>;
