////////////////////////////////////////////////////////////////////////////////
// External Imports
////////////////////////////////////////////////////////////////////////////////

import { z } from 'zod'; // zod ^3.22.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import { USER_ROLES } from '../constants/roles';
import { User, CreateUserInput, UpdateUserInput } from '../types/user';

////////////////////////////////////////////////////////////////////////////////
// userSettingsSchema
////////////////////////////////////////////////////////////////////////////////
/**
 * Zod schema for validating user settings within the B2B Sales Intelligence Platform.
 * This schema enforces the following properties:
 *  - theme: Must be a string with at least one character (e.g., "light", "dark").
 *  - timezone: Must be a non-empty string representing the user’s timezone.
 *  - notifications: Must be an object containing boolean flags for email and in-app
 *    notifications, as well as an array of strings for digestFrequency.
 *  - preferences: Must be a record keyed by string, allowing any typed values.
 *
 * This schema is crucial for maintaining user-specific preferences, ensuring
 * proper multi-tenant customization and alignment with data validation requirements.
 */
export const userSettingsSchema = z.object({
  /**
   * Indicates the user-selected theme (e.g., "light" or "dark").
   * Should always be at least one character long to avoid empty settings.
   */
  theme: z.string().min(1),

  /**
   * Represents the user’s timezone in a string format (e.g., "America/New_York").
   * Must be at least one character to ensure a valid identifier.
   */
  timezone: z.string().min(1),

  /**
   * Complex object dictating notification preferences:
   *  - emailNotifications: If true, the user receives email updates.
   *  - inAppNotifications: If true, the user sees in-app alerts.
   *  - digestFrequency: An array of strings specifying how often digest emails are sent.
   */
  notifications: z.object({
    emailNotifications: z.boolean(),
    inAppNotifications: z.boolean(),
    digestFrequency: z.array(z.string()),
  }),

  /**
   * An open-ended record of arbitrary preferences, keyed by string.
   * Allows for flexible feature toggles and custom user-level configurations.
   */
  preferences: z.record(z.string(), z.any()),
});

////////////////////////////////////////////////////////////////////////////////
// userSchema
////////////////////////////////////////////////////////////////////////////////
/**
 * Zod schema defining the complete structure of a User object. This schema
 * aligns with the multi-tenant requirement by including organizationId, enforces
 * role-based restrictions via the role field, and ensures robust data validation
 * for mission-critical user data.
 *
 * This schema covers:
 *  - id: Unique identifier for the user, non-empty string required.
 *  - email: Non-empty string validated as a proper email format.
 *  - name: Display name, must have at least one character.
 *  - role: Enumerated field using USER_ROLES to enforce RBAC consistency.
 *  - organizationId: String reference to an organization for multi-tenant data isolation.
 *  - settings: Nested user settings validated via userSettingsSchema.
 */
export const userSchema = z.object({
  /**
   * Unique identifier for the user within the system, non-empty to ensure validity.
   */
  id: z.string().min(1),

  /**
   * Email address used for both authentication and communication. Validates RFC 5322 compliance.
   */
  email: z.string().email(),

  /**
   * User's display or full name. Must be at least one character long.
   */
  name: z.string().min(1),

  /**
   * Enforces role-based access control by restricting the role to the
   * pre-defined USER_ROLES enumeration (admin, manager, user, api).
   */
  role: z.nativeEnum(USER_ROLES),

  /**
   * Reference to the unique identifier of the organization to which this user belongs.
   * Essential for multi-tenant segregation of data and functionality.
   */
  organizationId: z.string().min(1),

  /**
   * Detailed settings containing theme, timezone, notifications, and preferences fields.
   * This ensures user customization while maintaining validated constraints.
   */
  settings: userSettingsSchema,
});

////////////////////////////////////////////////////////////////////////////////
// createUserSchema
////////////////////////////////////////////////////////////////////////////////
/**
 * Zod schema for validating user creation input. This schema is specifically focused
 * on the initial payload needed to create a user, ensuring minimum required fields
 * (email, name, role, organizationId) for system integrity and multi-tenant alignment.
 *
 * Excludes user settings to keep creation straightforward; settings can be updated
 * optionally after user creation if needed.
 */
export const createUserSchema = z.object({
  /**
   * The new user's email, required for login and system notifications.
   */
  email: z.string().email(),

  /**
   * The new user's name, used for display and identification within the platform.
   */
  name: z.string().min(1),

  /**
   * The new user's assigned role, enforcing correct authorization boundaries
   * early in the user lifecycle.
   */
  role: z.nativeEnum(USER_ROLES),

  /**
   * Organization context for the user. Must be valid for correct multi-tenant
   * partitioning and data isolation.
   */
  organizationId: z.string().min(1),
});

////////////////////////////////////////////////////////////////////////////////
// updateUserSchema
////////////////////////////////////////////////////////////////////////////////
/**
 * Zod schema for validating user updates. This schema allows partial changes
 * without requiring all fields. Useful for scenarios like updating display name,
 * changing roles, or adjusting user settings.
 */
export const updateUserSchema = z.object({
  /**
   * Updates the user's display name. Optional to accommodate partial updates.
   */
  name: z.string().min(1).optional(),

  /**
   * Updates the user's role, enabling role promotion or demotion.
   * Optional to avoid forcing role changes when not intended.
   */
  role: z.nativeEnum(USER_ROLES).optional(),

  /**
   * Allows partial or complete updates to user settings, including theme, timezone,
   * and notification preferences.
   */
  settings: userSettingsSchema.partial().optional(),
});

////////////////////////////////////////////////////////////////////////////////
// validateUserInput
////////////////////////////////////////////////////////////////////////////////
/**
 * Asynchronous function that validates raw input data against the userSchema.
 * This function ensures robust data validation before persisting or acting on
 * user-related content in the B2B Sales Intelligence Platform.
 *
 * @param data Arbitrary input data intended to represent a full User object.
 * @returns A Promise resolving to the validated data, matching the shape of
 *          z.infer<typeof userSchema>. Throws an error if validation fails.
 */
export async function validateUserInput(
  data: unknown
): Promise<z.infer<typeof userSchema>> {
  // 1. Parse input data against user schema (asynchronous validation).
  // 2. Return the validated data or throw a Zod validation error if invalid.
  return userSchema.parseAsync(data);
}