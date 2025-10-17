import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import v1Router from "./routes/v1.route";
import errorHandler from "./middlewares/errorHandler";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1", v1Router);
app.get("/api/health", (req, res) => {
  res.send({ status: "ok" });
});
app.use(errorHandler);

export default app;
