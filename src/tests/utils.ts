import mongoose from "mongoose";

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
