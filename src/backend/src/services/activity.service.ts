////////////////////////////////////////////////////////////////////////////////
// External Imports (with versioning per requirement)
////////////////////////////////////////////////////////////////////////////////

import { z } from 'zod'; // zod@^3.21.4
import { Context, trace, Span, SpanKind } from '@opentelemetry/api'; // @opentelemetry/api@^1.4.1
import { createClient, RedisClientType } from 'redis'; // redis@^4.6.7

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import {
  Activity,
  ActivityType,
  ActivityCategory,
  ActivitySeverity,
  CreateActivityInput,
} from '../types/activity';
import { Logger } from '../utils/logger.util';
import { AppError } from '../utils/error.util';
import { ErrorCode, HTTP_STATUS_CODES } from '../constants/error-codes';

////////////////////////////////////////////////////////////////////////////////
// Decorator Stubs for Validation, Monitoring, Rate Limiting, Security, DI
////////////////////////////////////////////////////////////////////////////////

/**
 * @description
 * Decorator that applies Zod schema validation to the method's first parameter.
 * This is a simplistic example; in a production environment, you'd inject
 * a specialized function or write a universal wrapper to handle errors properly.
 *
 * @param schema Zod schema for validation
 */
export function validate(schema: z.ZodSchema<any>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      // Typically, we validate the first argument. Adjust logic as needed.
      try {
        schema.parse(args[0]);
      } catch (parseError) {
        // If schema validation fails, throw an AppError or handle accordingly
        throw new AppError(
          `Validation failed for method ${propertyKey}: ${(parseError as Error).message}`,
          ErrorCode.VALIDATION_ERROR,
          {
            context: { parseError },
            source: 'ActivityServiceSchemaValidation',
            severity: 1, // mapping to an appropriate severity
          }
        );
      }
      // Proceed if validation is successful
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

/**
 * @description
 * Decorator that simulates performance monitoring by starting an OpenTelemetry
 * span prior to method execution, and finishing it upon method completion.
 *
 * @param monitorName A unique name for the monitored operation
 */
export function monitor(monitorName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const tracer = trace.getTracer('ActivityServiceTracer');
      let span: Span | undefined;
      let ctx: Context;

      // Start a new span
      span = tracer.startSpan(monitorName, {
        kind: SpanKind.INTERNAL,
        attributes: {
          methodName: propertyKey,
          className: target.constructor.name,
        },
      });

      ctx = trace.setSpan(Context.active(), span);

      try {
        // Run the original method in the new span context
        const result = await Context.bind(ctx, originalMethod).apply(this, args);
        span.setStatus({ code: 1 }); // 1 typically maps to SpanStatusCode.OK
        return result;
      } catch (err) {
        if (span) {
          span.recordException(err as Error);
          span.setStatus({ code: 2 }); // 2 typically maps to ERROR
        }
        throw err;
      } finally {
        if (span) {
          span.end();
        }
      }
    };
    return descriptor;
  };
}

/**
 * @description
 * Decorator that simulates a rate-limiting mechanism. In production, you might
 * integrate Redis-based counters or a specialized library (e.g., rate-limiter-flexible).
 *
 * @param options { points, duration } The rate limit constraints
 */
export function rateLimit(options: { points: number; duration: number }) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // Simple in-memory counter for demonstration; not suitable for production
    let callCount = 0;
    let startTime = Date.now();

    descriptor.value = async function (...args: any[]) {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000; // seconds since start

      if (elapsed > options.duration) {
        // Reset window
        callCount = 0;
        startTime = currentTime;
      }

      if (callCount >= options.points) {
        // Rate limit exceeded
        throw new AppError('Rate limit exceeded', ErrorCode.RATE_LIMIT_EXCEEDED, {
          context: { limit: options.points, duration: options.duration },
          source: 'ActivityServiceRateLimit',
          severity: 2,
        });
      }

      callCount += 1;
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * @description
 * Decorator that simulates security checks (e.g., verifying user roles).
 * In production, you might check JWT tokens, user roles, ACLs, etc.
 */
export function secure() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      // You could examine the user or org ID from arguments here.
      // This is just a placeholder logic to show how you'd add a security check.
      const organizationId = args[1]; // e.g., second param might be orgID, per the spec
      if (!organizationId) {
        throw new AppError(
          `Security check failed: no organizationId provided in method ${propertyKey}`,
          ErrorCode.UNAUTHORIZED,
          {
            context: { propertyKey },
            source: 'ActivityServiceSecurity',
            severity: 2,
          }
        );
      }
      // If everything is good, proceed
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

/**
 * @description
 * Decorator simulating a basic dependency-injection marker (like Inversify).
 * In reality, you'd use a real DI framework or a container approach.
 */
export function injectable() {
  return function (constructor: Function) {
    // Here, you could store metadata or register in a container.
  };
}

////////////////////////////////////////////////////////////////////////////////
// Zod Schemas for Activity Validation
////////////////////////////////////////////////////////////////////////////////

/**
 * @description
 * A Zod schema derived from the CreateActivityInput interface, ensuring
 * that all required fields are present and valid. For demonstration,
 * we treat all fields in CreateActivityInput as required. Adjust as needed.
 */
const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  category: z.nativeEnum(ActivityCategory),
  organizationId: z.string(),
  userId: z.string(),
  leadId: z.string().nullable(),
  campaignId: z.string().nullable(),
  metadata: z.record(z.any()),
  severity: z.nativeEnum(ActivitySeverity),
});

/**
 * @description
 * A Zod schema for tracking activity—could be identical to createActivitySchema
 * or specialized for differently shaped data. For demonstration, it matches.
 */
const activitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  category: z.nativeEnum(ActivityCategory),
  organizationId: z.string(),
  userId: z.string(),
  leadId: z.string().nullable(),
  campaignId: z.string().nullable(),
  metadata: z.record(z.any()),
  severity: z.nativeEnum(ActivitySeverity),
});

////////////////////////////////////////////////////////////////////////////////
// logActivity Function Implementation
////////////////////////////////////////////////////////////////////////////////

/**
 * @description
 * Creates and logs a new activity with validation, security checks, and performance monitoring.
 * This function is designed as a standalone example that could be used for simpler or utility-based
 * activity logging, outside the context of a stateful service class.
 *
 * @param input          The needed input for creating an activity, validated by createActivitySchema
 * @param organizationId The organization scope for which this activity is being created
 * @returns A Promise of the created Activity object
 */
@monitor('activity.create')
@validate(createActivitySchema)
@rateLimit({ points: 100, duration: 60 })
export async function logActivity(
  input: CreateActivityInput,
  organizationId: string
): Promise<Activity> {
  // 1. Validate input using Zod - done by @validate decorator
  // 2. Check organization access permissions (stub logic)
  if (!organizationId || organizationId !== input.organizationId) {
    throw new AppError('Organization ID mismatch or undefined', ErrorCode.FORBIDDEN, {
      context: { organizationId, inputOrganizationId: input.organizationId },
      source: 'logActivityAccessCheck',
      severity: 2,
    });
  }

  // 3. Sanitize input metadata (stub logic, real system might do deeper checks)
  const sanitizedMetadata = { ...input.metadata };

  // 4. Create activity record using model (mock DB operation)
  // In an actual implementation, this step might call a repository or ORM
  const created: Activity = {
    id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    type: input.type,
    category: input.category,
    organizationId: input.organizationId,
    userId: input.userId,
    leadId: input.leadId,
    campaignId: input.campaignId,
    ipAddress: '', // placeholder if IP is tracked
    userAgent: '', // placeholder if browser/UA is tracked
    metadata: sanitizedMetadata,
    createdAt: new Date(),
    severity: input.severity,
  };

  // 5. Log activity creation with security context
  const logger = new Logger({ defaultLevel: 'info' });
  logger.info('Activity created via logActivity function', {
    activityId: created.id,
    type: created.type,
    category: created.category,
  });

  // 6. Update metrics and analytics (stub)
  // Potentially increment a counter or push to a data pipeline

  // 7. Cache activity data if needed (stub logic)
  // e.g., store in Redis briefly:
  // const cacheClient = createClient();
  // await cacheClient.set(`activities:${created.id}`, JSON.stringify(created));

  // 8. Return created activity
  return created;
}

////////////////////////////////////////////////////////////////////////////////
// Service Class Implementation
////////////////////////////////////////////////////////////////////////////////

@injectable()
@monitor('ActivityService')
export class ActivityService {
  /**
   * @description
   * Logger instance for capturing audit logs, errors, and system info.
   */
  private logger: Logger;

  /**
   * @description
   * Cache client instance (Redis) for performance optimization and caching.
   */
  private cache: RedisClientType;

  /**
   * @description
   * A placeholder for an OpenTelemetry or custom performance monitoring reference.
   * Could store Tracer or other instrumentation objects.
   */
  private monitor: { tracerName: string };

  /**
   * @description
   * Initializes the ActivityService with dependencies for logging, caching, and monitoring.
   * In a real DI framework, these might be injected automatically rather than manually.
   *
   * @param logger A shared logger utility for audit & debug logs
   * @param cache A Redis client for caching or rate-limited counters
   * @param monitor A reference to performance instrumentation
   */
  constructor(
    logger: Logger = new Logger({ defaultLevel: 'info' }),
    cache?: RedisClientType,
    monitor?: { tracerName: string }
  ) {
    // 1. Initialize logger instance
    this.logger = logger;

    // 2. Set up cache connection (or create one if not provided)
    this.cache =
      cache ??
      createClient({
        socket: { host: 'localhost', port: 6379 },
      });

    // 3. Configure performance monitoring: if not provided, we default
    this.monitor = monitor ?? { tracerName: 'ActivityServiceDefaultTracer' };

    // 4. Initialize rate limiters, if any (none in this example, see decorators)
    // 5. Set up error handlers or fallback if needed
  }

  /**
   * @description
   * Tracks and logs activity with security context and performance monitoring.
   *
   * @param input          The input describing the activity to be created
   * @param organizationId The specific organization scope for multi-tenant isolation
   * @returns A Promise that resolves to the newly created Activity record
   */
  @monitor('activity.track')
  @validate(activitySchema)
  @secure()
  public async trackActivity(
    input: CreateActivityInput,
    organizationId: string
  ): Promise<Activity> {
    // 1. Validate input & permissions done by decorators
    // 2. Start performance tracking done by monitor() decorator
    // 3. Check rate limits done by rateLimit() if we had it here, not in this example

    // 4. Create activity record (stub for actual DB)
    if (organizationId !== input.organizationId) {
      throw new AppError(
        'Organization mismatch in trackActivity method',
        ErrorCode.FORBIDDEN,
        {
          context: { method: 'trackActivity', inputOrgId: input.organizationId, paramOrgId: organizationId },
          source: 'ActivityServiceTrackActivity',
          severity: 2,
        }
      );
    }

    const newActivity: Activity = {
      id: `ACTSVC-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      type: input.type,
      category: input.category,
      organizationId: input.organizationId,
      userId: input.userId,
      leadId: input.leadId,
      campaignId: input.campaignId,
      ipAddress: '', // could be extracted from request context
      userAgent: '', // same as above
      metadata: { ...input.metadata },
      createdAt: new Date(),
      severity: input.severity,
    };

    // 5. Update analytics metrics (placeholder)
    // e.g., increment counters, track usage in the data pipeline

    // 6. Log security context
    this.logger.info('Security context log for trackActivity', {
      severity: newActivity.severity,
      category: newActivity.category,
      orgId: newActivity.organizationId,
    });

    // 7. Cache results (stub logic)
    const cacheKey = `activity:${newActivity.id}`;
    await this.cache.connect().catch(() => {
      // If connection fails, log but do not crash
      this.logger.warn('Redis cache connection failed', { cacheKey });
    });
    await this.cache.set(cacheKey, JSON.stringify(newActivity)).catch(() => {
      this.logger.warn('Failed to cache activity', { activityId: newActivity.id, cacheKey });
    });
    await this.cache.disconnect().catch(() => {
      this.logger.warn('Redis disconnection error', { cacheKey });
    });

    // 8. Return activity
    return newActivity;
  }

  /**
   * @description
   * Retrieves a list of activities from the datastore or cache for a particular organization.
   * In production, you'd typically have filtering, pagination, etc.
   *
   * @param organizationId The organization scope to fetch activities
   * @returns A Promise resolving to an array of Activity objects
   */
  public async getActivities(organizationId: string): Promise<Activity[]> {
    // Real implementation might query a DB, add caching, etc.
    // Here we simulate returning an empty array or some stub data:
    this.logger.info('Retrieving activities for organization', { organizationId });

    // Optionally, you might attempt a cache lookup
    // For demonstration, skip that logic or provide a stub
    return []; // Stub for demonstration
  }

  /**
   * @description
   * Retrieves metrics or analytics for activities at the organization level. This function
   * can be extended to query timeseries data, stats, or other aggregated analytics.
   *
   * @param organizationId The organization scope for the metrics
   * @returns A Promise resolving to any analytics or aggregated data structure
   */
  public async getMetrics(organizationId: string): Promise<Record<string, any>> {
    this.logger.info('Fetching activity metrics for organization', { organizationId });
    // Example: Return some stub analytics
    return {
      totalActivities: 0,
      leads: {
        created: 0,
        updated: 0,
        deleted: 0,
      },
      campaigns: {
        started: 0,
        paused: 0,
        completed: 0,
      },
      emails: {
        sent: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
      },
      securityEvents: {
        loginSuccess: 0,
        loginFailure: 0,
      },
    };
  }
}

////////////////////////////////////////////////////////////////////////////////
// Named Exports
////////////////////////////////////////////////////////////////////////////////
// Exporting ActivityService and the logActivity function as requested
export { ActivityService, logActivity };