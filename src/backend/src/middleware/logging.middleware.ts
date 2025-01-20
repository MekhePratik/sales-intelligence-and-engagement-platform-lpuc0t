/* -------------------------------------------------------------------------------------------------
 * logging.middleware.ts
 *
 * This file provides an Express middleware for comprehensive request/response logging, incorporating:
 *  1. Structured logging with the Logger class (imported from ../utils/logger.util).
 *  2. PII protection through deep object inspection and masking.
 *  3. Correlation IDs via UUID v4 to help trace requests across distributed systems.
 *  4. Security context analysis (IP address, user agent, and basic authentication status checks).
 *  5. Performance monitoring (e.g., API response times, error rate) with DataDog metrics integration.
 *  6. Error handling integration with AppError for elevated enterprise compliance and stability.
 *
 * Implements these core utility functions:
 *  1. generateRequestId(): Generates a UUID-based request ID with a timestamp prefix.
 *  2. maskPII(): Recursively detects and masks sensitive fields using known RegExp patterns.
 *  3. createSecurityContext(): Extracts IP, user agent, and basic checks for use in logging and monitoring.
 *  4. requestLogger(): Primary middleware function that logs request details, monitors performance,
 *     and intercepts response completion/error for structured logging.
 *
 * This middleware aims to fulfill enterprise requirements for security, privacy, and production-grade
 * observability. All steps are extensively detailed within each function for clarity and maintainability.
 * ------------------------------------------------------------------------------------------------- */

import { Request, Response, NextFunction } from 'express'; // express@^4.18.0 Types
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0 for generating correlation IDs

// Internal imports
import { Logger } from '../utils/logger.util';
import { AppError } from '../utils/error.util';
import { API_RESPONSE_TIME, API_ERROR_RATE } from '../constants/metrics';

// ------------------------------------------------------------------------------------------------
// Global logger instance (could be configured with environment-based settings if needed).
// Provides .info(), .warn(), .error() methods (and more) for structured logging.
const logger = new Logger({ defaultLevel: 'info' });

// ------------------------------------------------------------------------------------------------
// 1. generateRequestId
// ------------------------------------------------------------------------------------------------
/**
 * Generates a unique request identifier by combining a current timestamp prefix with a UUID v4 value.
 * This helps correlate log statements and other metrics to a single request across the system.
 *
 * STEPS:
 *  1. Generate UUID v4.
 *  2. Generate a numeric timestamp prefix (milliseconds since Unix epoch).
 *  3. Concatenate them into a string to form the final request ID.
 *
 * @returns A string-based unique identifier (e.g., "1689512345678_5b2d1f80-428e-4f74-8754-2c003b4f7d42").
 */
export function generateRequestId(): string {
  // STEP 1: Generate a new UUID v4
  const rawUuid = uuidv4();

  // STEP 2: Use the current time in milliseconds as a prefix
  const timestamp = Date.now();

  // STEP 3: Return a formatted string
  return `${timestamp}_${rawUuid}`;
}

// ------------------------------------------------------------------------------------------------
// 2. maskPII
// ------------------------------------------------------------------------------------------------
/**
 * Recursively detects and masks personally identifiable information in a given data object. This function:
 *  1. Deep clones the input to avoid side effects.
 *  2. Applies known patterns (e.g., email addresses, 16-digit numeric strings).
 *  3. Masks sensitive keys (password, secret, token, etc.).
 *  4. Returns the sanitized object.
 *
 * @param data - Potentially sensitive object requiring PII masking before logging.
 * @returns The masked/sanitized object, ensuring no direct exposure of PII in logs.
 */
export function maskPII<T>(data: T): T {
  // STEP 1: Deep clone the input, returning an empty object if falsy.
  const original = data ?? {};
  const clonedData = JSON.parse(JSON.stringify(original));

  // STEP 2: Define known PII patterns (email addresses, 16-digit numeric strings).
  // Also account for typical credit card or confidential sequences.
  const PII_PATTERNS: RegExp[] = [
    /\b\d{16}\b/g, // 16-digit sequences
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, // Emails
  ];

  // Helper to recursively find and replace PII in all string fields.
  function recursiveMask(inputObj: any): any {
    if (inputObj && typeof inputObj === 'object') {
      Object.keys(inputObj).forEach((key) => {
        const val = inputObj[key];
        if (typeof val === 'string') {
          let sanitized = val;
          for (const pattern of PII_PATTERNS) {
            sanitized = sanitized.replace(pattern, '[REDACTED]');
          }
          inputObj[key] = sanitized;
        } else if (
          typeof val === 'object' &&
          val !== null
        ) {
          recursiveMask(val);
        }
      });
    }
    return inputObj;
  }

  // Apply the PII masking
  recursiveMask(clonedData);

  // STEP 3: Known sensitive field names to be masked outright
  const SENSITIVE_KEYS = ['password', 'secret', 'token', 'apiKey', 'authToken', 'credential'];

  function maskSensitiveKeys(inputObj: any): any {
    if (inputObj && typeof inputObj === 'object') {
      Object.keys(inputObj).forEach((key) => {
        const val = inputObj[key];
        if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
          inputObj[key] = '[MASKED]';
        } else if (
          typeof val === 'object' &&
          val !== null
        ) {
          maskSensitiveKeys(val);
        }
      });
    }
    return inputObj;
  }
  maskSensitiveKeys(clonedData);

  // Return the masked object
  return clonedData;
}

// ------------------------------------------------------------------------------------------------
// 3. createSecurityContext
// ------------------------------------------------------------------------------------------------
/**
 * Assembles a security context object derived from request data. Includes:
 *  1. IP address extraction (req.ip).
 *  2. User agent details from request headers.
 *  3. A basic check for authentication status (assumes usage of a typical auth pattern).
 *  4. Request pattern analysis (could be expanded to detect known suspicious URIs or rate-limit info).
 *
 * @param req - The Express Request object from which security data is derived.
 * @returns A structured object containing relevant security data (ip, userAgent, isAuthenticated, etc.).
 */
export function createSecurityContext(req: Request): Record<string, any> {
  // STEP 1: Extract IP address from the Express request object
  let ipAddress = req.ip || '';
  if (req.headers['x-forwarded-for']) {
    // Some proxies or load balancers set x-forwarded-for
    ipAddress = (req.headers['x-forwarded-for'] as string).split(',')[0].trim();
  }

  // STEP 2: Get user agent details
  const userAgent = req.headers['user-agent'] || 'unknown';

  // STEP 3: Check authentication status (Placeholder for a real check, e.g., req.user)
  const isAuthenticated = !!(req as any).user;

  // STEP 4: Analyze request patterns for any suspicious or flagged behavior
  // (e.g., repeated attempts to access admin endpoints). For now, a placeholder:
  const suspiciousPatternsDetected = false;

  // STEP 5: Return the assembled security context
  return {
    ipAddress,
    userAgent,
    isAuthenticated,
    suspiciousPatternsDetected,
  };
}

// ------------------------------------------------------------------------------------------------
// 4. requestLogger (Express Middleware)
// ------------------------------------------------------------------------------------------------
/**
 * Primary Express middleware function for:
 *  1. Generating and attaching a correlation ID to the request/response lifecycle.
 *  2. Recording the request's start time for performance calculations.
 *  3. Masking PII in request body, query, and params before logging.
 *  4. Creating a security context with IP, user-agent, and authentication checks.
 *  5. Intercepting the response 'finish' event to measure response time, track metrics,
 *     and log the final outcome.
 *  6. Handling errors using AppError if something unexpected occurs during the logging process.
 *
 * STEPS:
 *  1. Generate unique request ID using UUID v4.
 *  2. Create correlation context (attach to res.locals for consistency).
 *  3. Record request start time.
 *  4. Detect and mask PII in request data.
 *  5. Log sanitized request details with .info().
 *  6. Attach security context to the request or local scope.
 *  7. Intercept response events to measure performance metrics and log outcome.
 *  8. If an error arises, handle with next(error) to leverage centralized error handling (AppError).
 *  9. Pass control to next middleware/route handler by invoking next().
 *
 * @param req  - Incoming Express Request
 * @param res  - Outgoing Express Response
 * @param next - Next function in the middleware chain
 * @returns void (continues the Express request lifecycle)
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  try {
    // STEP 1: Generate unique request ID
    const correlationId = generateRequestId();

    // STEP 2: Attach correlation ID to res.locals for future reference
    res.locals.correlationId = correlationId;

    // STEP 3: Record the request start time for performance measurement
    const startTime = process.hrtime.bigint(); // High-precision timer

    // STEP 4: Detect and mask PII in request data (body, query, and params)
    const maskedBody = maskPII(req.body);
    const maskedQuery = maskPII(req.query);
    const maskedParams = maskPII(req.params);

    // STEP 5: Log sanitized request details at info level
    logger.info('Incoming Request', {
      correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      body: maskedBody,
      query: maskedQuery,
      params: maskedParams,
    });

    // STEP 6: Attach a security context
    const securityContext = createSecurityContext(req);

    // Combine security context with existing res.locals (optional)
    res.locals.securityContext = securityContext;

    // STEP 7: Intercept response finish event for measuring and logging the outcome
    res.on('finish', () => {
      // Calculate response time in milliseconds
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      // Track performance metric (API response time)
      logger.performance(API_RESPONSE_TIME, durationMs, {
        correlationId,
        method: req.method,
        url: req.originalUrl || req.url,
      });

      // If status code indicates error, track error rate as a simple performance metric
      if (res.statusCode >= 400) {
        logger.performance(API_ERROR_RATE, 1, {
          correlationId,
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
        });
      }

      // Log sanitized response information
      // (We typically do not log entire response body for security reasons, just status & timing.)
      logger.info('Outgoing Response', {
        correlationId,
        statusCode: res.statusCode,
        responseTimeMs: durationMs,
        securityContext, // includes IP, user agent, etc. for correlation
      });
    });

    // STEP 8: If an error arises within the remainder of this middleware, we rely on try/catch
    // but in normal usage, error handling is delegated to the next(error) call.

    // STEP 9: Pass control to the next middleware/route
    next();
  } catch (error) {
    // In case of unexpected error during logging process, handle with AppError pattern
    if (error instanceof AppError) {
      logger.error('Logging Middleware encountered AppError', { correlationId: res.locals.correlationId, error });
      return next(error);
    }
    logger.error('Logging Middleware encountered an unexpected error', { correlationId: res.locals.correlationId, error });
    return next(error);
  }
}