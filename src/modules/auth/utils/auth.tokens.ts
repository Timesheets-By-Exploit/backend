import { JWT_ACCESS_EXPIRES_IN, JWT_SECRET } from "@config/env";
import * as jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { generateRandomTokenWithCrypto } from "@utils/generators";
import { hashWithCrypto } from "@utils/encryptors";
import { IUser } from "@modules/user/user.types";
import { AccessPayload } from "../auth.types";
import { DEFAULT_REFRESH_DAYS } from "@config/constants";
import UserModel from "@modules/user/user.model";
import { convertTimeToMilliseconds } from "@utils/index";
import { RefreshTokenModel } from "../refreshToken.model";

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, JWT_SECRET) as AccessPayload;
}

export async function createTokensForUser(
  user: IUser,
  rememberMe = false,
  ip?: string,
  userAgent?: string,
) {
  const accessToken = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
  });

  const rawRefreshToken = generateRandomTokenWithCrypto(
    Number(process.env.REFRESH_TOKEN_BYTES || 64),
  );
  const tokenHash = hashWithCrypto(rawRefreshToken);

  const expiresAt = new Date(
    Date.now() + (rememberMe ? DEFAULT_REFRESH_DAYS : 7) * 24 * 60 * 60 * 1000,
  );

  const refreshDoc = await RefreshTokenModel.create({
    user: user._id,
    tokenHash,
    expiresAt,
    createdByIp: ip,
    userAgent,
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    refreshTokenId: refreshDoc._id,
    expiresAt,
  };
}

export async function rotateRefreshToken(
  oldToken: string,
  ip?: string,
  userAgent?: string,
) {
  const oldHash = hashWithCrypto(oldToken);
  const existing = await RefreshTokenModel.findOne({ tokenHash: oldHash });

  if (!existing || existing.revokedAt) {
    if (existing && existing.revokedAt) {
      await RefreshTokenModel.updateMany(
        { user: existing.user, revokedAt: null },
        { revokedAt: new Date(), reason: "reused" },
      );
    }
    throw new Error("Invalid token");
  }

  if (existing.expiresAt < new Date()) {
    await existing.updateOne({
      revokedAt: new Date(),
      reason: "expired",
    });
    throw new Error("Refresh token expired");
  }
  const user = await UserModel.findById(existing.user);
  if (!user) throw new Error("User not found!");
  const rawRefreshToken = generateRandomTokenWithCrypto(
    Number(process.env.REFRESH_TOKEN_BYTES || 64),
  );
  const newHash = hashWithCrypto(rawRefreshToken);
  const expiresAt = new Date(
    Date.now() + convertTimeToMilliseconds(720, "hours"),
  );

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const newRefreshToken = await RefreshTokenModel.create(
      [
        {
          user: existing.user,
          tokenHash: newHash,
          expiresAt,
          createdByIp: ip,
          userAgent,
        },
      ],
      { session },
    );

    existing.revokedAt = new Date();
    existing.revokedByIp = ip as string;
    existing.replacedByToken = newRefreshToken[0]?._id?.toString() as string;
    await existing.save({ session });

    await session.commitTransaction();

    return {
      refreshToken: rawRefreshToken,
      refreshTokenId: newRefreshToken[0]?._id,
      accessToken: generateAccessToken({
        id: user._id.toString(),
        email: user?.email,
      }),
      expiresAt,
    };
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    session.endSession();
  }
}

export async function revokeRefreshToken(token: string | null, ip?: string) {
  if (!token) return;
  const tokenHash = hashWithCrypto(token);
  await RefreshTokenModel.findOneAndUpdate(
    { tokenHash },
    { revokedAt: new Date(), revokedByIp: ip, reason: "logout" },
  );
}

export function generateAccessToken(payload: AccessPayload) {
  return jwt.sign(
    payload,
    JWT_SECRET as string,
    {
      expiresIn: (JWT_ACCESS_EXPIRES_IN as string) || "15m",
    } as jwt.SignOptions,
  );
}
