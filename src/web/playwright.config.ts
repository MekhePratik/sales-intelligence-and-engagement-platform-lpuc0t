/* Playwright configuration file for comprehensive end-to-end testing
 * across multiple browsers and devices. This configuration covers
 * parallel execution, environment setup, and reporting integrations.
 */

// Importing defineConfig and devices from @playwright/test ^1.38.0 for powerful Playwright config.
import { defineConfig, devices } from '@playwright/test' // ^1.38.0

/**
 * Exporting a default configuration object of type PlaywrightTestConfig
 * that includes all critical testing parameters such as test directory,
 * global timeouts, browser projects, reporting options, and more.
 */
export default defineConfig({
  /**
   * The directory where all end-to-end test files are located.
   * This path is relative to the current working directory.
   */
  testDir: 'tests/e2e',

  /**
   * Maximum time one test can run before timing out.
   * Adjust this value to accommodate potentially long-running tests.
   */
  timeout: 30000,

  /**
   * Defines the number of times a test is retried upon failure
   * before marking it as a final failure.
   */
  retries: 2,

  /**
   * Controls the number of parallel worker processes. Here, "50%"
   * signifies running half as many test workers as CPU cores.
   */
  workers: '50%',

  /**
   * Global CLI options configuration for test execution.
   * These settings apply to all tests unless overridden in projects.
   */
  fullyParallel: true,
  forbidOnly: false,
  globalTimeout: 5400000, // 1.5 hours in milliseconds
  grep: '.*',             // Regex pattern to include tests
  grepInvert: null,       // Regex pattern to exclude tests
  maxFailures: 5,         // Stop test run after certain number of failures
  quiet: false,           // Output logs to the console
  updateSnapshots: 'missing', // Update missing snapshots only

  /**
   * Configuration for how Playwright handles fundamental test resources.
   * This includes baseURL for environment, trace, screenshot, and more.
   */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },

  /**
   * Defines browser-specific settings for running tests under various conditions,
   * such as desktop, mobile, and tablet form factors, across Chromium, Firefox, and WebKit.
   */
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
        },
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        browserName: 'firefox',
        viewport: { width: 1440, height: 900 },
        firefoxUserPrefs: {
          'media.navigator.streams.fake': true,
        },
      },
    },
    {
      name: 'Desktop Safari',
      use: {
        browserName: 'webkit',
        viewport: { width: 1440, height: 900 },
        actionTimeout: 15000,
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'Tablet Safari',
      use: {
        browserName: 'webkit',
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  /**
   * Configures multiple reporters to generate test result artifacts
   * in different formats. Includes HTML, JSON, and JUnit for broader
   * compatibility with external systems.
   */
  reporter: [
    ['html', { open: 'never', outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/json/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit/results.xml' }],
  ],

  /**
   * Directory to store all test outputs such as screenshots, videos, traces,
   * and other logs. Use preserveOutput to selectively retain files.
   */
  outputDir: 'test-results',

  /**
   * Retain artifacts only for failing tests. This helps reduce disk usage
   * while still providing valuable information for debugging.
   */
  preserveOutput: 'failures-only',

  /**
   * Web server setup for local development and CI environments. The server
   * is started before tests run, and automatically shut down afterwards,
   * unless reuseExistingServer is set to true.
   */
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: false,
    timeout: 120000,
  },

  /**
   * Expect configuration to fine-tune advanced playwright expect calls.
   * Controls default expectation timeouts and screenshot diff thresholds.
   */
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
})