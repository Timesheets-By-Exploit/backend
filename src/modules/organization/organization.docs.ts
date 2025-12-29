import { Tspec } from "tspec";
import {
  CreateOrganizationInput,
  CreateOrganizationOutput,
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
    };
  };
}>;
