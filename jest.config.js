
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
};