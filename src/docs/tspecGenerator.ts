import { generateTspec, Tspec } from "tspec";

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

export async function getTSpec() {
  return await generateTspec(options);
}
