import { Router } from 'express'; // express@^4.18.2
import rateLimit from 'express-rate-limit'; // express-rate-limit@^6.7.0

/**
 * Internal Imports
 * -----------------------------------------------------------------------------
 * Importing the ActivityController class methods for handling request logic,
 * authentication and authorization middleware, validation utilities, and role
 * definitions for RBAC checks.
 */
import { ActivityController } from '../controllers/activity.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { USER_ROLES } from '../constants/roles';

/**
 * Zod & Domain Imports
 * -----------------------------------------------------------------------------
 * We rely on zod to create route-specific validation schemas. Here we reference
 * the same enums used on the domain side for a fully typed approach.
 */
import { z } from 'zod';
import {
  ActivityType,
  ActivityCategory,
  ActivitySeverity,
} from '../types/activity';

/**
 * Extensive route-level schemas
 * -----------------------------------------------------------------------------
 * Below, we define distinct schemas for:
 * 1) Creation of activity records (POST /activities)
 * 2) Activity history queries (GET /activities/history)
 * 3) Activity metrics queries (GET /activities/metrics)
 *
 * These schemas ensure we validate incoming data structures and types in
 * alignment with the domain logic found in ActivityController.
 */
const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  category: z.nativeEnum(ActivityCategory),
  organizationId: z.string(),
  userId: z.string(),
  leadId: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
  severity: z.nativeEnum(ActivitySeverity),
});

const activityHistoryQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

const activityMetricsQuerySchema = z.object({
  dateRange: z.string().optional(),
});

/**
 * Audit Logging Middleware
 * -----------------------------------------------------------------------------
 * An audit logging middleware capturing relevant request information for
 * security and compliance. This is applied to all routes in this router.
 *
 * In production scenarios, this might use a dedicated logger configured
 * with Winston or a custom service to handle structured, secure logs.
 */
import { Logger } from '../utils/logger.util';

const routeLogger = new Logger({ defaultLevel: 'info' });

function auditLoggingMiddleware(
  req: any,
  res: any,
  next: (err?: any) => void
): void {
  // Capture method, URL, user context (if any), important metadata
  routeLogger.audit(`Incoming request: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    body: req.body,
    query: req.query,
    userId: req.currentUser?.id || null,
    userRole: req.currentUser?.role || null,
    timestamp: new Date().toISOString(),
  });
  next();
}

/**
 * Error Handling Middleware
 * -----------------------------------------------------------------------------
 * This error handler is mounted at the end of this router to catch any errors
 * propagated from the route handlers or the controller calls. It checks for
 * known error types (e.g., AppError) and responds with standardized JSON
 * structures. Unrecognized errors fallback to a generic 500 status.
 */
import { AppError, isAppError } from '../utils/error.util';

function activityRoutesErrorHandler(
  err: any,
  req: any,
  res: any,
  next: (err?: any) => void
): void {
  // We pass recognized AppErrors with specific status codes
  if (isAppError(err)) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json(err.toJSON());
  }
  // Otherwise, fallback to a 500
  return res.status(500).json({
    code: 'B2B_ERR_INTERNAL_SERVER_ERROR',
    statusCode: 500,
    message: 'An unexpected error occurred. Please try again later.',
  });
}

/**
 * Express-Rate-Limit Configuration
 * -----------------------------------------------------------------------------
 * We attach a rate limiter to each route that requires it, ensuring we do not
 * exceed a certain number of requests from the same IP within a defined window.
 * This is configurable based on project or environment needs.
 */
const routeRateLimit = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 100, // up to 100 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * configureActivityRoutes
 * -----------------------------------------------------------------------------
 * Factory function that accepts an ActivityController instance and returns an
 * Express Router configured with activity-specific routes:
 *
 * 1) POST /activities:
 *    - Authenticated, user-level route for creating new activity records.
 *    - Involves body validation, rate limiting, and role-based authorization.
 *
 * 2) GET /activities/history:
 *    - Authenticated, user-level route for retrieving a paginated list of
 *      existing activities. Involves query param validation, rate limiting,
 *      and role-based authorization.
 *
 * 3) GET /activities/metrics:
 *    - Authenticated, manager-level route for retrieving aggregated metrics.
 *    - Involves query param validation, rate limiting, and manager role-based authorization.
 *
 * All routes run through:
 *  - Audit logging middleware for compliance
 *  - Error handling middleware to capture and standardize errors
 *
 * @param activityController {ActivityController} - Instance of the controller
 * @returns {Router} Configured Express router with these secure routes
 */
export default function configureActivityRoutes(
  activityController: ActivityController
) {
  /**
   * Main Express Router
   * We create the router instance and attach route definitions below.
   */
  const router = Router();

  // 1) Attach an audit logging middleware to track all incoming requests
  router.use(auditLoggingMiddleware);

  // 2) POST /activities
  //    - Auth: authenticate => user token
  //    - Role: authorize => must have USER role
  //    - Body validation => matches CreateActivityInput schema
  //    - Rate limiting => attached prior to controller call
  router.post(
    '/activities',
    routeRateLimit,
    authenticate,
    authorize([USER_ROLES.USER]),
    validateBody(createActivitySchema),
    (req, res, next) => {
      /*
       * We call the appropriate controller method, passing the Express
       * arguments in typical Node style. The controller handles all logic
       * and returns a JSON response or throws an error.
       */
      return activityController.createActivity(req, res, next);
    }
  );

  // 3) GET /activities/history
  //    - Auth: authenticate => user token
  //    - Role: authorize => must have USER role
  //    - Query validation => ensures 'page' and 'limit' if present are correct
  //    - Rate limiting => attached prior to controller call
  router.get(
    '/activities/history',
    routeRateLimit,
    authenticate,
    authorize([USER_ROLES.USER]),
    validateQuery(activityHistoryQuerySchema),
    (req, res, next) => {
      return activityController.getActivityHistory(req, res, next);
    }
  );

  // 4) GET /activities/metrics
  //    - Auth: authenticate => user token
  //    - Role: manager-level => authorized for analytics
  //    - Query validation => ensures input is sanitized
  //    - Rate limiting => attached prior to controller call
  router.get(
    '/activities/metrics',
    routeRateLimit,
    authenticate,
    authorize([USER_ROLES.MANAGER]),
    validateQuery(activityMetricsQuerySchema),
    (req, res, next) => {
      return activityController.getActivityMetrics(req, res, next);
    }
  );

  // 5) Attach final error handling middleware to standardize error responses
  router.use(activityRoutesErrorHandler);

  /**
   * Return the fully configured router instance for consumption
   * in the parent Express application.
   */
  return router;
}