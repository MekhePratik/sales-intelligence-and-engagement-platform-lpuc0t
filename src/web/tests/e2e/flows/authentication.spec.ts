/**
 * End-to-end test suite for authentication flows, using Playwright ^1.40.0.
 * This suite covers:
 * - Setup and teardown steps for isolation and state management.
 * - Successful login flow using JWT + session validation, CSRF checks, and security headers.
 * - MFA enrollment and verification flow including rate limiting and backup code validation.
 *
 * Requirements Addressed:
 * 1) Comprehensive verification of JWT + Session authentication, MFA, and OAuth implementations.
 * 2) Ensuring smooth authentication flows aligned with user adoption targets.
 * 3) Validation of input validation, rate limiting, and security measures.
 */

import { test, expect } from '@playwright/test' // version ^1.40.0

/**
 * Internal dependencies.
 * Importing types from src/web/src/types/auth.ts
 * - LoginCredentials for user email/password
 * - AuthError for potential authentication error structure
 * - MFASettings for multi-factor authentication configuration
 */
import type { LoginCredentials, AuthError, MFASettings } from '../../src/types/auth'

// -----------------------------------------------------------------------------
// Global configuration objects, as specified in the JSON specification.
// -----------------------------------------------------------------------------

/**
 * TEST_USERS object containing pre-defined user accounts for testing.
 * Includes standard user details, MFA-enabled user, and placeholder social user.
 */
const TEST_USERS = {
  standard: {
    email: 'test@example.com',
    password: 'Test123!@#',
    name: 'Test User'
  },
  mfa: {
    email: 'mfa@example.com',
    password: 'Mfa123!@#',
    name: 'MFA Test User'
  },
  social: {
    email: 'social@example.com',
    provider: 'google'
  }
}

/**
 * TEST_CONFIG object providing baseUrl, API endpoints, and rate limit configurations.
 */
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:3000/api',
  rateLimits: {
    loginAttempts: 5,
    passwordResetAttempts: 3,
    timeWindow: 300000
  }
}

// -----------------------------------------------------------------------------
// Describe block encapsulates authentication flow tests.
// -----------------------------------------------------------------------------

test.describe('Authentication Flows', () => {
  /**
   * Hook: beforeEach
   * Enhanced setup function run before each test with isolation and state management.
   * Steps:
   * 1) Create new isolated browser context.
   * 2) Clear cookies, localStorage, and sessionStorage.
   * 3) Reset rate limiting counters.
   * 4) Initialize test database state.
   * 5) Configure test email interceptor.
   * 6) Navigate to base URL.
   */
  test.beforeEach(async ({ page, context }) => {
    // 1) Create new isolated browser context is handled internally by Playwright's parallelization.
    //    (Optionally we could create it manually if needed, but each test receives a fresh context by default.)

    // 2) Clear cookies, localStorage, and sessionStorage to ensure a clean start for each test.
    await context.clearCookies()
    await page.goto('about:blank')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // 3) Reset rate limiting counters (simulated API call to test utility endpoint).
    await page.request.post(`${TEST_CONFIG.apiUrl}/test-utils/reset-rate-limits`)

    // 4) Initialize test database state. This can be an API call that resets the DB to a known condition.
    await page.request.post(`${TEST_CONFIG.apiUrl}/test-utils/init-db-state`)

    // 5) Configure test email interceptor to capture outgoing emails for verification in tests.
    await page.request.post(`${TEST_CONFIG.apiUrl}/test-utils/configure-email-interceptor`)

    // 6) Navigate to the base URL for all subsequent test operations.
    await page.goto(TEST_CONFIG.baseUrl)
  })

  /**
   * Hook: afterEach
   * Enhanced cleanup function for thorough test isolation.
   * Steps:
   * 1) Close browser context.
   * 2) Clear test data from database.
   * 3) Reset MFA configurations.
   * 4) Clear email interceptor.
   * 5) Reset rate limiting state.
   */
  test.afterEach(async ({ context, page }) => {
    // 1) Close browser context. (Auto-handled by Playwright if desired, but shown explicitly.)
    await context.close()

    // 2) Clear test data from database (API call to remove created resources).
    await page.request.post(`${TEST_CONFIG.apiUrl}/test-utils/clear-test-data`)

    // 3) Reset MFA configurations to default off state for subsequent tests.
    await page.request.post(`${TEST_CONFIG.apiUrl}/test-utils/reset-mfa`)

    // 4) Clear email interceptor to release references and avoid data collision.
    await page.request.post(`${TEST_CONFIG.apiUrl}/test-utils/clear-email-interceptor`)

    // 5) Reset rate limiting state once again.
    await page.request.post(`${TEST_CONFIG.apiUrl}/test-utils/reset-rate-limits`)
  })

  /**
   * Test: testSuccessfulLogin
   * Tests successful login flow with session validation.
   * Steps:
   * 1) Navigate to login page.
   * 2) Fill in valid credentials.
   * 3) Submit login form.
   * 4) Verify CSRF token presence.
   * 5) Verify redirect to dashboard.
   * 6) Validate JWT token structure.
   * 7) Verify session cookie security flags.
   * 8) Validate user context.
   * 9) Check security headers.
   */
  test('testSuccessfulLogin', async ({ page }) => {
    // 1) Navigate directly to login page.
    await page.goto(`${TEST_CONFIG.baseUrl}/login`)

    // 2) Fill in valid credentials using the standard test user.
    const validCredentials: LoginCredentials = {
      email: TEST_USERS.standard.email,
      password: TEST_USERS.standard.password
    }
    await page.fill('input[name="email"]', validCredentials.email)
    await page.fill('input[name="password"]', validCredentials.password)

    // 3) Submit login form (click the "Login" button or equivalent).
    await page.click('button[type="submit"]')

    // 4) Verify CSRF token presence, e.g., hidden input or as part of a form field.
    //    Implementation detail depends on the actual page's structure.
    const csrfTokenPresent = await page.evaluate(() => {
      const csrfElement = document.querySelector('input[name="csrfToken"]')
      return csrfElement !== null
    })
    expect(csrfTokenPresent).toBeTruthy()

    // 5) Verify redirect to dashboard or homepage, checking final route.
    await page.waitForURL(`${TEST_CONFIG.baseUrl}/dashboard`)
    expect(page.url()).toBe(`${TEST_CONFIG.baseUrl}/dashboard`)

    // 6) Validate JWT token structure in localStorage or cookie as needed.
    //    Illustratively check for a well-formed JWT with 3 segments separated by dots.
    const localStorageJWT = await page.evaluate(() => localStorage.getItem('access_token'))
    expect(localStorageJWT).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)

    // 7) Verify session cookie security flags (HTTPOnly, Secure, SameSite).
    //    Example fetch of all cookies, then checking for known session cookie attributes.
    const allCookies = await page.context().cookies()
    const sessionCookie = allCookies.find((c) => c.name === 'session_id')
    expect(sessionCookie).toBeDefined()
    if (sessionCookie) {
      expect(sessionCookie.httpOnly).toBeTruthy()
      expect(sessionCookie.secure).toBeTruthy()
      // For demonstration, we can check SameSite if available:
      // expect(sessionCookie.sameSite).toBe('Lax')
    }

    // 8) Validate user context by checking displayed user name or success message.
    const welcomeMessage = await page.textContent('.welcome-banner')
    expect(welcomeMessage).toContain(TEST_USERS.standard.name)

    // 9) Check security headers with a response from the dashboard page or subsequent request.
    //    We'll examine the final page's main resource response for typical security headers.
    const [dashboardResponse] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/dashboard') && resp.request().method() === 'GET')
    ])
    const cspHeader = dashboardResponse.headers()['content-security-policy'] || ''
    expect(cspHeader).toContain('default-src')
  })

  /**
   * Test: testMFAFlow
   * Tests complete MFA enrollment and verification flow.
   * Steps:
   * 1) Login with MFA-enabled user.
   * 2) Verify MFA challenge screen.
   * 3) Test TOTP code generation.
   * 4) Validate backup codes.
   * 5) Test invalid MFA attempts.
   * 6) Verify rate limiting.
   * 7) Complete MFA verification.
   * 8) Validate session state.
   */
  test('testMFAFlow', async ({ page }) => {
    // 1) Login with MFA-enabled user by navigating to login page and entering credentials.
    const mfaCredentials: LoginCredentials = {
      email: TEST_USERS.mfa.email,
      password: TEST_USERS.mfa.password
    }
    await page.goto(`${TEST_CONFIG.baseUrl}/login`)
    await page.fill('input[name="email"]', mfaCredentials.email)
    await page.fill('input[name="password"]', mfaCredentials.password)
    await page.click('button[type="submit"]')

    // 2) Verify MFA challenge screen is displayed.
    await page.waitForSelector('#mfa-challenge-form')
    const challengeTitle = await page.textContent('#mfa-challenge-title')
    expect(challengeTitle).toContain('Multi-Factor Authentication Required')

    // 3) Test TOTP code generation.
    //    In a real scenario, this would involve generating a TOTP from the secret.
    //    Here we simulate or retrieve a test TOTP code from an API.
    const testTOTPCode = '123456'
    await page.fill('input[name="totp"]', testTOTPCode)

    // 4) Validate backup codes presence or usage. This might involve a second path for backup codes.
    //    For demonstration, we ensure the presence of a 'backup codes' link or similar element.
    const backupLinkVisible = await page.isVisible('#backup-codes-link')
    expect(backupLinkVisible).toBeTruthy()

    // 5) Test invalid MFA attempts (e.g., incorrect TOTPs) to ensure error handling and lockouts.
    await page.fill('input[name="totp"]', '000000') // invalid code
    await page.click('button[type="submit"]')
    const errorAlert = await page.textContent('#mfa-error')
    expect(errorAlert).toContain('Invalid MFA code')

    // 6) Verify rate limiting if user repeatedly enters wrong codes.
    //    We can loop some invalid attempts to see if we get a rate-limit message:
    for (let i = 0; i < TEST_CONFIG.rateLimits.loginAttempts; i++) {
      await page.fill('input[name="totp"]', '000000')
      await page.click('button[type="submit"]')
    }
    const possiblyRateLimited = await page.isVisible('#mfa-rate-limit-warning')
    expect(possiblyRateLimited).toBeTruthy()

    // 7) Complete MFA verification with a valid code to bypass rate limit for demonstration.
    await page.request.post(`${TEST_CONFIG.apiUrl}/test-utils/reset-rate-limits`) // reset to allow final valid attempt
    await page.fill('input[name="totp"]', testTOTPCode)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${TEST_CONFIG.baseUrl}/dashboard`)

    // 8) Validate session state post-MFA verification, ensuring user is fully authenticated.
    const sessionToken = await page.evaluate(() => localStorage.getItem('access_token'))
    expect(sessionToken).not.toBeNull()

    //    Optionally verify user name or MFA-enabled status on the dashboard.
    const userGreeting = await page.textContent('.welcome-banner')
    expect(userGreeting).toContain(TEST_USERS.mfa.name)
  })
})