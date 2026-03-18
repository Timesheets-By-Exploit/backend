import {
  JWT_ACCESS_EXPIRES_IN,
  JWT_SECRET,
  REFRESH_TOKEN_BYTES,
} from "@config/env";
import * as jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { generateRandomTokenWithCrypto } from "@utils/generators";
import { hashWithCrypto } from "@utils/encryptors";
import { IUser } from "@modules/user/user.types";
import { AccessPayload } from "../auth.types";
import { DEFAULT_REFRESH_DAYS } from "@config/constants";
import { RefreshTokenModel } from "../refreshToken.model";
import UserService from "@modules/user/user.service";

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

  const rawRefreshToken = generateRandomTokenWithCrypto(REFRESH_TOKEN_BYTES);
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
    rememberMe,
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

  // Atomically revoke the token if it is still active.
  // Using findOneAndUpdate as the atomic gate eliminates the race condition
  // where two concurrent requests could both pass the revokedAt === null check.
  const existing = await RefreshTokenModel.findOneAndUpdate(
    { tokenHash: oldHash, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedByIp: ip } },
    { new: false },
  );

  if (!existing) {
    // Token not found or already revoked — check whether this is a reuse attack.
    const doc = await RefreshTokenModel.findOne({ tokenHash: oldHash });
    if (doc?.revokedAt) {
      // A previously valid token is being replayed — revoke the entire family.
      await RefreshTokenModel.updateMany(
        { user: doc.user, revokedAt: null },
        { revokedAt: new Date(), reason: "reused" },
      );
    }
    throw new Error("Invalid token");
  }

  if (existing.expiresAt < new Date()) {
    await RefreshTokenModel.updateOne(
      { _id: existing._id },
      { reason: "expired" },
    );
    throw new Error("Refresh token expired");
  }

  const user = await UserService.getUserById(existing.user.toString());
  if (!user) throw new Error("User not found!");

  const rawRefreshToken = generateRandomTokenWithCrypto(REFRESH_TOKEN_BYTES);
  const newHash = hashWithCrypto(rawRefreshToken);

  // Preserve the original session length the user chose at login.
  const rememberMe = existing.rememberMe ?? false;
  const expiresAt = new Date(
    Date.now() + (rememberMe ? DEFAULT_REFRESH_DAYS : 7) * 24 * 60 * 60 * 1000,
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
          rememberMe,
        },
      ],
      { session },
    );

    // Update the old token's chain pointer and reason inside the transaction.
    await RefreshTokenModel.updateOne(
      { _id: existing._id },
      { replacedByToken: newRefreshToken[0]?._id, reason: "rotated" },
      { session },
    );

    await session.commitTransaction();

    return {
      refreshToken: rawRefreshToken,
      refreshTokenId: newRefreshToken[0]?._id,
      accessToken: generateAccessToken({
        id: user._id.toString(),
        email: user.email,
      }),
      expiresAt,
    };
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    await session.endSession();
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
