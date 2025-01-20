////////////////////////////////////////////////////////////////////////////////
// External Imports
////////////////////////////////////////////////////////////////////////////////

import { z } from 'zod'; // zod ^3.22.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import type { Organization } from './organization';
import { USER_ROLES } from '../constants/roles';

////////////////////////////////////////////////////////////////////////////////
// NotificationPreferences Interface & Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Describes the notification settings for a user, including email and in-app
 * notifications, as well as how frequently the user receives digests.
 */
export interface NotificationPreferences {
  /**
   * Indicates if user should receive email notifications.
   */
  emailNotifications: boolean;

  /**
   * Indicates if user should receive in-app notifications.
   */
  inAppNotifications: boolean;

  /**
   * Defines the frequency of digest emails (e.g., daily, weekly).
   */
  digestFrequency: string[];
}

/**
 * Zod schema for runtime validation of NotificationPreferences.
 */
export const NotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  inAppNotifications: z.boolean(),
  digestFrequency: z.array(z.string()),
});

////////////////////////////////////////////////////////////////////////////////
// UserSettings Interface & Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Encapsulates user-level preferences such as theme, timezone, notification
 * handling, and any custom preferences in an open-ended record type.
 */
export interface UserSettings {
  /**
   * A string representing the selected theme (e.g., 'light' or 'dark').
   */
  theme: string;

  /**
   * A string representing the user's timezone (e.g., 'America/New_York').
   */
  timezone: string;

  /**
   * The user's notification preference settings.
   */
  notifications: NotificationPreferences;

  /**
   * A general-purpose object for storing additional user-specific preferences.
   */
  preferences: Record<string, any>;
}

/**
 * Zod schema for runtime validation of UserSettings.
 */
export const UserSettingsSchema = z.object({
  theme: z.string(),
  timezone: z.string(),
  notifications: NotificationPreferencesSchema,
  preferences: z.record(z.any()),
});

////////////////////////////////////////////////////////////////////////////////
// User Interface & Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Core user entity definition for the B2B sales intelligence platform,
 * supporting multi-tenant organization memberships via organizationId and
 * comprehensive role-based access control via role.
 */
export interface User {
  /**
   * Unique identifier for the user.
   */
  id: string;

  /**
   * Email address of the user, used for login and communication.
   */
  email: string;

  /**
   * Display name or full name for the user.
   */
  name: string;

  /**
   * Role assigned to this user, controlling authorization scope and limits.
   */
  role: USER_ROLES;

  /**
   * References the ID of the organization to which this user belongs,
   * ensuring multi-tenant segregation.
   */
  organizationId: Organization['id'];

  /**
   * Settings instance containing all user-level preferences.
   */
  settings: UserSettings;

  /**
   * Timestamp indicating when the user was initially created.
   */
  createdAt: Date;

  /**
   * Timestamp indicating when the user was last updated.
   */
  updatedAt: Date;

  /**
   * Timestamp indicating the user's last login time, or null if never logged in.
   */
  lastLoginAt: Date | null;
}

/**
 * Zod schema for runtime validation of the User entity.
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.nativeEnum(USER_ROLES),
  organizationId: z.string(),
  settings: UserSettingsSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().nullable(),
});

////////////////////////////////////////////////////////////////////////////////
// CreateUserInput Type & Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents the payload required to create a new user in the system,
 * including core identity fields and optional user settings.
 */
export type CreateUserInput = {
  /**
   * Email address for the new user.
   */
  email: string;

  /**
   * Display name or full name for the new user.
   */
  name: string;

  /**
   * Role assigned to the new user.
   */
  role: USER_ROLES;

  /**
   * ID of the organization to which the user will belong.
   */
  organizationId: Organization['id'];

  /**
   * Partial user settings allowing specification of any subset of preferences.
   */
  settings: Partial<UserSettings>;
};

/**
 * Zod schema for validating user creation inputs.
 */
export const CreateUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  role: z.nativeEnum(USER_ROLES),
  organizationId: z.string(),
  settings: UserSettingsSchema.partial(),
});

////////////////////////////////////////////////////////////////////////////////
// UpdateUserInput Type & Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents the payload used to modify an existing user. Fields such as
 * name, role, and partial settings are optional, allowing for granular updates.
 */
export type UpdateUserInput = {
  /**
   * An updated name for the user, if changing.
   */
  name?: string;

  /**
   * An updated role for the user, if promoting or demoting.
   */
  role?: USER_ROLES;

  /**
   * Partial settings changes for the user, enabling selective preference updates.
   */
  settings?: Partial<UserSettings>;
};

/**
 * Zod schema for validating user update inputs.
 */
export const UpdateUserInputSchema = z.object({
  name: z.string().optional(),
  role: z.nativeEnum(USER_ROLES).optional(),
  settings: UserSettingsSchema.partial().optional(),
});