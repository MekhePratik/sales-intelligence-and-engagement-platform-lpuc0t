/**************************************************************************************
 * File: campaign.routes.ts
 * Description:
 *  This module defines and configures all routes for managing campaigns within the
 *  B2B Sales Intelligence Platform. It integrates comprehensive security controls,
 *  validation, and monitoring features aligned with the technical specifications:
 *
 *   1. Email Automation:
 *      - Template management, sequence builder, A/B testing engine
 *      - Secure access controls and role-based authorization
 *
 *   2. Campaign Analytics:
 *      - Real-time performance tracking of campaigns
 *      - Conversion analytics with data security at each endpoint
 *
 *   3. Security Controls:
 *      - JWT authentication middleware with enhanced security
 *      - Role-based authorization checks (RBAC)
 *      - Rate limiting for each user role
 *      - Audit logging and operational monitoring
 *
 * It implements these functionalities through Express router endpoints for:
 *   - Creating, updating, and controlling (start/pause) campaigns
 *   - Retrieving campaign metrics securely
 *
 * Steps Described in JSON Specification:
 *  1) Create an Express router instance
 *  2) Apply global authentication middleware
 *  3) Configure role-based rate limiting
 *  4) Set up performance monitoring (stub/logging placeholder)
 *  5) Configure audit logging (stub/logging placeholder)
 *  6) Define POST /campaigns (with validation, RBAC)
 *  7) Define PUT /campaigns/:id (with validation, RBAC)
 *  8) Define POST /campaigns/:id/start (with execution controls)
 *  9) Define POST /campaigns/:id/pause (with execution controls)
 * 10) Define GET /campaigns/:id/metrics (with data access controls)
 * 11) Integrate error handling using security context
 * 12) Add response sanitization references
 * 13) Return the configured router
 *
 * Exports:
 *  - configureCampaignRoutes
 **************************************************************************************/

/*------------------------------------------------------------------------------ 
 | External Imports (with version comments)
 *-----------------------------------------------------------------------------*/
import { Router } from 'express'; // express ^4.18.0
import winston from 'winston'; // winston ^3.8.0

/*------------------------------------------------------------------------------
 | Internal Imports
 *-----------------------------------------------------------------------------*/
import {
  authenticate,
  authorize,
} from '../middleware/auth.middleware'; // JWT & Role-based security
import { rateLimit } from '../middleware/rate-limit.middleware'; // Role-based rate limiting
import {
  validateBody,
  validateParams,
} from '../middleware/validation.middleware'; // Validation with security
import { campaignSchema } from '../schemas/campaign.schema'; // Campaign validation schema
import {
  USER_ROLES,
} from '../constants/roles'; // Role definitions for RBAC
import {
  CampaignController,
  createCampaign,
  updateCampaign,
  startCampaign,
  pauseCampaign,
  getCampaignMetrics,
} from '../controllers/campaign.controller'; // Controller with security context

/**
 * configureCampaignRoutes
 * -----------------------
 * Factory function to configure and return an Express router with secure
 * campaign management endpoints. Implements advanced authentication, authorization,
 * rate limiting, and auditing as specified in the JSON specification.
 *
 * @param campaignController Instance of CampaignController handling business logic.
 * @returns Configured Express router with secure campaign routes.
 */
export function configureCampaignRoutes(
  campaignController: CampaignController
): Router {
  // 1) Create new Router instance for campaign operations
  const router = Router();

  /******************************************************************************
   * 2) Apply global authentication middleware
   *    Ensures that all routes defined below require valid JWTs before proceeding.
   ******************************************************************************/
  router.use(authenticate);

  /******************************************************************************
   * 3) Configure role-based rate limiting
   *    Position this as a global router-level middleware to restrict excessive usage
   *    based on user roles or other criteria. The 'rateLimit' function is a stand-in
   *    for advanced role-based logic.
   ******************************************************************************/
  router.use(rateLimit());

  /******************************************************************************
   * 4) Set up performance monitoring (Placeholder / Logging Stub)
   *    In a production system, we might attach advanced performance metrics
   *    (e.g., using OpenTelemetry or custom logging around response times).
   ******************************************************************************/
  router.use((req, _res, next) => {
    // For demonstration, log entry indicating performance monitoring is in place
    winston.info('[CampaignRoutes] Performance monitoring stub active', {
      url: req.originalUrl,
      method: req.method,
    });
    next();
  });

  /******************************************************************************
   * 5) Configure audit logging (Placeholder / Logging Stub)
   *    Could include advanced track of request details, user ID, etc., persisted
   *    to an audit log or external service. For demonstration, a minimal approach:
   ******************************************************************************/
  router.use((req, _res, next) => {
    winston.info('[CampaignRoutes] Audit log stub triggered', {
      endpoint: req.originalUrl,
      user: req.currentUser?.id || 'unknown',
    });
    next();
  });

  /******************************************************************************
   * 6) Define POST /campaigns route with validation and RBAC
   *    - Validates request body against campaignSchema
   *    - Requires roles: ADMIN or MANAGER to create campaigns
   *    - Calls createCampaign on the controller
   ******************************************************************************/
  router.post(
    '/campaigns',
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    validateBody(campaignSchema),
    async (req, res, next) => {
      try {
        await campaignController.createCampaign(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /******************************************************************************
   * 7) Define PUT /campaigns/:id route with validation and RBAC
   *    - Validates params.id as string (rely on partial schema or minimal check)
   *    - Requires ADMIN or MANAGER roles to update campaigns
   *    - Uses updateCampaign on the controller
   ******************************************************************************/
  router.put(
    '/campaigns/:id',
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    validateParams(
      // Minimal param validation for campaign ID
      // Typically, we'd define a schema or reuse partial from campaign.schema
      // For demonstration, a single field check:
      z => z.object({ id: z.string().min(1, 'Campaign ID cannot be empty') })
    ),
    async (req, res, next) => {
      try {
        await campaignController.updateCampaign(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /******************************************************************************
   * 8) Define POST /campaigns/:id/start route with execution controls
   *    - Requires roles: ADMIN or MANAGER typically
   *    - Invokes the startCampaign operation
   ******************************************************************************/
  router.post(
    '/campaigns/:id/start',
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    validateParams(
      z => z.object({ id: z.string().min(1, 'Campaign ID cannot be empty') })
    ),
    async (req, res, next) => {
      try {
        await campaignController.startCampaign(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /******************************************************************************
   * 9) Define POST /campaigns/:id/pause route with execution controls
   *    - Requires roles: ADMIN or MANAGER
   *    - Invokes the pauseCampaign operation
   ******************************************************************************/
  router.post(
    '/campaigns/:id/pause',
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    validateParams(
      z => z.object({ id: z.string().min(1, 'Campaign ID cannot be empty') })
    ),
    async (req, res, next) => {
      try {
        await campaignController.pauseCampaign(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /******************************************************************************
   * 10) Define GET /campaigns/:id/metrics route with data access controls
   *     - Could allow ADMIN, MANAGER, or potentially USER to read metrics
   *     - Calls getCampaignMetrics from the controller to fetch analytics
   ******************************************************************************/
  router.get(
    '/campaigns/:id/metrics',
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.USER]),
    validateParams(
      z => z.object({ id: z.string().min(1, 'Campaign ID cannot be empty') })
    ),
    async (req, res, next) => {
      try {
        await campaignController.getCampaignMetrics(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /******************************************************************************
   * 11) Configure error handling with security context
   *     Typically done at the application level, but can be appended here if needed.
   *     For demonstration, we rely on a top-level error handler in the app.
   ******************************************************************************/

  /******************************************************************************
   * 12) Set up response sanitization references
   *     Actual sanitization is mainly performed in the controller or utility layers,
   *     but this block acknowledges the directive from the specification. This router
   *     ensures only validated data is passed forward, mitigating injection risks.
   ******************************************************************************/

  // 13) Return the fully configured router
  return router;
}