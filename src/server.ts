import dotenv from "dotenv";
dotenv.config();
import app, { mountSwagger } from "./app";
import connectDB from "./config/db";
import { PORT } from "@config/env";
import { logger } from "@config/logger";
import { getTSpec } from "@docs/tspecGenerator";
import { notFound } from "@middlewares/notFound";

async function start() {
  await connectDB();
  const spec = await getTSpec(); // async is allowed here
  mountSwagger(spec);
  app.use("*", notFound);

  app.listen(PORT, () => {
    logger.info({ port: PORT }, "Server running");
  });
}

start();
