import { Request, Response, NextFunction } from "express";
import AppError from "@utils/AppError";
import { verifyAccessToken } from "@modules/auth/utils/auth.tokens";
import UserService from "@modules/user/user.service";

const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.signedCookies?.access_token;

    if (!token) {
      return next(AppError.unauthorized("Authentication required"));
    }

    const payload = verifyAccessToken(token);

    const user = await UserService.getUserById(payload.id);

    if (!user) {
      return next(AppError.unauthorized("User not found"));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(
      AppError.unauthorized(
        (err as Error).message || "Invalid or expired token",
      ),
    );
  }
};

export default authenticate;
