/**
 * Extensive data structures and runtime validation schemas
 * for multi-tenant organization support in the B2B Sales Intelligence Platform.
 */

///////////////////////////////////////
// External Imports
///////////////////////////////////////

import { z } from 'zod'; // zod ^3.22.0

///////////////////////////////////////
// Feature Flags
///////////////////////////////////////

/**
 * FeatureFlags interface describing various feature toggles
 * that control optional or premium functionalities available
 * to an organization in a multi-tenant setup.
 */
export interface FeatureFlags {
  /**
   * Indicates if AI-powered lead enrichment is enabled.
   */
  aiEnrichment: boolean;

  /**
   * Indicates if advanced analytics features are enabled.
   */
  advancedAnalytics: boolean;

  /**
   * Indicates if the organization can apply custom branding.
   */
  customBranding: boolean;
}

/**
 * Zod schema for FeatureFlags, enforcing runtime validation.
 */
export const FeatureFlagsSchema = z.object({
  aiEnrichment: z.boolean(),
  advancedAnalytics: z.boolean(),
  customBranding: z.boolean(),
});

///////////////////////////////////////
// Usage Limits
///////////////////////////////////////

/**
 * UsageLimits interface setting resource usage constraints
 * for the organization such as maximum leads, campaigns, etc.
 */
export interface UsageLimits {
  /**
   * Maximum number of users that can be created under this organization.
   */
  maxUsers: number;

  /**
   * Maximum number of leads allowed under this organization.
   */
  maxLeads: number;

  /**
   * Maximum number of campaigns that can be created.
   */
  maxCampaigns: number;

  /**
   * Limit on the number of emails that can be sent per day.
   */
  emailsPerDay: number;
}

/**
 * Zod schema for UsageLimits providing runtime enforcement
 * of organization-level usage constraints.
 */
export const UsageLimitsSchema = z.object({
  maxUsers: z.number(),
  maxLeads: z.number(),
  maxCampaigns: z.number(),
  emailsPerDay: z.number(),
});

///////////////////////////////////////
// Organization Settings
///////////////////////////////////////

/**
 * OrganizationSettings interface encapsulating configuration options,
 * feature flags, and usage limits that apply to the entire organization.
 */
export interface OrganizationSettings {
  /**
   * The primary email domain for the organization (used for outbound emails).
   */
  emailDomain: string;

  /**
   * Feature flags controlling functionality toggles for this organization.
   */
  features: FeatureFlags;

  /**
   * Usage limits setting the resource constraints for the organization.
   */
  limits: UsageLimits;
}

/**
 * Zod schema for OrganizationSettings, including nested
 * schemas for features and usage limits.
 */
export const OrganizationSettingsSchema = z.object({
  emailDomain: z.string(),
  features: FeatureFlagsSchema,
  limits: UsageLimitsSchema,
});

///////////////////////////////////////
// Core Organization Interface
///////////////////////////////////////

/**
 * Core organization interface representing a multi-tenant
 * tenant entity in the system. Manages data isolation,
 * user membership, and advanced configuration.
 */
export interface Organization {
  /**
   * Unique identifier string for this organization.
   */
  id: string;

  /**
   * Name of the organization (e.g., company name).
   */
  name: string;

  /**
   * Primary domain used to differentiate tenant data
   * and for data security and isolation.
   */
  domain: string;

  /**
   * Detailed settings and configurations at the
   * organization level.
   */
  settings: OrganizationSettings;

  /**
   * Collection of user IDs that belong to this organization.
   */
  userIds: string[];

  /**
   * Timestamp indicating when the organization was created.
   */
  createdAt: Date;

  /**
   * Timestamp indicating the last time the organization
   * entity was updated.
   */
  updatedAt: Date;
}

/**
 * Zod schema for Organization, used for runtime validation
 * and data enforcement across the system.
 */
export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  settings: OrganizationSettingsSchema,
  userIds: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

///////////////////////////////////////
// CreateOrganizationInput
///////////////////////////////////////

/**
 * Input type utilized when creating a new organization
 * in the system. Ensures that essential fields are set
 * and allows partial settings for initial configuration.
 */
export type CreateOrganizationInput = {
  /**
   * Name of the new organization.
   */
  name: string;

  /**
   * Domain useful for multi-tenant data identification.
   */
  domain: string;

  /**
   * Partial settings to allow minimal or advanced configuration.
   */
  settings: Partial<OrganizationSettings>;
};

/**
 * Zod schema for validating data when creating a new organization.
 * Leverages partial settings to allow minimal specification of configs.
 */
export const CreateOrganizationInputSchema = z.object({
  name: z.string(),
  domain: z.string(),
  settings: OrganizationSettingsSchema.partial(),
});

///////////////////////////////////////
// UpdateOrganizationInput
///////////////////////////////////////

/**
 * Input type used when updating an existing organization.
 * Fields may be omitted if unchanged, consistently enabling
 * partial updates.
 */
export type UpdateOrganizationInput = {
  /**
   * Possibly updated name for the organization.
   */
  name?: string;

  /**
   * Partial organization settings for updating only portions
   * of the existing configuration.
   */
  settings?: Partial<OrganizationSettings>;
};

/**
 * Zod schema for validating data when updating an existing organization.
 * Optional fields permit partial updates for name or settings.
 */
export const UpdateOrganizationInputSchema = z.object({
  name: z.string().optional(),
  settings: OrganizationSettingsSchema.partial().optional(),
});