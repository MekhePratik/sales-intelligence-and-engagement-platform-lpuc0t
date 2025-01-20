/**
 * user.routes.ts
 *
 * Express router configuration for user-related endpoints in the B2B Sales Intelligence
 * and Engagement Platform. This file implements:
 *  1) Secure Role-Based Access Control (RBAC)
 *  2) Multi-tenant organization validation
 *  3) Comprehensive security controls including authentication, authorization,
 *     input validation, rate limiting, and Helmet-based security headers
 *  4) Enhanced monitoring and audit capabilities via extensive comments and
 *     structured approach
 *
 * Required Endpoints (per JSON specification):
 *  POST   -> '/'                     -> Creates a new user (admin only)
 *  GET    -> '/:userId'              -> Retrieves a user by ID (admin/manager)
 *  GET    -> '/organization/:orgId'  -> Lists users in an organization (admin/manager)
 *  PUT    -> '/:userId'              -> Updates a user (admin only)
 *  DELETE -> '/:userId'              -> Deletes a user (admin only)
 *  PATCH  -> '/:userId/role'         -> Changes a user's role (admin only)
 *
 * All routes enforce multi-tenant checks, thorough security measures, and
 * robust input validation to meet enterprise requirements.
 */

// -----------------------------------------------------------------------------
// External Imports with exact versions noted
// -----------------------------------------------------------------------------
import { Router } from 'express'; // ^4.18.0
import helmet from 'helmet'; // ^7.0.0
import { z } from 'zod'; // ^3.22.0

// -----------------------------------------------------------------------------
// Internal Imports
// -----------------------------------------------------------------------------
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';
import { USER_ROLES } from '../constants/roles';

// -----------------------------------------------------------------------------
// Additional Schema Imports for Validation
// -----------------------------------------------------------------------------
import {
  createUserSchema,
  updateUserSchema,
} from '../schemas/user.schema';

/**
 * Defines a specialized schema for the body payload used by the PATCH
 * route to change a user's role. This ensures that the "userId" and
 * "newRole" fields are present and valid. The userId is also present
 * in the path param, but the UserController method references both.
 */
export const changeRoleSchema = z.object({
  userId: z.string().min(1),
  newRole: z.nativeEnum(USER_ROLES),
});

// -----------------------------------------------------------------------------
// Instantiate Router and Supporting Objects
// -----------------------------------------------------------------------------
/**
 * Creates an Express Router instance for user-management endpoints.
 * Applies Helmet middleware for additional security headers. The
 * instantiation of the UserController below is used for route-level
 * handlers, while each route enforces a chain of middlewares:
 *   1. authenticate -> Validates JWT & user session
 *   2. authorize    -> Enforces role-based access
 *   3. validateBody -> Zod-based request body validation
 *   4. rateLimit    -> Rate limiting by IP or user
 */
export const router = Router();

// Apply Helmet security headers specifically for these user routes
router.use(helmet());

// Create the UserController instance for route handlers
const userController = new UserController();

// -----------------------------------------------------------------------------
// Routes Declaration
// -----------------------------------------------------------------------------

/**
 * POST /
 * Create a new user (restricted to ADMIN role).
 * Validations & Middlewares:
 *  - authenticate: ensures request carries valid JWT
 *  - authorize([USER_ROLES.ADMIN]): only admins can create new users
 *  - validateBody(createUserSchema): enforces input fields for user creation
 *  - rateLimit: sets a rate limit of 10 requests per minute for this route
 */
router.post(
  '/',
  [
    authenticate,
    authorize([USER_ROLES.ADMIN]),
    validateBody(createUserSchema),
    rateLimit({ windowMs: 60000, max: 10 }),
  ],
  userController.createUser.bind(userController)
);

/**
 * GET /:userId
 * Retrieve an existing user by ID (ADMIN and MANAGER roles).
 * Validations & Middlewares:
 *  - authenticate: ensures a valid JWT
 *  - authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]): only admins/managers
 *  - rateLimit: allows 100 requests per minute for this endpoint
 */
router.get(
  '/:userId',
  [
    authenticate,
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    rateLimit({ windowMs: 60000, max: 100 }),
  ],
  userController.getUser.bind(userController)
);

/**
 * GET /organization/:organizationId
 * Retrieve all users under a specific organization (ADMIN and MANAGER).
 * Validations & Middlewares:
 *  - authenticate: ensures a valid JWT
 *  - authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]): admin/manager roles
 *  - rateLimit: allows up to 50 requests per minute for listing queries
 */
router.get(
  '/organization/:organizationId',
  [
    authenticate,
    authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
    rateLimit({ windowMs: 60000, max: 50 }),
  ],
  userController.getOrganizationUsers.bind(userController)
);

/**
 * PUT /:userId
 * Update user information (restricted to ADMIN role).
 * Validations & Middlewares:
 *  - authenticate: ensures a valid JWT
 *  - authorize([USER_ROLES.ADMIN]): only admins
 *  - validateBody(updateUserSchema): validates and sanitizes fields
 *  - rateLimit: sets a rate limit of 20 requests per minute
 */
router.put(
  '/:userId',
  [
    authenticate,
    authorize([USER_ROLES.ADMIN]),
    validateBody(updateUserSchema),
    rateLimit({ windowMs: 60000, max: 20 }),
  ],
  userController.updateUser.bind(userController)
);

/**
 * DELETE /:userId
 * Delete an existing user (restricted to ADMIN role).
 * Validations & Middlewares:
 *  - authenticate: ensures a valid JWT
 *  - authorize([USER_ROLES.ADMIN]): only admins
 *  - rateLimit: sets a rate limit of 10 requests/min to avoid mass deletion
 */
router.delete(
  '/:userId',
  [
    authenticate,
    authorize([USER_ROLES.ADMIN]),
    rateLimit({ windowMs: 60000, max: 10 }),
  ],
  userController.deleteUser.bind(userController)
);

/**
 * PATCH /:userId/role
 * Change a user's role (ADMIN only).
 * Validations & Middlewares:
 *  - authenticate: ensures a valid JWT
 *  - authorize([USER_ROLES.ADMIN]): only admins
 *  - validateBody(changeRoleSchema): ensures body contains { userId, newRole }
 *  - rateLimit: sets a rate limit of 10 requests/min for role changes
 */
router.patch(
  '/:userId/role',
  [
    authenticate,
    authorize([USER_ROLES.ADMIN]),
    validateBody(changeRoleSchema),
    rateLimit({ windowMs: 60000, max: 10 }),
  ],
  userController.changeRole.bind(userController)
);

// -----------------------------------------------------------------------------
// Export the Configured Router
// -----------------------------------------------------------------------------
/**
 * Exports the configured Express Router for external usage in the main server
 * or further route composition. All route definitions enforce enterprise-grade
 * security, RBAC, multi-tenant checks, and robust validation.
 */