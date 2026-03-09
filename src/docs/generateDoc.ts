import { generateTspec, Tspec } from "tspec";
import fs from "fs";
import path from "path";

const options: Tspec.GenerateParams = {
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

async function generate() {
  console.log("Generating OpenAPI specification...");
  const spec = await generateTspec(options);
  const outputPath = path.join(process.cwd(), "openapi.json");
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`OpenAPI specification generated at ${outputPath}`);
}

generate().catch((err) => {
  console.error("Failed to generate OpenAPI specification:", err);
  process.exit(1);
});
