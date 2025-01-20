/**
 * External Dependencies
 * Using '@supabase/supabase-js' version ^2.38.4 for User and Session type definitions.
 */
import type { User, Session } from '@supabase/supabase-js' // version ^2.38.4

/**
 * @interface AuthState
 * Represents the shape of the global authentication state,
 * including the current Supabase user, session, and any
 * relevant loading or MFA status indicators.
 */
export interface AuthState {
  /**
   * The logged-in user object, or null if no user is authenticated.
   */
  user: User | null;

  /**
   * The current Supabase session object, or null if no session is active.
   */
  session: Session | null;

  /**
   * Indicates whether the authentication process is ongoing.
   */
  isLoading: boolean;

  /**
   * Flag to show if Multi-Factor Authentication (MFA) is enabled for this user.
   */
  mfaEnabled: boolean;
}

/**
 * @interface LoginCredentials
 * Represents the required information for logging in,
 * including optional TOTP code when MFA is enabled.
 */
export interface LoginCredentials {
  /**
   * The email address used for authentication.
   */
  email: string;

  /**
   * The password associated with the user account.
   */
  password: string;

  /**
   * The TOTP code for MFA verification if MFA is enabled. Optional.
   */
  totpCode?: string;
}

/**
 * @interface RegisterCredentials
 * Represents the input necessary for registering a new user,
 * including name and the organization name if applicable.
 */
export interface RegisterCredentials {
  /**
   * The email address to register a new user account.
   */
  email: string;

  /**
   * The chosen password for the new user.
   */
  password: string;

  /**
   * The display name (full name) of the new user.
   */
  name: string;

  /**
   * The name of the organization to associate with this user account.
   */
  organizationName: string;
}

/**
 * @enum UserRole
 * Enumerates the possible user roles for RBAC (Role-Based Access Control).
 */
export enum UserRole {
  /**
   * Admin role with full system access.
   */
  ADMIN = 'ADMIN',

  /**
   * Manager role with scoped team or organization capabilities.
   */
  MANAGER = 'MANAGER',

  /**
   * Regular user role with limited permissions.
   */
  USER = 'USER',
}

/**
 * @enum PermissionScope
 * Enumerates the possible permission scope levels for access control.
 */
export enum PermissionScope {
  /**
   * Global scope, typically for full cross-organization privileges.
   */
  GLOBAL = 'GLOBAL',

  /**
   * Organization scope, for actions within a single organization.
   */
  ORGANIZATION = 'ORGANIZATION',

  /**
   * Personal scope, limiting actions to the user's own resources only.
   */
  PERSONAL = 'PERSONAL',
}

/**
 * @enum OAuthProvider
 * Enumerates the supported OAuth 2.0 providers for external authentication flows.
 */
export enum OAuthProvider {
  /**
   * Google as an OAuth provider.
   */
  GOOGLE = 'GOOGLE',

  /**
   * LinkedIn as an OAuth provider.
   */
  LINKEDIN = 'LINKEDIN',
}

/**
 * @interface MFASettings
 * Represents configuration options for Multi-Factor Authentication (MFA),
 * currently scoped to TOTP-based methods.
 */
export interface MFASettings {
  /**
   * Flag indicating if MFA is currently enabled.
   */
  enabled: boolean;

  /**
   * The method used for MFA, currently only 'TOTP' is supported.
   */
  method: 'TOTP';

  /**
   * The secret key associated with the TOTP-based MFA.
   */
  secret: string;
}

/**
 * @interface AuthError
 * Represents the structure of an authentication-related error,
 * including an error message, error code, and optional OAuth provider context.
 */
export interface AuthError {
  /**
   * A descriptive message outlining the nature of the error.
   */
  message: string;

  /**
   * A short error code to help categorize the error type.
   */
  code: string;

  /**
   * The OAuth provider where the error originated, if applicable.
   */
  provider?: OAuthProvider;
}