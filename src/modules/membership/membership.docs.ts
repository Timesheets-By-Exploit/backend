import { Tspec } from "tspec";
import {
  CreateMembershipInput,
  CreateMembershipOutput,
} from "./membership.types";
import { ISuccessPayload, IErrorPayload } from "src/types";

export type MembershipApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/membership";
  tags: ["Membership"];
  paths: {
    "/": {
      post: {
        summary: "Create a new membership";
        body: CreateMembershipInput;
        responses: {
          201: ISuccessPayload<CreateMembershipOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
        };
      };
    };
  };
}>;
