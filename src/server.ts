import dotenv from "dotenv";
dotenv.config();
import app, { mountSwagger } from "./app";
import connectDB from "./config/db";
import { PORT } from "@config/env";
import { getTSpec } from "@docs/tspecGenerator";
import { notFound } from "@middlewares/notFound";

async function start() {
  await connectDB();
  const spec = await getTSpec(); // async is allowed here
  mountSwagger(spec);
  app.use("*", notFound);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start();
