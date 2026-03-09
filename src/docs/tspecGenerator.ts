import fs from "fs";
import path from "path";
import { Tspec } from "tspec";

const options = {
  specPathGlobs: ["src/**/*.ts"],
  tsconfigPath: "./tsconfig.json",
  outputPath: "openapi.json",
  specVersion: 3,
  openapi: {
    title: "Timesheets By Exploit",
    version: "1.0.0",
    description:
      "This is the official documentation of the Timesheets By Exploit API",
  },
  debug: false,
  ignoreErrors: true,
};

export async function getTSpec() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.TSPEC_STATIC === "true"
  ) {
    try {
      const specPath = path.join(process.cwd(), "openapi.json");
      const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
      return spec;
    } catch (error) {
      console.error("Failed to load pre-generated OpenAPI spec:", error);
      throw error;
    }
  }

  // Dynamic import to avoid runtime dependency in production
  const { generateTspec } = await import("tspec");
  return await generateTspec(options as Tspec.GenerateParams | undefined);
}
