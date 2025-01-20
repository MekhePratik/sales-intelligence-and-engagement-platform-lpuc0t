////////////////////////////////////////////////////////////////////////////////
// External Imports
////////////////////////////////////////////////////////////////////////////////

import { z } from 'zod'; // zod ^3.22.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import type { Organization } from './organization'; // For organizationId references
import type { User } from './user'; // For creatorId references
import type { Lead } from './lead'; // Potential usage for leads referencing
import { ActivityType } from './activity'; // Specifically leveraging EMAIL_SENT, EMAIL_OPENED, EMAIL_CLICKED in analytics

////////////////////////////////////////////////////////////////////////////////
// Data Classification
////////////////////////////////////////////////////////////////////////////////

/**
 * Enumerates data classification levels for sensitive information in campaigns.
 * Helps address security and compliance by categorizing the confidentiality
 * of email template data.
 */
export enum DataClassification {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED',
}

/**
 * Zod schema enumerating valid DataClassification values.
 */
export const DataClassificationSchema = z.nativeEnum(DataClassification);

////////////////////////////////////////////////////////////////////////////////
// StepCondition
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents conditions used to determine logic flow within an email sequence.
 * Could represent time-based waiting conditions, or checks against lead activity
 * such as opens/clicks.
 */
export interface StepCondition {
  /**
   * A unique identifier for the condition definition, if multiple conditions exist.
   */
  conditionId: string;
  /**
   * A textual label describing the purpose or type of this condition.
   */
  conditionType: string;
  /**
   * Operator used in evaluating the condition, e.g., "EQUALS", "GREATER_THAN", etc.
   */
  operator: string;
  /**
   * The field or metric being evaluated, e.g., "openRate", "clickRate".
   */
  field: string;
  /**
   * The target value or threshold, could be a string or numeric type depending on conditionType.
   */
  value: string | number;
}

/**
 * Zod schema for StepCondition, enabling runtime validation of any condition-based step logic.
 */
export const StepConditionSchema = z.object({
  conditionId: z.string(),
  conditionType: z.string(),
  operator: z.string(),
  field: z.string(),
  value: z.union([z.string(), z.number()]),
});

////////////////////////////////////////////////////////////////////////////////
// ABTestCriteria
////////////////////////////////////////////////////////////////////////////////

/**
 * Specifies how A/B test performance is evaluated across email variants,
 * including which metrics are considered and over what time window the system
 * chooses a "winner."
 */
export interface ABTestCriteria {
  /**
   * Metric used to evaluate the A/B test performance, e.g. "OPEN_RATE", "CLICK_RATE", "REPLY_RATE".
   */
  evaluationMetric: string;
  /**
   * The time window (in hours) after sending an email variant, during which
   * the system tracks performance metrics before selecting a winner.
   */
  evaluationWindowHours: number;
  /**
   * Defines how the winner is chosen once the evaluation metric is collected,
   * e.g. "BEST_PERFORMER", "FIRST_TO_THRESHOLD".
   */
  winnerSelectionMethod: string;
}

/**
 * Zod schema for ABTestCriteria, used in sequence step variants for advanced A/B testing logic.
 */
export const ABTestCriteriaSchema = z.object({
  evaluationMetric: z.string(),
  evaluationWindowHours: z.number(),
  winnerSelectionMethod: z.string(),
});

////////////////////////////////////////////////////////////////////////////////
// CampaignStatus
////////////////////////////////////////////////////////////////////////////////

/**
 * Enumeration of possible campaign statuses.
 */
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Zod schema enumerating valid CampaignStatus values.
 */
export const CampaignStatusSchema = z.nativeEnum(CampaignStatus);

////////////////////////////////////////////////////////////////////////////////
// CampaignType
////////////////////////////////////////////////////////////////////////////////

/**
 * Types of email campaigns supported by the platform.
 */
export enum CampaignType {
  OUTREACH = 'OUTREACH',
  NURTURE = 'NURTURE',
  REACTIVATION = 'REACTIVATION',
}

/**
 * Zod schema enumerating valid CampaignType values.
 */
export const CampaignTypeSchema = z.nativeEnum(CampaignType);

////////////////////////////////////////////////////////////////////////////////
// SequenceStepType
////////////////////////////////////////////////////////////////////////////////

/**
 * Types of steps in an email sequence, e.g., an email sending action,
 * a waiting period, or a conditional logic branch.
 */
export enum SequenceStepType {
  EMAIL = 'EMAIL',
  WAIT = 'WAIT',
  CONDITION = 'CONDITION',
}

/**
 * Zod schema enumerating valid SequenceStepType values.
 */
export const SequenceStepTypeSchema = z.nativeEnum(SequenceStepType);

////////////////////////////////////////////////////////////////////////////////
// EmailTemplate
////////////////////////////////////////////////////////////////////////////////

/**
 * Interface for email template configuration with security enhancements.
 * Provides the ability to classify data sensitivity, support encryption,
 * and define placeholders for dynamic variables.
 */
export interface EmailTemplate {
  /**
   * Subject line for the email.
   */
  subject: string;
  /**
   * Body of the email, potentially containing template variables (e.g., {{firstName}}).
   */
  body: string;
  /**
   * List of string placeholders used in the template, e.g. ["firstName", "companyName"].
   */
  variables: string[];
  /**
   * Indicates if the email body is encrypted at rest for security and compliance.
   */
  isEncrypted: boolean;
  /**
   * Data classification level for the email template (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED).
   */
  dataClassification: DataClassification;
}

/**
 * Zod schema for EmailTemplate, enforcing strong validation of security and content fields.
 */
export const EmailTemplateSchema = z.object({
  subject: z.string(),
  body: z.string(),
  variables: z.array(z.string()),
  isEncrypted: z.boolean(),
  dataClassification: DataClassificationSchema,
});

////////////////////////////////////////////////////////////////////////////////
// SequenceStep
////////////////////////////////////////////////////////////////////////////////

/**
 * A single step within an overall email sequence, possibly sending an email,
 * waiting a specified duration, or applying a condition. Supports variants
 * for A/B testing with distribution weighting, plus winner selection criteria.
 */
export interface SequenceStep {
  /**
   * Unique identifier for the step.
   */
  id: string;
  /**
   * The type of step (EMAIL, WAIT, CONDITION).
   */
  type: SequenceStepType;
  /**
   * Template used for email sending, if type = EMAIL.
   */
  template: EmailTemplate;
  /**
   * Delay in hours or days before executing this step, e.g. wait 48 hours.
   */
  delay: number;
  /**
   * Conditional logic that determines if or when to proceed, relevant if type = CONDITION.
   */
  condition: StepCondition;
  /**
   * Collection of different email variants in an A/B scenario.
   */
  variants: EmailTemplate[];
  /**
   * Distribution weights for each email variant in an A/B test scenario,
   * total across all entries should sum to 100% (or 1.0).
   */
  variantDistribution: number[];
  /**
   * Criteria used to determine a winning variant for subsequent sends.
   */
  winnerCriteria: ABTestCriteria;
}

/**
 * Zod schema enabling runtime validation of SequenceStep configurations.
 */
export const SequenceStepSchema = z.object({
  id: z.string(),
  type: SequenceStepTypeSchema,
  template: EmailTemplateSchema,
  delay: z.number(),
  condition: StepConditionSchema,
  variants: z.array(EmailTemplateSchema),
  variantDistribution: z.array(z.number()),
  winnerCriteria: ABTestCriteriaSchema,
});

////////////////////////////////////////////////////////////////////////////////
// VariantMetrics
////////////////////////////////////////////////////////////////////////////////

/**
 * Tracks performance data tied specifically to an individual email variant
 * in an A/B test scenario. Useful for deciding which template yields the best
 * open, click, or conversion rates.
 */
export interface VariantMetrics {
  /**
   * The internal or step-level ID associating metrics to a particular variant.
   */
  variantId: string;
  /**
   * Number of emails sent for this variant.
   */
  emailsSent: number;
  /**
   * Number of emails in this variant that were opened.
   */
  emailsOpened: number;
  /**
   * Number of recipients that clicked links within this variant.
   */
  emailsClicked: number;
  /**
   * Number of replies for this variant, if tracked.
   */
  emailsReplied: number;
}

/**
 * Zod schema for VariantMetrics, used to gather data on each tested variant.
 */
export const VariantMetricsSchema = z.object({
  variantId: z.string(),
  emailsSent: z.number(),
  emailsOpened: z.number(),
  emailsClicked: z.number(),
  emailsReplied: z.number(),
});

////////////////////////////////////////////////////////////////////////////////
// ROIMetrics
////////////////////////////////////////////////////////////////////////////////

/**
 * Stores Return on Investment (ROI) metrics at the campaign level, capturing
 * cost and revenue data for calculating the financial effectiveness of outreach.
 */
export interface ROIMetrics {
  /**
   * The monetary cost associated with the campaign (e.g., ad spend, tools, resources).
   */
  cost: number;
  /**
   * The monetary revenue generated as a result of the campaign.
   */
  revenue: number;
  /**
   * Computed ratio or percentage representing the net return on the campaign investment.
   */
  roiValue: number;
  /**
   * Additional comment explaining or contextualizing ROI outcomes.
   */
  note: string;
}

/**
 * Zod schema for ROIMetrics, validating cost and revenue details for campaigns.
 */
export const ROIMetricsSchema = z.object({
  cost: z.number(),
  revenue: z.number(),
  roiValue: z.number(),
  note: z.string(),
});

////////////////////////////////////////////////////////////////////////////////
// FunnelMetrics
////////////////////////////////////////////////////////////////////////////////

/**
 * Tracks funnel progression metrics for the campaign, from initial leads
 * to final conversion states. Helps identify drop-off points within the sequence.
 */
export interface FunnelMetrics {
  /**
   * Number of leads who started at the top of the funnel (initial exposure).
   */
  initialTouch: number;
  /**
   * Number of leads who responded or showed interest at some mid-funnel stage.
   */
  engagement: number;
  /**
   * Number of leads who scheduled a meeting, demo, or deeper engagement step.
   */
  opportunity: number;
  /**
   * Number of leads who converted into actual paying customers or deals.
   */
  conversion: number;
}

/**
 * Zod schema for FunnelMetrics, assisting in visualizing lead progress within the funnel.
 */
export const FunnelMetricsSchema = z.object({
  initialTouch: z.number(),
  engagement: z.number(),
  opportunity: z.number(),
  conversion: z.number(),
});

////////////////////////////////////////////////////////////////////////////////
// CampaignMetrics
////////////////////////////////////////////////////////////////////////////////

/**
 * Comprehensive campaign performance metrics, covering volume-based stats
 * (e.g., emailsSent) alongside funnel-based analytics (conversionFunnel),
 * ROI calculations, and variant-level detail for A/B testing success.
 */
export interface CampaignMetrics {
  /**
   * Total number of leads targeted by the campaign.
   */
  totalLeads: number;
  /**
   * Number of emails sent throughout the campaign.
   */
  emailsSent: number;
  /**
   * Number of opened emails recorded during the campaign.
   */
  emailsOpened: number;
  /**
   * Number of email click events recorded during the campaign.
   */
  emailsClicked: number;
  /**
   * Number of replies or responses recorded for the campaign emails.
   */
  responses: number;
  /**
   * Number of leads converted (based on campaign objective or definition).
   */
  conversions: number;
  /**
   * Number of bounced emails.
   */
  bounces: number;
  /**
   * Number of recipients who unsubscribed during the campaign.
   */
  unsubscribes: number;
  /**
   * Collection of variant-level metrics for any A/B tests conducted.
   */
  variantPerformance: VariantMetrics[];
  /**
   * ROI metrics capturing cost, revenue, and net gain from the campaign.
   */
  roi: ROIMetrics;
  /**
   * Funnel metrics representing lead movement through the pipeline.
   */
  conversionFunnel: FunnelMetrics;
}

/**
 * Zod schema for CampaignMetrics, merging multiple sub-schemas for analytics data tracking.
 */
export const CampaignMetricsSchema = z.object({
  totalLeads: z.number(),
  emailsSent: z.number(),
  emailsOpened: z.number(),
  emailsClicked: z.number(),
  responses: z.number(),
  conversions: z.number(),
  bounces: z.number(),
  unsubscribes: z.number(),
  variantPerformance: z.array(VariantMetricsSchema),
  roi: ROIMetricsSchema,
  conversionFunnel: FunnelMetricsSchema,
});

////////////////////////////////////////////////////////////////////////////////
// DataRetentionPolicy
////////////////////////////////////////////////////////////////////////////////

/**
 * Defines how campaign-related data is retained over time,
 * for compliance with data protection and privacy regulations.
 */
export interface DataRetentionPolicy {
  /**
   * Duration (in days) for which campaign data is retained.
   */
  retentionDays: number;
  /**
   * Whether data should be automatically archived after the retention period.
   */
  autoArchive: boolean;
  /**
   * Whether data should be permanently erased after final archival.
   */
  autoDelete: boolean;
}

/**
 * Zod schema for DataRetentionPolicy, assisting in the enforcement
 * of compliance-driven data lifecycle management.
 */
export const DataRetentionPolicySchema = z.object({
  retentionDays: z.number(),
  autoArchive: z.boolean(),
  autoDelete: z.boolean(),
});

////////////////////////////////////////////////////////////////////////////////
// SecuritySettings
////////////////////////////////////////////////////////////////////////////////

/**
 * Identifies security controls applied to a campaign, possibly including
 * encryption toggles, notifications for suspicious activity, or 2FA requirements
 * for campaign editing.
 */
export interface SecuritySettings {
  /**
   * Indicates if all email templates and associated data should be encrypted at rest.
   */
  encryptTemplates: boolean;
  /**
   * Indicates if link tracking for open/click/engagement metrics is enabled.
   */
  secureLinkTracking: boolean;
  /**
   * Additional security notes or an open key-value to store custom flags.
   */
  extraSecurityFlags: Record<string, any>;
}

/**
 * Zod schema for SecuritySettings, providing a structure for advanced
 * campaign security measures.
 */
export const SecuritySettingsSchema = z.object({
  encryptTemplates: z.boolean(),
  secureLinkTracking: z.boolean(),
  extraSecurityFlags: z.record(z.any()),
});

////////////////////////////////////////////////////////////////////////////////
// CampaignSettings
////////////////////////////////////////////////////////////////////////////////

/**
 * Interface for campaign configuration settings with enhanced security,
 * including daily email caps, tracking toggles, and data retention policies.
 */
export interface CampaignSettings {
  /**
   * Time window (start and end in HH:mm format) during which emails may be sent.
   */
  sendingWindow: { start: string; end: string };
  /**
   * Timezone used to interpret the sending window, e.g., "America/New_York".
   */
  timezone: string;
  /**
   * Maximum allowable number of emails to be sent per day by this campaign.
   */
  maxEmailsPerDay: number;
  /**
   * Whether open tracking is enabled for the campaign.
   */
  trackOpens: boolean;
  /**
   * Whether click tracking is enabled for the campaign.
   */
  trackClicks: boolean;
  /**
   * Indicates if the campaign is leveraging A/B testing steps.
   */
  abTesting: boolean;
  /**
   * Defines the data retention rules for the campaign.
   */
  dataRetention: DataRetentionPolicy;
  /**
   * Security parameters safeguarding the campaign's email content and metrics.
   */
  securityControls: SecuritySettings;
}

/**
 * Zod schema for CampaignSettings, guaranteeing validity of time windows,
 * tracking toggles, and retention policies.
 */
export const CampaignSettingsSchema = z.object({
  sendingWindow: z.object({
    start: z.string(),
    end: z.string(),
  }),
  timezone: z.string(),
  maxEmailsPerDay: z.number(),
  trackOpens: z.boolean(),
  trackClicks: z.boolean(),
  abTesting: z.boolean(),
  dataRetention: DataRetentionPolicySchema,
  securityControls: SecuritySettingsSchema,
});

////////////////////////////////////////////////////////////////////////////////
// CampaignGoals
////////////////////////////////////////////////////////////////////////////////

/**
 * Specifies desired outcomes or targets for the campaign, such as
 * target number of replies, conversions, or scheduled calls. Assists
 * with measuring overall success.
 */
export interface CampaignGoals {
  /**
   * A textual label describing the specific goal (e.g., "Get 50 replies").
   */
  description: string;
  /**
   * Numeric target associated with the campaign goal (e.g., 50, 100).
   */
  targetValue: number;
  /**
   * Date by which the goal should be achieved, if relevant.
   */
  dueDate: Date | null;
}

/**
 * Zod schema for CampaignGoals, ensuring that each campaign can define
 * quantifiable goals or objectives.
 */
export const CampaignGoalsSchema = z.object({
  description: z.string(),
  targetValue: z.number(),
  dueDate: z.date().nullable(),
});

////////////////////////////////////////////////////////////////////////////////
// AuditEvent
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents an individual event in the campaign's audit trail,
 * tracking significant actions like step additions, template changes,
 * or scheduling updates for compliance and historical record.
 */
export interface AuditEvent {
  /**
   * Unique identifier for the audit event record.
   */
  id: string;
  /**
   * The activity type enumerating the event (e.g., EMAIL_SENT, EMAIL_OPENED).
   */
  activityType: ActivityType;
  /**
   * Timestamp capturing when this audit entry was created.
   */
  createdAt: Date;
  /**
   * Additional data related to the event, stored as key-value pairs.
   */
  metadata: Record<string, any>;
}

/**
 * Zod schema for AuditEvent to track and validate event logs on campaigns.
 */
export const AuditEventSchema = z.object({
  id: z.string(),
  activityType: z.nativeEnum(ActivityType),
  createdAt: z.date(),
  metadata: z.record(z.any()),
});

////////////////////////////////////////////////////////////////////////////////
// Campaign
////////////////////////////////////////////////////////////////////////////////

/**
 * Main interface for email campaign configuration. Integrates sequence steps
 * for outreach, targets leads, provides performance metrics, and addresses
 * security/compliance considerations through settings and data retention.
 */
export interface Campaign {
  /**
   * Unique identifier for this campaign.
   */
  id: string;
  /**
   * Descriptive name to identify the campaign.
   */
  name: string;
  /**
   * Brief textual summary of the campaign's purpose or scope.
   */
  description: string;
  /**
   * The type of campaign (OUTREACH, NURTURE, REACTIVATION).
   */
  type: CampaignType;
  /**
   * Current campaign status (DRAFT, SCHEDULED, ACTIVE, etc.).
   */
  status: CampaignStatus;
  /**
   * Ordered array of steps that define emailing or waiting sequences.
   */
  steps: SequenceStep[];
  /**
   * Reference to the organization owning this campaign.
   */
  organizationId: Organization['id'];
  /**
   * Reference to the user who created the campaign.
   */
  creatorId: User['id'];
  /**
   * Array of lead identifiers to be targeted by the campaign.
   */
  targetLeads: string[];
  /**
   * Performance metrics measuring engagement, funnel progression, and ROI.
   */
  metrics: CampaignMetrics;
  /**
   * Detailed configuration controlling the campaign's security, scheduling, etc.
   */
  settings: CampaignSettings;
  /**
   * Goals or benchmarks that define success for this campaign.
   */
  goals: CampaignGoals;
  /**
   * Log of audit events describing changes or key actions in the campaign lifecycle.
   */
  auditTrail: AuditEvent[];
  /**
   * Date/time when the campaign is scheduled to start or actually started.
   */
  startDate: Date;
  /**
   * Date/time when the campaign is scheduled to finish or actually ended.
   */
  endDate: Date;
  /**
   * Timestamp indicating when the campaign was initially created in the system.
   */
  createdAt: Date;
  /**
   * Timestamp indicating the last time the campaign entity was updated.
   */
  updatedAt: Date;
}

/**
 * Zod schema for Campaign, comprehensively validating all campaign properties,
 * including references to nested sub-schemas for steps, settings, and metrics.
 */
export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: CampaignTypeSchema,
  status: CampaignStatusSchema,
  steps: z.array(SequenceStepSchema),
  organizationId: z.string(),
  creatorId: z.string(),
  targetLeads: z.array(z.string()),
  metrics: CampaignMetricsSchema,
  settings: CampaignSettingsSchema,
  goals: CampaignGoalsSchema,
  auditTrail: z.array(AuditEventSchema),
  startDate: z.date(),
  endDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});