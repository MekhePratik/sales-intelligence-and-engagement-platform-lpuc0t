/* ---------------------------------------------------------------------------------------------
 * File: validation.middleware.ts
 * Description: Express middleware for request validation using Zod schemas with enhanced
 * security features, rate limiting, and integration hooks for security monitoring.
 *
 * This file provides four main exports:
 *  1. validateRequest:  A comprehensive middleware factory that validates body, query, and
 *                       params simultaneously, includes a rate-limiting check, tracks security
 *                       context, and logs performance metrics.
 *  2. validateBody:     A specialized middleware factory that enforces validation rules on
 *                       request bodies, logs validation attempts, and integrates security context.
 *  3. validateQuery:    A specialized middleware factory for query string validation.
 *  4. validateParams:   A specialized middleware factory for URL parameter validation.
 *
 * Requirements Addressed:
 *  - Input Validation (Zod-based): Thorough schema validation per the B2B sales platform specs.
 *  - Security Controls: Rate limiting, enhanced error handling (AppError), and context tracking.
 *  - Security Monitoring: Placeholders for integration with monitoring/alerting systems on fail.
 *
 * NOTE: The actual rate-limiting strategy shown here uses a simple in-memory approach
 * and placeholders for security monitoring. For production-grade usage, adapt these
 * steps to invoke persistent storage (e.g. Redis) and a real monitoring system.
 * -------------------------------------------------------------------------------------------- */

/* -------------------------------- External Imports --------------------------------- */
// express version ^4.18.0
import { Request, Response, NextFunction } from 'express';
// zod version ^3.0.0
import { z } from 'zod';
// express-rate-limit version ^6.0.0
import rateLimit from 'express-rate-limit';

/* -------------------------------- Internal Imports -------------------------------- */
import { validateSchema } from '../utils/validation.util';
import { AppError } from '../utils/error.util';
import { ErrorCode } from '../constants/error-codes';

/* --------------------------------------------------------------------------------------------
 * In-Memory Rate Limiting Store
 * 
 * This simple object tracks the count of requests per unique key (e.g. IP address or user ID).
 * In high-traffic or distributed environments, a more robust store (Redis, Memcached) is needed.
 * -------------------------------------------------------------------------------------------- */
const requestCounts: Record<string, { count: number; lastRequestTimestamp: number }> = {};

/* --------------------------------------------------------------------------------------------
 * Helper Function: checkRateLimit
 * Description:
 *  - Check if a given unique identifier (e.g. IP address) has exceeded some threshold of requests
 *    within a fixed time window. Throws an AppError if the threshold is exceeded.
 * 
 *  - This is a simplistic example. Production code should use an external cache store or
 *    the express-rate-limit library's built-in approach for reliability and scalability.
 *
 * Steps:
 *  1. Read the current time and define a time window for counting requests.
 *  2. Increment the request count for the given key. If the time delta is beyond the window,
 *     reset the count.
 *  3. If the count exceeds the threshold, throw an AppError with code=RATE_LIMIT_EXCEEDED.
 * -------------------------------------------------------------------------------------------- */
function checkRateLimit(key: string, maxRequests = 100, windowMs = 60000): void {
  const currentTime = Date.now();
  const entry = requestCounts[key];

  // If no entry, create a new record.
  if (!entry) {
    requestCounts[key] = {
      count: 1,
      lastRequestTimestamp: currentTime,
    };
    return;
  }

  // If the time since last request is beyond the window, reset.
  if (currentTime - entry.lastRequestTimestamp > windowMs) {
    requestCounts[key] = {
      count: 1,
      lastRequestTimestamp: currentTime,
    };
    return;
  }

  // Otherwise, increment request count.
  requestCounts[key].count += 1;
  requestCounts[key].lastRequestTimestamp = currentTime;

  // If count is over threshold, throw AppError with code=RATE_LIMIT_EXCEEDED.
  if (requestCounts[key].count > maxRequests) {
    throw new AppError(
      'Rate limit exceeded. Too many requests within the defined time window.',
      ErrorCode.RATE_LIMIT_EXCEEDED,
      {
        context: {
          key,
          currentRequestCount: requestCounts[key].count,
        },
        source: 'ValidationMiddleware-checkRateLimit',
        severity: 2, // Example severity referencing custom scale in error.util
      },
    );
  }
}

/* --------------------------------------------------------------------------------------------
 * Factory: validateRequest
 * Description:
 *  - This is a comprehensive middleware factory that checks rate limits, constructs a security
 *    context, and validates the request body, query, and params (if schemas are provided).
 *  - On validation failure, it throws an AppError with code=VALIDATION_ERROR or
 *    RATE_LIMIT_EXCEEDED (when exceeding thresholds).
 *  - Logs attempts, captures metrics, and calls next() if all validations pass.
 *
 * Steps:
 *  1. Extract any provided schemas for body, query, and params.
 *  2. Check rate limiting threshold using checkRateLimit() with a unique key (e.g. IP).
 *  3. Build a security context object for potential auditing or advanced logging.
 *  4. Validate body, query, and params in turn (if schemas exist) using validateSchema().
 *  5. For each successful validation, optionally log success or performance metrics.
 *  6. Catch and transform any errors into an AppError, then propagate or rethrow.
 *  7. Call next() if everything passes.
 * -------------------------------------------------------------------------------------------- */
export function validateRequest(
  schemas: {
    body?: z.ZodSchema<any>;
    query?: z.ZodSchema<any>;
    params?: z.ZodSchema<any>;
  } = {},
  options?: {
    maxRequests?: number;
    windowMs?: number;
    enableLogging?: boolean;
  },
) {
  const maxRequests = options?.maxRequests ?? 50;
  const windowMs = options?.windowMs ?? 60000;
  const enableLogging = options?.enableLogging ?? true;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 2: Rate Limiting Threshold
      // Use IP address as the key or enrich with user ID if available
      const uniqueKey = req.ip || 'unknown_key';
      checkRateLimit(uniqueKey, maxRequests, windowMs);

      // Step 3: Build security context object (basic example)
      const securityContext = {
        sourceIP: req.ip,
        endpoint: req.originalUrl,
        httpMethod: req.method,
        userAgent: req.headers['user-agent'] || 'unknown',
      };

      // Step 4: Validate Body, Query, Params (if schemas are provided)
      if (schemas.body) {
        await validateSchema(schemas.body, req.body);
        if (enableLogging) {
          // Placeholder logging; in production use a robust logger (e.g. winston)
          console.log('[validateRequest] Body validation passed:', {
            endpoint: req.originalUrl,
            ip: req.ip,
          });
        }
      }
      if (schemas.query) {
        await validateSchema(schemas.query, req.query);
        if (enableLogging) {
          console.log('[validateRequest] Query validation passed:', {
            endpoint: req.originalUrl,
            ip: req.ip,
          });
        }
      }
      if (schemas.params) {
        await validateSchema(schemas.params, req.params);
        if (enableLogging) {
          console.log('[validateRequest] Params validation passed:', {
            endpoint: req.originalUrl,
            ip: req.ip,
          });
        }
      }

      // Step 7: All validations succeeded
      next();
    } catch (error: any) {
      if (enableLogging) {
        console.error('[validateRequest] Validation error or rate limit triggered:', {
          message: error?.message,
          code: error?.code,
        });
      }
      // If it's an AppError, we simply pass it along
      if (error instanceof AppError) {
        return next(error);
      }
      // Otherwise, wrap in a new AppError
      return next(
        new AppError(error?.message || 'Validation error', ErrorCode.VALIDATION_ERROR, {
          context: { error },
          source: 'validateRequest',
          severity: 2,
        }),
      );
    }
  };
}

/* --------------------------------------------------------------------------------------------
 * Factory: validateBody
 * Description:
 *  - Creates an Express middleware function dedicated to validating the request body using
 *    a provided Zod schema. Uses validateSchema() and throws an AppError if validation fails.
 *  - Allows for additional security monitoring and context logging.
 *
 * Steps:
 *  1. Build a security context object that references the IP, route, etc.
 *  2. Call validateSchema() to parse and check the request body.
 *  3. Log the validation result for auditing/performance tracking.
 *  4. Throw an AppError on failure or call next() if validation passes.
 * -------------------------------------------------------------------------------------------- */
export function validateBody(
  schema: z.ZodSchema<any>,
  options?: {
    enableLogging?: boolean;
  },
) {
  const enableLogging = options?.enableLogging ?? true;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const securityContext = {
        ip: req.ip,
        route: req.originalUrl,
        method: req.method,
      };

      await validateSchema(schema, req.body);

      if (enableLogging) {
        console.log('[validateBody] Body validation success:', {
          route: req.originalUrl,
          securityContext,
        });
      }

      return next();
    } catch (error: any) {
      if (enableLogging) {
        console.error('[validateBody] Body validation failed:', {
          message: error?.message,
          code: error?.code,
        });
      }
      // If it's already an AppError, pass it along
      if (error instanceof AppError) {
        return next(error);
      }
      // Otherwise, wrap it in a new AppError with a standard validation code
      return next(
        new AppError(error?.message || 'Body validation error', ErrorCode.VALIDATION_ERROR, {
          context: { error },
          source: 'validateBody',
          severity: 2,
        }),
      );
    }
  };
}

/* --------------------------------------------------------------------------------------------
 * Factory: validateQuery
 * Description:
 *  - Similar to validateBody but focuses on validating the query string using a Zod schema.
 *  - Integrates a security context and logs attempts for potential auditing and alerting.
 *
 * Steps:
 *  1. Construct or gather security context (IP, route, method).
 *  2. Use validateSchema() with the provided Zod schema and req.query.
 *  3. Log or measure performance metrics for success/failure.
 *  4. Throw an AppError or pass any existing AppError to next() on failure, next() on success.
 * -------------------------------------------------------------------------------------------- */
export function validateQuery(
  schema: z.ZodSchema<any>,
  options?: {
    enableLogging?: boolean;
  },
) {
  const enableLogging = options?.enableLogging ?? true;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const securityContext = {
        ip: req.ip,
        route: req.originalUrl,
        method: req.method,
      };

      await validateSchema(schema, req.query);

      if (enableLogging) {
        console.log('[validateQuery] Query validation success:', {
          route: req.originalUrl,
          securityContext,
        });
      }

      return next();
    } catch (error: any) {
      if (enableLogging) {
        console.error('[validateQuery] Query validation failed:', {
          message: error?.message,
          code: error?.code,
        });
      }
      if (error instanceof AppError) {
        return next(error);
      }
      return next(
        new AppError(error?.message || 'Query validation error', ErrorCode.VALIDATION_ERROR, {
          context: { error },
          source: 'validateQuery',
          severity: 2,
        }),
      );
    }
  };
}

/* --------------------------------------------------------------------------------------------
 * Factory: validateParams
 * Description:
 *  - Handles validation for request parameters (req.params) using a Zod schema.
 *  - Like validateBody/validateQuery, it creates a security context and uses validateSchema().
 *
 * Steps:
 *  1. Gather or build a security context including request details.
 *  2. Invoke validateSchema against req.params.
 *  3. Log outcomes for success or failure.
 *  4. Transform or forward errors using AppError.
 * -------------------------------------------------------------------------------------------- */
export function validateParams(
  schema: z.ZodSchema<any>,
  options?: {
    enableLogging?: boolean;
  },
) {
  const enableLogging = options?.enableLogging ?? true;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const securityContext = {
        ip: req.ip,
        route: req.originalUrl,
        method: req.method,
      };

      await validateSchema(schema, req.params);

      if (enableLogging) {
        console.log('[validateParams] Params validation success:', {
          route: req.originalUrl,
          securityContext,
        });
      }

      return next();
    } catch (error: any) {
      if (enableLogging) {
        console.error('[validateParams] Params validation failed:', {
          message: error?.message,
          code: error?.code,
        });
      }
      if (error instanceof AppError) {
        return next(error);
      }
      return next(
        new AppError(error?.message || 'Params validation error', ErrorCode.VALIDATION_ERROR, {
          context: { error },
          source: 'validateParams',
          severity: 2,
        }),
      );
    }
  };
}