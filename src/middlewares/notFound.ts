import { Request, Response } from "express";

export function notFound(_req: Request, res: Response) {
  if (res.headersSent) return;
  res.status(404).json({
    success: false,
    message: "Resource not found",
  });
}
