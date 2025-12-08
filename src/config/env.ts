import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("4000"),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "staging", "test"])
    .default("development"),
  ZEPTO_MAIL_TOKEN: z.string(),
  ZEPTO_MAIL_URL: z.string(),
  FROM_EMAIL: z.string().email(),
  SUPPORT_EMAIL: z.string().email(),
  FROM_NAME: z.string(),
  JWT_ACCESS_EXPIRES_IN: z.string(),
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
        ZEPTO_MAIL_TOKEN: "",
        ZEPTO_MAIL_URL: "",
        SUPPORT_EMAIL: "",
        FROM_EMAIL: "",
        FROM_NAME: "",
        JWT_ACCESS_EXPIRES_IN: "",
      },
      error: envSchema.safeParse(process.env).error,
    }
  : envSchema.safeParse(process.env);

if (!env.success) {
  console.error("❌ Invalid environment variables:", env.error?.format());
  process.exit(1);
}

export const {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  NODE_ENV,
  ZEPTO_MAIL_TOKEN,
  ZEPTO_MAIL_URL,
  FROM_EMAIL,
  FROM_NAME,
  SUPPORT_EMAIL,
  JWT_ACCESS_EXPIRES_IN,
} = env.data;
