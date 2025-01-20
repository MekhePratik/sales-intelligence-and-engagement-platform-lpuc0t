/*--------------------------------------------------------------------------------
 * File: sequence.schema.ts
 * Description:
 *   Zod schema definitions for email sequence validation in the B2B sales
 *   intelligence platform. This module addresses input validation for
 *   sequence creation, configuration, analytics tracking, and security
 *   settings, aligning with the following core requirements:
 *     1) Email Automation       (Template management, sequence builder)
 *     2) Data Security          (Data integrity, input validation)
 *     3) Analytics              (Performance tracking, conversion metrics)
 *
 *   References:
 *     - SequenceStatus:   ../types/sequence
 *     - SequenceStepType: ../types/sequence
 *     - ActivityType:     ../types/activity
 *     - Zod (v^3.22.0):   https://github.com/colinhacks/zod
 *
 * © 2023 B2B Sales Intelligence Platform. All rights reserved.
 *--------------------------------------------------------------------------------*/

/*//////////////////////////////////////////////////////////////////////////////
// External Imports (with versioning)
//////////////////////////////////////////////////////////////////////////////*/
import { z } from 'zod'; // zod ^3.22.0

/*//////////////////////////////////////////////////////////////////////////////
// Internal Imports
//////////////////////////////////////////////////////////////////////////////*/
import { SequenceStatus, SequenceStepType } from '../types/sequence';
import { ActivityType } from '../types/activity';

/*--------------------------------------------------------------------------------
 * Enums Usage Note:
 * For precise validation of only the subsets specified:
 *   - SequenceStatus has members: DRAFT, ACTIVE, PAUSED, COMPLETED
 *   - SequenceStepType has members: EMAIL, WAIT, CONDITION
 *   - ActivityType has members: SENT, OPENED, CLICKED, CONVERTED
 * We create Zod-based enums to strictly allow these enumerated values.
 *--------------------------------------------------------------------------------*/

/**
 * A restricted Zod enum for the SequenceStatus subset used here.
 * Only includes DRAFT, ACTIVE, PAUSED, COMPLETED.
 */
const sequenceStatusEnum = z.enum([
  SequenceStatus.DRAFT,
  SequenceStatus.ACTIVE,
  SequenceStatus.PAUSED,
  SequenceStatus.COMPLETED,
]);

/**
 * A restricted Zod enum for the SequenceStepType subset used here.
 * Only includes EMAIL, WAIT, CONDITION.
 */
const sequenceStepTypeEnum = z.enum([
  SequenceStepType.EMAIL,
  SequenceStepType.WAIT,
  SequenceStepType.CONDITION,
]);

/**
 * A restricted Zod enum for the subset of ActivityType used in sequence
 * analytics. Only includes SENT, OPENED, CLICKED, CONVERTED.
 */
const activityTypeEnum = z.enum([
  ActivityType.SENT,
  ActivityType.OPENED,
  ActivityType.CLICKED,
  ActivityType.CONVERTED,
]);

/*//////////////////////////////////////////////////////////////////////////////
// 1) Attachment Schema
//////////////////////////////////////////////////////////////////////////////*/

/**
 * Schema for validating a single email attachment, ensuring that the
 * file details (filename, contentType, url, and size) are provided and
 * meet numeric/string constraints.
 *
 * Exported as "attachmentSchema".
 */
export const attachmentSchema = z.object({
  /**
   * Filename of the attachment, e.g. "brochure.pdf".
   */
  filename: z.string(),

  /**
   * MIME type of the file, e.g. "application/pdf" or "image/png".
   */
  contentType: z.string(),

  /**
   * Signed or publicly accessible URL for retrieving the attachment.
   */
  url: z.string(),

  /**
   * File size in bytes for reporting or validation (e.g., < 25MB).
   */
  size: z.number(),
});

/*//////////////////////////////////////////////////////////////////////////////
// 2) Email Template Schema
//////////////////////////////////////////////////////////////////////////////*/

/**
 * Schema for validating the structure of an email template, including
 * subject line, body content, template variables, and file attachments.
 *
 * Exported as "emailTemplateSchema".
 */
export const emailTemplateSchema = z.object({
  /**
   * Subject line of the email, typically visible in recipients' inboxes.
   */
  subject: z.string(),

  /**
   * Body content of the email, potentially containing merge variables or placeholders.
   */
  body: z.string(),

  /**
   * Array of string placeholders or merge variables used within the template body.
   */
  variables: z.array(z.string()),

  /**
   * Array of attachment objects (optional or required depending on business logic).
   */
  attachments: z.array(attachmentSchema),
});

/*//////////////////////////////////////////////////////////////////////////////
// 3) Metrics Schema
//////////////////////////////////////////////////////////////////////////////*/

/**
 * Schema for sequence performance metrics. Each field tracks a key KPI
 * for email engagement (opens, clicks, conversions, bounces, unsubscribes).
 *
 * Exported as "metricsSchema".
 */
export const metricsSchema = z.object({
  /**
   * Total number of emails opened by recipients.
   */
  opens: z.number(),

  /**
   * Total number of link click events recorded for all emails in the sequence.
   */
  clicks: z.number(),

  /**
   * Number of times recipients performed the ultimate conversion event
   * (e.g., scheduling a demo, finalizing a signup, etc.).
   */
  conversions: z.number(),

  /**
   * Number of email bounces encountered, indicating deliverability issues.
   */
  bounces: z.number(),

  /**
   * Number of recipients who unsubscribed during the sequence.
   */
  unsubscribes: z.number(),
});

/*//////////////////////////////////////////////////////////////////////////////
// 4) Activity Schema
//////////////////////////////////////////////////////////////////////////////*/

/**
 * Schema for logging a single activity item in the sequence's activity log,
 * typically used for real-time or historical analytics. Each activity captures
 * an event type, timestamp, and associated metadata.
 *
 * Exported as "activitySchema".
 */
export const activitySchema = z.object({
  /**
   * Type of activity or engagement,
   * e.g. SENT, OPENED, CLICKED, CONVERTED.
   */
  type: activityTypeEnum,

  /**
   * Exact Date object capturing when this activity occurred.
   */
  timestamp: z.date(),

  /**
   * Additional context data for the activity, such as IP address,
   * user ID, or link references. Stored as a key-value record.
   */
  metadata: z.record(z.any()),
});

/*//////////////////////////////////////////////////////////////////////////////
// 5) A/B Test Schema
//////////////////////////////////////////////////////////////////////////////*/

/**
 * Schema describing the configuration for an A/B test within a sequence,
 * including a flag indicating whether the test is enabled, an array of
 * variants (ex: multiple email templates), distribution weights, and
 * the chosen winning criteria for concluding the test.
 *
 * Exported as "abTestSchema".
 */
export const abTestSchema = z.object({
  /**
   * Flag to enable or disable A/B testing at this step or sequence level.
   */
  enabled: z.boolean(),

  /**
   * Array of email template variants for the test,
   * each providing a different subject/body/variables.
   */
  variants: z.array(emailTemplateSchema),

  /**
   * Distribution weighting for how the variants are assigned
   * to recipients, e.g. [50, 50] or [30, 70].
   */
  distribution: z.array(z.number()),

  /**
   * Criterion for determining the winning variant,
   * e.g. "highestOpenRate" or "bestClickThrough".
   */
  winningCriteria: z.string(),
});

/*//////////////////////////////////////////////////////////////////////////////
// 6) Security Schema
//////////////////////////////////////////////////////////////////////////////*/

/**
 * Schema describing security settings and configurations for sequences,
 * addressing encryption needs, access control restrictions, and data
 * retention policies.
 *
 * Exported as "securitySchema".
 */
export const securitySchema = z.object({
  /**
   * Whether encryption is enabled at rest for data associated with the sequence.
   */
  encryption: z.boolean(),

  /**
   * List of user roles or group identifiers with access to the raw sequence data.
   */
  accessControl: z.array(z.string()),

  /**
   * Data retention period (in days) before archival or deletion of sequence data.
   */
  dataRetention: z.number(),
});

/*//////////////////////////////////////////////////////////////////////////////
// Internal: Sequence Step Schema
//////////////////////////////////////////////////////////////////////////////*/

/**
 * Schema representing an individual step within the overall email sequence,
 * allowing for typed fields such as a step name, wait duration, conditional
 * logic, or a possible reference to A/B testing configuration. This schema
 * is used internally by the primary sequence schema and is not exported
 * directly. Adjust fields as needed for expanded logic.
 */
const sequenceStepSchema = z.object({
  /**
   * Type of the step. Can be EMAIL, WAIT, or CONDITION.
   */
  type: sequenceStepTypeEnum,

  /**
   * Optional human-friendly label for the step, e.g. "Introduction Email".
   */
  name: z.string().optional(),

  /**
   * Wait duration in hours if the step involves a timed delay
   * before proceeding (valid for WAIT steps).
   */
  waitTimeHours: z.number().optional(),

  /**
   * Condition logic expression or rule if the step
   * includes branching criteria (valid for CONDITION steps).
   */
  conditionLogic: z.string().optional(),

  /**
   * Optional A/B testing configuration if relevant to this step (could be used
   * in a specialized environment or multi-variant logic).
   */
  abTestConfig: abTestSchema.optional(),

  /**
   * Reference to a specific email template or resource ID if the step
   * is sending an email. Could be used in an orchestration system
   * to load the relevant template from a data store.
   */
  emailTemplateId: z.string().optional(),
});

/*//////////////////////////////////////////////////////////////////////////////
// 7) Main Sequence Schema
//////////////////////////////////////////////////////////////////////////////*/

/**
 * Primary schema for validating all properties of an email sequence,
 * including:
 *   - Basic identification (name, optional description, campaign ID)
 *   - Status (draft, active, paused, completed)
 *   - Array of steps that define the sequence flow
 *   - Optional performance metrics
 *   - Event-based activity log
 *   - Optional A/B testing configuration
 *   - Optional security config
 *
 * Exported as "sequenceSchema".
 */
export const sequenceSchema = z.object({
  /**
   * The human-friendly name or title for the sequence.
   */
  name: z.string(),

  /**
   * Optional textual description providing additional context.
   */
  description: z.string().optional(),

  /**
   * ID referencing the campaign to which this sequence belongs.
   */
  campaignId: z.string(),

  /**
   * Current operational status of the sequence.
   * Allowed values: DRAFT, ACTIVE, PAUSED, COMPLETED.
   */
  status: sequenceStatusEnum,

  /**
   * Array of steps that define how emails, waits, and conditions
   * are sequenced in this particular flow.
   */
  steps: z.array(sequenceStepSchema),

  /**
   * Optional performance metrics object tracking engagement, conversions,
   * bounces, and unsubscribes for the entire sequence.
   */
  metrics: metricsSchema.optional(),

  /**
   * Array of activity records representing real-time or historical events
   * associated with the sequence, e.g. to track opens, clicks, or sends.
   */
  activityLog: z.array(activitySchema),

  /**
   * Optional configuration for A/B testing at the sequence level,
   * allowing multi-variant steps or entire flows.
   */
  abTestConfig: abTestSchema.optional(),

  /**
   * Optional security configuration specifying encryption, access controls,
   * and data retention for the sequence.
   */
  securityConfig: securitySchema.optional(),
});

/*//////////////////////////////////////////////////////////////////////////////
// 8) Validation Function
//////////////////////////////////////////////////////////////////////////////*/

/**
 * Validates sequence input data against the sequence schema, covering:
 *   - Core fields (name, campaignId, status)
 *   - Steps with typed structure (EMAIL, WAIT, CONDITION)
 *   - Analytics tracking (metrics, activityLog entries)
 *   - Security settings (encryption, access control, data retention)
 *
 * @param data  Arbitrary input data to be validated
 * @returns     Promise resolving to the validated sequence data
 *             if all criteria pass.
 */
export async function validateSequenceInput(
  data: unknown
): Promise<z.infer<typeof sequenceSchema>> {
  // Step 1: Parse input data using sequenceSchema
  const parsedSequence = sequenceSchema.parse(data);

  // Step 2: Validate relationships and constraints
  //         (e.g., ensuring distribution arrays line up with variants count)
  //         This is a placeholder for advanced checks as needed.
  //         Add thorough custom checks here if required.

  // Step 3: Validate analytics tracking configuration
  //         (e.g., metrics with consistent values, no negative numbers, etc.)
  //         Add domain-specific validations here if required.

  // Step 4: Validate security settings
  //         (e.g., data retention thresholds, encryption toggles, etc.)

  // Step 5: Return validated sequence data
  return Promise.resolve(parsedSequence);
}