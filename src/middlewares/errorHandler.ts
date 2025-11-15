import { Request, Response } from "express";
import AppError from "../utils/AppError";
import { NODE_ENV } from "@config/env";

const errorHandler = (err: any, _req: Request, res: Response) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details;

  if (err instanceof AppError) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      details,
    });
  }

  return res.status(500).json({
    success: false,
    error: message || "Something went wrong",
    details,
    stack: NODE_ENV === "development" ? err.stack : details,
  });
};

export default errorHandler;
