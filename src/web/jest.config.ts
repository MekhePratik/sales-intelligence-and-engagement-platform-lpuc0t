/**
 * Jest configuration file for the Next.js web application.
 * This configuration is designed to enforce comprehensive testing,
 * align with enterprise code quality standards, and provide optimized performance.
 * 
 * References:
 * - Technical Specifications/A.1.2 Code Quality Standards/Testing
 * - Technical Specifications/4.5 Development & Deployment/Development Environment
 */

// Using external type definitions from @jest/types@^29.7.0
import type { Config } from '@jest/types';

/**
 * Comprehensive Jest configuration for this Next.js application.
 * This configuration ensures consistent testing across unit, integration, and E2E levels,
 * while also providing coverage thresholds and utilizing SWC for higher performance.
 */
const config: Config = {
  /**
   * Specifies the test environment to be "jsdom", emulating a browser-like environment.
   * This is essential for React component tests that rely on DOM APIs.
   */
  testEnvironment: 'jsdom',

  /**
   * An array of modules that run some code to configure or set up the testing framework
   * before each test file in the suite is executed.
   */
  setupFilesAfterEnv: [
    '@testing-library/jest-dom',         // Extended DOM assertions for testing-library
    '<rootDir>/tests/setup.ts'           // Custom test setup (e.g., mocks, global vars)
  ],

  /**
   * A series of custom module name mappings to simplify imports within the application.
   * Maps certain prefix patterns to specific directories in the project.
   */
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/api/(.*)$': '<rootDir>/src/api/$1',
    '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '\\.css$': 'identity-obj-proxy' // Mocks CSS imports to allow Jest processing
  },

  /**
   * A set of glob patterns that Jest uses to detect test files.
   * These patterns cover unit, integration, and E2E tests in both TypeScript and TSX.
   */
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/unit/**/*.test.tsx',
    '<rootDir>/tests/integration/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.test.tsx',
    '<rootDir>/tests/e2e/**/*.test.ts',
    '<rootDir>/tests/e2e/**/*.test.tsx'
  ],

  /**
   * A set of glob patterns indicating which files Jest should collect coverage information from.
   * Excludes certain files like type definitions, story files, tests, mocks, and API routes.
   */
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/app/api/**/*',
    '!src/**/*.stories.{ts,tsx}',
    '!src/test/**/*',
    '!src/**/*.test.{ts,tsx}',
    '!src/mocks/**/*',
    '!src/**/index.{ts,tsx}'
  ],

  /**
   * Coverage thresholds for the entire codebase, ensuring at least 80% coverage across branches,
   * functions, lines, and statements. Failing to meet these thresholds triggers a build error.
   */
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  /**
   * The transform object instructs Jest how to process different file types before testing.
   * Here we leverage @swc/jest for faster TypeScript and React transformations.
   */
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: true
          },
          transform: {
            react: {
              runtime: 'automatic'
            }
          }
        }
      }
    ]
  },

  /**
   * A list of file extensions that Jest will look for when resolving modules.
   * Ensures coverage of various standard extensions for the app.
   */
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  /**
   * Additional watch plugins to improve the Jest watch mode experience,
   * providing test-file and test-name suggestions.
   */
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  /**
   * Global values that will be defined in all test environments.
   * Here we specify properties for ts-jest if needed, even though SWC is primary.
   */
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true
    }
  },

  /**
   * Specifies the maximum time in milliseconds Jest should wait for a test to complete.
   * Helps prevent stalled tests from hanging the test suite.
   */
  testTimeout: 10000,

  /**
   * The maximum number of workers used to run tests in parallel.
   * Using "50%" helps balance CPU usage across available resources.
   */
  maxWorkers: '50%',

  /**
   * Enables Jest's verbose output, providing information about each individual test run.
   */
  verbose: true,

  /**
   * Automatically clears mock calls and instances between every test.
   * Prevents tests from affecting each other through shared state.
   */
  clearMocks: true,

  /**
   * Restores initial implementations of mocked functions before each test.
   */
  restoreMocks: true,

  /**
   * Resets mock state between every test, ensuring a clean slate for each test.
   */
  resetMocks: true,

  /**
   * A set of RegExp patterns that Jest uses to skip certain paths during the testing process.
   * Excludes the node_modules folder and Next.js build output directories.
   */
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/'
  ],

  /**
   * Bypass transformation of files matching these RegExp patterns.
   * Often used to skip CSS modules or external libraries.
   */
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$'
  ]
};

export default config;