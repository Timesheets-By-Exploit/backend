import { Tspec } from "tspec";

export type HealthApiSpec = Tspec.DefineApiSpec<{
  basePath: "/api";
  tags: ["Health"];
  paths: {
    "/health": {
      get: {
        summary: "Check API health status";
        responses: {
          200: { status: "ok" };
        };
      };
    };
  };
}>;
