/////////////////////////////////////////////////////////////////
// External Imports
/////////////////////////////////////////////////////////////////

/**
 * zod ^3.22.0
 * Runtime type validation library for ensuring robust data
 * integrity across campaign-related interfaces and schemas.
 */
import { z } from 'zod';

/**
 * Importing the Lead interface for campaign targeting.
 * We specifically utilize the 'id' and 'email' fields
 * from the Lead interface to track which leads are
 * recipients of a given campaign.
 */
import type { Lead } from '../types/lead'; 

/////////////////////////////////////////////////////////////////
// Enums & Schemas
/////////////////////////////////////////////////////////////////

/**
 * CampaignStatus enum lists all possible lifecycle states
 * that an email campaign can occupy in this platform.
 * This supports high-level management and filtering of
 * campaigns within the application.
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
 * CampaignStatusSchema is the zod schema for enumerating
 * valid campaign statuses, ensuring no invalid states
 * are introduced at runtime.
 */
export const CampaignStatusSchema = z.enum([
  CampaignStatus.DRAFT,
  CampaignStatus.SCHEDULED,
  CampaignStatus.ACTIVE,
  CampaignStatus.PAUSED,
  CampaignStatus.COMPLETED,
  CampaignStatus.ARCHIVED,
]);

/////////////////////////////////////////////////////////////////
// CampaignMetrics Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * CampaignMetrics provides a comprehensive set of
 * performance indicators for any email campaign,
 * covering everything from lead volume to revenue
 * and returns on investment.
 */
export interface CampaignMetrics {
  /**
   * Total number of leads targeted by the campaign.
   */
  totalLeads: number;

  /**
   * Total emails sent within this campaign.
   */
  emailsSent: number;

  /**
   * Number of emails opened by recipients.
   */
  emailsOpened: number;

  /**
   * Number of recipients who clicked on at least
   * one link in the campaign emails.
   */
  emailsClicked: number;

  /**
   * Number of direct email replies or responses
   * captured by the system.
   */
  responses: number;

  /**
   * Number of leads that converted (literal
   * definition of conversion depends on campaign type).
   */
  conversions: number;

  /**
   * Percentage of successfully delivered emails,
   * computed as (emailsSent - bounces) / emailsSent.
   */
  deliveryRate: number;

  /**
   * The count of emails that bounced, possibly
   * due to invalid addresses or server errors.
   */
  bounces: number;

  /**
   * The count of spam complaints or abuse reports
   * triggered by this campaign.
   */
  spamReports: number;

  /**
   * Number of recipients who unsubscribed via
   * a campaign link or direct request.
   */
  unsubscribes: number;

  /**
   * The total revenue generated (in unit currency)
   * that can be attributed or correlated to this campaign.
   */
  revenueGenerated: number;

  /**
   * Return on investment metric for the campaign,
   * typically (revenue - cost) / cost, represented
   * as a number.
   */
  roi: number;
}

/**
 * CampaignMetricsSchema applies runtime validation
 * on each field of CampaignMetrics to ensure
 * correctness and numerical consistency.
 */
export const CampaignMetricsSchema = z.object({
  totalLeads: z.number(),
  emailsSent: z.number(),
  emailsOpened: z.number(),
  emailsClicked: z.number(),
  responses: z.number(),
  conversions: z.number(),
  deliveryRate: z.number(),
  bounces: z.number(),
  spamReports: z.number(),
  unsubscribes: z.number(),
  revenueGenerated: z.number(),
  roi: z.number(),
});

/////////////////////////////////////////////////////////////////
// CampaignSettings Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * CampaignSettings captures configuration properties
 * that govern how and when emails are sent, along with
 * security features, retry strategies, and optional
 * A/B testing configuration.
 */
export interface CampaignSettings {
  /**
   * sendingWindow defines the acceptable start and end times
   * for sending emails in this campaign. Times should be
   * expressed in a 24-hour format (e.g. "08:00").
   */
  sendingWindow: {
    start: string;
    end: string;
  };

  /**
   * timezone denotes the timezone associated with the
   * sendingWindow, e.g., "America/New_York".
   */
  timezone: string;

  /**
   * maxEmailsPerDay limits the maximum number of emails
   * the campaign can send in a single 24-hour period.
   */
  maxEmailsPerDay: number;

  /**
   * trackOpens indicates whether or not to embed open
   * tracking elements (e.g. tracking pixels) in emails.
   */
  trackOpens: boolean;

  /**
   * trackClicks controls whether clickable links in
   * emails should be routed through a tracking service
   * to log all click events.
   */
  trackClicks: boolean;

  /**
   * abTesting signals if the campaign is configured
   * to split test multiple variants for subject lines
   * or email content.
   */
  abTesting: boolean;

  /**
   * retryStrategy dictates how the system retries sending
   * an email upon an initial failure. maxAttempts defines
   * the maximum tries, while delay (in minutes) is the gap
   * between consecutive attempts.
   */
  retryStrategy: {
    maxAttempts: number;
    delay: number;
  };

  /**
   * customHeaders is a key-value dictionary for
   * custom email headers, potentially used for advanced
   * email client interactions or special logging.
   */
  customHeaders: Record<string, string>;

  /**
   * securitySettings configures DKIM and SPF validations
   * on outgoing emails, reinforcing deliverability
   * and domain reputation.
   */
  securitySettings: {
    dkimEnabled: boolean;
    spfEnabled: boolean;
  };
}

/**
 * CampaignSettingsSchema provides runtime
 * validation rules for all fields in the
 * CampaignSettings interface. This ensures that
 * sending windows, security preferences, and
 * advanced features are consistently defined.
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
  retryStrategy: z.object({
    maxAttempts: z.number(),
    delay: z.number(),
  }),
  customHeaders: z.record(z.string()),
  securitySettings: z.object({
    dkimEnabled: z.boolean(),
    spfEnabled: z.boolean(),
  }),
});

/////////////////////////////////////////////////////////////////
// Sequence Structures (Optional: Extended for Email Automation)
/////////////////////////////////////////////////////////////////

/**
 * CampaignSequenceStep represents a single step in
 * an automated email workflow. Each step defines when
 * to send an email (after a given delay), which template
 * or content to use, and optionally a specific variant
 * for A/B testing.
 */
export interface CampaignSequenceStep {
  /**
   * Zero-based step index to preserve ordering
   * in the sequence. The platform uses stepOrder
   * to maintain which step runs first, second, etc.
   */
  stepOrder: number;

  /**
   * Delay in hours after the previous step or
   * after this campaign starts for day 0. A value
   * of 24 means wait one day after the prior step.
   */
  delayHours: number;

  /**
   * Unique identifier for the email template to be used
   * in this step. The content, subject, and personalization
   * can be dynamically loaded at runtime.
   */
  templateId: string;

  /**
   * Optionally track which variant (A or B) is used,
   * especially during A/B testing campaigns.
   */
  variant?: 'A' | 'B';
}

/**
 * CampaignSequenceStepSchema enforces valid step ordering,
 * template references, optional variant assignments, and
 * a numeric delay. This is critical for the sequence builder
 * functionality.
 */
export const CampaignSequenceStepSchema = z.object({
  stepOrder: z.number(),
  delayHours: z.number(),
  templateId: z.string(),
  variant: z.enum(['A', 'B']).optional(),
});

/**
 * CampaignSequence comprises an ordered list of steps that
 * define how email workflows progress over time. This allows
 * multiple steps (e.g., initial email, follow-up after 3 days,
 * final reminder after 1 week) to be organized.
 */
export interface CampaignSequence {
  /**
   * The name for this sequence, used to differentiate between
   * multiple sequences in advanced or large-scale campaigns.
   */
  sequenceName: string;

  /**
   * The ordered steps for this campaign's email sequence.
   */
  steps: CampaignSequenceStep[];
}

/**
 * CampaignSequenceSchema ensures that sequence definitions
 * include a valid name and an array of steps, each step
 * passing the CampaignSequenceStepSchema checks.
 */
export const CampaignSequenceSchema = z.object({
  sequenceName: z.string(),
  steps: z.array(CampaignSequenceStepSchema),
});

/////////////////////////////////////////////////////////////////
// Core Campaign Interface & Schema (Optional)
/////////////////////////////////////////////////////////////////

/**
 * Campaign interface captures all necessary fields for
 * managing a campaign end-to-end, including recipients,
 * scheduling, metrics, and advanced email automation
 * settings. Though not explicitly listed in the exports
 * table, this interface is provided for completeness
 * and may be useful in the application domain.
 */
export interface Campaign {
  /**
   * Unique identifier of the campaign record.
   */
  id: string;

  /**
   * Human-readable name or label for the
   * campaign.
   */
  name: string;

  /**
   * Overall campaign status, referencing the
   * CampaignStatus enum.
   */
  status: CampaignStatus;

  /**
   * Configuration settings that dictate how emails
   * are sent, tracked, and retried.
   */
  settings: CampaignSettings;

  /**
   * This includes advanced metrics to analyze
   * performance. Thorough analytics are critical
   * for conversion optimization and ROI measurement.
   */
  metrics: CampaignMetrics;

  /**
   * A list of leads that are targeted by this campaign.
   * Only grabbing 'id' and 'email' properties from
   * the Lead interface for the purpose of lightweight
   * storing or referencing.
   */
  recipients: Array<Pick<Lead, 'id' | 'email'>>;

  /**
   * Optional sequence defining the multi-step email
   * automation flow, including timed follow-ups and
   * variant testing steps.
   */
  sequence?: CampaignSequence;

  /**
   * Timestamp indicating when the campaign was initially
   * created, allowing for chronological sorting.
   */
  createdAt: Date;

  /**
   * Timestamp for the most recent update to the campaign,
   * useful for concurrency checks and audit trails.
   */
  updatedAt: Date;
}

/**
 * CampaignSchema imposes runtime checks on each field
 * in the Campaign interface, ensuring that campaigns
 * are well-formed when created or updated.
 */
export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: CampaignStatusSchema,
  settings: CampaignSettingsSchema,
  metrics: CampaignMetricsSchema,
  recipients: z.array(
    // We only pick the 'id' and 'email' from a lead schema
    // at runtime if we had imported the entire schema.
    // This preserves data minimization while referencing
    // essential lead identification and contact info.
    z.object({
      id: z.string(),
      email: z.string().email(),
    })
  ),
  sequence: CampaignSequenceSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/////////////////////////////////////////////////////////////////
// Exports
/////////////////////////////////////////////////////////////////

/**
 * Exporting the core constructs for external usage:
 * 1) CampaignStatus enum
 * 2) CampaignMetrics interface
 * 3) CampaignSettings interface
 *
 * Additional interfaces and schemas (Campaign, CampaignSequence, etc.)
 * are also exported for optional usage throughout the application.
 */
export {
  CampaignStatus,
  CampaignMetrics,
  CampaignSettings,
};