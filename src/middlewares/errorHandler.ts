import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";
import { NODE_ENV } from "@config/env";
import { logger } from "@config/logger";
import { MongooseError } from "mongoose";

const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next?: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
  }

  if (err instanceof Error || err instanceof MongooseError) {
    logger.error({ err }, "Unhandled error");
    return res.status(500).json({
      success: false,
      error: NODE_ENV === "development" ? err.message : "Internal server error",
      stack: NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  logger.error({ err }, "Unhandled non-Error thrown");
  return res.status(500).json({
    success: false,
    error: "Something went wrong",
  });
};

export default errorHandler;
