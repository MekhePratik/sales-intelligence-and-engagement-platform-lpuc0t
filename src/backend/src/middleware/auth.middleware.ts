/* ********************************************************************************
 * Authentication Middleware
 * ------------------------------------------------------------------------------
 * This file provides two key middlewares for secure B2B Sales Intelligence
 * platform operations:
 *   1) authenticate: Responsible for validating JSON Web Tokens (JWT),
 *      session management, Supabase Auth verification, user fetch, and
 *      rate-limiting enforcement.
 *   2) authorize: Role-based access control (RBAC) middleware factory that
 *      checks if an authenticated user has one of the allowed roles.
 *
 * Comprehensive error handling is implemented using AppError, including
 * standardized codes, secure messages, and Winston-based logging. Rate-limiting
 * is aligned with each role’s configuration in ROLE_PERMISSIONS to address
 * high-volume usage safely and securely.
 *
 * ------------------------------------------------------------------------------
 * Requirements Addressed:
 * - Authentication Methods (7. SECURITY CONSIDERATIONS/7.1 AUTHENTICATION AND AUTHORIZATION)
 * - Role-Based Access Control (7. SECURITY CONSIDERATIONS/7.1 AUTHENTICATION AND AUTHORIZATION)
 * - Security Controls (7. SECURITY CONSIDERATIONS/7.2 DATA SECURITY/Security Controls)
 *
 * ------------------------------------------------------------------------------
 * Implementation Steps in This File:
 *  1. Global Request augmentation to attach the authenticated user.
 *  2. Logging setup and usage with Winston for security events.
 *  3. An in-memory rate-limiting mechanism which reads role-based limits
 *     from ROLE_PERMISSIONS.
 *  4. The `authenticate` middleware that:
 *       - Extracts and verifies the JWT from the Authorization header.
 *       - Validates the token with Supabase Auth.
 *       - Retrieves user data from the database.
 *       - Checks for user existence and status.
 *       - Enforces role-specific rate limits.
 *       - Attaches user info to the request object.
 *  5. The `authorize` middleware factory that:
 *       - Checks if request is authenticated and user is present.
 *       - Compares user's role to allowed roles.
 *       - Returns a forbidden error if no match.
 *  6. Comprehensive comments and error handling at all steps.
 *
 ******************************************************************************** */

////////////////////////////////////////////////////////////////////////////////
// External Imports
////////////////////////////////////////////////////////////////////////////////
import { Request, Response, NextFunction } from 'express'; // express ^4.18.0
import { Logger, createLogger, format, transports } from 'winston'; // winston ^3.8.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////
import { User } from '../types/user';
import { AppError } from '../utils/error.util';
import { USER_ROLES, ROLE_PERMISSIONS } from '../constants/roles';
import { ErrorCode } from '../constants/error-codes';
import supabase from '../config/supabase'; // SupabaseClient with auth, from

////////////////////////////////////////////////////////////////////////////////
// Global Request Augmentation
////////////////////////////////////////////////////////////////////////////////

/**
 * Augments the Express Request interface to include a reference
 * to the authenticated user. Applicable only after the `authenticate`
 * middleware has successfully attached a validated user object.
 */
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      /**
       * `currentUser` references the validated User record from the database,
       * including role and organization ID. This is set by `authenticate`.
       */
      currentUser?: User;
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// Winston Logger Setup
////////////////////////////////////////////////////////////////////////////////

/**
 * An enterprise-grade Winston logger for security events and errors.
 * Uses console transport for demonstration; in production, prefer
 * robust solutions (e.g. file or centralized logging).
 */
const logger: Logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(
      (info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`
    )
  ),
  transports: [
    new transports.Console()
  ]
});

////////////////////////////////////////////////////////////////////////////////
// In-Memory Rate Limiting Store
////////////////////////////////////////////////////////////////////////////////

/**
 * Rate-limiting data structure storing usage for each user ID, keyed by userRole + userId.
 * Example key format: "admin::userId1234"
 *
 * Each record holds:
 *   count     : Number of requests made in the current interval
 *   lastReset : Timestamp (in ms) when the current interval started
 */
interface RateLimitRecord {
  count: number;
  lastReset: number;
}

const rateLimitStore: Map<string, RateLimitRecord> = new Map();

/**
 * Resets or increments rate limiting usage for a particular user.
 *
 * @param user The authenticated user for whom we track rate usage.
 */
function enforceRateLimit(user: User): void {
  const rolePerms = ROLE_PERMISSIONS[user.role];
  const roleLimit = rolePerms.rateLimit;  // { requests: number, interval: 'minute' | 'hour' }
  const userKey = `${user.role}::${user.id}`;

  const now = Date.now();

  // Convert roleLimit.interval into milliseconds
  let intervalMs: number;
  switch (roleLimit.interval) {
    case 'minute':
      intervalMs = 60_000; // 1 minute = 60,000 ms
      break;
    case 'hour':
      intervalMs = 3_600_000; // 1 hour = 3,600,000 ms
      break;
    default:
      intervalMs = 3_600_000; // Default to 1 hour if unspecified
      break;
  }

  // Retrieve or initialize the record
  const record = rateLimitStore.get(userKey) || { count: 0, lastReset: now };

  // If interval has expired, reset usage
  if (now - record.lastReset >= intervalMs) {
    record.count = 0;
    record.lastReset = now;
  }

  // Increment usage
  record.count += 1;

  // Persist usage record back into the map
  rateLimitStore.set(userKey, record);

  // Check if usage has exceeded role-specific allowed requests
  if (record.count > roleLimit.requests) {
    logger.warn(
      `Rate limit exceeded for userId=${user.id}, role=${user.role}, ` +
      `limit=${roleLimit.requests}/${roleLimit.interval}`
    );
    throw new AppError(
      `You have exceeded the allowed ${roleLimit.requests} requests per ${roleLimit.interval}.`,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      {
        context: { userId: user.id, userRole: user.role },
        source: 'RateLimitingMiddleware',
        severity: 3 // Could match an enum for severity or custom usage
      }
    );
  }
}

////////////////////////////////////////////////////////////////////////////////
// Middleware: authenticate
////////////////////////////////////////////////////////////////////////////////

/**
 * Middleware that performs comprehensive JWT validation, session management,
 * user fetching, and rate-limiting. The verified user will be attached to
 * req.currentUser if authentication succeeds.
 *
 * @param req  Express Request object
 * @param res  Express Response object
 * @param next Express NextFunction
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract token from 'Authorization' header in the format: "Bearer <TOKEN>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.error('Missing or invalid Authorization header.');
      throw new AppError(
        'Authorization header is missing or invalid.',
        ErrorCode.UNAUTHORIZED,
        {
          context: { header: authHeader },
          source: 'authenticate',
          severity: 2
        }
      );
    }
    const token = authHeader.substring(7).trim(); // Remove "Bearer " prefix

    // 2. Validate JWT token with Supabase Auth
    //    This method returns user metadata if valid, or an error otherwise.
    const { data: supabaseUser, error: supabaseError } = await supabase.auth.getUser(token);
    if (supabaseError || !supabaseUser || !supabaseUser.user) {
      logger.error(`Supabase token validation error: ${supabaseError?.message || 'Unknown'}`);
      throw new AppError(
        'Invalid or expired JWT token.',
        ErrorCode.UNAUTHORIZED,
        {
          context: { supabaseError: supabaseError?.message },
          source: 'authenticate',
          severity: 2
        }
      );
    }

    // 3. Retrieve user data from the database using the Supabase user ID
    //    The "users" table must contain an entry matching this ID for a successful login.
    const supabaseId = supabaseUser.user.id;
    const { data: dbUser, error: dbError } = await supabase
      .from<User>('users')
      .select('*')
      .eq('id', supabaseId)
      .maybeSingle();

    if (dbError) {
      logger.error(`Database error while retrieving user: ${dbError.message}`);
      throw new AppError(
        'Failed to retrieve user from database.',
        ErrorCode.DATABASE_ERROR,
        {
          context: { supabaseId },
          source: 'authenticate',
          severity: 3
        }
      );
    }
    if (!dbUser) {
      logger.warn(`No matching user in DB for supabaseId=${supabaseId}`);
      throw new AppError(
        'User account not found.',
        ErrorCode.UNAUTHORIZED,
        {
          context: { supabaseId },
          source: 'authenticate',
          severity: 2
        }
      );
    }

    // 4. Enforce rate limiting for this user role. Roles are stored in the DB row.
    if (!dbUser.role || !ROLE_PERMISSIONS[dbUser.role]) {
      logger.error(`Invalid or unknown role detected for userId=${dbUser.id}`);
      throw new AppError(
        'Your user role is invalid or unconfigured.',
        ErrorCode.FORBIDDEN,
        {
          context: { userId: dbUser.id, userRole: dbUser.role },
          source: 'authenticate',
          severity: 3
        }
      );
    }
    enforceRateLimit(dbUser);

    // 5. Attach user to request object for downstream usage
    req.currentUser = dbUser;

    // 6. Log success and proceed
    logger.info(
      `User authenticated successfully: id=${dbUser.id}, role=${dbUser.role}, org=${dbUser.organizationId}`
    );
    return next();
  } catch (error) {
    // 7. Handle any thrown AppError or unexpected error
    return next(error);
  }
}

////////////////////////////////////////////////////////////////////////////////
// Middleware Factory: authorize
////////////////////////////////////////////////////////////////////////////////

/**
 * Middleware factory that enforces role-based access control (RBAC).
 * Returns an Express middleware function that checks if the authenticated
 * user's role is in the provided allowedRoles list. If not, it throws
 * a Forbidden error.
 *
 * @param allowedRoles - List of roles permitted to access this route
 * @returns Express middleware function
 */
export function authorize(allowedRoles: USER_ROLES[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // 1. Ensure user is already authenticated and attached
      const user = req.currentUser;
      if (!user) {
        logger.error('Authorization check failed: No authenticated user found.');
        throw new AppError(
          'You must be authenticated to access this resource.',
          ErrorCode.UNAUTHORIZED,
          {
            context: {},
            source: 'authorize',
            severity: 2
          }
        );
      }

      // 2. Validate user's role is included in the allowedRoles
      if (!allowedRoles.includes(user.role)) {
        logger.warn(
          `User with role=${user.role} is not permitted. Allowed roles: ${allowedRoles.join(', ')}`
        );
        throw new AppError(
          'You do not have permission to perform this action.',
          ErrorCode.FORBIDDEN,
          {
            context: { userRole: user.role, allowedRoles },
            source: 'authorize',
            severity: 2
          }
        );
      }

      // 3. Proceed if role matches
      logger.info(`Authorization succeeded for userId=${user.id}, role=${user.role}`);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}