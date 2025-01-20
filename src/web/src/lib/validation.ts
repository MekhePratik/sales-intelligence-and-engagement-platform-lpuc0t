/*******************************************************************************************
 * Core validation library providing comprehensive Zod schema definitions and validation
 * utilities with enhanced security features, performance optimizations, and detailed error
 * handling for form data, API requests, and data models across the web application.
 *
 * Implements:
 *  - Comprehensive input validation with zod (^3.22.0)
 *  - Security checks (domain validation, password complexity, rate limiting, sanitization)
 *  - Data integrity rules before persistence
 *  - High-performance result caching using memoizee (^0.4.15)
 *
 * This file addresses:
 *  - Input Validation (7. SECURITY CONSIDERATIONS/7.3 SECURITY PROTOCOLS/Security Controls)
 *  - Data Integrity (3.2 DATABASE DESIGN/Data Management Strategy)
 ******************************************************************************************/

/*******************************************************************************************
 * External Imports
 *******************************************************************************************/
// zod ^3.22.0 - Schema validation with strict type checking
import { z } from 'zod';
// memoizee ^0.4.15 - Validation result caching for performance optimization
import memoizee from 'memoizee';

/*******************************************************************************************
 * Internal Imports
 *******************************************************************************************/
// Type definitions for structured validation error responses
import { ApiError } from '../types/api';
// Enhanced email validation with domain checks and security patterns
import { isValidEmail } from './utils';

/*******************************************************************************************
 * Global Constants
 ******************************************************************************************/
/**
 * VALIDATION_CACHE_TTL
 *  - Maximum lifetime in milliseconds for cached validation results
 *  - Applied to memoized parse operations for performance gains
 */
export const VALIDATION_CACHE_TTL = 300000;

/**
 * MAX_VALIDATION_ATTEMPTS
 *  - Maximum number of validation attempts allowed before triggering rate limiting
 *  - Used for login credential validations to mitigate brute forcing
 */
export const MAX_VALIDATION_ATTEMPTS = 5;

/**
 * PASSWORD_REGEX
 *  - Enforces complexity rules:
 *    1. At least 1 lowercase letter
 *    2. At least 1 uppercase letter
 *    3. At least 1 digit
 *    4. At least 1 special character
 *    5. Minimum length of 8 characters
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/*******************************************************************************************
 * Interface Definitions
 ******************************************************************************************/
/**
 * LoginCredentials
 *  - Represents the user-provided data for a login attempt
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * RegisterCredentials
 *  - Represents the user data required for new account registrations
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}

/**
 * ValidationResult
 *  - Standardized result structure returned by validation functions
 *  - Includes:
 *    success: boolean indicating pass/fail
 *    errors: an array of structured ApiError objects
 *    metrics: an object for tracking attempt count, timestamps, etc.
 */
export interface ValidationResult {
  success: boolean;
  errors: ApiError[];
  metrics: {
    validatedAt: string;      // ISO timestamp indicating when validation was performed
    attemptCount: number;     // Number of attempts used for rate limiting
  };
}

/*******************************************************************************************
 * Enhanced Security & Rate Limiting Data Structures
 ******************************************************************************************/
/**
 * inMemoryLoginAttempts
 *  - Maps email string to the count of validation attempts within a certain TTL window.
 *  - Used to enforce MAX_VALIDATION_ATTEMPTS to mitigate brute-force attacks.
 */
const inMemoryLoginAttempts: Map<string, number> = new Map();

/**
 * Clears the record of login attempts for a specific email address if needed.
 * Typically called upon successful authentication or after a security cooldown period.
 *
 * @param email The user email address to clear from the login attempt map
 */
export function resetLoginAttempts(email: string): void {
  inMemoryLoginAttempts.delete(email.toLowerCase());
}

/*******************************************************************************************
 * Zod Schemas
 ******************************************************************************************/
/**
 * loginSchema
 *  - Enhanced login validation schema with security rules.
 *  - Ensures:
 *    - Valid email format using custom refine with isValidEmail
 *    - Minimal password length of 8 characters for basic security
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .refine(
      (val) => isValidEmail(val).isValid,
      'Invalid or unrecognized email address format.'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
});

/**
 * registrationSchema
 *  - Comprehensive registration validation schema with business rules and security checks.
 *  - Ensures:
 *    - Valid email using custom refine
 *    - Password matches PASSWORD_REGEX for complexity
 *    - Non-empty name and organizationName
 */
export const registrationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .refine(
      (val) => isValidEmail(val).isValid,
      'Invalid or unrecognized email address format.'
    ),
  password: z
    .string()
    .regex(
      PASSWORD_REGEX,
      'Password must contain upper, lower, digit, special char, and be at least 8 characters.'
    ),
  name: z.string().min(1, 'Name is required.'),
  organizationName: z.string().min(1, 'Organization name is required.')
});

/*******************************************************************************************
 * Memoized Parse Functions
 *  - Wraps the schema safeParse() calls in memoizee to avoid unnecessary
 *    repeated validations when inputs remain unchanged for a short duration.
 ******************************************************************************************/
const memoizedLoginSafeParse = memoizee(
  (credentials: LoginCredentials) => loginSchema.safeParse(credentials),
  {
    maxAge: VALIDATION_CACHE_TTL,
    primitive: true
  }
);

const memoizedRegistrationSafeParse = memoizee(
  (data: RegisterCredentials) => registrationSchema.safeParse(data),
  {
    maxAge: VALIDATION_CACHE_TTL,
    primitive: true
  }
);

/*******************************************************************************************
 * validateLoginCredentials
 *  - Validates login credentials with enhanced security checks (rate limiting),
 *    sanitization, structured error collection, and result metrics.
 *
 * Steps:
 *  1. Check rate limiting for ongoing validation attempts
 *  2. Sanitize input data
 *  3. Validate through compiled loginSchema (memoized)
 *  4. Perform additional security checks (e.g., attempt count)
 *  5. Record validation metrics
 *  6. Return structured validation result
 *
 * @param credentials - The user-provided login data
 * @returns Promise<ValidationResult> - Detailed result indicating success/fail and structured errors
 ******************************************************************************************/
export async function validateLoginCredentials(
  credentials: LoginCredentials
): Promise<ValidationResult> {
  const now = new Date().toISOString();
  const sanitizedEmail = credentials.email.trim().toLowerCase();
  const sanitizedPassword = credentials.password.trim();

  // 1. Check rate limiting
  const attemptCount = inMemoryLoginAttempts.get(sanitizedEmail) || 0;
  if (attemptCount >= MAX_VALIDATION_ATTEMPTS) {
    // If limit exceeded, return a rate-limited error
    const rateLimitedError: ApiError = {
      code: 'RATE_LIMITED',
      message: 'Maximum login validation attempts reached.',
      details: {},
      stack: '',
      timestamp: now,
      requestId: 'n/a'
    };

    return {
      success: false,
      errors: [rateLimitedError],
      metrics: {
        validatedAt: now,
        attemptCount
      }
    };
  }

  // 2. Sanitize input data object
  const safeCredentials: LoginCredentials = {
    email: sanitizedEmail,
    password: sanitizedPassword
  };

  // 3. Validate through loginSchema using memoized safeParse
  const parseResult = memoizedLoginSafeParse(safeCredentials);

  // 4. Increment attempt count for security check
  inMemoryLoginAttempts.set(sanitizedEmail, attemptCount + 1);

  // If validation fails, assemble structured errors
  if (!parseResult.success) {
    const validationError: ApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Failed to validate login credentials.',
      details: { issues: parseResult.error.issues },
      stack: '',
      timestamp: now,
      requestId: 'n/a'
    };

    return {
      success: false,
      errors: [validationError],
      metrics: {
        validatedAt: now,
        attemptCount: attemptCount + 1
      }
    };
  }

  // 5. Record successful validation metrics. Further security checks can be added here if needed.
  // 6. Return structured result
  return {
    success: true,
    errors: [],
    metrics: {
      validatedAt: now,
      attemptCount: attemptCount + 1
    }
  };
}

/*******************************************************************************************
 * validateRegistrationData
 *  - Validates registration data with comprehensive business rules and security checks,
 *    including domain validation, password complexity, and organizational constraints.
 *
 * Steps:
 *  1. Sanitize registration data
 *  2. Validate through compiled registrationSchema (memoized)
 *  3. Perform domain validation via isValidEmail
 *  4. Check password complexity (PASSWORD_REGEX in schema)
 *  5. Validate organization rules (illustrative placeholder)
 *  6. Record validation metrics
 *  7. Return structured validation result
 *
 * @param data - The user-provided registration data
 * @returns Promise<ValidationResult> - Detailed result indicating success/fail and structured errors
 ******************************************************************************************/
export async function validateRegistrationData(
  data: RegisterCredentials
): Promise<ValidationResult> {
  const now = new Date().toISOString();

  // 1. Sanitize registration data
  const safeData: RegisterCredentials = {
    email: data.email.trim().toLowerCase(),
    password: data.password.trim(),
    name: data.name.trim(),
    organizationName: data.organizationName.trim()
  };

  // 2. Validate through registrationSchema using memoized safeParse
  const parseResult = memoizedRegistrationSafeParse(safeData);
  if (!parseResult.success) {
    const validationError: ApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Failed to validate registration data.',
      details: { issues: parseResult.error.issues },
      stack: '',
      timestamp: now,
      requestId: 'n/a'
    };

    return {
      success: false,
      errors: [validationError],
      metrics: {
        validatedAt: now,
        attemptCount: 1
      }
    };
  }

  // 3. Perform domain validation (isValidEmail is already refined in schema).
  // 4. Check password complexity (enforced by .regex in schema).
  // 5. Validate organization rules (placeholder: additional checks could be performed here).

  // 6. Record validation metrics
  // 7. Return structured validation result
  return {
    success: true,
    errors: [],
    metrics: {
      validatedAt: now,
      attemptCount: 1
    }
  };
}