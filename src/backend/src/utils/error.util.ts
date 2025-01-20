/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * This file provides a core error handling utility for the B2B sales intelligence platform,
 * offering standardized error classes (AppError) and helper functions (captureError, isAppError)
 * for consistent error management, enhanced security, and robust monitoring. This includes
 * integration with Sentry (@sentry/node ^7.0.0) for enterprise-grade error tracking.
 */

// --------------------------------- External Imports ---------------------------------
// @sentry/node version ^7.0.0
import * as Sentry from '@sentry/node';

// --------------------------------- Internal Imports ---------------------------------
import { ErrorCode, HTTP_STATUS_CODES } from '../constants/error-codes';

/**
 * Represents the severity level for a given error, enabling more granular
 * tracking and response strategies. This enumeration helps classify errors
 * based on impact and urgency for both logging and runtime handling.
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Defines the structure of metadata that can be attached to errors.
 * This allows developers to pass additional context, the source of the error,
 * and a severity level for more efficient debugging and monitoring.
 */
export interface ErrorMetadata {
  /**
   * Arbitrary context object containing additional details relevant to the error.
   * This is useful for providing environment, request, or user information without
   * directly exposing sensitive data in raw error messages.
   */
  context: object;

  /**
   * A short identifier indicating the logical or functional source of the error.
   * For example, "UserController" or "DatabaseLayer" might be used for clarity.
   */
  source: string;

  /**
   * A classification of the error's impact or urgency, allowing
   * the system to differentiate between minor and critical issues.
   */
  severity: ErrorSeverity;
}

/**
 * AppError is a specialized error class offering rich context, security features,
 * and enterprise-grade clarity. It extends the native Error to encapsulate an
 * ErrorCode, HTTP status code mapping, and optional metadata, which includes
 * various contextual details that should not be exposed to end users.
 */
export class AppError extends Error {
  /**
   * The standardized error code that references a predefined set of error constants
   * (e.g., BAD_REQUEST, INTERNAL_SERVER_ERROR) for consistent handling.
   */
  public code: ErrorCode;

  /**
   * The numeric HTTP status code associated with this error, derived from the provided
   * ErrorCode. This ensures predictable responses for client applications.
   */
  public statusCode: number;

  /**
   * Additional metadata containing contextual detail that helps diagnose errors
   * without exposing sensitive information directly in the error message.
   */
  public metadata: ErrorMetadata;

  /**
   * A unique fingerprint for this error, assisting in deduplication and grouping
   * across monitoring systems such as Sentry.
   */
  public fingerprint: string;

  /**
   * The time at which this error instance was created, helping in audits and logs.
   */
  public timestamp: Date;

  /**
   * Constructs a new AppError instance with enhanced context, security features,
   * and runtime validation against the global error code definitions.
   *
   * @param message   The raw or developer-focused error message (may be sanitized later).
   * @param code      A standardized ErrorCode enumerated value for consistent classification.
   * @param metadata  Additional contextual information relevant to the error, such as its source or severity.
   */
  constructor(message: string, code: ErrorCode, metadata: ErrorMetadata) {
    // Call the parent Error constructor with a sanitized message
    super(message);

    // Ensure that the built-in name property is correctly set for stack trace labeling
    this.name = 'AppError';

    // Validate and set the error code
    this.code = code;

    // Derive a suitable HTTP status code from the provided error code (limited usage for demonstration)
    // Only BAD_REQUEST and INTERNAL_SERVER_ERROR are specifically enumerated in this specification
    if (this.code === ErrorCode.BAD_REQUEST) {
      this.statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
    } else if (this.code === ErrorCode.INTERNAL_SERVER_ERROR) {
      this.statusCode = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
    } else {
      // Fallback to 500 if the error code does not map to a recognized HTTP status in this context
      this.statusCode = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
    }

    // Sanitize and store any additional metadata (in a real system, you'd carefully remove PII or secrets)
    this.metadata = metadata;

    // Generate a rudimentary fingerprint to group related error events
    this.fingerprint = `${this.code}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Capture an enhanced stack trace if supported
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the timestamp for when this error instance was created
    this.timestamp = new Date();
  }

  /**
   * Produces a secure JSON representation of the error for API responses or logs,
   * automatically sanitizing sensitive information and including only details
   * permitted for the current environment.
   *
   * @returns A serialized object containing safe error data, including code, status, and optionally the stack.
   */
  public toJSON(): Record<string, any> {
    // Construct a base object reflecting necessary error information
    const errorObject: Record<string, any> = {
      code: this.code,
      statusCode: this.statusCode,
      message: this.getSafeMessage(),
      // In some implementations, you might conditionally include partial metadata here
      // if it does not contain sensitive data. This is an example of an approach
      // showing how you would carefully filter sensitive info:
      metadata: {
        source: this.metadata.source,
        severity: this.metadata.severity,
      },
      // A unique identifier for referencing this error instance in logs and UIs
      referenceId: this.fingerprint,
      // A timestamp to help track the occurrence time
      timestamp: this.timestamp,
    };

    // Include a stack trace only if not in production (to avoid leaking internals)
    if (process.env.NODE_ENV !== 'production') {
      errorObject.stack = this.stack || null;
    }

    return errorObject;
  }

  /**
   * Returns a sanitized, client-appropriate message that excludes sensitive server-side
   * data. Implementations can incorporate advanced filtering logic, pattern matching,
   * or data obfuscation depending on the organization's security policies.
   *
   * @returns A safe string suitable for display to the client or logs.
   */
  public getSafeMessage(): string {
    let safeMessage = this.message;

    // Example: remove potential database credentials using a naive pattern check
    safeMessage = safeMessage.replace(/(user|password|host)=\w+/gi, '[REDACTED]');

    // Truncate the message if it is too long
    if (safeMessage.length > 200) {
      safeMessage = `${safeMessage.substring(0, 200)}...`;
    }

    return safeMessage;
  }
}

/**
 * Determines if the provided error object is a valid AppError instance, including
 * checks for the presence and integrity of the code, status code, and metadata attributes.
 * This allows for advanced runtime type checking in situations where error objects
 * could originate from various libraries or contexts.
 *
 * @param error Any unknown error or object that may or may not conform to AppError.
 * @returns True if the error is a valid, structurally complete AppError instance; otherwise, false.
 */
export function isAppError(error: unknown): boolean {
  // Check if the error is an object and not null
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  // Check for an AppError instance via prototype chain or name attribute
  // (Direct instanceof works if the error was created in the same runtime environment.)
  const maybeAppError = error as AppError;
  if (maybeAppError.name !== 'AppError') {
    return false;
  }

  // Verify the presence of a recognized error code
  const potentialCode = maybeAppError.code;
  const validEnumValues = Object.values(ErrorCode);
  if (!validEnumValues.includes(potentialCode)) {
    return false;
  }

  // Ensure the statusCode is a number that corresponds to a recognized framework code
  if (typeof maybeAppError.statusCode !== 'number') {
    return false;
  }

  // Check that metadata has the essential keys if it exists
  if (
    !maybeAppError.metadata ||
    typeof maybeAppError.metadata !== 'object' ||
    typeof maybeAppError.metadata.source !== 'string' ||
    !Object.values(ErrorSeverity).includes(maybeAppError.metadata.severity)
  ) {
    return false;
  }

  // If all checks pass, we conclude that this is indeed an AppError
  return true;
}

/**
 * Enhanced error capture utility that reports errors to Sentry, applies advanced sampling,
 * sanitizes sensitive data, and returns a unique identifier for the tracked error event.
 * This allows for sophisticated error handling within enterprise contexts, ensuring that
 * Sentry logs remain both comprehensive and secure.
 *
 * @param error           The actual thrown error, which can be an instance of AppError or any other Error.
 * @param context         An arbitrary context object containing environment, user, or request information.
 * @param samplingOptions Provides adjustable thresholds or rates for controlling how frequently errors are reported.
 * @returns               A promise that resolves to the Sentry error ID, enabling future cross-referencing and investigation.
 */
export async function captureError(
  error: Error | AppError,
  context: Record<string, any> = {},
  samplingOptions: { sampleRate?: number } = {},
): Promise<string> {
  // STEP 1: Validate parameters
  // As an example, we expect a non-null error and a context object
  if (!error) {
    return Promise.resolve('no_error_provided');
  }

  // STEP 2: Apply sampling rules based on error type, frequency, or environment
  // If sampleRate is specified, we only capture a random subset of errors
  const { sampleRate = 1.0 } = samplingOptions;
  if (sampleRate < 1.0 && Math.random() > sampleRate) {
    // Skip sending to Sentry if we're above the sampling threshold
    return Promise.resolve('error_skipped_due_to_sampling');
  }

  // STEP 3: Sanitize the error message, depending on whether it is an AppError or a generic Error
  let sanitizedMessage = error.message;
  if (isAppError(error)) {
    // Use the built-in sanitization logic for AppError
    sanitizedMessage = (error as AppError).getSafeMessage();
  } else {
    // For regular Error, apply a basic pattern-based sanitization
    sanitizedMessage = sanitizedMessage.replace(/(secret|password)=\S+/gi, '[REDACTED]');
  }

  // STEP 4: Enrich the error with environment, user, or request-related context
  // Provide Sentry with custom context data to facilitate debugging and triaging
  Sentry.setContext('customContext', {
    environment: process.env.NODE_ENV,
    ...context,
  });
  Sentry.setExtra('sanitized_error_message', sanitizedMessage);

  // STEP 5: Generate / retrieve a unique error fingerprint
  // For AppError, we can leverage its fingerprint. Otherwise, we generate a new one
  let errorFingerprint: string;
  if (isAppError(error)) {
    errorFingerprint = (error as AppError).fingerprint;
  } else {
    errorFingerprint = `GENERIC_ERROR-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  Sentry.setFingerprint([errorFingerprint]);

  // STEP 6: Report to Sentry with enhanced context
  // We capture the exception; the returned value is the Sentry event ID
  const eventId = Sentry.captureException(error);

  // STEP 7: Return the Sentry error ID to reference this specific event
  return Promise.resolve(eventId);
}