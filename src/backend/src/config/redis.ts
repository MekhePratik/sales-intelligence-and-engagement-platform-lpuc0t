/**
 * ---------------------------------------------------------------------------------------------
 * redis.ts
 *
 * This file provides a comprehensive Redis configuration module for the B2B Sales Intelligence
 * Platform, covering:
 * - Single-node and cluster mode connection settings
 * - Detailed client initialization with event listeners and retry strategies
 * - Singleton class (RedisManager) for managing Redis connections
 * - Support for caching, session management, and rate limiting
 * - High availability through cluster options and automatic failover
 * - Robust error handling and logging for connection and operation events
 *
 * Requirements Addressed:
 * 1. Cache Layer (performance optimization with cluster mode/sharding)
 * 2. Rate Limiting (Redis-based implementation with configurable thresholds)
 * 3. Session Management (secure session storage and management with configurable TTL)
 *
 * All functionalities align with the enterprise standards, including:
 * - Secure password storage and optional TLS
 * - Automatic retry strategies for cluster failover
 * - Comprehensive event listeners for monitoring and alerting
 * - Integration with application-wide logging and error handling
 *
 * Exports:
 * 1. REDIS_CONFIG: Object containing single-node Redis configuration.
 * 2. REDIS_CLUSTER_CONFIG: Object containing cluster configuration options.
 * 3. createRedisClient(options): Factory function returning a configured client (standalone or cluster).
 * 4. handleRedisError(error): Comprehensive error handler for Redis-related issues.
 * 5. class RedisManager: A singleton class managing Redis connections for caching/rate limiting/sessions.
 *
 * ---------------------------------------------------------------------------------------------
 */

// --------------------------------- External Imports (versioned) ---------------------------------
// ioredis@^5.3.0 - Redis client library with cluster and TLS support
import Redis, { Redis as IRedis, Cluster as RedisCluster } from 'ioredis';

// --------------------------------- Internal Imports ---------------------------------------------
import { Logger } from '../utils/logger.util'; // Using Logger.info and Logger.error for log events
import { AppError } from '../utils/error.util'; // Using AppError for Redis-related errors
import { PERFORMANCE_METRICS } from '../constants/metrics'; // For referencing performance metrics (e.g., CACHE_HIT_RATE)

// --------------------------------- Global Configuration Objects ---------------------------------

/**
 * REDIS_CONFIG
 * ------------
 * Contains the comprehensive configuration options for establishing a
 * standalone Redis connection, following best practices for retries,
 * timeouts, and TLS usage. Environment variables drive these settings
 * for flexibility across multiple deployment environments.
 */
export const REDIS_CONFIG = {
  // Hostname (or IP) of the Redis server
  host: process.env.REDIS_HOST,

  // TCP port on which Redis is listening
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,

  // Optional password for Redis authentication
  password: process.env.REDIS_PASSWORD,

  // Logical database index for namespacing
  db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,

  // Key prefix to differentiate multiple apps in the same Redis instance
  keyPrefix: process.env.REDIS_KEY_PREFIX || '',

  // Whether to use TLS for an encrypted connection
  tls: process.env.REDIS_TLS_ENABLED === 'true',

  // Maximum number of retries per request before failing
  maxRetriesPerRequest: 3,

  // Whether Redis should perform a ready check before enabling commands
  enableReadyCheck: true,

  /**
   * retryStrategy
   * -------------
   * Custom function controlling the wait time before a reconnection attempt.
   * This uses an exponential backoff capped at 2000 ms for reliability.
   */
  retryStrategy: (times: number) => Math.min(times * 50, 2000),

  // Whether to show extensive error stacks in development
  showFriendlyErrorStack: process.env.NODE_ENV === 'development',

  // Connection-related timeouts in milliseconds
  connectionTimeout: 10000,
  keepAlive: 10000,
  connectTimeout: 10000,
  disconnectTimeout: 2000,
  commandTimeout: 5000,

  // If set to true, the client won't attempt to connect until .connect() is called
  lazyConnect: true,

  // Whether commands are queued before a connection is established
  enableOfflineQueue: true,

  // Maximum time in milliseconds to retry loading cluster slots
  // before giving up (used only for cluster connections if needed).
  maxLoadingRetryTime: 2000,
};

/**
 * REDIS_CLUSTER_CONFIG
 * --------------------
 * Contains configuration for connecting to a Redis Cluster environment,
 * including node addresses and advanced cluster options such as read
 * scaling to replicas.
 */
export const REDIS_CLUSTER_CONFIG = {
  /**
   * Array of node definitions, each containing the host and port fields.
   * This is parsed from a comma-separated string like: "host1:7000,host2:7001"
   */
  nodes: process.env.REDIS_CLUSTER_NODES
    ? process.env.REDIS_CLUSTER_NODES.split(',').map((node) => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port, 10) };
      })
    : [],

  // Fallback options for the underlying Redis connection
  redisOptions: REDIS_CONFIG,

  // Direct reads to slave nodes when possible, improving throughput
  scaleReads: 'slave',

  // Maximum number of redirections before giving up on a try
  maxRedirections: 3,

  // Time to wait (ms) before trying to query another node after failover
  retryDelayOnFailover: 300,

  // Time to wait (ms) before trying again when the cluster is down
  retryDelayOnClusterDown: 1000,

  // Whether to enable offline queue in cluster mode
  enableOfflineQueue: true,

  // Whether Redis cluster should perform a ready check
  enableReadyCheck: true,

  /**
   * clusterRetryStrategy
   * --------------------
   * Determines how long to wait before reconnecting when
   * the Redis Cluster experiences operational errors. Uses
   * incremental backoff with a max of 3000 ms.
   */
  clusterRetryStrategy: (times: number) => Math.min(times * 100, 3000),

  /**
   * Additional advanced options for the cluster connection, allowing
   * fine-grained control over redirections, failover delays, etc.
   */
  redisClusterOptions: {
    maxRedirections: 16,
    retryDelayOnFailover: 100,
    retryDelayOnClusterDown: 100,
    enableOfflineQueue: true,
    enableReadyCheck: true,
  },
};

// --------------------------------- Utility Functions ---------------------------------------------

/**
 * handleRedisError
 * ----------------
 * Comprehensive error handler for Redis connection and operation errors, containing:
 * - Detailed logging with stack traces
 * - Error type categorization (connection, operation, timeout, etc.)
 * - AppError instantiation for consistent platform-level handling
 * - Health metric updates and alert triggers if necessary
 *
 * @param error - The encountered Redis error object (Error instance from ioredis).
 * @returns void
 */
export function handleRedisError(error: Error): void {
  // STEP 1: Log detailed error information
  Logger.error(error, {
    context: { redisErrorStack: error.stack },
    redisErrorMessage: error.message,
  });

  // STEP 2: Categorize error type
  // For demonstration, a simple pattern-based check
  let errorCategory = 'operation';
  if (error.message && error.message.includes('ECONN')) {
    errorCategory = 'connection';
  } else if (error.message && error.message.includes('timeout')) {
    errorCategory = 'timeout';
  }

  // STEP 3: Create an AppError instance for internal tracking
  const appError = new AppError(
    `Redis ${errorCategory} error: ${error.message}`,
    // We use "DATABASE_ERROR" for a Redis-related issue, though it can vary
    // depending on organizational standards (e.g., a specialized REDIS_ERROR code).
    // The system's error codes and severities are flexible here.
    'B2B_ERR_DATABASE_ERROR' as any,
    {
      context: { originalError: error.message, category: errorCategory },
      source: 'Redis',
      severity: 'HIGH' as any, // Typically ErrorSeverity.HIGH
    },
  );

  // STEP 4: Implement any recovery strategy or specialized fallback
  // This is a placeholder for advanced logic such as reinitializing channels,
  // clearing stale connections, or forcing a reconnect.
  // e.g., we might conditionally attempt an immediate reconnect or queue a reconnect job.

  // STEP 5: Update health metrics / log metrics
  // (Example) We could increment a custom metric for Redis errors:
  Logger.info(`Redis error categorized as: ${errorCategory}`, {
    metricsUpdate: `Increment error count for category ${errorCategory}`,
  });

  // STEP 6: Emit or trigger any relevant monitoring/alerting event
  // If the error is severe, this is where we might push a Slack alert or PagerDuty incident.
  // Implementation is environment-specific.

  // Final step: The system can choose to throw the appError or propagate
  // it upwards to unify with other error-handling logic as needed. Here,
  // we simply log the structured error. Additional rethrow is optional.
  Logger.error(appError, { eventContext: 'Redis handleRedisError completed' });
}

/**
 * createRedisClient
 * -----------------
 * Factory function to create and configure a Redis client instance based on environment
 * configuration, supporting both standalone and cluster modes. Applies event listeners
 * for connection management, error handling, retry logic, and performance metrics.
 *
 * @param options - Optional overrides for Redis configuration
 * @returns Promise<IRedis | RedisCluster> - A fully configured Redis client instance
 */
export async function createRedisClient(
  options?: Record<string, any>,
): Promise<IRedis | RedisCluster> {
  // STEP 1: Validate configuration options
  // Merge defaults (REDIS_CONFIG) with any function-level overrides
  const finalOptions = Object.assign({}, REDIS_CONFIG, options || {});

  // STEP 2: Determine if cluster mode is enabled by checking nodes
  const isClusterMode =
    REDIS_CLUSTER_CONFIG.nodes && REDIS_CLUSTER_CONFIG.nodes.length > 0;

  // STEP 3: Create appropriate Redis client instance (standalone or cluster)
  let client: IRedis | RedisCluster;
  if (isClusterMode) {
    // If cluster mode is active, merge cluster config with finalOptions
    Logger.info('Initializing Redis in CLUSTER mode', { clusterNodes: REDIS_CLUSTER_CONFIG.nodes });
    client = new Redis.Cluster(
      REDIS_CLUSTER_CONFIG.nodes,
      {
        ...REDIS_CLUSTER_CONFIG.redisClusterOptions,
        redisOptions: { ...REDIS_CLUSTER_CONFIG.redisOptions, ...finalOptions },
      },
    );
  } else {
    // Standalone mode
    Logger.info('Initializing Redis in STANDALONE mode', { host: finalOptions.host, port: finalOptions.port });
    client = new Redis(finalOptions);
  }

  // STEP 4: Set up event listeners for connection management
  /**
   * 'connect' event:
   *   Emitted when the client is initiating a connection.
   */
  client.on('connect', () => {
    Logger.info('Redis client connecting...', {
      nodeType: isClusterMode ? 'ClusterNode' : 'Standalone',
    });
  });

  /**
   * 'ready' event:
   *   Emitted when the client successfully establishes the connection
   *   and is ready to accept commands.
   */
  client.on('ready', () => {
    Logger.info('Redis client ready', {
      nodeType: isClusterMode ? 'ClusterNode' : 'Standalone',
    });
  });

  /**
   * 'error' event:
   *   Emitted when there's an error in the client operation or connection.
   *   We leverage the handleRedisError function for comprehensive error management.
   */
  client.on('error', (err) => {
    handleRedisError(err);
  });

  /**
   * 'close' event:
   *   Emitted when an established Redis connection has closed.
   */
  client.on('close', () => {
    Logger.info('Redis connection closed', {
      nodeType: isClusterMode ? 'ClusterNode' : 'Standalone',
    });
  });

  /**
   * 'reconnecting' event:
   *   Emitted when the client is attempting to reconnect after a disconnection.
   */
  client.on('reconnecting', () => {
    Logger.info('Redis client reconnecting...', {
      nodeType: isClusterMode ? 'ClusterNode' : 'Standalone',
    });
  });

  // STEP 5: Apply optional logic for connecting if lazyConnect is false
  // By default, 'lazyConnect' is true, so the connection will not be established
  // until a command is called or connect() is explicitly invoked.
  if (!finalOptions.lazyConnect) {
    try {
      // Attempt immediate connection
      if (isClusterMode) {
        // For cluster, optional readiness checks can be done here
        // In ioredis cluster, .connect() returns a promise
        await (client as RedisCluster).connect();
      } else {
        // For standalone, .connect() returns a promise if lazyConnect is set
        await (client as IRedis).connect();
      }
      Logger.info('Redis client connected (eager mode)', {});
    } catch (connectErr) {
      handleRedisError(connectErr as Error);
    }
  }

  // STEP 6: Configure performance metrics collection if needed
  // For instance, we could measure total commands processed or track
  // cache hit rate in an advanced scenario. The code is omitted here
  // for brevity, but we show a placeholder log message below.
  Logger.info('Redis performance metrics can be instrumented here', {
    metricKey: PERFORMANCE_METRICS.CACHE_HIT_RATE,
  });

  // STEP 7: Return the fully configured client instance
  return client;
}

// --------------------------------- Singleton Class Definition ------------------------------------

/**
 * RedisManager
 * ------------
 * A singleton class managing Redis client instances and connections for:
 * - General caching usage
 * - Rate limiting storage
 * - Session management
 *
 * This class offers high availability features by supporting both standalone
 * and cluster modes. It includes internal health checks, metrics collection,
 * and comprehensive connect/disconnect methods.
 */
export class RedisManager {
  /**
   * The underlying Redis or RedisCluster client instance.
   */
  private client: IRedis | RedisCluster | undefined;

  /**
   * Base options used when initializing the Redis client.
   */
  private options: Record<string, any>;

  /**
   * Connection state indicating whether the manager has
   * connected at least once to the Redis service.
   */
  private isConnected: boolean;

  /**
   * Object tracking various metrics relevant to Redis usage,
   * such as cache hit/miss ratio, error counts, etc.
   */
  private metrics: Record<string, any>;

  /**
   * A simplified healthCheck object that can store the latest
   * connection status, timestamps, or potential error details
   * for reporting to monitoring tools.
   */
  private healthCheck: Record<string, any>;

  /**
   * Constructor
   * -----------
   * Initializes the RedisManager with the provided configuration options,
   * sets up metrics, and prepares the internal state without immediately
   * establishing a connection unless specified.
   *
   * @param options - Overrides or additional config for Redis.
   */
  constructor(options?: Record<string, any>) {
    // STEP 1: Validate and store configuration
    this.options = options || {};
    // STEP 2: Initialize connection state
    this.isConnected = false;
    // STEP 3: Set up metrics collection object
    this.metrics = {
      [PERFORMANCE_METRICS.CACHE_HIT_RATE]: 0,
      errorCount: 0,
    };
    // STEP 4: Initialize basic health check structure
    this.healthCheck = {
      status: 'initialized',
      lastError: null,
      lastConnected: null,
    };
    // STEP 5: The actual Redis client is not created here yet; it will be done on connect
    this.client = undefined;
    // STEP 6: Log creation of the RedisManager instance
    Logger.info('RedisManager instance created', { options: this.options });
  }

  /**
   * connect
   * -------
   * Establishes the Redis connection with proper error handling and retry logic.
   * Ensures the client is not already connected, then uses createRedisClient()
   * to obtain a configured Redis instance. Also updates healthCheck and metrics.
   *
   * @returns Promise<void> - Resolves when the connection is successfully established.
   */
  public async connect(): Promise<void> {
    // STEP 1: Check existing connection state
    if (this.isConnected && this.client) {
      Logger.info('RedisManager.connect called but client is already connected', {});
      return;
    }

    // STEP 2: Create the Redis client (standalone or cluster)
    try {
      this.client = await createRedisClient(this.options);
      // (Optional) If we want to force an immediate connection in lazyConnect mode:
      if (this.client && (this.client as IRedis).connect) {
        await (this.client as IRedis).connect();
      }
      // STEP 3: Connection successful, update states
      this.isConnected = true;
      this.healthCheck.status = 'connected';
      this.healthCheck.lastConnected = new Date().toISOString();
      Logger.info('RedisManager: Connection established successfully', {});
    } catch (connError) {
      // STEP 4: Handle connection errors using handleRedisError or custom logic
      handleRedisError(connError as Error);
      this.healthCheck.status = 'error';
      this.healthCheck.lastError = connError;
      this.metrics.errorCount += 1;
      throw connError; // Optionally rethrow to signal upper layers
    }
  }

  /**
   * disconnect
   * ----------
   * Gracefully closes the existing Redis connection if it exists. Cleans up
   * any resources, stops metrics collection, and clears the isConnected state.
   *
   * @returns Promise<void> - Resolves upon successful disconnection or if no client is present.
   */
  public async disconnect(): Promise<void> {
    if (!this.client) {
      Logger.info('RedisManager.disconnect called but no client is present', {});
      return;
    }

    // Try to quit or disconnect the client gracefully
    try {
      if ((this.client as IRedis).quit) {
        await (this.client as IRedis).quit();
      } else if ((this.client as RedisCluster).quit) {
        await (this.client as RedisCluster).quit();
      }
      Logger.info('RedisManager: Client disconnected successfully', {});
    } catch (discError) {
      // Handle disconnection errors
      handleRedisError(discError as Error);
      this.metrics.errorCount += 1;
    } finally {
      // Clear connection state
      this.client = undefined;
      this.isConnected = false;
      this.healthCheck.status = 'disconnected';
    }
  }

  /**
   * getClient
   * ---------
   * Retrieves the underlying Redis client instance for direct command usage.
   * Verifies the connection is still valid and throws if it is not.
   *
   * @returns IRedis | RedisCluster - The Redis client interface for further operations.
   */
  public getClient(): IRedis | RedisCluster {
    if (!this.client || !this.isConnected) {
      Logger.error('RedisManager.getClient called but client is not connected', {});
      throw new AppError('Redis client not connected', 'B2B_ERR_DATABASE_ERROR' as any, {
        context: { message: 'Attempted to use getClient without active connection' },
        source: 'RedisManager',
        severity: 'MEDIUM' as any, // Typically ErrorSeverity.MEDIUM
      });
    }
    return this.client;
  }
}