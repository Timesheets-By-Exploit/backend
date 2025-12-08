import bcrypt from "bcryptjs";
import crypto from "crypto";

export function hashWithCrypto(code: crypto.BinaryLike) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function hashWithBcrypt(str: string, salt?: string) {
  if (!salt) salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(str, salt);
}
export async function compareHashedBcryptString(plain: string, hashed: string) {
  return await bcrypt.compare(plain, hashed);
}
