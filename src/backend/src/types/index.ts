/**
 * -------------------------------------------------------------------------------
 * Central Type Definitions Index for the B2B Sales Intelligence Platform
 * -------------------------------------------------------------------------------
 *
 * This file aggregates and re-exports all crucial type definitions, interfaces,
 * and enums used throughout the backend services to enforce strict type safety,
 * comprehensive domain coverage, and multi-tenant data isolation. It consolidates
 * activity tracking types, campaign-related structures, lead management definitions,
 * multi-organizational scopes, user settings, and email sequence data models.
 *
 * System Requirements Addressed:
 * 1. Type Safety:
 *    - Uses TypeScript 5.2+ with strict mode to strongly type complex data models,
 *      preventing runtime errors and enhancing IDE support.
 *
 * 2. Data Structures:
 *    - Provides an extensive set of type exports for all core backend entities,
 *      ensuring consistent references across the entire platform (leads,
 *      campaigns, sequences, organizations, users, activities).
 *
 * 3. Multi-tenant Data Isolation:
 *    - Re-exports types that incorporate organization-level scoping in their design,
 *      adhering to the security and partitioning model critical for enterprise-grade SaaS.
 *
 * 4. Activity Tracking:
 *    - Encompasses interfaces and enums for system-wide event logging. Ensures a
 *      unified approach to capturing lead-related, campaign-related, and security
 *      activities within the platform.
 *
 * All re-exported structures here facilitate robust auditing, compliance, data
 * management, and multi-tenant security, aligning with the system’s technical
 * specification and business requirements.
 */

// -----------------------------------------------------------------------------
// Internal Imports (Local Modules)
// -----------------------------------------------------------------------------
import * as ActivityModule from './activity';
import * as CampaignModule from './campaign';

// NOTE: We provide star exports for these modules to fully aggregate all
// remaining types, including those for leads, organizations, sequences, and users.
export * from './lead';
export * from './organization';
export * from './sequence';
export * from './user';

/**
 * -----------------------------------------------------------------------------
 * Activity Namespace
 * -----------------------------------------------------------------------------
 * Provides a scoped collection of exported activity-tracking definitions that
 * fulfill comprehensive audit logging requirements. This namespace covers:
 *   1. ActivityType (enum)      : Enumerates core event types (e.g., LEAD_CREATED).
 *   2. ActivityCategory (enum)  : Clusters events by domain category (e.g., LEAD).
 *   3. Activity (interface)     : Full detail struct for logs (multi-tenant).
 *   4. CreateActivityInput      : Payload structure for creating new events.
 */
export namespace Activity {
  /**
   * Enumerates specific event types recognized by the platform’s logging system.
   * Examples include LEAD_CREATED, LEAD_UPDATED, EMAIL_SENT, etc.
   */
  export import ActivityType = ActivityModule.ActivityType;

  /**
   * Broadly classifies activity types under categories like LEAD, CAMPAIGN,
   * SECURITY, and COMPLIANCE, simplifying filtering and analytics.
   */
  export import ActivityCategory = ActivityModule.ActivityCategory;

  /**
   * Main interface for an auditable event or log record, storing multi-tenant
   * context, severity, and metadata for compliance and analytics.
   */
  export type Activity = ActivityModule.Activity;

  /**
   * Strictly typed input payload for creating a new activity record. Emphasizes
   * mandatory fields (e.g., type, category, organizationId) for robust auditing.
   */
  export type CreateActivityInput = ActivityModule.CreateActivityInput;
}

/**
 * -----------------------------------------------------------------------------
 * Campaign Namespace
 * -----------------------------------------------------------------------------
 * Groups together the primary campaign-related exports, including status, type,
 * and interfaces defining campaign configuration, metrics, and settings.
 */
export namespace Campaign {
  /**
   * Enum covering potential campaign states from creation to completion or archiving.
   */
  export import CampaignStatus = CampaignModule.CampaignStatus;

  /**
   * Enum specifying campaign type such as OUTREACH, NURTURE, or REACTIVATION.
   */
  export import CampaignType = CampaignModule.CampaignType;

  /**
   * Core campaign interface integrating multi-step email sequences, funnel
   * analytics, security controls, ROI metrics, and advanced scheduling.
   */
  export type Campaign = CampaignModule.Campaign;

  /**
   * Comprehensive metrics object capturing all essential campaign analytics,
   * including email sends, opens, clicks, funnel progress, bounces, and ROI.
   */
  export type CampaignMetrics = CampaignModule.CampaignMetrics;

  /**
   * Covers scheduling windows, daily send caps, security controls, data retention,
   * and tracking toggles for advanced campaign performance insights.
   */
  export type CampaignSettings = CampaignModule.CampaignSettings;
}
```