import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";
import AppError from "@utils/AppError";

const validateResource =
  (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (e: any) {
      return next(
        AppError.badRequest(
          "Validation failed",
          e.errors.map((err: any) => err.message),
        ),
      );
    }
  };

export default validateResource;
