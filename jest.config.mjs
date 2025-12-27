export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  clearMocks: true,
  extensionsToTreatAsEsm: [".ts"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  maxWorkers: 1,
  transformIgnorePatterns: ["node_modules/(?!(.*@faker-js/faker))"],
  moduleNameMapper: {
    "^@app$": "<rootDir>/src/app.ts",
    "^@server$": "<rootDir>/src/server.ts",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@tests/(.*)$": "<rootDir>/src/tests/$1",
    "^@middlewares/(.*)$": "<rootDir>/src/middlewares/$1",
    "^@docs/(.*)$": "<rootDir>/src/docs/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
  },
};
