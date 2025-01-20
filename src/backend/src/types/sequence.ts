////////////////////////////////////////////////////////////////////////////////
// External Imports
////////////////////////////////////////////////////////////////////////////////

import { z } from 'zod'; // zod ^3.22.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import { Campaign } from './campaign'; // For campaignId references
import { Lead } from './lead';         // Potential references for lead-related expansions
import { ActivityType } from './activity'; // Specifically can leverage EMAIL_SENT, EMAIL_OPENED for step tracking

////////////////////////////////////////////////////////////////////////////////
// SequenceStatus Enum and Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Enumeration of sequence execution statuses, reflecting the overall state
 * of a given email sequence as it moves from initial draft to completion.
 */
export enum SequenceStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

/**
 * Zod schema enumerating valid SequenceStatus values.
 */
export const SequenceStatusSchema = z.nativeEnum(SequenceStatus);

////////////////////////////////////////////////////////////////////////////////
// SequenceStepType Enum and Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Declares the different types of steps that may appear in a sequence.
 * - EMAIL: A step responsible for sending emails.
 * - WAIT: A timed delay before moving to the next step.
 * - CONDITION: A logic-based branching step, evaluating success or open/click rates.
 * - AB_TEST: A step that performs A/B testing across multiple email variants.
 */
export enum SequenceStepType {
  EMAIL = 'EMAIL',
  WAIT = 'WAIT',
  CONDITION = 'CONDITION',
  AB_TEST = 'AB_TEST',
}

/**
 * Zod schema enumerating valid SequenceStepType values.
 */
export const SequenceStepTypeSchema = z.nativeEnum(SequenceStepType);

////////////////////////////////////////////////////////////////////////////////
// SecurityConfig Interface and Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Configuration for sequence-specific security and compliance measures,
 * such as data classification, encryption, retention, and access controls.
 */
export interface SecurityConfig {
  /**
   * The classification level of data handled by the sequence (e.g., "CONFIDENTIAL").
   */
  dataClassification: string;

  /**
   * Indicates whether encryption at rest is enabled for sequence-related data.
   */
  encryptionEnabled: boolean;

  /**
   * Provides a textual or symbolic representation of the policy for retaining
   * or archiving data tied to this sequence (e.g., "30 days", "indefinite").
   */
  retentionPolicy: string;

  /**
   * An open-ended object capturing key-value pairs that specify access restrictions,
   * multi-tenant compliance, or any specialized security flags.
   */
  accessControls: Record<string, any>;
}

/**
 * Zod schema for SecurityConfig, delivering runtime validation of
 * sequence-level security parameters.
 */
export const SecurityConfigSchema = z.object({
  dataClassification: z.string(),
  encryptionEnabled: z.boolean(),
  retentionPolicy: z.string(),
  accessControls: z.record(z.any()),
});

////////////////////////////////////////////////////////////////////////////////
// AuditEvent Interface and Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * AuditEvent captures a single event in the sequence's audit trail, ensuring that
 * any significant operation is logged for compliance, debugging, and historical record.
 */
export interface AuditEvent {
  /**
   * Identifies the type of event that occurred (e.g., "STEP_ADDED").
   */
  eventType: string;

  /**
   * The user responsible for triggering this event, if applicable.
   */
  userId: string;

  /**
   * The exact timestamp at which this audit event took place.
   */
  timestamp: Date;

  /**
   * An object describing the specific changes or details relevant
   * to the event (e.g., old/new values).
   */
  changes: Record<string, any>;
}

/**
 * Zod schema enforcing the structure of an AuditEvent for robust event tracking.
 */
export const AuditEventSchema = z.object({
  eventType: z.string(),
  userId: z.string(),
  timestamp: z.date(),
  changes: z.record(z.any()),
});

////////////////////////////////////////////////////////////////////////////////
// ABTestConfig Interface and Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Configuration parameters defining how an A/B test is performed within
 * a particular step. Includes multiple variants, selection/winner criteria,
 * and optional performance statistics for tracking real-world outcomes.
 */
export interface ABTestConfig {
  /**
   * Unique identifier for the A/B test scenario to allow referencing or aggregation.
   */
  testId: string;

  /**
   * An array of variants that represent different email or messaging treatments.
   * Each variant can contain template details or other configuration.
   */
  variants: any[];

  /**
   * Defines how the system identifies a winning variant, including the specific metrics
   * or threshold-based conditions (e.g., best open rate within 48 hours).
   */
  winnerCriteria: Record<string, any>;

  /**
   * Holds any tracked statistics or ephemeral data used to evaluate or finalize
   * the test outcome (e.g., real-time open/click counts, click-through rate).
   */
  statistics: Record<string, any>;
}

/**
 * Zod schema for ABTestConfig, ensuring that test identifiers, variant arrays,
 * and winner criteria are represented accurately at runtime.
 */
export const ABTestConfigSchema = z.object({
  testId: z.string(),
  variants: z.array(z.any()),
  winnerCriteria: z.record(z.any()),
  statistics: z.record(z.any()),
});

////////////////////////////////////////////////////////////////////////////////
// SequenceStep Interface and Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * A single step defining actions within a multi-step sequence.
 * This can represent an email send, a wait period, a branching condition,
 * or an A/B test configuration. Optional fields are included for each step type.
 */
export interface SequenceStep {
  /**
   * Unique identifier for the step, ensuring we can track or reorder items.
   */
  id: string;

  /**
   * Identifies the type of step, affecting other optional fields and logic flow.
   */
  type: SequenceStepType;

  /**
   * Optional textual label or summary describing this specific step.
   */
  name?: string;

  /**
   * Used if type = WAIT, specifying how many hours to wait before triggering the next step.
   */
  waitTimeHours?: number;

  /**
   * Contains logic or expression if type = CONDITION, enabling dynamic branching
   * based on metrics like open rates or lead status.
   */
  conditionLogic?: string;

  /**
   * For type = AB_TEST, a config object detailing the test setup, variants, and evaluation logic.
   */
  abTestConfig?: ABTestConfig;

  /**
   * References an email template or configuration ID if the step is an EMAIL step.
   * In real implementations, this might point to a template entity loaded from the database.
   */
  emailTemplateId?: string;
}

/**
 * Zod schema for SequenceStep, accepting optional fields depending on the step type.
 * This approach allows partial property usage without forcing a discriminated union.
 */
export const SequenceStepSchema = z.object({
  id: z.string(),
  type: SequenceStepTypeSchema,
  name: z.string().optional(),
  waitTimeHours: z.number().optional(),
  conditionLogic: z.string().optional(),
  abTestConfig: ABTestConfigSchema.optional(),
  emailTemplateId: z.string().optional(),
});

////////////////////////////////////////////////////////////////////////////////
// SequenceMetrics Interface and Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Aggregated performance and engagement metrics for an entire sequence,
 * enabling advanced analytics and optimization of email campaigns.
 */
export interface SequenceMetrics {
  /**
   * The total number of emails dispatched throughout all steps in the sequence.
   */
  totalEmailsSent: number;

  /**
   * The total number of emails opened by recipients, used to gauge engagement.
   */
  totalOpens: number;

  /**
   * The total number of links clicked across all emails in the sequence.
   */
  totalClicks: number;

  /**
   * The total number of replies received across all email steps.
   */
  totalReplies: number;

  /**
   * The total number of bounced emails, indicating deliverability issues.
   */
  totalBounces: number;

  /**
   * The total number of recipients who unsubscribed during this sequence.
   */
  totalUnsubscribes: number;

  /**
   * Calculated ratio or percentage that indicates the proportion of leads who
   * converted or performed a desired action after receiving the sequence.
   */
  conversionRate: number;
}

/**
 * Zod schema for SequenceMetrics, binding numeric fields to a validated structure
 * for broad usage in analytics dashboards and performance tracking.
 */
export const SequenceMetricsSchema = z.object({
  totalEmailsSent: z.number(),
  totalOpens: z.number(),
  totalClicks: z.number(),
  totalReplies: z.number(),
  totalBounces: z.number(),
  totalUnsubscribes: z.number(),
  conversionRate: z.number(),
});

////////////////////////////////////////////////////////////////////////////////
// Sequence Interface and Schema
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents a top-level email sequence in the B2B sales intelligence platform,
 * encompassing an ordered list of steps, overarching security controls, and
 * aggregated performance metrics. Ties to a campaign through campaignId, which
 * references `Campaign['id']`.
 */
export interface Sequence {
  /**
   * Unique identifier for this sequence.
   */
  id: string;

  /**
   * Human-friendly name describing the sequence (e.g. "Product Launch Drip").
   */
  name: string;

  /**
   * Brief summary or explanation of the sequence's purpose or content.
   */
  description: string;

  /**
   * References the associated campaign as `Campaign['id']`.
   */
  campaignId: string;

  /**
   * Indicates the current operating state of the sequence (draft, active, etc.).
   */
  status: SequenceStatus;

  /**
   * Ordered steps defining how emails, waits, conditions, and tests
   * proceed in this sequence.
   */
  steps: SequenceStep[];

  /**
   * Metrics capturing performance, engagement, and deliverability stats
   * across the entire sequence.
   */
  metrics: SequenceMetrics;

  /**
   * Security and compliance settings that govern data encryption, retention,
   * or special access restrictions for the sequence.
   */
  securityConfig: SecurityConfig;

  /**
   * Array of audit events recording significant changes or actions
   * taken on this sequence (e.g., step additions, status updates).
   */
  auditTrail: AuditEvent[];

  /**
   * Creation timestamp automatically set when the sequence is initially added to the system.
   */
  createdAt: Date;

  /**
   * Timestamp indicating the latest update to the sequence record.
   */
  updatedAt: Date;
}

/**
 * Zod schema for Sequence, validating an entire sequence entity, including
 * steps, security configurations, metrics, and an audit trail.
 */
export const SequenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  campaignId: z.string(),
  status: SequenceStatusSchema,
  steps: z.array(SequenceStepSchema),
  metrics: SequenceMetricsSchema,
  securityConfig: SecurityConfigSchema,
  auditTrail: z.array(AuditEventSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

////////////////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////////////////

export {
  SequenceStatus,
  SequenceStepType,
  SecurityConfig,
  AuditEvent,
  ABTestConfig,
  SequenceStep,
  SequenceMetrics,
  Sequence,
  // Zod Schemas:
  SequenceStatusSchema,
  SequenceStepTypeSchema,
  SecurityConfigSchema,
  AuditEventSchema,
  ABTestConfigSchema,
  SequenceStepSchema,
  SequenceMetricsSchema,
  SequenceSchema,
};