import { Tspec } from "tspec";
import {
  CreateOrganizationInput,
  CreateOrganizationOutput,
  GetOrganizationOutput,
} from "./organization.types";
import { ISuccessPayload, IErrorPayload } from "src/types";

export type OrganizationApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/org";
  tags: ["Organization"];
  paths: {
    "/": {
      post: {
        summary: "Create a new organization";
        body: CreateOrganizationInput;
        responses: {
          201: ISuccessPayload<CreateOrganizationOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
        };
      };
      get: {
        summary: "Get organization with caller's role";
        query: {
          orgId: string;
        };
        responses: {
          200: ISuccessPayload<GetOrganizationOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          403: IErrorPayload;
          404: IErrorPayload;
        };
      };
    };
  };
}>;
