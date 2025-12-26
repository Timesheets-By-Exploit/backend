import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import v1Router from "./routes/v1.route";
import errorHandler from "./middlewares/errorHandler";
import swaggerUi from "swagger-ui-express";
import { notFound } from "@middlewares/notFound";
import getTSpec from "@docs/tspecGenerator";

const app: Application = express();

(async () => {
  app.set("trust proxy", 1);
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.use("/api/v1", v1Router);

  app.get("/api/health", (req, res) => {
    res.send({ status: "ok" });
  });
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(await getTSpec()));
  app.use("*", notFound);
  app.use((err: Error, req: Request, res: Response, next: NextFunction) =>
    errorHandler(err, req, res, next),
  );
})();

export default app;
