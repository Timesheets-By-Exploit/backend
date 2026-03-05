import { Tspec } from "tspec";
import {
  CreateClientInput,
  UpdateClientInput,
  ClientOutput,
} from "./client.types";
import { ISuccessPayload, IErrorPayload } from "src/types";

export type ClientApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/clients";
  tags: ["Clients"];
  paths: {
    "/": {
      post: {
        summary: "Create a new client";
        body: CreateClientInput;
        responses: {
          201: ISuccessPayload<ClientOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          403: IErrorPayload;
        };
      };
      get: {
        summary: "Get all clients for the organization";
        responses: {
          200: ISuccessPayload<ClientOutput[]>;
          401: IErrorPayload;
          403: IErrorPayload;
        };
      };
    };
    "/{id}": {
      patch: {
        summary: "Update a client";
        path: { id: string };
        body: UpdateClientInput;
        responses: {
          200: ISuccessPayload<ClientOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          403: IErrorPayload;
          404: IErrorPayload;
        };
      };
      delete: {
        summary: "Delete a client";
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
