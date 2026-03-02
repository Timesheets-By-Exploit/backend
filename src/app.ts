import express, { Application, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import morgan from "morgan";
import v1Router from "./routes/v1.route";
import errorHandler from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import { COOKIE_SECRET, FRONTEND_BASE_URL } from "@config/env";
import swaggerUi from "swagger-ui-express";

const app: Application = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

app.use(helmet());
app.use(limiter);
app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === FRONTEND_BASE_URL) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);
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
