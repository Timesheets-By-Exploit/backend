import { Tspec } from "tspec";
import { CreateTaskInput, UpdateTaskInput, TaskOutput } from "./task.types";
import { ISuccessPayload, IErrorPayload } from "src/types";

export type TaskApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/tasks";
  tags: ["Tasks"];
  paths: {
    "/": {
      post: {
        summary: "Create a new task";
        body: CreateTaskInput;
        responses: {
          201: ISuccessPayload<TaskOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          403: IErrorPayload;
        };
      };
      get: {
        summary: "Get all tasks for the organization";
        responses: {
          200: ISuccessPayload<TaskOutput[]>;
          401: IErrorPayload;
          403: IErrorPayload;
        };
      };
    };
    "/{id}": {
      patch: {
        summary: "Update a task";
        path: { id: string };
        body: UpdateTaskInput;
        responses: {
          200: ISuccessPayload<TaskOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          403: IErrorPayload;
          404: IErrorPayload;
        };
      };
      delete: {
        summary: "Delete a task";
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
