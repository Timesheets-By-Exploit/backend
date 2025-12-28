import * as signature from "cookie-signature";
import { COOKIE_SECRET } from "@config/env";

export const TEST_CONSTANTS = {
  verifiedUserEmail: "verified@example.com",
  nonVerifiedUserEmail: "nonverified@example.com",
  testPassword: "Secret123!",
  newPassword: "newPassword456!",
} as const;

export const createSignedAccessTokenCookie = (accessToken: string): string => {
  const signedToken = "s:" + signature.sign(accessToken, COOKIE_SECRET);
  return `access_token=${signedToken}`;
};
