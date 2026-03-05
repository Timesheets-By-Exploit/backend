import { Tspec } from "tspec";
import { CreateTagInput, UpdateTagInput, TagOutput } from "./tag.types";
import { ISuccessPayload, IErrorPayload } from "src/types";

export type TagApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/tags";
  tags: ["Tags"];
  paths: {
    "/": {
      post: {
        summary: "Create a new tag";
        body: CreateTagInput;
        responses: {
          201: ISuccessPayload<TagOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          403: IErrorPayload;
        };
      };
      get: {
        summary: "Get all tags for the organization";
        responses: {
          200: ISuccessPayload<TagOutput[]>;
          401: IErrorPayload;
          403: IErrorPayload;
        };
      };
    };
    "/{id}": {
      patch: {
        summary: "Update a tag";
        path: { id: string };
        body: UpdateTagInput;
        responses: {
          200: ISuccessPayload<TagOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          403: IErrorPayload;
          404: IErrorPayload;
        };
      };
      delete: {
        summary: "Delete a tag";
        path: { id: string };
        responses: {
          200: ISuccessPayload<{ message: string }>;
          400: IErrorPayload;
          401: IErrorPayload;
          403: IErrorPayload;
          404: IErrorPayload;
        };
      };
    };
  };
}>;
