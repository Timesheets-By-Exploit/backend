import { ZodSchema, ZodError, ZodIssue } from "zod";
import { Request, Response, NextFunction } from "express";
import AppError from "@utils/AppError";

const validateResource =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (e: unknown) {
      return next(
        AppError.badRequest(
          "Validation failed",
          (e as ZodError).errors.reduce(
            (acc: string, err: ZodIssue, idx: number) =>
              acc +
              `Error on path ${err.path}: ${err.message}${
                idx !== (e as ZodError).errors.length - 1 ? ", " : ""
              }`,
            "",
          ),
        ),
      );
    }
  };

export default validateResource;
