import { Router } from 'express'; // express@^4.18.0
import monitor from 'express-monitor'; // express-monitor@^1.0.0

/**
 * Importing the named functions from our internal modules as specified in the JSON specification.
 * These controllers and middlewares collectively implement the multi-layered security, rate limiting,
 * validation, and A/B testing capabilities required for sequence route management in the platform.
 */
import {
  createSequence,
  getSequence,
  updateSequence,
  startSequence,
  pauseSequence,
  createABTest,
  getABTestResults,
} from '../controllers/sequence.controller'; // src/backend/src/controllers/sequence.controller.ts

import { authenticate, authorize } from '../middleware/auth.middleware'; // JWT auth & RBAC
import { validateBody } from '../middleware/validation.middleware'; // Enhanced request body validation
import { rateLimitMiddleware as rateLimit } from '../middleware/rate-limit.middleware'; // Sliding window rate limiting
import { sequenceSchema } from '../schemas/sequence.schema'; // Enhanced validation schema including A/B testing logic
import { USER_ROLES } from '../constants/roles'; // Role definitions (ADMIN, MANAGER, etc.)

/**
 * configureSequenceRoutes
 * -------------------------------------------------------------------------------
 * This function produces an Express Router instance for managing all email
 * sequence endpoints in the B2B sales intelligence platform. It integrates:
 *  - Security controls (JWT authentication, role-based authorization)
 *  - Rate limiting per user/IP with a sliding window
 *  - Schema validation for request bodies (Zod-based)
 *  - Performance & APM monitoring
 *  - A/B testing routes for advanced email campaign optimization
 *
 * According to the JSON specification steps:
 *
 * 1) Create new Express router instance with security options.
 * 2) Apply global authentication middleware for protected routes.
 * 3) Configure rate limiting per route type to throttle requests.
 * 4) Set up the POST /sequences endpoint with body validation (sequenceSchema)
 *    and monitoring for template management & creation of sequences.
 * 5) Configure GET /sequences/:id route with optional caching decisions (placeholder).
 * 6) Implement PUT /sequences/:id route for updates using optimistic locking logic (placeholder).
 * 7) Provide POST /sequences/:id/start route with circuit breaker logic (handled in the controller).
 * 8) Provide POST /sequences/:id/pause route with additional safety checks (in the controller).
 * 9) Configure POST /sequences/:id/ab-test route for A/B testing creation.
 * 10) Provide GET /sequences/:id/ab-test/results route for real-time or historical test analysis.
 * 11) Apply security headers and CORS configuration as needed (placeholder).
 * 12) Integrate express-monitor for performance/metrics collection.
 * 13) Return the configured router with thorough error handling delegated to Express.
 *
 * @param sequenceController An instance or object containing the methods for
 *        core sequence management (createSequence, updateSequence, etc.).
 * @returns Configured Express router with all sequence-related routes.
 */
export function configureSequenceRoutes(sequenceController: {
  createSequence: typeof createSequence;
  getSequence: typeof getSequence;
  updateSequence: typeof updateSequence;
  startSequence: typeof startSequence;
  pauseSequence: typeof pauseSequence;
  createABTest: typeof createABTest;
  getABTestResults: typeof getABTestResults;
}): Router {
  /**
   * STEP 1: Instantiate a new router for sequence operations.
   * We include any relevant options for advanced security or custom behaviors
   * if needed. By default, this is a standard Express Router.
   */
  const router = Router();

  /**
   * STEP 2: Set up security headers, CORS, or any custom global middlewares.
   * For demonstration, we show a minimal placeholder for security response headers.
   */
  router.use((req, res, next) => {
    // Example security headers:
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // Could also configure CORS here if needed:
    // res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  /**
   * STEP 3: Integrate express-monitor to collect performance metrics,
   * route response times, and general system health checks. This can
   * be extended with further configuration as necessary.
   */
  router.use(monitor());

  /**
   * STEP 4: Apply global authentication. All routes below require the requester
   * to be logged in with a valid JWT. Additional role-based authorizations
   * occur per-route or can be more granular.
   */
  router.use(authenticate);

  // ---------------------------------------------------------------------------
  // POST /sequences
  // ---------------------------------------------------------------------------
  /**
   * Creates a new email sequence. This route is protected by:
   *  - rateLimit to prevent abuse
   *  - authorize to ensure only MANAGER or ADMIN role can create
   *  - validateBody using sequenceSchema for robust input checks
   */
  router.post(
    '/sequences',
    rateLimit(), // Per-route rate limiter
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    validateBody(sequenceSchema),
    (req, res, next) => {
      /**
       * The sequenceController.createSequence method is invoked here to handle the logic.
       * Additional error handling is delegated to next(err), consistent with Express.
       */
      return sequenceController.createSequence(req, res, next);
    }
  );

  // ---------------------------------------------------------------------------
  // GET /sequences/:id
  // ---------------------------------------------------------------------------
  /**
   * Retrieves a specific email sequence by ID. We also protect this route using
   * rate limit, role-based authorization, etc. A placeholder mention for caching
   * can be integrated by an in-memory or Redis-based approach within the controller.
   */
  router.get(
    '/sequences/:id',
    rateLimit(),
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    (req, res, next) => {
      // The sequenceController.getSequence processes the request/response
      // logic including potential read-level caching.
      return sequenceController.getSequence(req, res, next);
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /sequences/:id
  // ---------------------------------------------------------------------------
  /**
   * Updates an existing email sequence. Could incorporate an optimistic locking
   * mechanism if a version or ETag is tracked. The route again is rate-limited,
   * restricted to manager/admin, with the request body validated by sequenceSchema.
   */
  router.put(
    '/sequences/:id',
    rateLimit(),
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    validateBody(sequenceSchema),
    (req, res, next) => {
      // The sequenceController.updateSequence handles applying any changes
      // ensuring no conflicting modifications. Could incorporate ETag or
      // concurrency checks if desired.
      return sequenceController.updateSequence(req, res, next);
    }
  );

  // ---------------------------------------------------------------------------
  // POST /sequences/:id/start
  // ---------------------------------------------------------------------------
  /**
   * Transitions a draft or paused sequence to an active (started) state.
   * The underlying logic may include circuit breaker usage within the controller.
   */
  router.post(
    '/sequences/:id/start',
    rateLimit(),
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    (req, res, next) => {
      return sequenceController.startSequence(req, res, next);
    }
  );

  // ---------------------------------------------------------------------------
  // POST /sequences/:id/pause
  // ---------------------------------------------------------------------------
  /**
   * Pauses an active sequence, applying safety checks within the controller
   * to ensure partial steps are handled gracefully.
   */
  router.post(
    '/sequences/:id/pause',
    rateLimit(),
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    (req, res, next) => {
      return sequenceController.pauseSequence(req, res, next);
    }
  );

  // ---------------------------------------------------------------------------
  // POST /sequences/:id/ab-test
  // ---------------------------------------------------------------------------
  /**
   * Creates or configures an A/B test for a particular sequence. The request
   * body may contain variant details, distribution weights, or other advanced
   * test parameters. The logic for building the test is encapsulated in the
   * createABTest method.
   */
  router.post(
    '/sequences/:id/ab-test',
    rateLimit(),
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    (req, res, next) => {
      return sequenceController.createABTest(req, res, next);
    }
  );

  // ---------------------------------------------------------------------------
  // GET /sequences/:id/ab-test/results
  // ---------------------------------------------------------------------------
  /**
   * Retrieves real-time or aggregated results of a previously configured A/B test
   * for a specific sequence. The controller method might query relevant metrics
   * (open rates, click rates, conversions) to help the client decide the winning variant.
   */
  router.get(
    '/sequences/:id/ab-test/results',
    rateLimit(),
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    (req, res, next) => {
      return sequenceController.getABTestResults(req, res, next);
    }
  );

  // ---------------------------------------------------------------------------
  // Final Step: Return the configured router
  // ---------------------------------------------------------------------------
  return router;
}

/**
 * Default Export:
 * Provides a single default export following the JSON specification that
 * returns an Express Router with all sequence-related endpoints.
 */
export default configureSequenceRoutes;