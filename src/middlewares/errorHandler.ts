import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";
import { NODE_ENV } from "@config/env";
import { MongooseError } from "mongoose";

const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next?: NextFunction,
) => {
  if (!(err instanceof AppError)) {
    console.log(err);
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
  }

  if (err instanceof Error || err instanceof MongooseError) {
    return res.status(500).json({
      success: false,
      error: err.message || "Something went wrong",
      stack: NODE_ENV === "development" ? err.stack : "",
    });
  }
  return res.status(500).json({
    success: false,
    error: "Something went wrong",
  });
};

export default errorHandler;
