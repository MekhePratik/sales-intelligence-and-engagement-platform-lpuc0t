import { Router } from 'express'; // express@^4.18.0
import compression from 'compression'; // compression@^1.7.4
import helmet from 'helmet'; // helmet@^6.0.0
import cors from 'cors'; // cors@^2.8.5
import timeout from 'connect-timeout'; // connect-timeout@^1.9.0
import { z } from 'zod'; // zod@^3.22.0

/**
 * Internal Imports
 * -----------------------------------------------------------------------------
 * Controllers, middleware, and constants specifically required for analytics
 * endpoints providing campaign performance, lead metrics, and ROI report data
 * with robust security, caching, and rate limiting.
 */
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { USER_ROLES } from '../constants/roles';

/**
 * Minimal Zod schemas for validating query parameters in analytics routes.
 * Adjust or expand these to suit real API data requirements.
 */
const campaignQuerySchema = z.object({ /* Placeholder for campaign analytics query */ });
const leadQuerySchema = z.object({ /* Placeholder for lead metrics query */ });
const roiQuerySchema = z.object({ /* Placeholder for ROI report query */ });

/**
 * configureAnalyticsRoutes
 * -----------------------------------------------------------------------------
 * Function that configures an Express router for analytics-related endpoints,
 * fulfilling the following:
 *  - Enhanced security with HTTP headers, CORS, and timeout handling.
 *  - Route-specific rate limits for campaigns, leads, and ROI requests.
 *  - JWT-based authentication and role-based authorization (ADMIN/MANAGER).
 *  - Query validation using Zod schemas for data integrity.
 *  - Circuit breaker and audit logging stubs for demonstration.
 *  - Caching is enforced by decorators or logic in the AnalyticsController.
 *  - Returns a configured router instance.
 *
 * @param controller {AnalyticsController} - Instance handling analytics requests.
 * @returns {Router} - Fully configured router with routes for campaigns, leads, and ROI.
 */
export function configureAnalyticsRoutes(controller: AnalyticsController): Router {
  /**
   * Create a new Express router instance with strict routing enabled,
   * ensuring route paths are matched exactly.
   */
  const router = Router({ strict: true });

  /**
   * Apply various global middlewares for:
   *  - Response compression optimization.
   *  - A default request timeout of 30 seconds to avoid hanging requests.
   *  - Secure HTTP headers with helmet.
   *  - CORS for cross-origin resource considerations.
   */
  router.use(compression());
  router.use(timeout('30s'));
  router.use(helmet());
  router.use(cors());

  /**
   * Placeholder for circuit breaker integration or advanced external
   * service call interception. In production, integrate real logic
   * (e.g., opossum or an upstream library).
   */
  router.use((req, _res, next) => {
    // Stub: Setup circuit breaker or track external service calls if necessary.
    next();
  });

  /**
   * Placeholder for audit logging of sensitive operations. In production,
   * integrate a logger to capture route usage, user ID, IP, and more.
   */
  router.use((req, _res, next) => {
    // Example: console.log(`[Audit Log] ${req.method} ${req.originalUrl} by user/IP`);
    next();
  });

  /**
   * Apply JWT authentication to all analytics routes. Only authenticated
   * users can access subsequent analytics endpoints.
   */
  router.use(authenticate);

  /**
   * Route: GET /analytics/campaigns
   * Description:
   *  - Retrieves campaign analytics from the AnalyticsController.
   *  - Uses a rate limit of 100 requests/minute per user or IP.
   *  - Allows only ADMIN and MANAGER roles to access this endpoint.
   *  - Validates query parameters with a minimal Zod schema (placeholder).
   */
  router.get(
    '/campaigns',
    rateLimitMiddleware({ limit: 100, window: 60 }),
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    validateQuery(campaignQuerySchema),
    (req, res, next) => {
      controller
        .getCampaignAnalytics(req, res)
        .catch(next);
    }
  );

  /**
   * Route: GET /analytics/leads
   * Description:
   *  - Retrieves lead metrics from the AnalyticsController.
   *  - Enforces a rate limit of 50 requests/minute per user or IP.
   *  - Access restricted to ADMIN and MANAGER roles.
   *  - Validate query parameters using a placeholder Zod schema.
   */
  router.get(
    '/leads',
    rateLimitMiddleware({ limit: 50, window: 60 }),
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    validateQuery(leadQuerySchema),
    (req, res, next) => {
      controller
        .getLeadMetrics(req, res)
        .catch(next);
    }
  );

  /**
   * Route: GET /analytics/roi
   * Description:
   *  - Produces ROI calculation reports from the AnalyticsController.
   *  - Limits usage to 20 requests/hour per user or IP.
   *  - Allows only ADMIN role to access ROI analytics.
   *  - Validates query parameters via a minimal Zod schema.
   */
  router.get(
    '/roi',
    rateLimitMiddleware({ limit: 20, window: 3600 }),
    authorize([USER_ROLES.ADMIN]),
    validateQuery(roiQuerySchema),
    (req, res, next) => {
      controller
        .getROIReport(req, res)
        .catch(next);
    }
  );

  /**
   * Return the fully configured router for analytics endpoints.
   */
  return router;
}

/**
 * Instantiate a default AnalyticsController. In production, pass
 * actual dependencies (e.g., AnalyticsService) as needed. This
 * example uses a simple placeholder approach.
 */
const defaultAnalyticsController = new AnalyticsController(
  // In real usage, provide a valid AnalyticsService instance.
  // Example: new AnalyticsService(new MetricsService({}), new CacheService(), {})
  // For demonstration, we pass nothing or mock arguments if needed.
  // @ts-ignore - ignoring constructor param for demonstration stubs
);

/**
 * analyticsRouter
 * -----------------------------------------------------------------------------
 * Pre-configured instance of the analytics router with default controller.
 * Exported for application-wide usage, featuring security, rate limiting,
 * caching, validation, and performance optimizations for analytics routes.
 */
export const analyticsRouter: Router = configureAnalyticsRoutes(defaultAnalyticsController);