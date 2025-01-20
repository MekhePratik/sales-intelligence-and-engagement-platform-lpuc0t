/***********************************************************************************************
 * File: auth.routes.ts
 * Description:
 *   Enterprise-grade Express router for authentication endpoints in the B2B Sales Intelligence
 *   platform. Implements security and validation requirements such as:
 *     - Rate limiting
 *     - Request body validation (Zod)
 *     - JSON Web Token authentication and session management
 *     - MFA (multi-factor authentication) validation
 *     - Role-based access control scaffolding with future expandability
 *     - Helmet-based security headers for HTTP hardening
 *
 * Technical Requirements Satisfied:
 *   1) Authentication Methods:
 *      - Uses JWT-based and optional MFA flows from AuthController methods.
 *   2) Role-Based Access Control:
 *      - Illustrates usage of "authenticate" middleware, which can be extended for more specific
 *        role checks via "authorize" if needed.
 *   3) Security Controls:
 *      - Rate limiting on critical endpoints
 *      - Input validation with Zod
 *      - Enhanced error handling
 *      - Helmet for HTTP security headers
 *
 * Usage:
 *   import { router as authRouter } from './auth.routes';
 *   app.use('/auth', authRouter);
 *
 * Exported Items:
 *   - router: The Express router with configured auth endpoints.
 **********************************************************************************************/

/************************************************************************************************
 * External Imports (with versions per specification)
 **********************************************************************************************/
/**
 * express ^4.18.2
 * Provides Router functionality for defining routes.
 */
import { Router } from 'express';

/**
 * helmet ^7.0.0
 * Adds secure HTTP headers to help protect against well-known vulnerabilities.
 */
import helmet from 'helmet';

/**
 * zod ^3.22.0
 * Provides runtime schema validation for request bodies.
 */
import { z } from 'zod';

/************************************************************************************************
 * Internal Imports
 **********************************************************************************************/
/**
 * The AuthController class from ../controllers/auth.controller
 * Handles login, registration, logout, reset password, token refresh, and MFA validation.
 */
import { AuthController } from '../controllers/auth.controller';

/**
 * The authenticate middleware from ../middleware/auth.middleware
 * Applies JWT validation and user session checks.
 */
import { authenticate } from '../middleware/auth.middleware';

/**
 * validateBody function from ../middleware/validation.middleware
 * Validates request body against a Zod schema.
 */
import { validateBody } from '../middleware/validation.middleware';

/**
 * rateLimit function from ../middleware/rate-limit.middleware
 * Provides route-specific rate limiting with advanced security measures.
 */
import { rateLimit } from '../middleware/rate-limit.middleware';

/************************************************************************************************
 * Instantiate AuthController
 * --------------------------------------------------------------------------------------------
 * In a full application, you might inject dependencies (AuthService, custom rate limiters, etc.)
 * into the AuthController via a dependency injection layer or constructor arguments. For
 * demonstration purposes here, we assume the default construction or minimal injection logic
 * is performed elsewhere. If needed, adjust to pass the relevant dependencies when creating:
 *
 *   const authController = new AuthController(someAuthService, someRateLimiterInstance);
 **********************************************************************************************/

/**
 * We create a single instance of AuthController. The actual construction details may vary
 * depending on how your application wires up services and rate limiters. Shown here as if
 * they were default singletons for demonstration.
 */
const authController = new AuthController(
  /* authService */ undefined as any,
  /* rateLimiter */ undefined as any
);

/************************************************************************************************
 * Zod Schemas
 * --------------------------------------------------------------------------------------------
 * The route definitions in the JSON specification reference schemas for:
 *   - loginSchema
 *   - registerSchema
 *   - resetPasswordSchema
 *   - mfaSchema
 *
 * We define them below for demonstration. In a production codebase, you might organize
 * these in a separate validation file or share them with the controller. The requirement
 * here is to ensure that "validateBody(schema)" can run with the correct schema for each
 * endpoint as specified by the JSON spec.
 **********************************************************************************************/

/**
 * loginSchema
 * Validates credentials for login requests. The specification mentions:
 *   - email (string, email format)
 *   - password (string, min length 8)
 *   - optional organizationId if your system supports multi-organization context
 */
const loginSchema = z.object({
  email: z.string().email({ message: 'A valid email is required.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  organizationId: z.string().optional()
});

/**
 * registerSchema
 * Validates data for new user registration. The specification indicates
 * "enhanced validation and security checks." Adjust as needed:
 *   - email (string, email format)
 *   - password (string, min length 8)
 *   - name (string, optional or min length, etc.)
 */
const registerSchema = z.object({
  email: z.string().email({ message: 'A valid email is required to register.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).optional(),
  organizationId: z.string().optional()
});

/**
 * resetPasswordSchema
 * Validates password reset requests. In the simplest scenario, only an email field is required.
 * More advanced flows might require security questions or user verification tokens.
 */
const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Valid email is required for password reset.' })
});

/**
 * mfaSchema
 * Validates multi-factor authentication challenges:
 *   - userId: identifies which user is completing MFA
 *   - token: the MFA code (TOTP, push notification, or similar)
 */
const mfaSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required to verify MFA.' }),
  token: z.string().min(1, { message: 'MFA token is required for verification.' })
});

/************************************************************************************************
 * Router Definition and Endpoints
 **********************************************************************************************/

/**
 * Create an Express router instance for authentication flows.
 */
const router = Router();

/**
 * Apply Helmet to secure requests with recommended HTTP headers. This helps mitigate
 * common vulnerabilities like XSS, clickjacking, etc.
 */
router.use(helmet());

/**
 * POST /login
 * --------------------------------------------------------------------------------------------
 * Authenticates user credentials with rate limiting and request validation. On success,
 * issues session tokens or indicates if MFA is required.
 *
 * Middlewares (in exact order from the JSON specification):
 *   1) rateLimit({ window: '15m', max: 5 }) - Limits to 5 requests per 15-minute window
 *   2) validateBody(loginSchema) - Checks that email/password are valid
 *   3) authController.login - Proceeds with the actual login logic
 */
router.post(
  '/login',
  rateLimit({ window: '15m', max: 5 }),
  validateBody(loginSchema),
  authController.login
);

/**
 * POST /register
 * --------------------------------------------------------------------------------------------
 * Creates a new user account with enhanced validation and security checks. This route
 * also enforces rate limiting with a smaller threshold over a longer window to mitigate
 * account creation abuse.
 *
 * Middlewares:
 *   1) rateLimit({ window: '1h', max: 3 }) - 3 attempts per hour
 *   2) validateBody(registerSchema) - Validates registration data
 *   3) authController.register - Handles user creation flows
 */
router.post(
  '/register',
  rateLimit({ window: '1h', max: 3 }),
  validateBody(registerSchema),
  authController.register
);

/**
 * POST /logout
 * --------------------------------------------------------------------------------------------
 * Invalidates the current user session. Requires user to be authenticated. The specification
 * simply mentions 'authenticate' then the controller's 'logout' method.
 *
 * Middlewares:
 *   1) authenticate - Ensures the user is identified and has a valid session
 *   2) authController.logout - Invalidates session tokens or cookies
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * POST /reset-password
 * --------------------------------------------------------------------------------------------
 * Initiates a password reset flow for a given email. Rate-limited to prevent spamming
 * or enumeration attacks.
 *
 * Middlewares:
 *   1) rateLimit({ window: '1h', max: 3 }) - 3 attempts per hour
 *   2) validateBody(resetPasswordSchema) - Ensures a properly formatted email is supplied
 *   3) authController.resetPassword - Initiates the reset procedure (e.g., sending email)
 */
router.post(
  '/reset-password',
  rateLimit({ window: '1h', max: 3 }),
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

/**
 * POST /refresh-token
 * --------------------------------------------------------------------------------------------
 * Exchanges or refreshes an existing JWT token, returning a new one. The JSON specification
 * includes rate limiting and authentication, but not a body validation step by default.
 *
 * Middlewares:
 *   1) rateLimit({ window: '15m', max: 10 }) - Up to 10 refresh attempts per 15 minutes
 *   2) authenticate - Ensures the user is currently valid
 *   3) authController.refreshToken - Actual token refresh logic
 */
router.post(
  '/refresh-token',
  rateLimit({ window: '15m', max: 10 }),
  authenticate,
  authController.refreshToken
);

/**
 * POST /validate-mfa
 * --------------------------------------------------------------------------------------------
 * Validates an MFA token. Rate-limited to deter brute-forcing codes.
 *
 * Middlewares:
 *   1) rateLimit({ window: '15m', max: 3 }) - 3 attempts per 15 minutes
 *   2) validateBody(mfaSchema) - Ensures userId/token are present
 *   3) authController.validateMfa - Perform validation logic
 */
router.post(
  '/validate-mfa',
  rateLimit({ window: '15m', max: 3 }),
  validateBody(mfaSchema),
  authController.validateMfa
);

/**
 * GET /session
 * --------------------------------------------------------------------------------------------
 * Validates the current session and returns user data if authenticated. The specification
 * indicates this route requires the user to be authenticated. This is helpful for frontends
 * that need to confirm user status or fetch user details.
 *
 * Middlewares:
 *   1) authenticate - Ensures there's a valid session
 *
 * Handler:
 *   Anonymous inline function that returns user info from req.currentUser
 *   (since the JSON spec does not map this to a method in AuthController).
 */
router.get('/session', authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.currentUser || null
  });
});

/************************************************************************************************
 * Export Router
 **********************************************************************************************/
/**
 * Exporting the router for use in top-level server files or sub-apps. This router encapsulates
 * all authentication-related endpoints and their security logic. The JSON specification states
 * we expose the "router" as part of our enterprise-grade solution.
 */
export { router };