/**
 * Jest Configuration File for the Backend Service
 * ------------------------------------------------
 * This configuration file sets up the Jest testing framework with TypeScript (via ts-jest),
 * ensuring comprehensive coverage reporting, module resolution, and strict testing standards
 * aligned with the project's code quality requirements.
 *
 * References:
 * - Technical Specifications/A.1.2 Code Quality Standards
 * - Testing Infrastructure Requirements
 * - ts-jest, Jest, and related dependencies
 */

// Importing Jest type definitions (version ^29.0.0) for a strongly typed config.
import type { Config } from '@jest/types'; // @jest/types ^29.0.0

// Importing ts-jest type definitions (version ^29.0.0) for TypeScript-specific Jest configuration.
import type { JestConfigWithTsJest } from 'ts-jest'; // ts-jest ^29.0.0

/**
 * The complete Jest configuration object for backend testing setup.
 * This object adheres to both the standard Jest configuration structure
 * (via the Config type) and the ts-jest extension (via the JestConfigWithTsJest type).
 */
const jestConfig: JestConfigWithTsJest = {
  // Utilize ts-jest preset to properly handle TypeScript compilation during testing.
  preset: 'ts-jest',

  // Specify the test environment as Node.js for backend-focused testing.
  testEnvironment: 'node',

  /**
   * roots - Define the primary directories where Jest will look for test files.
   * This helps segregate tests from any distributed or build output.
   */
  roots: [
    '<rootDir>/src',
    '<rootDir>/tests',
  ],

  /**
   * moduleNameMapper - A mapping that helps Jest resolve path aliases.
   * This is particularly useful for cleaner import paths in TypeScript files.
   */
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  /**
   * moduleFileExtensions - Used by Jest to locate/test files with these specific extensions.
   * Ensures compatibility with TS, JS, JSON, and Node.
   */
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  /**
   * testRegex - Pattern matching test files (e.g., *.test.ts, *.spec.js, etc.),
   * including the __tests__ folder structure.
   */
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',

  /**
   * transform - Instructs Jest to use ts-jest for transformation of .ts/.tsx files,
   * enabling TypeScript support.
   */
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  /**
   * collectCoverageFrom - Specifies the directories and file patterns for coverage data collection.
   * Excludes type definition files, index, and certain folders as needed.
   */
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/types/**',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],

  /**
   * coverageDirectory - Directory path to output all coverage reports.
   */
  coverageDirectory: 'coverage',

  /**
   * coverageReporters - Formats in which the coverage data should be reported.
   * text, lcov, and json-summary are used here for thorough reporting.
   */
  coverageReporters: ['text', 'lcov', 'json-summary'],

  /**
   * coverageThreshold - Enforces specific minimum coverage levels.
   * If any threshold is not met, Jest will fail the test suite.
   */
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  /**
   * setupFilesAfterEnv - A list of modules that will be run before
   * all tests, useful for global test setup (e.g., custom matchers).
   */
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  /**
   * testPathIgnorePatterns - Patterns to avoid when scanning for tests,
   * excluding commonly ignored or built directories like node_modules, dist, or coverage.
   */
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],

  /**
   * globals - Additional config keys for ts-jest.
   * Setting diagnostics to true ensures that TypeScript compilation issues
   * appear as part of the test feedback.
   */
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: true,
    },
  },

  /**
   * verbose - When set to true, Jest outputs individual test results to the console.
   * This is helpful for debugging and reviewing test results.
   */
  verbose: true,

  /**
   * testTimeout - Maximum time (in milliseconds) each test can run before Jest aborts.
   * Here it is set to 10 seconds, which is often sufficient for backend integration tests.
   */
  testTimeout: 10000,

  /**
   * maxWorkers - Controls the maximum number of worker processes used by Jest.
   * Using a percentage helps control resource usage in CI environments.
   */
  maxWorkers: '50%',
};

export default jestConfig;