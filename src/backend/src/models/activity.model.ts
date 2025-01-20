/*--------------------------------------------------------------------------------------------------
 * File: activity.model.ts
 * Description:
 *   Prisma model implementation for activity tracking and event logging in the B2B sales
 *   intelligence platform. This module handles CRUD operations, multi-tenant isolation,
 *   security audit logging, and performance monitoring for Activity records. It leverages:
 *     - Prisma Client (@prisma/client ^5.2.0) for DB interactions
 *     - DataDog (datadog-metrics ^1.2.0) for performance metrics
 *     - NodeCache (node-cache ^5.1.2) for caching
 *     - Zod validation schema (activitySchema) for input validation
 *     - Logger utilities (logActivity) for security/audit logging
 *     - Detailed enterprise-grade comments and structured code
 * 
 * Requirements Addressed:
 *   1. Activity Tracking (campaign performance, conversion analytics, ROI calculation).
 *   2. Audit Logging (comprehensive activity logging for security and compliance).
 *   3. Performance Monitoring (target response times < 50ms p95).
 *
 * Exports:
 *   - createActivity        : Create new activity record in a multi-tenant context
 *   - getActivityById       : Retrieve single activity record by ID with caching
 *   - getActivitiesByLead   : Retrieve all activities for a given lead with pagination
 *   - getActivitiesByCampaign : Retrieve all activities for a given campaign with filtering
 --------------------------------------------------------------------------------------------------*/

// -------------------------------------------------------------------------------------
// External Imports (with version references for clarity)
// -------------------------------------------------------------------------------------
import DataDog from 'datadog-metrics'; // datadog-metrics ^1.2.0
import NodeCache from 'node-cache'; // node-cache ^5.1.2

// -------------------------------------------------------------------------------------
// Internal Imports
// -------------------------------------------------------------------------------------
import type { Activity, ActivityType, ActivityCategory } from '../types/activity';
import type { CreateActivityInput } from '../types/activity'; // Extended interface from activity.ts
import { activitySchema } from '../schemas/activity.schema'; // Activity validation schema (zod)
import prisma from '../config/database'; // PrismaClient instance (@prisma/client ^5.2.0)
import { Logger, logActivity } from '../utils/logger.util'; // Security audit logging
import { PERFORMANCE_METRICS } from '../constants/metrics'; // Performance constants

// -------------------------------------------------------------------------------------
// Local Logger Instance
// -------------------------------------------------------------------------------------
const logger = new Logger({ defaultLevel: 'info' });

/*--------------------------------------------------------------------------------------
 * NodeCache instance to store Activity objects, preventing repeated DB queries for
 * frequently accessed records (e.g., getActivityById). The stdTTL (time-to-live) and
 * checkperiod are set to moderate defaults for demonstration only. Adjust based on real
 * usage patterns and scale requirements.
 *-------------------------------------------------------------------------------------*/
const activityCache = new NodeCache({
  stdTTL: 60, // 60 seconds default TTL per cached entry
  checkperiod: 120, // Check for expired entries every 120 seconds
});

/*--------------------------------------------------------------------------------------
 * Decorator: performanceMetric
 *--------------------------------------------------------------------------------------
 * A simplistic TypeScript decorator to measure the execution time of asynchronous
 * functions. It uses DataDog to record histograms of execution durations, enabling
 * performance benchmarking and alerting.
 *
 * @param metricKey - The metric name to record in DataDog for performance tracking.
 *-------------------------------------------------------------------------------------*/
function performanceMetric(metricKey: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
  ): TypedPropertyDescriptor<(...args: any[]) => Promise<any>> | void {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    descriptor.value = async function (...args: any[]): Promise<any> {
      const startTime = process.hrtime();
      try {
        // Execute the original method
        const result = await originalMethod.apply(this, args);

        // Calculate elapsed time in milliseconds
        const elapsed = process.hrtime(startTime);
        const ms = (elapsed[0] * 1e9 + elapsed[1]) / 1e6;

        // Record the performance metric in DataDog
        DataDog.histogram(metricKey, ms);

        logger.debug('Performance metric recorded.', {
          functionName: propertyKey,
          metricKey,
          durationMs: ms,
        });

        return result;
      } catch (error) {
        // Even on error, record the elapsed time
        const elapsed = process.hrtime(startTime);
        const ms = (elapsed[0] * 1e9 + elapsed[1]) / 1e6;
        DataDog.histogram(metricKey, ms);

        logger.error(`Error encountered in ${propertyKey}`, {
          metricKey,
          durationMs: ms,
          error,
        });
        throw error;
      }
    };
    return descriptor;
  };
}

/*--------------------------------------------------------------------------------------
 * Decorator: cacheResult
 *--------------------------------------------------------------------------------------
 * A simplistic TypeScript decorator that checks for an existing cached entry
 * before invoking the original method. If found, it returns the cached data;
 * otherwise, it processes the method, caches the result if non-null,
 * and returns it.
 *
 * @param cacheKey - The standard prefix or key category for the cache.
 *-------------------------------------------------------------------------------------*/
function cacheResult(cacheKey: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
  ): TypedPropertyDescriptor<(...args: any[]) => Promise<any>> | void {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    descriptor.value = async function (...args: any[]): Promise<any> {
      // Construct a unique cache key based on method arguments
      // e.g., "activity:getActivityById:ID:ORG_ID"
      const uniqueKey = `${cacheKey}:${args.join(':')}`;

      // Check if the data is in cache
      const cachedResult = activityCache.get(uniqueKey);
      if (cachedResult) {
        logger.debug('Cache hit for activity.', {
          methodName: propertyKey,
          cacheKey: uniqueKey,
        });
        return cachedResult;
      }

      logger.debug('Cache miss. Querying database.', {
        methodName: propertyKey,
        cacheKey: uniqueKey,
      });

      const result = await originalMethod.apply(this, args);

      // Cache the result if any data is returned
      if (result) {
        activityCache.set(uniqueKey, result);
      }

      return result;
    };
    return descriptor;
  };
}

/*--------------------------------------------------------------------------------------
 * Helper Function: checkOrganizationAccess
 *--------------------------------------------------------------------------------------
 * A placeholder function simulating multi-tenant access checks. In a real system,
 * this might verify the user's role, membership status, or subscription level
 * against the organizationId. For demonstration, it always allows.
 *
 * @param organizationId - The ID of the tenant for which access is being validated.
 *-------------------------------------------------------------------------------------*/
function checkOrganizationAccess(organizationId: string): void {
  // Placeholder logic: In production, enforce robust access checks here.
  // If unauthorized, throw an error or handle suitably.
  if (!organizationId) {
    throw new Error('Organization ID is invalid or missing.');
  }
}

/*--------------------------------------------------------------------------------------
 * Function: createActivity
 *--------------------------------------------------------------------------------------
 * Creates a new activity record with enhanced security logging and performance tracking.
 * 
 * Decorators:
 *   @performanceMetric(PERFORMANCE_METRICS.ACTIVITY_CREATE)
 * 
 * Steps (as per specification):
 *   1. Start performance tracking
 *   2. Validate organization access
 *   3. Sanitize input data (demonstrated inline)
 *   4. Validate input using activitySchema
 *   5. Create activity record with organization context
 *   6. Log security audit event
 *   7. Update performance metrics
 *   8. Return created activity
 *
 * @param input            The data used to create a new Activity. Based on CreateActivityInput.
 * @param organizationId   The organization context for multi-tenant isolation.
 * @returns                A Promise resolving to the newly created Activity record.
 *-------------------------------------------------------------------------------------*/
@performanceMetric(PERFORMANCE_METRICS.ACTIVITY_CREATE)
export async function createActivity(
  input: CreateActivityInput,
  organizationId: string,
): Promise<Activity> {
  // (1) Start performance tracking is handled by the @performanceMetric decorator.

  // (2) Validate organization access
  checkOrganizationAccess(organizationId);

  // (3) & (4) Validate and sanitize the input using activitySchema. 
  //     We map 'timestamp' -> 'createdAt' & incorporate severity manually.
  //     For demonstration, we use a minimal transformation. If the schema
  //     doesn't handle severity, we manage it directly.
  const validatedData = activitySchema.parse({
    type: input.type,
    category: input.category,
    organizationId,
    userId: input.userId,
    leadId: input.leadId,
    campaignId: input.campaignId,
    metadata: input.metadata || {},
    timestamp: new Date(),   // auto-set creation time
    ipAddress: '0.0.0.0',    // placeholder, typically derived from request
    userAgent: 'unknown',    // placeholder, typically derived from request
  });

  // (5) Create activity record with organization context
  //     The DB schema is presumed to have a 'severity' column aligned with ActivitySeverity.
  const createdActivity = await prisma.activity.create({
    data: {
      type: validatedData.type,
      category: validatedData.category,
      organizationId: validatedData.organizationId,
      userId: validatedData.userId,
      leadId: validatedData.leadId,
      campaignId: validatedData.campaignId,
      metadata: validatedData.metadata,
      createdAt: validatedData.timestamp, // stored as createdAt in DB
      ipAddress: validatedData.ipAddress,
      userAgent: validatedData.userAgent,
      severity: input.severity, // from extended input
    },
  });

  // (6) Log security audit event
  logActivity({
    eventType: 'CREATE_ACTIVITY',
    details: {
      activityId: createdActivity.id,
      activityType: createdActivity.type,
    },
    organizationId: createdActivity.organizationId,
  });

  // (7) & (8) The performance metric is updated by the decorator,
  // then we return the created activity.
  return createdActivity as Activity;
}

/*--------------------------------------------------------------------------------------
 * Function: getActivityById
 *--------------------------------------------------------------------------------------
 * Retrieves an activity record by its ID with local caching and security context checks.
 *
 * Decorators:
 *   @performanceMetric(PERFORMANCE_METRICS.ACTIVITY_GET)
 *   @cacheResult('activity')
 * 
 * Steps (as per specification):
 *   1. Check cache for activity
 *   2. Validate organization access
 *   3. Query database if cache miss
 *   4. Log access attempt
 *   5. Update performance metrics
 *   6. Cache result if found
 *   7. Return activity or null
 *
 * @param id              The unique ID of the Activity record
 * @param organizationId  The tenant's organization ID for multi-tenant isolation
 * @returns               A Promise resolving to the found Activity or null if none
 *-------------------------------------------------------------------------------------*/
@performanceMetric(PERFORMANCE_METRICS.ACTIVITY_GET)
@cacheResult('activity')
export async function getActivityById(
  id: string,
  organizationId: string,
): Promise<Activity | null> {
  // (1) The cache check is handled by @cacheResult decorator.

  // (2) Validate organization access
  checkOrganizationAccess(organizationId);

  // (3) Query the database for matching record
  const record = await prisma.activity.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  // (4) Log access attempt (security audit)
  logActivity({
    eventType: 'GET_ACTIVITY_BY_ID',
    details: {
      requestedId: id,
      found: !!record,
    },
    organizationId,
  });

  // (5) & (6) Performance metrics and caching are handled by the decorators.
  // (7) Return the matched record or null
  return record;
}

/*--------------------------------------------------------------------------------------
 * Function: getActivitiesByLead
 *--------------------------------------------------------------------------------------
 * Retrieves all activity records for a specific lead with pagination, ensuring that
 * multi-tenant isolation is enforced via organizationId checks.
 *
 * Steps:
 *   - Validate organization access
 *   - Paginate results (skip & take) based on supplied page & pageSize
 *   - Return an array of Activity records associated with the given lead
 *
 * @param leadId          The unique ID of the lead
 * @param organizationId  The tenant's organization ID for isolation
 * @param page            Page number for pagination (default 1)
 * @param pageSize        Number of results per page (default 10)
 * @returns               A Promise resolving to an array of matching Activity records
 *-------------------------------------------------------------------------------------*/
export async function getActivitiesByLead(
  leadId: string,
  organizationId: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<Activity[]> {
  // Validate org access
  checkOrganizationAccess(organizationId);

  // Calculate pagination offsets
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // Execute the query
  const activities = await prisma.activity.findMany({
    where: {
      leadId,
      organizationId,
    },
    orderBy: {
      createdAt: 'desc', // Example sorting by newest first
    },
    skip,
    take,
  });

  // Optionally log the pagination event for analytics or debugging
  logger.debug('Fetched activities by lead with pagination.', {
    leadId,
    organizationId,
    page,
    pageSize,
    resultCount: activities.length,
  });

  return activities;
}

/*--------------------------------------------------------------------------------------
 * Function: getActivitiesByCampaign
 *--------------------------------------------------------------------------------------
 * Retrieves all activity records for a specific campaign with optional filtering,
 * applying multi-tenant isolation based on organizationId. Useful for campaign-level
 * analytics and auditing.
 *
 * Steps:
 *   - Validate organization access
 *   - Apply optional filters (e.g., ActivityType, date range)
 *   - Query matching records from the DB
 *   - Return an array of Activity records
 *
 * @param campaignId      The unique campaign ID
 * @param organizationId  The tenant's organization ID for isolation
 * @param filter          An optional object with fields for type filtering or date bounds
 * @returns               A Promise resolving to an array of matching Activity records
 *-------------------------------------------------------------------------------------*/
export async function getActivitiesByCampaign(
  campaignId: string,
  organizationId: string,
  filter?: {
    type?: ActivityType;
    fromDate?: Date;
    toDate?: Date;
  },
): Promise<Activity[]> {
  checkOrganizationAccess(organizationId);

  // Compose where clause with optional filters. This partial approach merges
  // user-supplied constraints (type, date range) into the final query.
  const whereClause: Record<string, any> = {
    campaignId,
    organizationId,
  };

  // If a specific ActivityType is requested
  if (filter?.type) {
    whereClause.type = filter.type;
  }

  // If a fromDate or toDate is specified, apply a createdAt range
  if (filter?.fromDate || filter?.toDate) {
    whereClause.createdAt = {};
    if (filter.fromDate) {
      whereClause.createdAt.gte = filter.fromDate;
    }
    if (filter.toDate) {
      whereClause.createdAt.lte = filter.toDate;
    }
  }

  // Query the database
  const activities = await prisma.activity.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
  });

  logger.debug('Fetched activities by campaign with optional filters.', {
    campaignId,
    organizationId,
    filter,
    recordCount: activities.length,
  });

  return activities;
}