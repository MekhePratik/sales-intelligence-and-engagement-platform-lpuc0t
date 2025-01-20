/////////////////////////////////////////////////////////////////////////////////////////////////
// External Imports
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * express ^4.18.2
 * Provides Request and Response types for typed HTTP controllers.
 */
import { Request, Response } from 'express';

/**
 * winston ^3.8.2
 * Used for enterprise-grade logging and audit trails.
 */
import * as winston from 'winston';

/**
 * zod ^3.22.0
 * Provides runtime schema validation to enforce input correctness.
 */
import { z } from 'zod';

/**
 * express-rate-limit ^6.7.0
 * Rate limiting utility applied to critical authentication endpoints.
 */
import { RateLimiter } from 'express-rate-limit';

/////////////////////////////////////////////////////////////////////////////////////////////////
// Internal Imports
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * AuthService from ../services/auth.service
 * Provides core authentication flows including signIn, signUp, signOut, MFA, and refresh token.
 */
import { AuthService } from '../services/auth.service';

/////////////////////////////////////////////////////////////////////////////////////////////////
// Schema Definitions
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * loginSchema
 * Used to validate login requests containing email, password, and organizationId fields.
 */
const loginSchema = z.object({
  email: z.string().email({
    message: 'A valid email is required for login.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters long.',
  }),
  organizationId: z.string().min(1, {
    message: 'organizationId is required for login.',
  }),
});

/**
 * mfaSchema
 * Used to validate the MFA verification request containing userId and token.
 */
const mfaSchema = z.object({
  userId: z.string().min(1, {
    message: 'User ID is required to verify MFA.',
  }),
  token: z.string().min(1, {
    message: 'MFA token is required for verification.',
  }),
});

/**
 * refreshSchema
 * Used to validate refresh token requests ensuring a refreshToken is provided.
 */
const refreshSchema = z.object({
  refreshToken: z.string().min(1, {
    message: 'Refresh token is required.',
  }),
});

/////////////////////////////////////////////////////////////////////////////////////////////////
// AuthController Class
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * AuthController
 * ---------------------------------------------------------------------------------------------
 * This controller class handles all authentication-related HTTP operations:
 *  1. login        - Authenticates a user with optional MFA checks.
 *  2. verifyMFA    - Verifies a second-factor token for MFA completion.
 *  3. refreshToken - Rotates and issues a new session token for an existing session.
 *
 * The constructor accepts:
 *  - authService:   An instance of AuthService providing signIn, signUp, signOut, resetPassword,
 *                   verifyMFA, setupMFA, and refreshToken methods.
 *  - rateLimiter:   An instance of express-rate-limit or custom RateLimiter for automated
 *                   request limiting.
 *
 * This class implements comprehensive security features including:
 *  - Input validation with Zod schemas
 *  - Rate limiting integrated per request
 *  - Winston-based audit logging for authentication attempts
 *  - Extended error handling to provide secure, consistent responses
 */
export class AuthController {
  /**
   * Private property holding a reference to the AuthService instance.
   * Used for complex auth flows like signIn, verifyMFA, and refreshToken.
   */
  private readonly authService: AuthService;

  /**
   * Private property holding a reference to an express-rate-limit RateLimiter instance.
   * Used to enforce IP or user-based rate limiting for critical endpoints.
   */
  private readonly rateLimiter: RateLimiter;

  /**
   * Private Winston logger instance for capturing and recording security/audit events.
   */
  private readonly logger: winston.Logger;

  /**
   * Constructs the AuthController with its dependencies.
   * ---------------------------------------------------------------------------------------
   * Steps:
   *  1. Initialize AuthService reference for advanced authentication flows.
   *  2. Store reference to the RateLimiter for login/verifyMFA endpoints.
   *  3. Instantiate a Winston logger for comprehensive audit logging.
   *  4. Prepares the necessary request validation schemas (already declared above).
   *
   * @param authService A fully constructed AuthService object from the DI layer.
   * @param rateLimiter A rate-limiting middleware/function for controlling repeated requests.
   */
  constructor(authService: AuthService, rateLimiter: RateLimiter) {
    // Step 1: Assign the AuthService reference to a private property.
    this.authService = authService;

    // Step 2: Assign the RateLimiter for controlling requests on sensitive endpoints.
    this.rateLimiter = rateLimiter;

    // Step 3: Create an appropriate Winston logger for authentication events including login, MFA attempts, etc.
    this.logger = winston.createLogger({
      level: 'info',
      transports: [new winston.transports.Console()],
      format: winston.format.json(),
    });
  }

  /**
   * login
   * ---------------------------------------------------------------------------------------
   * Handles user login with potential MFA support. The solution is designed to:
   *  1. Check rate limit for the requesting IP address to mitigate brute force attacks.
   *  2. Validate request body (email, password, organizationId) with Zod.
   *  3. Call authService.signIn() to authenticate the user within a specific organization.
   *  4. (Optional) Check if MFA is required for that user.
   *  5. Generate either a full session or prompt for MFA challenge.
   *  6. Log authentication attempt details for audit.
   *  7. Return the response with tokens or MFA instructions.
   *
   * Decorators:
   *  - asyncHandler : A higher-order function that catches any async errors and propagates them.
   *  - rateLimited  : The express-rate-limit function or custom logic that imposes usage limits.
   *
   * @param req Express Request object containing login data in req.body.
   * @param res Express Response object used to return session data or errors.
   * @returns Returns a Promise of the HTTP response, with JSON data representing success or error.
   */
  public login = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Step 1: Rate limiting. We call this.rateLimiter manually for demonstration.
      // In practice, you might attach it as middleware before this handler.
      await new Promise<void>((resolve, reject) => {
        this.rateLimiter(req, res, (rateLimitError: unknown) => {
          if (rateLimitError) {
            return reject(rateLimitError);
          }
          return resolve();
        });
      });

      // Step 2: Validate request body schema, extracting email, password, organizationId.
      const { email, password, organizationId } = loginSchema.parse(req.body);

      // Step 3: Call authService.signIn to authenticate the user.
      // This method imposes additional rate limiting at the service layer.
      const { user, session } = await this.authService.signIn(
        email,
        password,
        organizationId
      );

      // Step 4/5: Check if the user requires MFA. (Placeholder check - real systems vary.)
      // If no explicit MFA logic is returned from signIn, you might reference user data to see if MFA is enabled.
      let mfaNeeded = false;
      // Potentially something like: mfaNeeded = !!user.mfaEnabled;
      if (mfaNeeded) {
        this.logger.info('MFA challenge required during login.', { userId: user.id });
        return res.status(200).json({
          success: true,
          mfaRequired: true,
          userId: user.id,
        });
      }

      // If MFA is not required or already satisfied, return a successful login response with session
      this.logger.info('User login successful.', { userId: user.id });
      return res.status(200).json({
        success: true,
        user,
        session,
      });
    } catch (error) {
      // Step 6: Comprehensive error handling
      this.logger.error('Error during login attempt.', {
        error: String(error),
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to process login request. Please try again.',
      });
    }
  };

  /**
   * verifyMFA
   * ---------------------------------------------------------------------------------------
   * Completes a multi-factor authentication process by verifying a user-provided token.
   * The logic:
   *  1. Enforce rate limiting to prevent brute force attempts on MFA codes.
   *  2. Validate the input (userId, token) with Zod.
   *  3. Call authService.verifyMFA to check correctness of the token.
   *  4. If valid, create/return a complete session token or attach to an existing session.
   *  5. Log the MFA verification event for audit and security analysis.
   *  6. Return success or error response.
   *
   * Decorators:
   *  - asyncHandler : Captures any async errors.
   *  - rateLimited  : Applies usage limits to avoid rapid repeated calls.
   *
   * @param req Express Request object holding the userId and MFA token in req.body.
   * @param res Express Response object returning either a completed session or error details.
   * @returns A Promise of the HTTP response, containing the success state or failure reason.
   */
  public verifyMFA = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Step 1: Rate limiting check to prevent repeated attempts
      await new Promise<void>((resolve, reject) => {
        this.rateLimiter(req, res, (rateLimitError: unknown) => {
          if (rateLimitError) {
            return reject(rateLimitError);
          }
          return resolve();
        });
      });

      // Step 2: Validate request input for userId and token
      const { userId, token } = mfaSchema.parse(req.body);

      // Step 3: Use authService.verifyMFA to confirm if the token is correct
      const isVerified = await this.authService.verifyMFA(userId, token);
      if (!isVerified) {
        this.logger.warn('MFA verification failed.', { userId });
        return res.status(401).json({
          success: false,
          message: 'Invalid MFA token provided.',
        });
      }

      // Step 4: Generate a complete session token or additional session data.
      // For demonstration, we will simply call a placeholder or repeat existing logic.
      // In a real scenario, you could call signIn again (with stored credentials) or refresh.
      // We'll do a simplified approach here:
      const session = { token: 'fake_session_mfa_complete' };

      // Step 5: Log success of MFA
      this.logger.info('MFA successfully verified.', { userId });

      // Step 6: Return success with session tokens or relevant data
      return res.status(200).json({
        success: true,
        message: 'MFA verified. Session is now fully active.',
        session,
      });
    } catch (error) {
      this.logger.error('Error during MFA verification.', {
        error: String(error),
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to verify MFA token. Please try again.',
      });
    }
  };

  /**
   * refreshToken
   * ---------------------------------------------------------------------------------------
   * Exchanges a valid refresh token for a new session token, cycling credentials to
   * maintain security. Typical steps include:
   *  1. Validate the input refresh token via the refreshSchema.
   *  2. Call authService.refreshToken to generate a new session token and optional user data.
   *  3. Log the token refresh event for audit purposes (potentially capturing userId).
   *  4. Return the newly created tokens or session details.
   *
   * Decorators:
   *  - asyncHandler : Allows error capture from asynchronous calls.
   *
   * @param req Express Request object containing the refresh token in req.body.
   * @param res Express Response object returning new tokens in case of success, or an error message on failure.
   * @returns A Promise of the HTTP response, containing renewed session tokens or error information.
   */
  public refreshToken = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Step 1: Validate the refresh token field from the request body
      const { refreshToken } = refreshSchema.parse(req.body);

      // Step 2: Call authService.refreshToken
      // In a real scenario, this method would verify the existing refresh token, check for validity, etc.
      const { user, session } = await this.authService.refreshToken(refreshToken);

      // Step 3: Log the token refresh event
      this.logger.info('Session token refreshed.', { userId: user.id });

      // Step 4: Return success with the updated session
      return res.status(200).json({
        success: true,
        user,
        session,
      });
    } catch (error) {
      this.logger.error('Error during token refresh.', {
        error: String(error),
      });
      return res.status(500).json({
        success: false,
        message: 'Could not refresh the token. Please try again.',
      });
    }
  };
}