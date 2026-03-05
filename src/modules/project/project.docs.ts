import { Tspec } from "tspec";
import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectOutput,
} from "./project.types";
import { ISuccessPayload, IErrorPayload } from "src/types";

export type ProjectApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/projects";
  tags: ["Projects"];
  paths: {
    "/": {
      post: {
        summary: "Create a new project";
        body: CreateProjectInput;
        responses: {
          201: ISuccessPayload<ProjectOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          403: IErrorPayload;
        };
      };
      get: {
        summary: "Get all projects for the organization";
        responses: {
          200: ISuccessPayload<ProjectOutput[]>;
          401: IErrorPayload;
          403: IErrorPayload;
        };
      };
    };
    "/{id}": {
      patch: {
        summary: "Update a project";
        path: { id: string };
        body: UpdateProjectInput;
        responses: {
          200: ISuccessPayload<ProjectOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          403: IErrorPayload;
          404: IErrorPayload;
        };
      };
      delete: {
        summary: "Delete a project";
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
