import { Request, Response, NextFunction } from 'express'; // express version ^4.18.0
import * as Sentry from '@sentry/node'; // @sentry/node version ^7.0.0

// Internal Imports
import { AppError } from '../utils/error.util'; // AppError class for standardized errors, referencing toJSON()
import { Logger } from '../utils/logger.util'; // Secure logging functionality with PII protection
import { ErrorCode } from '../constants/error-codes'; // Standardized error codes, specifically INTERNAL_SERVER_ERROR

// -----------------------------------------------------------------------------------------
// Instantiate a global logger instance for enterprise-grade, structured logging
// -----------------------------------------------------------------------------------------
const logger = new Logger({
  // In a real production scenario, these configuration details can be injected from env variables
  defaultLevel: 'info',
  fileLogPath: 'logs/error-middleware.log',
  papertrailHost: process.env.PAPERTRAIL_HOST || '',
  papertrailPort: process.env.PAPERTRAIL_PORT ? parseInt(process.env.PAPERTRAIL_PORT, 10) : undefined,
  datadogApiKey: process.env.DD_API_KEY || '',
  securityAlerts: true, // Toggle for hypothetical external alerting integrations
});

// -----------------------------------------------------------------------------------------
// errorHandler
// -----------------------------------------------------------------------------------------
// Handles both application-specific and unexpected errors by providing a uniform response,
// enhanced security context, structured logging, and optional Sentry reporting for production.
// This function implements the steps outlined in the JSON specification.
//
// Steps Implemented:
// 1. Generate unique error reference ID for tracking
// 2. Extract user context and correlation ID from request
// 3. Sanitize error message and remove PII data
// 4. Log error details using Logger with security context
// 5. Report error to Sentry in production with compliance metadata
// 6. Determine if error is an AppError instance
// 7. Extract status code and sanitized error details
// 8. Format error response based on environment and security rules
// 9. Track error metrics and performance impact
// 10. Send sanitized error response to client
// -----------------------------------------------------------------------------------------
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // STEP 1: Generate unique error reference ID for consistent error tracing
  const referenceId = `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  // STEP 2: Extract user context (if any) & correlation ID from headers or request
  // (In a real scenario, you may have authentication middleware to populate req.user, etc.)
  const userContext = {
    userId: (req as any).user?.id || null,
    correlationId: req.headers['x-correlation-id'] || null,
  };

  // STEP 3: Sanitize error message, removing PII or sensitive data
  // (AppError provides getSafeMessage() internally, so we'll rely on that as needed)

  // STEP 4: Use the logger to record application-specific or unexpected errors with security context
  // The Logger.error method also handles data sanitization and may integrate with external monitoring
  let statusCode = 500;
  let responsePayload: Record<string, any> = {};

  // Convert unknown error to an AppError if possible, or default to a new instance
  let isAppErrorInstance = false;
  let finalError: AppError;

  if (error instanceof AppError) {
    // Already an AppError
    isAppErrorInstance = true;
    finalError = error;
  } else if (error instanceof Error) {
    // Convert a generic Error into an AppError with INTERNAL_SERVER_ERROR
    finalError = new AppError(
      error.message,
      ErrorCode.INTERNAL_SERVER_ERROR,
      {
        context: { originalErrorName: error.name },
        source: 'errorHandler',
        severity: 'HIGH' as any, // Could map to an enum if needed
      },
    );
  } else {
    // Handle truly unknown errors (string, object, etc.) as a fallback
    finalError = new AppError(
      'An unexpected error occurred',
      ErrorCode.INTERNAL_SERVER_ERROR,
      {
        context: { originalErrorType: typeof error },
        source: 'errorHandler',
        severity: 'HIGH' as any,
      },
    );
  }

  // STEP 5: In production, report the error to Sentry with compliance metadata
  if (process.env.NODE_ENV === 'production') {
    Sentry.setContext('compliance', {
      referenceId,
      environment: process.env.NODE_ENV,
      userId: userContext.userId,
      correlationId: userContext.correlationId,
    });
    Sentry.captureException(finalError);
  }

  // STEP 6: We have an AppError object at this point. Retrieve status code and use toJSON to sanitize
  statusCode = finalError.statusCode;
  const sanitizedErrorObject = finalError.toJSON();

  // STEP 7: Format error response based on environment & security rules
  // Hide internal details if in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    // Provide only sanitized fields
    responsePayload = {
      code: sanitizedErrorObject.code,
      statusCode: sanitizedErrorObject.statusCode,
      message: sanitizedErrorObject.message,
      referenceId: sanitizedErrorObject.referenceId,
      timestamp: sanitizedErrorObject.timestamp,
    };
  } else {
    // Include debug fields (e.g., stack) if not production
    responsePayload = sanitizedErrorObject;
  }

  // STEP 8 & 9: Track error metrics and performance impact automatically through logger's integrated approach
  // Additional custom metrics can be sent if needed. Log the final error details with security context.
  logger.error(finalError, {
    referenceId,
    correlationId: userContext.correlationId,
    userId: userContext.userId,
    isAppErrorInstance,
  });

  // STEP 10: Send sanitized error response to the client
  res.status(statusCode).json(responsePayload);
}

// -----------------------------------------------------------------------------------------
// notFoundHandler
// -----------------------------------------------------------------------------------------
// Middleware to handle 404 Not Found errors for undefined routes with security logging.
// This function implements the steps specified:
// 1. Generate 404 error reference ID
// 2. Create AppError for not found route
// 3. Add security context and request metadata
// 4. Pass error to next middleware
// -----------------------------------------------------------------------------------------
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // STEP 1: Generate a unique reference ID specifically for 404
  const referenceId = `NOTFOUND-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  // STEP 2: Construct an AppError indicating a NOT_FOUND route
  const notFoundError = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    // We rely on the standardized error code for 404
    ErrorCode.NOT_FOUND,
    {
      context: { referenceId, method: req.method, path: req.originalUrl },
      source: 'notFoundHandler',
      severity: 'MEDIUM' as any,
    },
  );

  // STEP 3: (Optional) Additional security context or logging can be done here
  // For demonstration, we attach user or correlation ID if needed
  (req as any).correlationId = req.headers['x-correlation-id'] || null;

  // STEP 4: Pass this specialized AppError to the next error handling middleware
  next(notFoundError);
}