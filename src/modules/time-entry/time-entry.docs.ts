import { Tspec } from "tspec";
import {
  CreateTimeEntryInput,
  StartTimeEntryInput,
  UpdateTimeEntryInput,
  TimeEntryOutput,
} from "./time-entry.types";
import { ISuccessPayload, IErrorPayload } from "src/types";

export type TimeEntryApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/time-entries";
  tags: ["Time Entries"];
  paths: {
    "/start": {
      post: {
        summary: "Start a new timer";
        body: StartTimeEntryInput;
        responses: {
          201: ISuccessPayload<TimeEntryOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
        };
      };
    };
    "/stop": {
      post: {
        summary: "Stop the currently active timer";
        responses: {
          200: ISuccessPayload<TimeEntryOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          404: IErrorPayload;
        };
      };
    };
    "/manual": {
      post: {
        summary: "Create a manual (completed) time entry";
        body: CreateTimeEntryInput;
        responses: {
          201: ISuccessPayload<TimeEntryOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
        };
      };
    };
    "/active": {
      get: {
        summary: "Get the currently active timer for the user";
        responses: {
          200: ISuccessPayload<TimeEntryOutput | null>;
          401: IErrorPayload;
        };
      };
    };
    "/": {
      get: {
        summary: "List time entries with filters";
        query: {
          projectId?: string;
          startDate?: string;
          endDate?: string;
        };
        responses: {
          200: ISuccessPayload<TimeEntryOutput[]>;
          401: IErrorPayload;
        };
      };
    };
    "/{id}": {
      patch: {
        summary: "Update a time entry";
        path: { id: string };
        body: UpdateTimeEntryInput;
        responses: {
          200: ISuccessPayload<TimeEntryOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
          404: IErrorPayload;
        };
      };
      delete: {
        summary: "Delete a time entry";
        path: { id: string };
        responses: {
          200: ISuccessPayload<null>;
          400: IErrorPayload;
          401: IErrorPayload;
          404: IErrorPayload;
        };
      };
    };
  };
}>;
