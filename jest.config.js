/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testMatch: ["**/__tests__/**/*.ts"],
  moduleFileExtensions: ["js", "ts"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coverageReporters: ['lcov', 'text', 'cobertura'],
};

module.exports = config;
