////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import type { User } from './user'; // Importing User from user.ts (no explicit usage beyond doc referencing)

////////////////////////////////////////////////////////////////////////////////
// ActivityType Enum
////////////////////////////////////////////////////////////////////////////////

/**
 * Enumerates all possible activity types tracked within the system.
 * Each constant represents a distinct action or event performed by users
 * or triggered by system processes in the B2B sales intelligence platform.
 * This comprehensive list covers core business events (e.g., LEAD and CAMPAIGN),
 * email interactions, security events (e.g., LOGIN), and system maintenance tasks.
 */
export enum ActivityType {
  /**
   * Denotes when a new lead has been created in the system.
   * Typically used for analytics on lead generation efficacy.
   */
  LEAD_CREATED = 'LEAD_CREATED',

  /**
   * Denotes when an existing lead record is modified in the system.
   * Often used for tracking data updates and compliance logs.
   */
  LEAD_UPDATED = 'LEAD_UPDATED',

  /**
   * Denotes when a lead record is removed from the system.
   * Critical for auditing deletion events and compliance requirements.
   */
  LEAD_DELETED = 'LEAD_DELETED',

  /**
   * Denotes when a new campaign is created.
   * Used to track outreach or marketing initiatives instantiation.
   */
  CAMPAIGN_CREATED = 'CAMPAIGN_CREATED',

  /**
   * Denotes when a campaign transitions from an idle state to an active or
   * in-progress state, signifying the start of automated outreach or marketing.
   */
  CAMPAIGN_STARTED = 'CAMPAIGN_STARTED',

  /**
   * Denotes when an ongoing campaign is manually paused.
   * Allows for analytics around mid-campaign stops and restarts.
   */
  CAMPAIGN_PAUSED = 'CAMPAIGN_PAUSED',

  /**
   * Denotes when a campaign’s lifecycle is concluded, either by success criteria or expiry.
   */
  CAMPAIGN_COMPLETED = 'CAMPAIGN_COMPLETED',

  /**
   * Denotes when an email is dispatched through the platform’s email service.
   * Useful for understanding email sending volumes and deliverability.
   */
  EMAIL_SENT = 'EMAIL_SENT',

  /**
   * Denotes when the recipient opens an email, typically tracked via email pixel or link.
   */
  EMAIL_OPENED = 'EMAIL_OPENED',

  /**
   * Denotes when a recipient clicks a link within an email,
   * contributing to email engagement metrics.
   */
  EMAIL_CLICKED = 'EMAIL_CLICKED',

  /**
   * Denotes when a recipient replies to a sent email,
   * a key event for measuring engagement success.
   */
  EMAIL_REPLIED = 'EMAIL_REPLIED',

  /**
   * Denotes when a user login action is successful.
   * Critical for session tracking, reporting, and security analytics.
   */
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',

  /**
   * Denotes when a user login attempt fails.
   * Useful for security monitoring, especially around brute-force detection.
   */
  LOGIN_FAILURE = 'LOGIN_FAILURE',

  /**
   * Denotes when the system’s or user’s configuration changes,
   * including updates to settings, preferences, or environment variables.
   */
  CONFIG_CHANGED = 'CONFIG_CHANGED',

  /**
   * Denotes when a backup of the system or specific resource set is created,
   * often used for compliance verification and system maintenance logs.
   */
  BACKUP_CREATED = 'BACKUP_CREATED',

  /**
   * Denotes when data is exported from the system, whether for analytics,
   * compliance, or user-initiated downloads.
   */
  DATA_EXPORTED = 'DATA_EXPORTED',

  /**
   * Denotes when data is permanently removed from the system,
   * either by user request or automated processes.
   */
  DATA_DELETED = 'DATA_DELETED',
}

////////////////////////////////////////////////////////////////////////////////
// ActivityCategory Enum
////////////////////////////////////////////////////////////////////////////////

/**
 * Categorizes activities at a broader level to aid in filtering, analytics,
 * and reporting. Each category groups related activity types under an umbrella
 * for more efficient data segmentation and security posture tracking.
 */
export enum ActivityCategory {
  /**
   * Activities related to lead management, including creation, updates, and deletions.
   */
  LEAD = 'LEAD',

  /**
   * Activities related to campaigns, including creation, starting, pausing, and completion.
   */
  CAMPAIGN = 'CAMPAIGN',

  /**
   * Activities directly related to email events, such as sending, opening, or replying.
   */
  EMAIL = 'EMAIL',

  /**
   * Activities that focus on system operations, configuration changes,
   * backups, or non-security system-level events.
   */
  SYSTEM = 'SYSTEM',

  /**
   * Activities tied to security events, including login successes/failures
   * and potential compliance triggers.
   */
  SECURITY = 'SECURITY',

  /**
   * Activities dedicated to ensuring oversight for compliance procedures,
   * like data export or sensitive record handling.
   */
  COMPLIANCE = 'COMPLIANCE',
}

////////////////////////////////////////////////////////////////////////////////
// ActivitySeverity Enum
////////////////////////////////////////////////////////////////////////////////

/**
 * Classifies the severity level of each activity, assisting in prioritizing
 * responses and logging. Higher severity items (ERROR, CRITICAL) may trigger
 * immediate alerts or escalation.
 */
export enum ActivitySeverity {
  /**
   * Informational only; used for routine system or user actions requiring no follow-up.
   */
  INFO = 'INFO',

  /**
   * Indicates a warning or possibly undesirable yet non-critical event,
   * warranting closer inspection.
   */
  WARNING = 'WARNING',

  /**
   * Represents an error event that might need attention or remediation,
   * though core systems may remain functional.
   */
  ERROR = 'ERROR',

  /**
   * Denotes critical failures, security breaches, or severe data-related issues
   * requiring immediate intervention.
   */
  CRITICAL = 'CRITICAL',
}

////////////////////////////////////////////////////////////////////////////////
// Activity Interface
////////////////////////////////////////////////////////////////////////////////

/**
 * A comprehensive representation of an auditable event or activity occurring in the platform.
 * Designed to serve analytics, security audits, compliance reports, and general event logging.
 * Each field is carefully considered to ensure multi-tenant isolation and granular event detail.
 */
export interface Activity {
  /**
   * Unique identifier for this activity record, typically a UUID for uniqueness.
   */
  id: string;

  /**
   * Specific activity or event type, indicating exactly which action took place.
   */
  type: ActivityType;

  /**
   * Broad classification under which this activity falls for easier filtering and analysis.
   */
  category: ActivityCategory;

  /**
   * Identifier of the organization under which this event took place,
   * ensuring multi-tenant data isolation.
   */
  organizationId: string;

  /**
   * Identifier of the user who performed or triggered this activity.
   * Can be null or a system user ID for automated tasks in certain implementations.
   */
  userId: string;

  /**
   * Identifier of an associated lead, if applicable. Could be null for events
   * not directly tied to a specific lead (e.g., system or security events).
   */
  leadId: string | null;

  /**
   * Identifier of an associated campaign, if applicable. Could be null for events
   * not directly tied to a specific campaign (e.g., login or other user actions).
   */
  campaignId: string | null;

  /**
   * IP address from where this activity originated, crucial for security audits
   * and unusual activity detection.
   */
  ipAddress: string;

  /**
   * User-Agent string of the client/browser/device for this activity,
   * enabling deeper analytics on environment usage and patterns.
   */
  userAgent: string;

  /**
   * Open-ended object for storing additional metadata relevant to the activity,
   * such as system logs, headers, or object snapshots.
   */
  metadata: Record<string, any>;

  /**
   * Timestamp denoting when the activity occurred or was recorded in the system.
   */
  createdAt: Date;

  /**
   * Classification of activity severity for operational and security alerting.
   */
  severity: ActivitySeverity;
}

////////////////////////////////////////////////////////////////////////////////
// CreateActivityInput Interface
////////////////////////////////////////////////////////////////////////////////

/**
 * Defines the payload required to create a new Activity record in the platform.
 * This interface ensures that the essential tracking and audit fields are provided
 * whenever a new event is recorded, supporting security, analytics, and compliance.
 */
export interface CreateActivityInput {
  /**
   * The specific type of activity being recorded (e.g., LEAD_UPDATED, CAMPAIGN_STARTED).
   */
  type: ActivityType;

  /**
   * The category grouping under which this event falls (e.g., EMAIL, SECURITY, COMPLIANCE).
   */
  category: ActivityCategory;

  /**
   * The organization under which this event belongs, critical for multi-tenant isolation.
   */
  organizationId: string;

  /**
   * The user who triggered or is associated with this event.
   * If performed by a system process, an automated user context may be assigned.
   */
  userId: string;

  /**
   * References a specific lead that this activity concerns, if any.
   */
  leadId: string | null;

  /**
   * References a particular campaign that this event is tied to, if any.
   */
  campaignId: string | null;

  /**
   * Provides additional structured or unstructured context about this event,
   * enabling flexible extended logging for future analytics or auditing.
   */
  metadata: Record<string, any>;

  /**
   * Designates the importance and potential impact level of this activity.
   */
  severity: ActivitySeverity;
}