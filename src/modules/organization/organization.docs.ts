import { Tspec } from "tspec";
import {
  CreateOrganizationInput,
  CreateOrganizationOutput,
  GetOrganizationOutput,
  GetOrganizationMembersOutput,
} from "./organization.types";
import { ISuccessPayload, IErrorPayload } from "src/types";

export type OrganizationApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/org";
  tags: ["Organization"];
  paths: {
    "/": {
      post: {
        summary: "Create a new organization (one per user)";
        body: CreateOrganizationInput;
        responses: {
          201: ISuccessPayload<CreateOrganizationOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          409: IErrorPayload;
        };
      };
      get: {
        summary: "Get user's organization with caller's role";
        responses: {
          200: ISuccessPayload<GetOrganizationOutput>;
          401: IErrorPayload;
          404: IErrorPayload;
        };
      };
    };
    "/members": {
      get: {
        summary: "Get organization members (OWNER/ADMIN only)";
        responses: {
          200: ISuccessPayload<GetOrganizationMembersOutput>;
          401: IErrorPayload;
          403: IErrorPayload;
          404: IErrorPayload;
        };
      };
    };
  };
}>;
