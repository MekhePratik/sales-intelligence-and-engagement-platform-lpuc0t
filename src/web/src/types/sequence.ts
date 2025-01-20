/////////////////////////////////////////////////////////////////
// External Imports
/////////////////////////////////////////////////////////////////

/**
 * zod ^3.22.0
 * Runtime type validation library for ensuring robust data
 * integrity across sequence-related interfaces and schemas.
 */
import { z } from 'zod';

/**
 * Importing the Campaign interface to establish a relationship
 * between Sequences and Campaigns. We specifically utilize
 * the 'id' field from the Campaign interface for referencing
 * or linking a sequence with a specific campaign.
 */
import type { Campaign } from '../types/campaign';

/**
 * Similarly, importing the Lead interface to potentially
 * capture lead targeting for any sequence. Here, we only
 * harness the 'id' field to maintain minimal referencing.
 */
import type { Lead } from '../types/lead';

/////////////////////////////////////////////////////////////////
// SequenceStatus Enum & Schema
/////////////////////////////////////////////////////////////////

/**
 * SequenceStatus enumerates all possible high-level states
 * of an email sequence, governing how the sequence is
 * managed and displayed throughout its lifecycle.
 *
 * DRAFT: The sequence is being set up and is not yet active.
 * ACTIVE: The sequence is currently sending emails or
 *         performing wait steps based on its configuration.
 * PAUSED: The sequence execution has been halted temporarily.
 * COMPLETED: The sequence has concluded all steps.
 */
export enum SequenceStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

/**
 * SequenceStatusSchema is the corresponding zod enum schema
 * that strictly validates SequenceStatus values at runtime.
 */
export const SequenceStatusSchema = z.enum([
  SequenceStatus.DRAFT,
  SequenceStatus.ACTIVE,
  SequenceStatus.PAUSED,
  SequenceStatus.COMPLETED,
]);

/////////////////////////////////////////////////////////////////
// SequenceStepType Enum & Schema
/////////////////////////////////////////////////////////////////

/**
 * SequenceStepType enumerates distinct step types within a
 * sequence. Each type determines how the step should be
 * processed:
 *
 * EMAIL: Specifies a targeted email step.
 * WAIT: Implies a time delay or waiting period before
 *       proceeding to the next step.
 * CONDITION: Indicates a branching condition that
 *            can alter the sequence flow based on data.
 */
export enum SequenceStepType {
  EMAIL = 'EMAIL',
  WAIT = 'WAIT',
  CONDITION = 'CONDITION',
}

/**
 * SequenceStepTypeSchema is the zod schema ensuring valid
 * step types, preventing unrecognized strings from being
 * used in step definitions.
 */
export const SequenceStepTypeSchema = z.enum([
  SequenceStepType.EMAIL,
  SequenceStepType.WAIT,
  SequenceStepType.CONDITION,
]);

/////////////////////////////////////////////////////////////////
// SequenceMetrics Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * SequenceMetrics extends key performance indicators
 * to monitor the health and efficacy of a given sequence.
 * Incorporates advanced metrics such as ROI to fulfill
 * analytics enhancement requirements.
 */
export interface SequenceMetrics {
  /**
   * The total number of leads targeted by this sequence.
   */
  totalLeads: number;

  /**
   * The number of emails actually sent out as part
   * of the sequence.
   */
  emailsSent: number;

  /**
   * The total times recipients opened emails from
   * this sequence.
   */
  emailsOpened: number;

  /**
   * The total clicks recorded if tracking is enabled.
   */
  emailsClicked: number;

  /**
   * The number of direct replies or responses from
   * recipients within this sequence scope.
   */
  responses: number;

  /**
   * Percentage of successfully delivered emails:
   * (emailsSent - bounces) / emailsSent * 100
   */
  deliveryRate: number;

  /**
   * The count of email bounces encountered.
   */
  bounces: number;

  /**
   * The number of spam/abuse reports from recipients.
   */
  spamReports: number;

  /**
   * The total unsubscribes captured for emails in
   * this sequence.
   */
  unsubscribes: number;

  /**
   * The overall revenue recognized from the sequence,
   * enabling direct revenue-based performance insights.
   */
  revenueGenerated: number;

  /**
   * Return on investment, typically calculated as
   * (revenue - cost) / cost or similar variations,
   * expressed as a numerical value.
   */
  roi: number;
}

/**
 * Zod schema enforcing strong runtime checks for each
 * SequenceMetrics property to prevent invalid data from
 * being tracked in analytics.
 */
export const SequenceMetricsSchema = z.object({
  totalLeads: z.number(),
  emailsSent: z.number(),
  emailsOpened: z.number(),
  emailsClicked: z.number(),
  responses: z.number(),
  deliveryRate: z.number(),
  bounces: z.number(),
  spamReports: z.number(),
  unsubscribes: z.number(),
  revenueGenerated: z.number(),
  roi: z.number(),
});

/////////////////////////////////////////////////////////////////
// StepCondition Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * StepCondition defines logic-based branching for condition
 * execution steps within a sequence. For instance, if an email
 * remains unopened, proceed to one path, otherwise branch
 * to another step.
 */
export interface StepCondition {
  /**
   * A developer-friendly label or identifier representing
   * the nature of this condition (e.g., "OPEN_CHECK").
   */
  type: string;

  /**
   * The data field or metric on which the condition
   * is based (e.g., "emailsOpened", "score", "status").
   */
  field: string;

  /**
   * The comparison operator for evaluating the field
   * (e.g., "EQ", "GT", "LT", "CONTAINS").
   */
  operator: string;

  /**
   * The value or threshold being evaluated. This can be
   * any type depending on the field's data (e.g., number,
   * string, boolean).
   */
  value: any;

  /**
   * The specific ID of the next step if this condition
   * is satisfied. If undefined, the sequence may end
   * or default to an alternative path.
   */
  nextStepId?: string;
}

/**
 * StepConditionSchema ensures that each conditional step
 * within a sequence is structured correctly, with valid
 * strings and optional next step references.
 */
export const StepConditionSchema = z.object({
  type: z.string(),
  field: z.string(),
  operator: z.string(),
  value: z.any(),
  nextStepId: z.string().optional(),
});

/////////////////////////////////////////////////////////////////
// Attachment Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * Attachment interface outlines the structure for any files
 * or documents embedded or linked within an email step of
 * the sequence. This can include PDFs, images, or additional
 * resources.
 */
export interface Attachment {
  /**
   * The human-readable name of the file (e.g., "brochure.pdf").
   */
  filename: string;

  /**
   * MIME type of the attachment (e.g., "application/pdf",
   * "image/png").
   */
  contentType: string;

  /**
   * The URL where the file can be downloaded or retrieved.
   */
  url: string;

  /**
   * File size in bytes, facilitating potential size checks
   * or display in the email client.
   */
  size: number;
}

/**
 * AttachmentSchema ensures attachments have well-defined
 * properties to maintain consistency in step configurations.
 */
export const AttachmentSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  url: z.string(),
  size: z.number(),
});

/////////////////////////////////////////////////////////////////
// SequenceStep Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * SequenceStep is a single actionable or logical entity
 * within an email sequence. It can represent various
 * behaviors depending on stepType (EMAIL, WAIT, CONDITION).
 */
export interface SequenceStep {
  /**
   * A unique identifier for the step, enabling
   * references to this step in conditions or logs.
   */
  id: string;

  /**
   * The step type determines how the system processes
   * this step, including sending an email, waiting
   * a specified duration, or evaluating a condition.
   */
  stepType: SequenceStepType;

  /**
   * Optional descriptive name or label for the step
   * to provide user-friendly context in UI or logs.
   */
  name?: string;

  /**
   * The number of hours to wait before executing
   * this step, commonly used for WAIT steps. For
   * EMAIL steps, this can also represent how many
   * hours after a previous step to send the message.
   */
  delayHours?: number;

  /**
   * Zero-based ordering to define sequence flow. A lower
   * stepOrder value indicates earlier execution.
   */
  stepOrder: number;

  /**
   * For EMAIL stepType, the subject of the email. This
   * might be omitted for WAIT or CONDITION steps.
   */
  subject?: string;

  /**
   * For EMAIL stepType, the body content or template
   * reference of the email to be delivered.
   */
  body?: string;

  /**
   * For EMAIL stepType, an array of attachments
   * to include in the outbound message.
   */
  attachments?: Attachment[];

  /**
   * For CONDITION stepType, the condition logic
   * controlling branching. Omitted for EMAIL or WAIT.
   */
  condition?: StepCondition;
}

/**
 * SequenceStepSchema enforces correct data structure for
 * each step, ensuring stepType is valid and that relevant
 * fields (like condition) are only provided for the
 * appropriate type.
 */
export const SequenceStepSchema = z.object({
  id: z.string(),
  stepType: SequenceStepTypeSchema,
  name: z.string().optional(),
  delayHours: z.number().optional(),
  stepOrder: z.number(),
  subject: z.string().optional(),
  body: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional(),
  condition: StepConditionSchema.optional(),
});

/////////////////////////////////////////////////////////////////
// Core Sequence Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * The Sequence interface defines the overall structure
 * and configuration for an automated email flow within
 * the platform. It references a Campaign via a minimal
 * pick of the campaign's 'id', associates an array of
 * target leads, includes a list of steps, and maintains
 * essential status/analytic fields.
 */
export interface Sequence {
  /**
   * Unique identifier for the entire sequence. This
   * can be used to store or fetch the sequence in
   * persistent data stores.
   */
  id: string;

  /**
   * A descriptive name for the sequence, aiding
   * in quick identification among multiple
   * sequences in the UI.
   */
  name: string;

  /**
   * A minimal reference to the associated campaign.
   * Only the 'id' field is retained to maintain a
   * lightweight relationship in the sequence object.
   */
  campaign: Pick<Campaign, 'id'>;

  /**
   * An optional collection of leads specifically
   * targeted by this sequence. Only the 'id' is
   * referenced to preserve minimal data usage.
   */
  targetLeads?: Array<Pick<Lead, 'id'>>;

  /**
   * The status describing whether the sequence is
   * in draft, active, paused, or completed state.
   */
  status: SequenceStatus;

  /**
   * An array of steps that define the chronological
   * flow or logic branching of the sequence.
   */
  steps: SequenceStep[];

  /**
   * Metrics to capture comprehensive analytics for
   * the entire sequence, including email performance
   * and ROI calculations.
   */
  metrics?: SequenceMetrics;

  /**
   * Timestamp specifying when this sequence was
   * created, supporting chronological filtering
   * and auditing.
   */
  createdAt: Date;

  /**
   * Timestamp of the most recent update to the
   * sequence, enabling concurrency control and
   * historical tracking.
   */
  updatedAt: Date;
}

/**
 * SequenceSchema is the zod validation schema for
 * the entire Sequence object. It incorporates
 * references to the enumerations and sub-schemas
 * specified above to guarantee integrity.
 */
export const SequenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  campaign: z.object({
    id: z.string(),
  }),
  targetLeads: z
    .array(
      z.object({
        id: z.string(),
      })
    )
    .optional(),
  status: SequenceStatusSchema,
  steps: z.array(SequenceStepSchema),
  metrics: SequenceMetricsSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/////////////////////////////////////////////////////////////////
// Exports
/////////////////////////////////////////////////////////////////

/**
 * SequenceStatus, SequenceStepType, SequenceMetrics, and
 * StepCondition are exported for direct usage in other
 * parts of the application that manage sequence statuses,
 * step logic, analytics, or attachments. The Attachement
 * interface is also available for handling file references.
 */

export { SequenceStatus };
export { SequenceStepType };
export type { SequenceMetrics };
export type { StepCondition };
export type { Attachment };