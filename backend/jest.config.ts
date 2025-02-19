const path = require("path");

module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@/(.*)$": path.join(__dirname, "src/$1"),
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      },
    ],
  },
  testMatch: ["**/tests/**/*.test.ts"],
};
