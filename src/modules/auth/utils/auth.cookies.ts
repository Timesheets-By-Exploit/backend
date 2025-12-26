import { convertTimeToMilliseconds } from "@utils/index";
import { Response } from "express";

export function setAuthCookies({
  res,
  accessToken,
  refreshToken,
  refreshTokenExpiresAt,
}: {
  res: Response;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}) {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "none" : "lax";

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: convertTimeToMilliseconds(15, "min"),
    path: "/",
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: Math.max(0, refreshTokenExpiresAt.getTime() - Date.now()),
    path: "/auth/refresh",
  });
}

export function clearAuthCookies(res: Response) {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "none" : "lax";

  res.clearCookie("access_token", {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure,
    sameSite,
    path: "/auth/refresh",
  });
}
