import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("4000"),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "staging"])
    .default("development"),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("❌ Invalid environment variables:", env.error.format());
  process.exit(1); // Exit if validation fails
}

export const { PORT, MONGODB_URI, JWT_SECRET, NODE_ENV } = env.data;
