import express, { Application, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import { httpLogger } from "@config/logger";
import v1Router from "./routes/v1.route";
import errorHandler from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import { COOKIE_SECRET, FRONTEND_BASE_URL, NODE_ENV } from "@config/env";
import swaggerUi from "swagger-ui-express";

const app: Application = express();

const skip = () => NODE_ENV === "test";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

// Tighter limit for brute-force-sensitive auth endpoints (login, OTP, password reset).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip,
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
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(cookieParser(COOKIE_SECRET));
app.use(express.json());
app.use(httpLogger);

app.use(
  [
    "/api/v1/auth/login",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/verify-email",
    "/api/v1/auth/resend-verification-email",
  ],
  authLimiter,
);
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
