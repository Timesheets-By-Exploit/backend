import { Tspec } from "tspec";
import { ISuccessPayload, IErrorPayload } from "src/types";
import { UpdateUserInput } from "./user.validators";

type UpdateUserOutput = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isOnboarded: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api/v1/users";
  tags: ["Users"];
  paths: {
    "/me": {
      put: {
        summary: "Update the currently authenticated user";
        body: UpdateUserInput;
        responses: {
          200: ISuccessPayload<UpdateUserOutput>;
          400: IErrorPayload;
          401: IErrorPayload;
        };
      };
    };
  };
}>;
