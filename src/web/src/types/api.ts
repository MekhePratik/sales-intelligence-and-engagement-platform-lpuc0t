/*******************************************************
 * Core TypeScript type definitions for API interactions.
 * This file includes:
 *  1. Error code unions for robust error handling
 *  2. Interfaces for standardized API responses
 *  3. Query parameter structures with filtering and sorting
 *  4. Zod schemas for runtime validation
 *  5. Supporting interfaces (RetryConfig, CacheConfig)
 *
 * Enforces:
 *  - Strong typing (TypeScript 5.2+)
 *  - Comprehensive coverage for error handling
 *  - Validation with Zod (^3.22.0)
 ******************************************************/

/* External Imports */
// zod ^3.22.0
import { z } from 'zod';

/*******************************************************
 * COMMON AND SUPPORTING TYPES
 *******************************************************/

/**
 * SortOrder represents the sorting direction for queries.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * RetryConfig provides configurable retry logic parameters for API requests.
 */
export interface RetryConfig {
  /**
   * The maximum number of retry attempts to perform in case of a failed request.
   */
  retries: number;
  /**
   * An exponential factor used to increase the delay between retries.
   */
  factor: number;
  /**
   * Minimum time in milliseconds to wait before attempting another retry.
   */
  minTimeout: number;
  /**
   * Maximum time in milliseconds to wait before attempting a retry.
   */
  maxTimeout: number;
}

/**
 * CacheConfig provides cache-related options for API requests.
 */
export interface CacheConfig {
  /**
   * When true, caching is enabled for the request.
   */
  enable: boolean;
  /**
   * Maximum age (in seconds) to hold the cache entry before invalidation.
   */
  maxAge: number;
}

/*******************************************************
 * API ERROR AND VALIDATION
 *******************************************************/

/**
 * ApiErrorCode is a union of semantic error codes for categorizing error responses.
 */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT';

/**
 * ApiValidationError provides detailed information about validation issues,
 * including the specific field or fields that failed validation.
 */
export interface ApiValidationError {
  /**
   * The name or path of the field that failed validation.
   */
  field: string;
  /**
   * An explanatory message describing the validation failure.
   */
  message: string;
  /**
   * The value that was provided and failed validation.
   */
  value: any;
  /**
   * A collection of validation constraints that were violated.
   */
  constraints: string[];
}

/*******************************************************
 * ERROR RESPONSE INTERFACE AND SCHEMAS
 *******************************************************/

/**
 * ApiError defines a structured format for error responses,
 * providing a code, message, and additional details for debugging.
 */
export interface ApiError {
  /**
   * A semantic code representing the specific error category.
   */
  code: ApiErrorCode;
  /**
   * A human-readable message describing the error.
   */
  message: string;
  /**
   * Arbitrary key-value pairs containing contextual details about the error.
   */
  details: Record<string, unknown>;
  /**
   * An optional stack trace (commonly present in development environments).
   */
  stack?: string;
  /**
   * ISO timestamp indicating when the error occurred.
   */
  timestamp: string;
  /**
   * Unique identifier for correlating error logs and diagnostics.
   */
  requestId: string;
}

/**
 * Zod schema for validating API errors at runtime.
 */
export const apiErrorSchema = z.object({
  code: z.enum([
    'BAD_REQUEST',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'RATE_LIMITED',
    'VALIDATION_ERROR',
    'INTERNAL_ERROR',
    'SERVICE_UNAVAILABLE',
    'GATEWAY_TIMEOUT',
  ]),
  message: z.string(),
  details: z.record(z.unknown()),
  stack: z.string().optional(),
  timestamp: z.string(),
  requestId: z.string(),
});

/*******************************************************
 * PAGINATION METADATA AND API RESPONSE STRUCTURES
 *******************************************************/

/**
 * PaginationMeta provides enhanced pagination metadata for list responses.
 */
export interface PaginationMeta {
  /**
   * Current page number.
   */
  page: number;
  /**
   * Number of items per page.
   */
  perPage: number;
  /**
   * Total number of items across all pages.
   */
  total: number;
  /**
   * Total number of pages.
   */
  totalPages: number;
  /**
   * Indicates if there is a next page available.
   */
  hasNextPage: boolean;
}

/**
 * ApiResponse is a generic wrapper for successful responses,
 * containing data, optional pagination metadata, status, and a timestamp.
 */
export interface ApiResponse<T> {
  /**
   * The success payload of the response, typed as T.
   */
  data: T;
  /**
   * Optional pagination metadata for list-type responses.
   */
  meta?: PaginationMeta;
  /**
   * HTTP status code (e.g., 200, 201, 204, etc.).
   */
  status: number;
  /**
   * ISO timestamp indicating when the response was generated.
   */
  timestamp: string;
}

/**
 * We create a helper function to build a Zod schema
 * for ApiResponse<T> by passing in the schema of T.
 * This approach maintains strong typing at runtime.
 */
export function apiResponseSchema<T>(
  dataSchema: z.ZodType<T>
) {
  return z.object({
    data: dataSchema,
    meta: z
      .object({
        page: z.number(),
        perPage: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNextPage: z.boolean(),
      })
      .optional(),
    status: z.number(),
    timestamp: z.string(),
  });
}

/*******************************************************
 * QUERY PARAMS
 *******************************************************/

/**
 * ApiQueryParams organizes query-related settings for list endpoints,
 * including pagination, sorting, filtering, and relationship inclusion.
 */
export interface ApiQueryParams {
  /**
   * The current page number requested for paginated results.
   */
  page: number;
  /**
   * Number of items per page for pagination.
   */
  perPage: number;
  /**
   * Field name by which to sort results.
   */
  sort: string;
  /**
   * Direction for the sorting, either 'asc' or 'desc'.
   */
  order: SortOrder;
  /**
   * A record of arbitrary filters applied to the query.
   */
  filters: Record<string, unknown>;
  /**
   * A string term for a basic text search across supported fields.
   */
  search: string;
  /**
   * An array of related entities to include or expand in the result set.
   */
  include: string[];
}

/*******************************************************
 * API REQUEST CONFIG
 *******************************************************/

/**
 * ApiRequestConfig defines configuration options for HTTP API requests.
 */
export interface ApiRequestConfig {
  /**
   * The base URL of the API endpoint (e.g., https://api.example.com).
   */
  baseURL: string;
  /**
   * Additional headers to include in the request.
   */
  headers: Record<string, string>;
  /**
   * Request timeout in milliseconds.
   */
  timeout: number;
  /**
   * Indicates if cross-site Access-Control requests
   * should be made using credentials like cookies.
   */
  withCredentials: boolean;
  /**
   * Configuration object controlling retry logic.
   */
  retry: RetryConfig;
  /**
   * Configuration object controlling caching behavior.
   */
  cache: CacheConfig;
  /**
   * AbortSignal for optional cancellation support during a request.
   */
  signal: AbortSignal;
}
```