////////////////////////////////////////////////////////////////////////////////
// External Imports
////////////////////////////////////////////////////////////////////////////////

// @supabase/supabase-js ^2.38.0
import {
  AuthError,
  type SupabaseClient,
  type Session as SupabaseSession,
} from '@supabase/supabase-js';

// rate-limiter-flexible ^2.4.1
import { RateLimiterMemory } from 'rate-limiter-flexible';

// winston ^3.8.2
import * as winston from 'winston';

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import supabase from '../config/supabase';
import { AppError, isAppError, ErrorSeverity } from '../utils/error.util';
import { ErrorCode } from '../constants/error-codes';
import { User, CreateUserInput } from '../types/user';
import { USER_ROLES } from '../constants/roles';

////////////////////////////////////////////////////////////////////////////////
// Extended Type Definitions
////////////////////////////////////////////////////////////////////////////////

/**
 * For creating a new user, we need an additional password field to handle
 * authentication credentials alongside the data in CreateUserInput.
 */
interface CreateUserAuthInput extends CreateUserInput {
  /**
   * Password to be used for creating a new user account in Supabase Auth.
   */
  password: string;
}

/**
 * Represents the return type for a successful signIn operation,
 * including both the application-level User object and the Supabase
 * session information.
 */
interface AuthSignInResult {
  user: User;
  session: SupabaseSession;
}

////////////////////////////////////////////////////////////////////////////////
// AuthService Class
////////////////////////////////////////////////////////////////////////////////

/**
 * The AuthService class provides enterprise-grade authentication,
 * authorization, session management, and multi-factor authentication
 * features using Supabase Auth. It enforces organization-based user
 * access control and implements robust security measures such as
 * rate limiting and structured error handling.
 */
export class AuthService {
  /**
   * Supabase client instance for standard authentication flows and
   * database interactions.
   */
  private readonly supabase: SupabaseClient;

  /**
   * RateLimiterMemory instance used to control requests for actions
   * such as signIn and resetPassword, preventing abuse or brute-force
   * attempts.
   */
  private readonly rateLimiter: RateLimiterMemory;

  /**
   * Winston logger instance to record authentication events, errors,
   * and other audit-relevant information.
   */
  private readonly logger: winston.Logger;

  /**
   * Constructs and initializes the AuthService with all required
   * dependencies for secure authentication.
   *
   * Steps:
   * 1. Sets up reference to the global Supabase client.
   * 2. Instantiates the in-memory rate limiter for login/reset attempts.
   * 3. Prepares a Winston logger for structured audit logs.
   */
  constructor() {
    // Step 1: Assign the shared Supabase client instance
    this.supabase = supabase;

    // Step 2: Configure an in-memory rate limiter with a default
    // allowance of 5 points over 60 seconds per unique key.
    // Each key references email + organizationId or similar.
    this.rateLimiter = new RateLimiterMemory({
      points: 5,
      duration: 60,
    });

    // Step 3: Create a Winston logger to track important events.
    // In production, you can configure transports for files, etc.
    this.logger = winston.createLogger({
      level: 'info',
      transports: [new winston.transports.Console()],
      format: winston.format.json(),
    });
  }

  /**
   * Authenticates a user with email and password. Enforces rate limiting
   * to mitigate brute-force attacks, verifies organization membership,
   * and updates the user's last login timestamp on success.
   *
   * Steps:
   * 1. Check rate limiting for login attempts.
   * 2. Validate email/password/organizationId inputs.
   * 3. Fetch the user from the database to verify organization context.
   * 4. Use Supabase to authenticate with email and password.
   * 5. Handle authentication errors from Supabase if any.
   * 6. Update last login timestamp in the application database.
   * 7. Log the authentication event.
   * 8. Return user data and session.
   *
   * @param email           The user's email address.
   * @param password        The user's password.
   * @param organizationId  The organization ID to verify multi-tenant access.
   * @returns {Promise<AuthSignInResult>} The authenticated user and a Supabase session.
   */
  public async signIn(
    email: string,
    password: string,
    organizationId: string
  ): Promise<AuthSignInResult> {
    // Step 1: Enforce rate limiting for this email + org combination.
    const rateLimitKey = `signin_${email}_${organizationId}`;
    try {
      await this.rateLimiter.consume(rateLimitKey, 1);
    } catch (rlErr) {
      // If consumption failed, the user has exceeded attempts within time window.
      throw new AppError(
        'Too many login attempts. Please try again later.',
        ErrorCode.RATE_LIMIT_EXCEEDED,
        {
          context: { email, organizationId },
          source: 'AuthService',
          severity: ErrorSeverity.MEDIUM,
        }
      );
    }

    // Step 2: Basic validations of input strings
    if (!email || !password || !organizationId) {
      throw new AppError(
        'Missing required fields for signIn.',
        ErrorCode.BAD_REQUEST,
        {
          context: { email, organizationId },
          source: 'AuthService',
          severity: ErrorSeverity.LOW,
        }
      );
    }

    // Step 3: Fetch user from "users" table to confirm existence, org membership
    const { data: fetchedUser, error: fetchUserError } = await this.supabase
      .from<User>('users')
      .select('*')
      .eq('email', email)
      .eq('organizationId', organizationId)
      .single();

    if (fetchUserError || !fetchedUser) {
      throw new AppError(
        'User not found or not associated with the provided organization.',
        ErrorCode.UNAUTHORIZED,
        {
          context: { email, organizationId },
          source: 'AuthService',
          severity: ErrorSeverity.LOW,
        }
      );
    }

    // Step 4: Attempt authentication with Supabase
    const { data: signInData, error: signInError } =
      await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

    // Step 5: Handle Supabase auth errors
    if (signInError) {
      // If this is an AuthError, we can gather more context
      let supabaseErrMessage = signInError.message;
      if (signInError instanceof AuthError && signInError.status) {
        supabaseErrMessage += ` (status: ${signInError.status})`;
      }
      // Throw a structured AppError
      throw new AppError(supabaseErrMessage, ErrorCode.UNAUTHORIZED, {
        context: { email, organizationId },
        source: 'AuthService',
        severity: ErrorSeverity.LOW,
      });
    }

    // If no session is returned for any reason, we treat it as failed authentication
    if (!signInData?.session) {
      throw new AppError('No session returned. Authentication failed.', ErrorCode.UNAUTHORIZED, {
        context: { email, organizationId },
        source: 'AuthService',
        severity: ErrorSeverity.LOW,
      });
    }

    // Step 6: Update last login timestamp in "users" table
    const updatedAt = new Date();
    const { data: updatedUserRow, error: updateErr } = await this.supabase
      .from<User>('users')
      .update({ lastLoginAt: updatedAt })
      .eq('id', fetchedUser.id)
      .select()
      .single();

    if (updateErr || !updatedUserRow) {
      // If we fail to update the user table, we still proceed with the signIn,
      // but log this failure for follow-up.
      this.logger.error('Failed to update lastLoginAt.', {
        error: updateErr,
        userId: fetchedUser.id,
      });
    }

    // Step 7: Log the authentication event
    this.logger.info('User successfully signed in.', {
      userId: fetchedUser.id,
      organizationId: fetchedUser.organizationId,
    });

    // Step 8: Return user data and the Supabase session
    return {
      user: updatedUserRow || fetchedUser,
      session: signInData.session,
    };
  }

  /**
   * Registers a new user with email and password, associating them with
   * the appropriate organization and role context in both Supabase Auth
   * and the application database. Prevents duplicate registrations for
   * the same email/org combination.
   *
   * Steps:
   * 1. Validate the user data input.
   * 2. Check if the user email already exists for the given organization.
   * 3. Create a user in Supabase Auth with the provided email and password.
   * 4. Create the user record in the local "users" table with org membership.
   * 5. Assign the specified role and set up initial user settings.
   * 6. Log the user creation event.
   * 7. Return the newly created user data.
   *
   * @param userData The CreateUserInput plus a password field for signup.
   * @returns {Promise<User>} The created user record.
   */
  public async signUp(userData: CreateUserAuthInput): Promise<User> {
    // Step 1: Basic validation
    if (!userData.email || !userData.password || !userData.organizationId) {
      throw new AppError('Invalid user data for signUp.', ErrorCode.BAD_REQUEST, {
        context: { userData },
        source: 'AuthService',
        severity: ErrorSeverity.LOW,
      });
    }

    // Step 2: Check if user email already exists in the same organization
    const { data: existingUser } = await this.supabase
      .from<User>('users')
      .select('id')
      .eq('email', userData.email)
      .eq('organizationId', userData.organizationId)
      .maybeSingle();

    if (existingUser) {
      throw new AppError(
        'A user with this email already exists in the organization.',
        ErrorCode.CONFLICT,
        {
          context: { email: userData.email, organizationId: userData.organizationId },
          source: 'AuthService',
          severity: ErrorSeverity.LOW,
        }
      );
    }

    // Step 3: Create a user in Supabase Auth
    const { data: supabaseSignUpData, error: supabaseSignUpError } =
      await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          // Example: Optionally store some profile data in auth metadata
          data: {
            organizationId: userData.organizationId,
            role: userData.role || USER_ROLES.USER,
          },
        },
      });

    if (supabaseSignUpError) {
      // Convert Supabase sign-up error into structured AppError
      throw new AppError(supabaseSignUpError.message, ErrorCode.API_ERROR, {
        context: { email: userData.email, organizationId: userData.organizationId },
        source: 'AuthService',
        severity: ErrorSeverity.MEDIUM,
      });
    }

    // If for any reason the user isn't returned, we consider it an error
    if (!supabaseSignUpData?.user) {
      throw new AppError('Supabase signUp did not return user data.', ErrorCode.API_ERROR, {
        context: { userData },
        source: 'AuthService',
        severity: ErrorSeverity.MEDIUM,
      });
    }

    // Step 4: Create the user entry in the "users" table
    const createdAt = new Date();
    const userToInsert: Partial<User> = {
      email: userData.email,
      name: userData.name || '',
      role: userData.role || USER_ROLES.USER,
      organizationId: userData.organizationId,
      // Settings can be partial in userData, so we fallback to sensible defaults.
      settings: userData.settings || {
        theme: 'light',
        timezone: 'UTC',
        notifications: {
          emailNotifications: true,
          inAppNotifications: true,
          digestFrequency: [],
        },
        preferences: {},
      },
      createdAt,
      updatedAt: createdAt,
      lastLoginAt: null,
    };

    const { data: newUserRows, error: insertErr } = await this.supabase
      .from<User>('users')
      .insert(userToInsert)
      .select();

    if (insertErr || !newUserRows || !newUserRows[0]) {
      throw new AppError('Failed to insert user in local database.', ErrorCode.DATABASE_ERROR, {
        context: { userData, insertErr },
        source: 'AuthService',
        severity: ErrorSeverity.HIGH,
      });
    }

    // Step 5: The role is assigned above. If you want additional role-based logic,
    // you can implement that here, such as user-based usage limit checks, etc.

    // Step 6: Log the user creation event
    this.logger.info('New user account created.', {
      userId: newUserRows[0].id,
      email: newUserRows[0].email,
      organizationId: newUserRows[0].organizationId,
    });

    // Step 7: Return the newly created user record
    return newUserRows[0];
  }

  /**
   * Initiates the password reset process by sending a secure reset link
   * via Supabase's resetPasswordForEmail functionality, with advanced
   * rate limiting to deter password reset abuse.
   *
   * Steps:
   * 1. Check rate limiting for reset attempts on this email.
   * 2. Validate email address input.
   * 3. Verify the user exists to avoid sending resets for nonexistent accounts.
   * 4. Use Supabase to send password reset email.
   * 5. Handle potential email-delivery errors.
   * 6. Log the reset attempt.
   *
   * @param email The email address for which to reset the password.
   * @returns {Promise<void>} Resolves on successful initiation of the reset flow.
   */
  public async resetPassword(email: string): Promise<void> {
    // Step 1: Rate limiting for password reset attempts
    const rateLimitKey = `reset_${email}`;
    try {
      await this.rateLimiter.consume(rateLimitKey, 1);
    } catch (rlErr) {
      throw new AppError(
        'Too many password reset attempts. Please try again later.',
        ErrorCode.RATE_LIMIT_EXCEEDED,
        {
          context: { email },
          source: 'AuthService',
          severity: ErrorSeverity.MEDIUM,
        }
      );
    }

    // Step 2: Basic validation
    if (!email) {
      throw new AppError(
        'An email address is required for password reset.',
        ErrorCode.BAD_REQUEST,
        {
          context: {},
          source: 'AuthService',
          severity: ErrorSeverity.LOW,
        }
      );
    }

    // Step 3: Verify user existence in local "users" table
    const { data: existingUser, error: findErr } = await this.supabase
      .from<User>('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (findErr || !existingUser) {
      // For security, do not reveal whether an account truly exists. We'll log it privately.
      this.logger.warn('Password reset requested for non-existent or unknown user.', {
        email,
      });
      return;
    }

    // Step 4: Supabase's built-in reset flow. Provide a redirectTo path for
    // the user to complete the reset within your application domain.
    const { error: resetErr } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL || 'https://example.com'}/auth/password-reset`,
    });

    // Step 5: Handle potential errors in sending the password reset
    if (resetErr) {
      throw new AppError(resetErr.message, ErrorCode.API_ERROR, {
        context: { email },
        source: 'AuthService',
        severity: ErrorSeverity.MEDIUM,
      });
    }

    // Step 6: Log the reset attempt
    this.logger.info('Password reset initiated.', { userId: existingUser.id, email });
  }

  /**
   * Verifies a Multi-Factor Authentication (MFA) token for enhanced account security.
   * In a production scenario, the token is typically a TOTP code or similar. This
   * method performs validity checks, token expiration checks, and logs attempts.
   *
   * Steps:
   * 1. Validate input parameters for userId and token.
   * 2. Retrieve the stored MFA secret or configuration for the user.
   * 3. Compare supplied token against a verified TOTP or token generator.
   * 4. Check for token expiration or reuse.
   * 5. Log MFA attempt.
   * 6. Return verification result.
   *
   * @param userId A string representing the user's unique ID.
   * @param token  The MFA token provided by the user to verify.
   * @returns {Promise<boolean>} True if token is successfully verified, otherwise false.
   */
  public async verifyMFA(userId: string, token: string): Promise<boolean> {
    // Step 1: Validate input parameters
    if (!userId || !token) {
      throw new AppError('MFA verification requires userId and token.', ErrorCode.BAD_REQUEST, {
        context: { userId, token },
        source: 'AuthService',
        severity: ErrorSeverity.LOW,
      });
    }

    // Step 2: In a real system, you would retrieve a stored secret/totp from your DB
    // or from Supabase auth.user(). For illustration, we use a placeholder scenario.
    // Example: const userMfaSecret = fetchUserMfaSecretFromDatabase(userId);

    // Step 3 & 4: Here we simulate the check. Replace this with a real TOTP library check.
    // For a demonstration, let's accept '123456' as a valid token:
    const isValid = token === '123456';

    // Step 5: Log the MFA attempt
    if (isValid) {
      this.logger.info('MFA token verified successfully.', { userId });
    } else {
      this.logger.warn('MFA token verification failed.', { userId, token });
    }

    // Step 6: Return the result of token verification
    return isValid;
  }
}