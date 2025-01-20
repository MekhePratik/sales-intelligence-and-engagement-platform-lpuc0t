////////////////////////////////////////////////////////////////////////////////
// File: lead.schema.ts
// Description:
//   Zod schema definitions for lead-related data validation in the B2B sales
//   intelligence platform. This file implements enhanced security controls,
//   comprehensive validation rules, and integrates domain checks via the
//   validateEmail utility function. It also provides an advanced rate-limiting
//   demonstration for each validation pathway.
//
//   Exports:
//     1) companyDataSchema  -> Zod schema for company enrichment data
//     2) createLeadSchema   -> Zod schema for creating a new lead
//     3) updateLeadSchema   -> Zod schema for updating an existing lead
//     4) validateLeadSchema -> Asynchronous function that parses, validates,
//                              enforces rate-limiting, and returns a Promise<Lead>
////////////////////////////////////////////////////////////////////////////////

// --------------------------- External Imports ------------------------------- //
// zod ^3.22.0 for runtime schema validation
import { z } from 'zod'; // zod ^3.22.0

// --------------------------- Internal Imports ------------------------------- //
import { validateEmail } from '../utils/validation.util';
import { ErrorCode } from '../constants/error-codes';
import type { Lead } from '../types/lead';
import { LeadStatus, LeadSource } from '../types/lead';

// ---------------------------------------------------------------------------
// Rate Limit Storage and Helper Function
// ---------------------------------------------------------------------------

/**
 * An in-memory store to keep track of validation attempts per schemaType.
 * In production, replace this with a distributed store like Redis to handle
 * multi-instance concurrency, ensuring accurate rate-limiting across nodes.
 */
const rateLimitStore = new Map<
  string,
  {
    timestamps: number[]; // Array of Unix epoch timestamps representing each validation attempt
  }
>();

/**
 * Checks and enforces a configurable rate limit for schema validation actions.
 *
 * @param schemaType - The name of the schema route (e.g., 'createLead', 'updateLead', etc.)
 * @param maxRequests - Maximum number of allowed validation calls within the specified windowMs
 * @param windowMs - Time window in milliseconds during which maxRequests are allowed
 *
 * @throws Error if the rate limit is exceeded
 */
function checkRateLimit(schemaType: string, maxRequests: number, windowMs: number): void {
  const now = Date.now();

  // Retrieve or initialize rate limit tracking for this schema type
  let rateTrack = rateLimitStore.get(schemaType);
  if (!rateTrack) {
    rateTrack = { timestamps: [] };
    rateLimitStore.set(schemaType, rateTrack);
  }

  // Remove timestamps older than the specified window
  rateTrack.timestamps = rateTrack.timestamps.filter((ts) => now - ts < windowMs);

  // Check if we're exceeding the maxRequests threshold
  if (rateTrack.timestamps.length >= maxRequests) {
    // Thorough context can be attached for advanced error handling
    throw new Error(`Rate limit exceeded for schemaType: ${schemaType}`);
  }

  // Record this validation attempt
  rateTrack.timestamps.push(now);
}

// ---------------------------------------------------------------------------
// 1) companyDataSchema
// ---------------------------------------------------------------------------

/**
 * companyDataSchema:
 * Provides strict rules for company enrichment data. Aligned with
 * "Enhanced schema for company enrichment data validation with strict rules".
 */
export const companyDataSchema = z.object({
  /**
   * Industry classification (e.g., "Technology", "Healthcare", etc.).
   * Non-empty string required to ensure consistent data.
   */
  industry: z.string().min(1, {
    message: 'Industry is required and must be a non-empty string',
  }),

  /**
   * Size of the company. The specification demands a string, even though
   * the internal types might allow enumerations. This project specifically
   * uses a string-based field here, adhering strictly to the JSON spec.
   */
  size: z.string().min(1, {
    message: 'Company size is required and must be a non-empty string',
  }),

  /**
   * Revenue range for the company, stored as a string as per specification.
   */
  revenue: z.string().min(1, {
    message: 'Revenue range is required and must be a non-empty string',
  }),

  /**
   * General location data, stored here as a single string field
   * in accordance with the JSON specification.
   */
  location: z.string().min(1, {
    message: 'Location is required and must be a non-empty string',
  }),

  /**
   * Official website of the company, validated simply as a string with .min(1).
   * The specification does not require full URL checks here. Further checks
   * could be done with a refine if needed.
   */
  website: z.string().min(1, {
    message: 'Website is required and must be a non-empty string',
  }),

  /**
   * Technologies used by the company. Must be an array of strings.
   */
  technologies: z.array(z.string()).default([]),
});

// ---------------------------------------------------------------------------
// 2) createLeadSchema
// ---------------------------------------------------------------------------

/**
 * createLeadSchema:
 * Zod schema for lead creation with strict validation. Follows the JSON spec
 * fields and integrates domain checks via validateEmail.
 */
export const createLeadSchema = z.object({
  /**
   * Lead email address. We apply a .refine() step to leverage the advanced
   * domain checks performed by validateEmail from validation.util.
   */
  email: z
    .string()
    .refine((val) => validateEmail(val), {
      message: 'Invalid or unsupported email address/domain',
    }),

  /**
   * First name of the lead, required for personalized outreach.
   */
  firstName: z.string().min(1, {
    message: 'First name is required and must be a non-empty string',
  }),

  /**
   * Last name of the lead, similarly required.
   */
  lastName: z.string().min(1, {
    message: 'Last name is required and must be a non-empty string',
  }),

  /**
   * Current professional title or position of the lead.
   */
  title: z.string().min(1, {
    message: 'Title is required and must be a non-empty string',
  }),

  /**
   * The name of the company where the lead works. Distinct from the
   * detailed companyData object, this is a top-level short reference.
   */
  companyName: z.string().min(1, {
    message: 'Company name is required and must be a non-empty string',
  }),

  /**
   * Source of this lead, referencing an internal enum. This enumerates
   * possible lead acquisition channels (WEBSITE, LINKEDIN, etc.).
   */
  source: z.nativeEnum(LeadSource, {
    invalid_type_error: 'Lead source is invalid',
  }),

  /**
   * ID of the organization that owns or manages this lead.
   */
  organizationId: z.string().min(1, {
    message: 'Organization ID is required and must be a non-empty string',
  }),
});

// ---------------------------------------------------------------------------
// 3) updateLeadSchema
// ---------------------------------------------------------------------------

/**
 * updateLeadSchema:
 * Zod schema for partially updating an existing lead. All fields are optional
 * so that updates can be granular. Includes status, score, and owner changes.
 */
export const updateLeadSchema = z.object({
  /**
   * First name can be updated if needed.
   */
  firstName: z.string().optional(),

  /**
   * Last name can be updated if needed.
   */
  lastName: z.string().optional(),

  /**
   * Job title can be updated if the lead's position changes.
   */
  title: z.string().optional(),

  /**
   * Updated lead status, referencing the internal enum for lifecycle states.
   */
  status: z.nativeEnum(LeadStatus).optional(),

  /**
   * Lead scoring updates, potentially from AI or manual prioritization.
   */
  score: z.number().optional(),

  /**
   * Reassignment of lead ownership within the same organization if needed.
   */
  ownerId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// 4) validateLeadSchema (Function)
// ---------------------------------------------------------------------------

/**
 * validateLeadSchema:
 * Enhanced utility function for lead data validation with security controls.
 * Executes the following major steps:
 *   1) Rate-limit enforcement based on schemaType.
 *   2) Schema selection (companyData, createLead, or updateLead).
 *   3) Parse and validate input data with Zod.
 *   4) Security logging or auditing for validation events.
 *   5) Error handling with detailed context on validation failures.
 *   6) Final data sanitization.
 *   7) Return a fully formed Lead object to ensure typed ingestion.
 *
 * @param data       Arbitrary input data to be validated.
 * @param schemaType A string referencing which schema to apply ("companyData",
 *                   "createLead", or "updateLead").
 * @returns          A Promise resolving to a validated Lead object, with
 *                   default or placeholder fields where needed.
 * @throws           Throws a zod validation error or a rate limit error.
 */
export async function validateLeadSchema(
  data: unknown,
  schemaType: string,
): Promise<Lead> {
  // ----------------- STEP 1: Rate limit enforcement ----------------------- //
  // For demonstration, we allow up to 100 validations per minute per schema.
  try {
    checkRateLimit(schemaType, 100, 60_000 /* 1 minute in ms */);
  } catch (err) {
    // If rate limit is exceeded, we rethrow a structured error
    throw new Error(`Validation refused: ${String(err)}`);
  }

  // ----------------- STEP 2: Schema selection ----------------------------- //
  let chosenSchema: z.ZodObject<any>;
  switch (schemaType) {
    case 'companyData':
      chosenSchema = companyDataSchema;
      break;
    case 'createLead':
      chosenSchema = createLeadSchema;
      break;
    case 'updateLead':
      chosenSchema = updateLeadSchema;
      break;
    default:
      // Unknown schema type - use a standard error approach
      throw new Error(`Unknown schemaType: ${schemaType}`);
  }

  // ----------------- STEP 3: Parse/validate data with Zod ----------------- //
  let parsedData: any;
  try {
    // parseAsync ensures we handle asynchronous checks or transforms if any
    parsedData = await chosenSchema.parseAsync(data);
  } catch (zodError) {
    // --------------- STEP 5: Detailed error handling with context --------- //
    // This block captures any zod validation errors and returns them
    // with a predefined error code for consistent handling.
    const errorDetails = JSON.stringify(zodError, null, 2);
    throw new Error(
      `Validation failed with ${ErrorCode.VALIDATION_ERROR}: ${errorDetails}`,
    );
  }

  // ----------------- STEP 4: Security logging (demonstration) ------------ //
  // In a production environment, integrate with a security monitoring system
  // or logger. For demonstration, we do a simple console trace here.
  console.log(
    '[Security Monitoring] Lead schema validation attempt succeeded',
    {
      schemaType,
      timestamp: new Date().toISOString(),
    },
  );

  // ----------------- STEP 6: Data sanitization (example) ------------------ //
  // For createLead or updateLead, certain fields might be defaulted if absent.
  // For companyData, we similarly consolidate it into a Lead object with
  // placeholders for missing fields.
  const sanitizedLead: Lead = {
    // Assign a temporary or mock ID for demonstration. A real environment might
    // generate this via a database or UUID library upon creation.
    id: 'temp-validation-id',

    // If schemaType is createLead or updateLead, we might have partial fields. Here we merge:
    email: parsedData.email ?? 'placeholder@example.com',
    firstName: parsedData.firstName ?? 'PlaceholderFirstName',
    lastName: parsedData.lastName ?? 'PlaceholderLastName',
    title: parsedData.title ?? 'PlaceholderTitle',
    companyName: parsedData.companyName ?? 'PlaceholderCompany',

    // For demonstration, we embed the companyData if the schemaType was 'companyData';
    // otherwise we default to an empty object or partial fields.
    companyData: schemaType === 'companyData'
      ? {
          industry: parsedData.industry ?? '',
          size: parsedData.size ?? '',
          revenue: parsedData.revenue ?? '',
          location: parsedData.location ?? '',
          website: parsedData.website ?? '',
          technologies: parsedData.technologies ?? [],
          // The original interface includes socialProfiles, but the specification
          // omitted it from the export. We default to empty to maintain type safety.
          socialProfiles: {
            linkedin: null,
            twitter: null,
            facebook: null,
          },
        }
      : {
          industry: '',
          size: '',
          revenue: '',
          location: '',
          website: '',
          technologies: [],
          socialProfiles: {
            linkedin: null,
            twitter: null,
            facebook: null,
          },
        },

    // Potential fields from updateLead or placeholders for createLead
    source: parsedData.source ?? LeadSource.OTHER,
    status: parsedData.status ?? LeadStatus.NEW,
    score: parsedData.score ?? 0,
    organizationId: parsedData.organizationId ?? 'placeholder-org-id',
    ownerId: parsedData.ownerId ?? 'placeholder-owner-id',

    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date(),
    lastEnriched: null,

    // A field indicating encryption (the specification implies this is needed).
    isEncrypted: false,
  };

  // ----------------- STEP 7: Return validated and sanitized data ---------- //
  return sanitizedLead;
}