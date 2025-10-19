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
          (e.errors as Array<{ path: string; message: string }>).reduce(
            (acc: string, err: any, idx: number) =>
              acc +
              `Error on path ${err.path}: ${err.message}${
                idx !== e.errors.length - 1 ? ", " : ""
              }`,
            "",
          ),
        ),
      );
    }
  };

export default validateResource;
