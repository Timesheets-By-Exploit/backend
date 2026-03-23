import dotenv from "dotenv";
dotenv.config();
import app, { mountSwagger } from "./app";
import connectDB from "./config/db";
import { PORT } from "@config/env";
import { logger } from "@config/logger";
import { getTSpec } from "@docs/tspecGenerator";
import { notFound } from "@middlewares/notFound";
import mongoose from "mongoose";
import { Server } from "http";

let server: Server;

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled Rejection — shutting down");
  gracefulShutdown(1);
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught Exception — shutting down");
  gracefulShutdown(1);
});

function gracefulShutdown(code: number = 0) {
  logger.info("Graceful shutdown initiated");
  if (server) {
    server.close(() => {
      mongoose.connection.close(false).then(() => {
        process.exit(code);
      });
    });
  } else {
    process.exit(code);
  }
}

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  gracefulShutdown(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received");
  gracefulShutdown(0);
});

async function start() {
  await connectDB();
  const spec = await getTSpec(); // async is allowed here
  mountSwagger(spec);
  app.use("*", notFound);

  server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "Server running");
  });
}

start().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
