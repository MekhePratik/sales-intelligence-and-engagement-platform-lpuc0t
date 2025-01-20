/**
 * Lead Routes Configuration
 * --------------------------------------------------------------------------
 * This file provides an Express router setup for lead management endpoints
 * within the B2B Sales Intelligence Platform. It addresses enterprise-level
 * requirements such as AI-driven lead management, comprehensive security
 * (authentication, authorization, and org-based rate limiting), as well as
 * performance monitoring and custom error handling.
 *
 * Steps Implemented:
 *  1) Create a strict Express router instance.
 *  2) Apply CORS configuration for allowed origins.
 *  3) Configure structured logging middleware with winston.
 *  4) Set up organization-based rate limiting using rate-limiter-flexible.
 *  5) Enforce authentication on routes requiring secure access.
 *  6) Implement role-based authorization for lead operations.
 *  7) Configure performance monitoring middleware (placeholder).
 *  8) Add error handling middleware for operational and security events.
 *  9) Initialize lead endpoints with schema validation and caching references.
 * 10) Apply response sanitization (placeholder).
 * 11) Provide a health check endpoint at /leads/health.
 *
 * Export:
 *  - Default function "initializeLeadRoutes" that takes a LeadController and
 *    returns a configured Express Router.
 */

// ----------------------------------------------------------------------------
// External Imports with Versions
// ----------------------------------------------------------------------------
import { Router, Request, Response, NextFunction } from 'express'; // ^4.18.0
import cors from 'cors'; // ^2.8.5
import winston from 'winston'; // ^3.8.0
import { RateLimiterMemory } from 'rate-limiter-flexible'; // ^2.4.1

// ----------------------------------------------------------------------------
// Internal Imports - LeadController
// ----------------------------------------------------------------------------
import { LeadController } from '../controllers/lead.controller';

// ----------------------------------------------------------------------------
// Placeholder Types for Zod-Schema Validation Middlewares
// (In a real system, import actual schemas from ../schemas/lead.schema)
// ----------------------------------------------------------------------------
type LeadCreationSchema = any; // Replace with real createLeadSchema type
type LeadUpdateSchema = any;   // Replace with real updateLeadSchema type

// ----------------------------------------------------------------------------
// Placeholder: authentication middleware
// ----------------------------------------------------------------------------
function authenticate(req: Request, res: Response, next: NextFunction): void {
  // In a real environment:
  // 1) Verify token/session (e.g., from headers or cookies).
  // 2) Populate req.user with identity claims if valid.
  // 3) On failure, send 401 or 403.
  next();
}

// ----------------------------------------------------------------------------
// Placeholder: role-based authorization middleware
// ----------------------------------------------------------------------------
function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // In a real environment:
    // 1) Check req.user.role for membership in allowedRoles.
    // 2) If not authorized, reject with 403.
    next();
  };
}

// ----------------------------------------------------------------------------
// Placeholder: rate limiting middleware referencing org-based usage
// ----------------------------------------------------------------------------
const orgRateLimiter = new RateLimiterMemory({
  points: 10,   // 10 requests
  duration: 60, // per 60 seconds
});

async function rateLimitForOrg(req: Request, res: Response, next: NextFunction) {
  try {
    // Example: Use x-org-id header to separate usage per organization
    const organizationId = (req.headers['x-org-id'] as string) || 'unknown-org';
    await orgRateLimiter.consume(organizationId);
    next();
  } catch (rejRes) {
    res.status(429).json({
      success: false,
      message: 'Too Many Requests (org-based rate limiting)',
    });
  }
}

// ----------------------------------------------------------------------------
// Placeholder: validateBody middleware
// ----------------------------------------------------------------------------
function validateBody(schema: LeadCreationSchema | LeadUpdateSchema) {
  // In a real system, use schema.parse(req.body) with zod or similar
  return (req: Request, res: Response, next: NextFunction): void => {
    // For demonstration, we assume validation is successful
    // On failure, respond with 400 or an appropriate code
    next();
  };
}

// ----------------------------------------------------------------------------
// Health check handler
// ----------------------------------------------------------------------------
function healthCheck(req: Request, res: Response): void {
  res.status(200).json({ success: true, message: 'Lead management service is healthy.' });
}

// ----------------------------------------------------------------------------
// Logging (Winston) Initialization
// ----------------------------------------------------------------------------
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
  ],
  format: winston.format.json(),
});

/**
 * requestLogger
 * -------------
 * Logs incoming requests (method, url, and timestamp).
 */
function requestLogger(req: Request, res: Response, next: NextFunction): void {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });
  next();
}

// ----------------------------------------------------------------------------
// Placeholder: performance monitoring middleware
// ----------------------------------------------------------------------------
function performanceMonitoring(req: Request, res: Response, next: NextFunction): void {
  // 1) Capture start time
  const start = process.hrtime();
  // 2) After response, measure elapsed time
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const elapsedMs = diff[0] * 1e3 + diff[1] / 1e6;
    logger.info('Performance Monitoring', {
      path: req.path,
      method: req.method,
      elapsedMs,
    });
  });
  next();
}

// ----------------------------------------------------------------------------
// Placeholder: response sanitization middleware
// (In a real system, remove or mask sensitive fields in res.body if needed.)
// ----------------------------------------------------------------------------
function sanitizeResponse(req: Request, res: Response, next: NextFunction): void {
  // Example placeholder logic
  next();
}

// ----------------------------------------------------------------------------
// Placeholder: errorHandling middleware
// (This should be the last piece of middleware in typical Express setups.)
// ----------------------------------------------------------------------------
function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  logger.error('Global error handler caught an error', {
    message: err?.message,
    stack: err?.stack,
  });
  res.status(err?.statusCode || 500).json({
    success: false,
    message: err?.message || 'Internal Server Error',
  });
}

// ----------------------------------------------------------------------------
// initializeLeadRoutes Function
// ----------------------------------------------------------------------------
/**
 * initializeLeadRoutes
 * --------------------
 * Configures and returns an Express router with the lead management endpoints,
 * applying enhanced security (authentication, authorization, rate limiting),
 * comprehensive monitoring (logging, performance metrics), and error handling.
 *
 * @param leadController - Instance of LeadController containing core logic
 * @returns Configured Express router for lead-related operations
 */
export function initializeLeadRoutes(leadController: LeadController): Router {
  // Step 1: Create new Express router instance with strict routing
  const router = Router({ caseSensitive: true, strict: true });

  // Step 2: Apply CORS configuration with allowed origins (example: all)
  router.use(cors({ origin: '*' }));

  // Step 3: Configure request logging middleware
  router.use(requestLogger);

  // Step 4: Apply performance monitoring at router level
  router.use(performanceMonitoring);

  // Step 5: [Global error handling for repeated logic can also be placed here if needed]

  // Step 6: Initialize route handlers with the specified middlewares & definitions

  // POST /leads => create new lead
  router.post(
    '/leads',
    [
      authenticate,
      authorize(['ADMIN', 'MANAGER', 'USER']),
      rateLimitForOrg,
      validateBody({}), // placeholder: replace {} with createLeadSchema
    ],
    (req: Request, res: Response, next: NextFunction) => {
      leadController.createLead(req, res).catch(next);
    }
  );

  // PUT /leads/:id => update existing lead
  router.put(
    '/leads/:id',
    [
      authenticate,
      authorize(['ADMIN', 'MANAGER', 'USER']),
      rateLimitForOrg,
      validateBody({}), // placeholder: replace {} with updateLeadSchema
    ],
    (req: Request, res: Response, next: NextFunction) => {
      leadController.updateLead(req, res).catch(next);
    }
  );

  // GET /leads/:id => retrieve lead by ID
  router.get(
    '/leads/:id',
    [
      authenticate,
      authorize(['ADMIN', 'MANAGER', 'USER']),
      rateLimitForOrg,
    ],
    (req: Request, res: Response, next: NextFunction) => {
      leadController.getLead(req, res).catch(next);
    }
  );

  // POST /leads/:id/enrich => AI-based enrichment
  router.post(
    '/leads/:id/enrich',
    [
      authenticate,
      authorize(['ADMIN', 'MANAGER']),
      rateLimitForOrg,
    ],
    (req: Request, res: Response, next: NextFunction) => {
      leadController.enrichLead(req, res).catch(next);
    }
  );

  // POST /leads/:id/score => recalculate lead score
  router.post(
    '/leads/:id/score',
    [
      authenticate,
      authorize(['ADMIN', 'MANAGER']),
      rateLimitForOrg,
    ],
    (req: Request, res: Response, next: NextFunction) => {
      leadController.recalculateScore(req, res).catch(next);
    }
  );

  // Step 7: Health check endpoint for lead management
  router.get('/leads/health', healthCheck);

  // Step 8: Apply response sanitization after routes (placeholder)
  router.use(sanitizeResponse);

  // Step 9: Configure error handling middleware
  router.use(errorHandler);

  // Step 10: Return configured router
  return router;
}

// ----------------------------------------------------------------------------
// Default Export
// ----------------------------------------------------------------------------
/**
 * By default, exports the function for router initialization, enabling usage
 * such as:
 *    import initLeadRoutes from './lead.routes';
 *    ...
 *    app.use('/api', initLeadRoutes(new LeadController(...)));
 */
export default initializeLeadRoutes;