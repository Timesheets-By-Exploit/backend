import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import v1Router from "./routes/v1.route";
import errorHandler from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import { COOKIE_SECRET } from "@config/env";
import swaggerUi from "swagger-ui-express";
const app: Application = express();

app.set("trust proxy", 1);
app.use(cors());
app.use(cookieParser(COOKIE_SECRET));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1", v1Router);
export function mountSwagger(spec: object) {
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(spec));
}

app.get("/api/health", (req, res) => {
  res.send({ status: "ok" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) =>
  errorHandler(err, req, res, next),
);
export default app;
