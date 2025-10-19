import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("4000"),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "staging", "test"])
    .default("development"),
});

const isTest = process.env.NODE_ENV === "test";

const env = isTest
  ? {
      success: true,
      data: {
        PORT: "4000",
        MONGODB_URI: "mongodb://localhost:27017/test",
        JWT_SECRET: "testsecret",
        NODE_ENV: "test",
      },
      error: envSchema.safeParse(process.env).error,
    }
  : envSchema.safeParse(process.env);

if (!env.success) {
  console.error("❌ Invalid environment variables:", env.error?.format());
  process.exit(1);
}

export const { PORT, MONGODB_URI, JWT_SECRET, NODE_ENV } = env.data;
