/**
 * Global constants used for error handling throughout the B2B Sales Intelligence Platform.
 * These ensure consistent naming and size constraints for error codes.
 */
export const ERROR_CODE_PREFIX = "B2B_ERR_";

/**
 * Defines the maximum allowable length for error messages, ensuring
 * that sensitive information is not inadvertently exposed in responses.
 */
export const MAX_ERROR_MESSAGE_LENGTH = 256;

/**
 * Enumerates all standardized error codes for global error handling,
 * facilitating type-safe usage across the application.
 * 
 * Each member explicitly prefixes the error code with ERROR_CODE_PREFIX
 * to ensure consistent naming and clear separation from other identifiers.
 */
export enum ErrorCode {
  BAD_REQUEST = `${ERROR_CODE_PREFIX}BAD_REQUEST`,
  UNAUTHORIZED = `${ERROR_CODE_PREFIX}UNAUTHORIZED`,
  FORBIDDEN = `${ERROR_CODE_PREFIX}FORBIDDEN`,
  NOT_FOUND = `${ERROR_CODE_PREFIX}NOT_FOUND`,
  CONFLICT = `${ERROR_CODE_PREFIX}CONFLICT`,
  VALIDATION_ERROR = `${ERROR_CODE_PREFIX}VALIDATION_ERROR`,
  RATE_LIMIT_EXCEEDED = `${ERROR_CODE_PREFIX}RATE_LIMIT_EXCEEDED`,
  INTERNAL_SERVER_ERROR = `${ERROR_CODE_PREFIX}INTERNAL_SERVER_ERROR`,
  SERVICE_UNAVAILABLE = `${ERROR_CODE_PREFIX}SERVICE_UNAVAILABLE`,
  GATEWAY_TIMEOUT = `${ERROR_CODE_PREFIX}GATEWAY_TIMEOUT`,
  API_ERROR = `${ERROR_CODE_PREFIX}API_ERROR`,
  DATABASE_ERROR = `${ERROR_CODE_PREFIX}DATABASE_ERROR`,
}

/**
 * Immutable mapping of standardized HTTP status codes for
 * consistent usage in API responses. These should be used in conjunction
 * with the ErrorCode enum to create predictable, secure responses.
 */
export const HTTP_STATUS_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Container for secure, production-ready error messages. Each object within
 * ERROR_MESSAGES corresponds to a specific usage/context:
 *   - DEFAULT_MESSAGES: General-purpose messages not revealing sensitive details.
 *   - SECURITY_MESSAGES: Messages specifically crafted for security events or violations.
 *   - VALIDATION_MESSAGES: Messages describing constraints related to invalid form, request, or entity data.
 * 
 * Use these to unify error-handling patterns across the platform and to
 * comply with security standards requiring non-disclosure of internal logic.
 */
export const ERROR_MESSAGES = {
  DEFAULT_MESSAGES: {
    [ErrorCode.BAD_REQUEST]: "Invalid request format or missing required data.",
    [ErrorCode.UNAUTHORIZED]: "Access requires valid authentication credentials.",
    [ErrorCode.FORBIDDEN]: "You lack permission to access this resource.",
    [ErrorCode.NOT_FOUND]: "The requested resource could not be found.",
    [ErrorCode.CONFLICT]: "A conflict occurred on the server. Please retry the operation.",
    [ErrorCode.VALIDATION_ERROR]: "One or more fields failed validation. Please correct and try again.",
    [ErrorCode.RATE_LIMIT_EXCEEDED]: "Rate limit reached. Please slow down your requests.",
    [ErrorCode.INTERNAL_SERVER_ERROR]: "An internal error occurred, please try again later.",
    [ErrorCode.SERVICE_UNAVAILABLE]: "The service is currently unavailable. Please try again soon.",
    [ErrorCode.GATEWAY_TIMEOUT]: "The server did not respond in time. Please try again soon.",
    [ErrorCode.API_ERROR]: "An unexpected error occurred in an external service call.",
    [ErrorCode.DATABASE_ERROR]: "A database error occurred. Please try again or contact support.",
  } as Record<ErrorCode, string>,

  SECURITY_MESSAGES: {
    [ErrorCode.BAD_REQUEST]: "Security policy violation detected for the incoming request format.",
    [ErrorCode.UNAUTHORIZED]: "Authentication failed. Security protocols require valid credentials.",
    [ErrorCode.FORBIDDEN]: "Access to this resource is strictly restricted. Security enforcement applied.",
    [ErrorCode.NOT_FOUND]: "Resource not found or restricted by security constraints.",
    [ErrorCode.CONFLICT]: "Operation conflicted with an existing resource. Security check in place.",
    [ErrorCode.VALIDATION_ERROR]: "Security-based validation failed for the provided input fields.",
    [ErrorCode.RATE_LIMIT_EXCEEDED]: "Potential abuse detected. Too many requests from your account.",
    [ErrorCode.INTERNAL_SERVER_ERROR]: "An internal security mechanism triggered an error. Please try again.",
    [ErrorCode.SERVICE_UNAVAILABLE]: "Security system is currently unavailable. Please try again later.",
    [ErrorCode.GATEWAY_TIMEOUT]: "Security gateway timed out waiting for a valid response.",
    [ErrorCode.API_ERROR]: "Security layers encountered an error while communicating with an external service.",
    [ErrorCode.DATABASE_ERROR]: "Security-based transaction checks encountered an error in the data layer.",
  } as Record<ErrorCode, string>,

  VALIDATION_MESSAGES: {
    [ErrorCode.BAD_REQUEST]: "The request body or query parameters are malformed and cannot be processed.",
    [ErrorCode.UNAUTHORIZED]: "Validation of authentication failed. Please provide valid login credentials.",
    [ErrorCode.FORBIDDEN]: "Your role or permissions do not meet the required validation criteria.",
    [ErrorCode.NOT_FOUND]: "The entity you are trying to validate does not exist in the system records.",
    [ErrorCode.CONFLICT]: "Validation detected a conflicting resource state. Another process may have changed the data.",
    [ErrorCode.VALIDATION_ERROR]: "One or more fields did not meet the validation requirements. Please check and retry.",
    [ErrorCode.RATE_LIMIT_EXCEEDED]: "Validation identified excessive requests. Please reduce your call frequency.",
    [ErrorCode.INTERNAL_SERVER_ERROR]: "Validation encountered unexpected conditions. Please retry later.",
    [ErrorCode.SERVICE_UNAVAILABLE]: "The validation service is currently offline or cannot be reached.",
    [ErrorCode.GATEWAY_TIMEOUT]: "Validation timed out. The request took too long to complete.",
    [ErrorCode.API_ERROR]: "Validation failed due to an external API error. Please try again later.",
    [ErrorCode.DATABASE_ERROR]: "Validation could not complete due to a database error. Please retry after some time.",
  } as Record<ErrorCode, string>,
};