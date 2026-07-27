/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  testPathIgnorePatterns: ["\\.integration\\.spec\\.ts$"],
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },

  testEnvironment: "node",
  passWithNoTests: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@intervu-ai/generation$": "<rootDir>/../../../generation/src/index.ts",
    "^@intervu-ai/generation/(.*)$": "<rootDir>/../../../generation/src/$1",
  },
};
