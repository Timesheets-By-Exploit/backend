import mongoose from "mongoose";
import * as cookie from "cookie";

const MAX_RETRIES = 8;
const BASE_DELAY_MS = 50;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      const errorMessage = (err as Error).message || "";
      const isRetryable =
        errorMessage.includes("catalog changes") ||
        errorMessage.includes("please retry") ||
        errorMessage.includes("WriteConflict") ||
        (err as { code?: number }).code === 112;

      if (!isRetryable || attempt === retries - 1) {
        throw err;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw new Error("Max retries exceeded");
};

export const clearDB = async () => {
  await retryOperation(async () => {
    await mongoose.connection.dropDatabase();
  });

  await mongoose.connection.syncIndexes();
};

export const extractSignedCookie = (
  setCookieHeader: string | string[] | undefined,
  cookieName: string,
): string | null => {
  if (!setCookieHeader) return null;

  const cookieArray = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  const cookieString = cookieArray.find((c) => c.startsWith(`${cookieName}=`));
  if (!cookieString) return null;

  const parsed = cookie.parse(cookieString);
  const signedValue = parsed[cookieName];

  if (!signedValue || !signedValue.startsWith("s:")) {
    return null;
  }

  return signedValue;
};

export const extractSignedCookies = (
  setCookieHeader: string | string[] | undefined,
  cookieNames: string[],
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const cookieName of cookieNames) {
    const value = extractSignedCookie(setCookieHeader, cookieName);
    if (value) {
      result[cookieName] = value;
    }
  }

  return result;
};
