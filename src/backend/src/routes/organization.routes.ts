import { Router } from 'express'; // express@^4.18.2
import rateLimit from 'express-rate-limit'; // express-rate-limit@^7.1.0
import helmet from 'helmet'; // helmet@^7.1.0
import { AuditLogger } from '@company/audit-logger'; // @company/audit-logger@^1.0.0

/**
 * Internal Imports
 * ----------------------------------------------------------------------------
 * The OrganizationController class provides the following methods:
 *  - createOrganization
 *  - updateOrganization
 *  - deleteOrganization
 *  - getOrganization
 *  - getOrganizationByDomain
 * All of these are used to manage multi-tenant organization data securely.
 */
import {
  OrganizationController,
  // The following methods exist inside OrganizationController:
  // createOrganization,
  // updateOrganization,
  // deleteOrganization,
  // getOrganization,
  // getOrganizationByDomain
} from '../controllers/organization.controller';

/**
 * Additional role-based security, authentication, and validation imports.
 * These are placeholders representing advanced middleware usage, including:
 *  - authenticate        -> Validates user credentials and session
 *  - authorize           -> Checks user roles and permissions
 *  - validateBody        -> Schema validation for request bodies
 *  - validateParams      -> Schema validation for route parameters
 *  - createOrganizationSchema  -> Zod or Joi schema for creating organizations
 *  - updateOrganizationSchema  -> Zod or Joi schema for updating organizations
 *  - idSchema, domainSchema    -> Zod or Joi schemas for validating route params
 *  - USER_ROLES               -> Enum of role constants (ADMIN, MANAGER, USER, API)
 */
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { createOrganizationSchema, updateOrganizationSchema } from '../schemas/organization.schema';
import { idSchema, domainSchema } from '../schemas/params.schema';
import { USER_ROLES } from '../../constants/roles';

/**
 * initializeOrganizationRoutes
 * ----------------------------------------------------------------------------
 * Initializes and configures the Express router for organization-related endpoints.
 * This router employs multi-tenant isolation, robust security controls, and role-based
 * access checks to ensure safe, enterprise-grade operations on organization data.
 *
 * Implementation Steps:
 *  1. Create a new Express router instance.
 *  2. Apply security hardening with Helmet for HTTP headers.
 *  3. Apply IP-based rate limiting for each route to mitigate abuse.
 *  4. Add authentication to confirm session validity.
 *  5. Add role-based authorization to restrict certain routes to ADMINs.
 *  6. Perform request validation (body or params) to enforce data integrity.
 *  7. Log route access via the audit logger for compliance and monitoring.
 *  8. Attach the respective OrganizationController method as the final route handler.
 *  9. Return the fully configured router to the caller.
 *
 * @param organizationController : An instance of OrganizationController containing
 *                                 business logic for organization data operations.
 * @param auditLogger            : An AuditLogger instance for recording security
 *                                 and auditing events on route access.
 *
 * @returns Router               : The configured Express router, ready for mounting.
 */
function initializeOrganizationRoutes(
  organizationController: OrganizationController,
  auditLogger: AuditLogger
): Router {
  /**
   * The router instance to which we attach all organization routes.
   * It will enforce multi-tenant rules, security, and advanced monitoring.
   */
  const router = Router();

  /**
   * POST /
   * ----------------------------------------------------------------------------
   * Creates a new organization.
   * Enforces:
   *  - Strict IP-based rate limiting: 5 requests/min
   *  - Helmet for secure HTTP headers
   *  - Authentication
   *  - Role-based access requiring ADMIN
   *  - Request body validation using createOrganizationSchema
   *  - Audit logging for compliance
   * After these checks pass, calls organizationController.createOrganization.
   */
  router.post(
    '/',
    helmet(),
    rateLimit({
      windowMs: 60000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many create-organization requests. Please try again later.',
      },
    }),
    authenticate,
    authorize([USER_ROLES.ADMIN]),
    validateBody(createOrganizationSchema),
    (req, res, next) => auditLogger.logRouteAccess(req, res, next),
    organizationController.createOrganization
  );

  /**
   * PUT /:id
   * ----------------------------------------------------------------------------
   * Updates an existing organization by ID.
   * Enforces:
   *  - Helmet for secure HTTP headers
   *  - IP-based rate limiting: 10 requests/min
   *  - Authentication
   *  - Role-based ADMIN authorization
   *  - Request body validation using updateOrganizationSchema
   *  - Route parameter validation using idSchema
   *  - Audit logging for security and compliance
   */
  router.put(
    '/:id',
    helmet(),
    rateLimit({
      windowMs: 60000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many update-organization attempts. Please slow down.',
      },
    }),
    authenticate,
    authorize([USER_ROLES.ADMIN]),
    validateBody(updateOrganizationSchema),
    validateParams(idSchema),
    (req, res, next) => auditLogger.logRouteAccess(req, res, next),
    organizationController.updateOrganization
  );

  /**
   * DELETE /:id
   * ----------------------------------------------------------------------------
   * Performs a soft delete on an organization by ID.
   * Enforces:
   *  - Helmet for HTTP header security
   *  - Rate limiting to 3 requests/min, given the destructive nature of deletion
   *  - Authentication
   *  - ADMIN role authorization
   *  - Request parameter validation for the :id
   *  - Audit logging for each deletion
   */
  router.delete(
    '/:id',
    helmet(),
    rateLimit({
      windowMs: 60000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many organization deletion requests. Please wait before trying again.',
      },
    }),
    authenticate,
    authorize([USER_ROLES.ADMIN]),
    validateParams(idSchema),
    (req, res, next) => auditLogger.logRouteAccess(req, res, next),
    organizationController.deleteOrganization
  );

  /**
   * GET /:id
   * ----------------------------------------------------------------------------
   * Retrieves an organization by its unique ID.
   * Enforces:
   *  - HTTP header security with Helmet
   *  - IP-based rate limiting: 20 requests/min
   *  - Authentication
   *  - ADMIN role-based check
   *  - Route parameter schema validation using idSchema
   *  - Audit logging for accountability
   */
  router.get(
    '/:id',
    helmet(),
    rateLimit({
      windowMs: 60000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Excessive requests to retrieve organizations. Please calm down.',
      },
    }),
    authenticate,
    authorize([USER_ROLES.ADMIN]),
    validateParams(idSchema),
    (req, res, next) => auditLogger.logRouteAccess(req, res, next),
    organizationController.getOrganization
  );

  /**
   * GET /domain/:domain
   * ----------------------------------------------------------------------------
   * Retrieves an organization by its domain name.
   * Enforces:
   *  - Helmet for standard HTTP security headers
   *  - Rate limit: 20 requests/min
   *  - Authentication
   *  - ADMIN role-based authorization
   *  - Route parameter validation using domainSchema
   *  - Audit logging to track who accessed domain-based lookup
   */
  router.get(
    '/domain/:domain',
    helmet(),
    rateLimit({
      windowMs: 60000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many requests for organization domain lookups. Please slow down.',
      },
    }),
    authenticate,
    authorize([USER_ROLES.ADMIN]),
    validateParams(domainSchema),
    (req, res, next) => auditLogger.logRouteAccess(req, res, next),
    organizationController.getOrganizationByDomain
  );

  /**
   * Return the fully configured router for use in the main application,
   * ensuring multi-tenant isolation, advanced security controls, and
   * enterprise-grade auditing for all organization-related endpoints.
   */
  return router;
}

/**
 * Exporting this function as the default export of this file
 * in accordance with the JSON specification.
 */
export default initializeOrganizationRoutes;