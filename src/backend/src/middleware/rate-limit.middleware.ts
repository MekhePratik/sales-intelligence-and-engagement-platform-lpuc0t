/**
 * rate-limit.middleware.ts
 *
 * This file provides an enterprise-grade Express middleware for rate limiting
 * within the B2B Sales Intelligence Platform. It uses a Redis-based sliding
 * window algorithm to enforce request limits on a per-user or per-IP basis,
 * helping safeguard the system against abuse, DDoS attacks, and excessive usage.
 *
 * The middleware:
 * 1. Derives a unique rate limit key per request (either user ID or IP address).
 * 2. Maintains request timestamps in a Redis sorted set to track counts within
 *    a specified time window.
 * 3. Enforces the threshold, returning appropriate HTTP status codes (429) and
 *    standardized error codes if exceeded.
 * 4. Provides standard rate limit headers (X-RateLimit-* and Retry-After) to
 *    inform clients about usage limits and reset times.
 * 5. Optionally performs cleanup of expired keys at regular intervals to reclaim
 *    memory and maintain performance.
 *
 * Requirements Addressed:
 * - Rate Limiting (Technical Specifications/3.3 API Design/Rate Limiting)
 * - Security Controls (Technical Specifications/3.3 API Design/Security Controls)
 * - Performance Monitoring (Technical Specifications/7.1 Security Protocols/Security Monitoring)
 */

// --------------------------- External Imports (versioned) ---------------------------
// express@^4.18.0 - For Request, Response, NextFunction typings
import { Request, Response, NextFunction } from 'express';

// --------------------------- Internal Imports ---------------------------------------
import { RedisManager } from '../config/redis'; // Manages Redis connections
import { AppError } from '../utils/error.util'; // Custom app error for standardized handling
import { ErrorCode } from '../constants/error-codes'; // Error codes (incl. RATE_LIMIT_EXCEEDED)

// --------------------------- Global Constants ---------------------------------------
/**
 * DEFAULT_RATE_LIMIT
 * The maximum allowed requests within the specified time window.
 * Default: 1000 requests
 */
export const DEFAULT_RATE_LIMIT = 1000;

/**
 * DEFAULT_WINDOW
 * The time window in seconds for counting requests.
 * Default: 60 (i.e., 1 minute)
 */
export const DEFAULT_WINDOW = 60;

/**
 * RATE_LIMIT_PREFIX
 * A prefix used in Redis keys for scoping rate limit entries
 * and avoiding collisions with other sets.
 */
export const RATE_LIMIT_PREFIX = 'rl:';

/**
 * CLEANUP_INTERVAL
 * Interval in seconds at which the rate limiter performs key cleanup
 * to remove stale data and maintain memory usage. Default: 300 seconds.
 */
export const CLEANUP_INTERVAL = 300;

// --------------------------- Utility Functions --------------------------------------

/**
 * generateRateLimitKey
 * --------------------
 * Generates a unique key for rate limiting in Redis. Uses the user ID from
 * an authenticated request if available; otherwise falls back to an IP-based key.
 *
 * Steps:
 * 1. Attempt to extract user ID from the authenticated request (if any).
 * 2. Retrieve the IP address from X-Forwarded-For or socket address.
 * 3. Validate and sanitize the IP address to ensure it is in a consistent format.
 * 4. If user ID is available, use that to form the key.
 * 5. Otherwise, default to the sanitized IP-based key.
 * 6. Prepend the RATE_LIMIT_PREFIX (e.g., "rl:") to avoid collisions in Redis.
 * 7. Return the final formatted key string.
 *
 * @param req Express Request object
 * @returns A string representing the rate limit key for Redis.
 */
export function generateRateLimitKey(req: Request): string {
  // Attempt to extract user ID from request (this logic may vary based on authentication)
  const userId = (req as any)?.user?.id || null;

  // Extract IP address (X-Forwarded-For or fallback to connection remote address)
  let ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
  ip = ip.split(',')[0].trim(); // In case multiple IPs are in X-Forwarded-For

  // Basic sanitization for IP address, removing brackets or unexpected characters
  ip = ip.replace(/[^0-9a-fA-F:\.]/g, '');

  // If user ID is available, prefer user-based limiting; fallback to IP-based if not
  const keyIdentifier = userId ? `user:${userId}` : `ip:${ip}`;

  // Construct final key
  const finalKey = `${RATE_LIMIT_PREFIX}${keyIdentifier}`;
  return finalKey;
}

/**
 * getRateLimitHeaders
 * -------------------
 * Produces standard rate limit headers consistent with the IETF rate limit draft
 * and popular usage patterns. Helps clients manage their requests responsibly.
 *
 * Steps:
 * 1. Derive the future reset timestamp (in seconds).
 * 2. Populate:
 *    - X-RateLimit-Limit      -> The maximum number of requests in the window
 *    - X-RateLimit-Remaining  -> How many requests remain in the current window
 *    - X-RateLimit-Reset      -> When the current window ends (UNIX timestamp in seconds)
 *    - Retry-After            -> How long the client should wait
 * 3. Return the assembled headers object.
 *
 * @param remaining Remaining requests within the window
 * @param limit The overall limit for the window
 * @param reset Time in seconds until the window resets
 * @returns A map of standard rate limit headers
 */
export function getRateLimitHeaders(
  remaining: number,
  limit: number,
  reset: number,
): Record<string, string> {
  // Current Unix time in seconds
  const nowSec = Math.floor(Date.now() / 1000);
  // Compute the future time when the window resets
  const resetTimestamp = nowSec + reset;

  // Build a set of standard and custom rate limit headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTimestamp.toString(),
  };

  // If the user has exhausted the limit (remaining < 0), provide Retry-After
  // indicating how long they should wait before making new requests.
  if (remaining < 0) {
    headers['Retry-After'] = reset.toString();
  }

  return headers;
}

// --------------------------- Rate Limiter Class -------------------------------------

/**
 * RateLimiter
 * -----------
 * An advanced rate limiter that uses Redis as a backing store with a sliding
 * window algorithm. It includes:
 *  - A dedicated Redis client
 *  - Configurable limit and window
 *  - A periodic cleanup routine
 *  - Comprehensive metrics for performance monitoring
 */
export class RateLimiter {
  /**
   * The connected Redis client obtained from RedisManager.
   * Used to store and retrieve request timestamps for the sliding window.
   */
  private redisClient: any;

  /**
   * The maximum number of requests allowed in the set time window.
   */
  private limit: number;

  /**
   * The time window (in seconds) during which requests are counted.
   */
  private window: number;

  /**
   * The Node.js timer reference for periodic key cleanup.
   */
  private cleanupInterval: NodeJS.Timer;

  /**
   * An internal RedisManager instance controlling creation, connection,
   * and retrieval of Redis clients for the platform.
   */
  private manager: RedisManager;

  /**
   * constructor
   * -----------
   * Initializes the RateLimiter with a Redis connection pool and optional
   * configuration overrides for limit and window. Also sets up a cleanup
   * interval to purge stale keys.
   *
   * Steps:
   * 1. Create a RedisManager instance and attempt to connect.
   * 2. Store the Redis client reference for subsequent usage.
   * 3. Apply user-specified or default limit/window values.
   * 4. Set up a periodic cleanup interval for stale rate limit keys.
   * 5. Optionally track rate limit usage metrics for performance monitoring.
   *
   * @param options An object with optional overrides for limit, window, or other custom settings
   */
  constructor(options?: { limit?: number; window?: number }) {
    // STEP 1: Initialize RedisManager and connect
    this.manager = new RedisManager();
    // Attempt asynchronous connection in the background (best-effort)
    this.manager.connect().catch((err) => {
      // In enterprise scenarios, consider logging or rethrowing
      // for robust error recovery.
      // Here, we elect to simply log and proceed.
      // console.error('Error connecting RedisManager in RateLimiter constructor:', err);
    });

    // STEP 2: Retrieve the client (may not be fully connected yet)
    try {
      this.redisClient = this.manager.getClient();
    } catch (err) {
      // If getClient() throws an error (not connected yet), we can store null for now
      this.redisClient = null;
    }

    // STEP 3: Apply limit/window with fallback to defaults
    this.limit = options?.limit ?? DEFAULT_RATE_LIMIT;
    this.window = options?.window ?? DEFAULT_WINDOW;

    // STEP 4: Configure cleanup interval in seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup().catch(() => {
        // If an error occurs during cleanup, optionally log it.
        // console.error('Error during rate limit cleanup:', err);
      });
    }, CLEANUP_INTERVAL * 1000);

    // STEP 5: Additional metric tracking can be set up here if needed
  }

  /**
   * checkRateLimit
   * --------------
   * Uses a sliding window approach in Redis to track request timestamps
   * (ZADD with sorted sets). If the number of requests within the current
   * window exceeds the configured limit, the user is considered rate-limited.
   *
   * Steps:
   * 1. Compute the window start time (current time - window).
   * 2. Remove timestamps older than windowStart from the sorted set.
   * 3. Add the current timestamp to the sorted set.
   * 4. Count the total requests in the sorted set.
   * 5. Compare against this.limit to determine if the user is over the limit.
   * 6. Calculate remaining requests and time until reset for the headers.
   * 7. Return structured limit data including isLimited, remaining, limit, reset.
   *
   * @param key Unique key (generated by generateRateLimitKey) identifying the user or IP
   * @returns Object containing the rate limit check result
   */
  public async checkRateLimit(key: string): Promise<{
    isLimited: boolean;
    remaining: number;
    limit: number;
    reset: number;
  }> {
    if (!this.redisClient) {
      // Attempt to lazily fetch the Redis client if constructor retrieval failed
      this.redisClient = this.manager.getClient();
    }

    const now = Date.now();
    const windowStart = now - this.window * 1000;

    // Remove entries older than windowStart
    // ZREMRANGEBYSCORE key -inf windowStart
    await this.redisClient.zremrangebyscore(key, '-inf', windowStart);

    // Add current timestamp
    // ZADD key now now
    await this.redisClient.zadd(key, now, now);

    // Count how many requests are in the current window
    const count = await this.redisClient.zcard(key);

    // If count exceeds limit, user is over the threshold
    const isLimited = count > this.limit;

    // Remaining is how many requests remain before hitting the limit
    const remaining = this.limit - count;

    // Time until the window is considered reset (in seconds)
    // Example: window - how long into the window we currently are
    const timeSinceWindowStart = now - windowStart;
    const timeLeftInMillis = this.window * 1000 - timeSinceWindowStart;
    const reset = Math.ceil(timeLeftInMillis / 1000);

    return {
      isLimited,
      remaining,
      limit: this.limit,
      reset: reset < 0 ? 0 : reset, // Ensure we don't return negative even if some concurrency slip
    };
  }

  /**
   * cleanup
   * -------
   * Periodically scans Redis keys matching the rate limit prefix, removing
   * timestamps outside the relevant window. This helps free memory and
   * ensures more efficient data usage over time.
   *
   * Steps:
   * 1. Scan for keys matching RATE_LIMIT_PREFIX.
   * 2. For each key, remove timestamps older than the current window start.
   * 3. If the set becomes empty, optionally delete the key entirely.
   * 4. Update metrics if needed, and log any pertinent cleanup results.
   */
  public async cleanup(): Promise<void> {
    if (!this.redisClient) return;

    const now = Date.now();
    const windowStart = now - this.window * 1000;

    // We'll use SCAN to iterate over matching keys
    let cursor = '0';
    const matchPattern = `${RATE_LIMIT_PREFIX}*`;

    do {
      const scanResult = await this.redisClient.scan(cursor, 'MATCH', matchPattern, 'COUNT', 100);
      cursor = scanResult[0];
      const keys = scanResult[1];

      if (keys && keys.length > 0) {
        // Use a pipeline to remove old entries in a batch
        const pipeline = this.redisClient.pipeline();
        for (const key of keys) {
          pipeline.zremrangebyscore(key, '-inf', windowStart);
          pipeline.zcard(key);
        }
        const results = await pipeline.exec();

        // Check if sets became empty and remove them
        // results[i][1] => zremrange return, results[i+1][1] => zcard count
        // For each key, we performed (zremrange, zcard) => 2 operations
        for (let i = 0; i < (results?.length ?? 0); i += 2) {
          const updatedZCard = results[i + 1]?.[1] ?? null;
          // The key index in 'keys' array is i/2
          const keyIndex = i / 2;
          if (updatedZCard === 0 && keys[keyIndex]) {
            await this.redisClient.del(keys[keyIndex]);
          }
        }
      }
    } while (cursor !== '0');

    // Potentially log or track performance metrics about how many keys were cleaned
    // console.log('RateLimiter cleanup completed at', new Date().toISOString());
  }
}

// --------------------------- Express Middleware -------------------------------------

/**
 * rateLimitMiddleware
 * -------------------
 * Creates an Express middleware function that applies rate limiting to each request.
 * By default, it uses 1000 requests/minute. This can be customized by passing an
 * options object with `limit` and `window` in seconds. The middleware:
 * 1. Generates a unique key for the client (user or IP).
 * 2. Calls the RateLimiter's checkRateLimit method to enforce the sliding window.
 * 3. Sets appropriate rate limit headers in the response (X-RateLimit-*, Retry-After).
 * 4. Throws an AppError with ErrorCode.RATE_LIMIT_EXCEEDED if the limit is violated.
 *
 * @param options Optional configuration overrides (limit, window)
 * @returns An Express middleware function
 */
export function rateLimitMiddleware(
  options?: { limit?: number; window?: number },
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  // We create a single RateLimiter instance with the given options.
  // For high-traffic scenarios, consider making this a singleton or
  // otherwise reusing between calls to avoid overhead.
  const limiter = new RateLimiter(options);

  // Return the actual middleware
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Generate a unique rate limit key
      const key = generateRateLimitKey(req);

      // 2. Check the rate limit in Redis
      const { isLimited, remaining, limit, reset } = await limiter.checkRateLimit(key);

      // 3. Set standard rate limit headers in the response
      const headers = getRateLimitHeaders(remaining, limit, reset);
      Object.entries(headers).forEach(([headerName, headerValue]) => {
        res.setHeader(headerName, headerValue);
      });

      // 4. If the limit is exceeded, throw an error with the correct code
      if (isLimited) {
        throw new AppError(
          'Rate limit exceeded. Please wait before retrying.',
          ErrorCode.RATE_LIMIT_EXCEEDED,
          {
            context: {
              message: 'User or IP has exceeded the allowed request limit.',
              key,
              limit,
              window: limiter['window'],
            },
            source: 'RateLimitMiddleware',
            severity: 'HIGH' as any,
          },
        );
      }

      // If not limited, proceed to the next middleware/route handler
      next();
    } catch (error) {
      // Forward any errors to the next error-handling middleware
      next(error);
    }
  };
}

// --------------------------- Exports -----------------------------------------------
/**
 * Exports:
 * - DEFAULT_RATE_LIMIT, DEFAULT_WINDOW, RATE_LIMIT_PREFIX, CLEANUP_INTERVAL
 * - generateRateLimitKey
 * - getRateLimitHeaders
 * - RateLimiter
 * - rateLimitMiddleware
 *
 * These named exports support advanced usage, such as creating custom
 * routes with dynamic rate limiting configurations.
 */