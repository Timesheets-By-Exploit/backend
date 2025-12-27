import { z } from "zod";
import crypto from "crypto";

export function generateCode(numberOfDigits: number) {
  const isNumberOfDigitsGeneratable = z
    .number()
    .int()
    .gt(2)
    .lt(16)
    .safeParse(numberOfDigits);

  if (isNumberOfDigitsGeneratable.error)
    throw new Error(isNumberOfDigitsGeneratable.error.message);

  return Math.floor(
    Math.pow(10, numberOfDigits - 1) +
      Math.random() * 9 * Math.pow(10, numberOfDigits - 1),
  ).toString();
}

export function generateRandomTokenWithCrypto(bytes = 64) {
  return crypto.randomBytes(bytes).toString("hex");
}
