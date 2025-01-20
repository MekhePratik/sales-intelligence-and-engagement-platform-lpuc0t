/////////////////////////////////////////////////////////////////
// External Dependencies
/////////////////////////////////////////////////////////////////

/**
 * The Organization interface is imported here to clarify the
 * relationship between leads and their parent organization.
 * Specifically, the "organizationId" field in Lead corresponds
 * to the "id" property within Organization.
 */
import { Organization } from '../../../backend/src/types/organization'; // Organization interface with property id: string

/**
 * Zod: Runtime type validation library for data security and
 * schema enforcement throughout the application.
 */
// zod ^3.22.0
import { z } from 'zod';

/////////////////////////////////////////////////////////////////
// Enums
/////////////////////////////////////////////////////////////////

/**
 * LeadStatus enum defines distinct phases in a lead's lifecycle
 * within the platform, enabling precise tracking of sales progress.
 */
export enum LeadStatus {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  CONTACTED = 'CONTACTED',
  ENGAGED = 'ENGAGED',
  CONVERTED = 'CONVERTED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Zod schema for LeadStatus enum, enforcing valid status values
 * at runtime to maintain data integrity.
 */
export const LeadStatusSchema = z.enum([
  LeadStatus.NEW,
  LeadStatus.QUALIFIED,
  LeadStatus.CONTACTED,
  LeadStatus.ENGAGED,
  LeadStatus.CONVERTED,
  LeadStatus.ARCHIVED,
]);

/**
 * LeadSource enum specifies the origin of a lead and is used
 * to differentiate between manually entered, imported, or
 * AI-generated leads, among others.
 */
export enum LeadSource {
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
  AI_GENERATED = 'AI_GENERATED',
  WEBSITE = 'WEBSITE',
}

/**
 * Zod schema for LeadSource enum, ensuring that lead sources
 * are restricted to recognized values only.
 */
export const LeadSourceSchema = z.enum([
  LeadSource.MANUAL,
  LeadSource.IMPORT,
  LeadSource.AI_GENERATED,
  LeadSource.WEBSITE,
]);

/////////////////////////////////////////////////////////////////
// CompanyData Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * CompanyData interface holds enrichment details for the
 * organization associated with the lead, aiding in AI-powered
 * analytics and segmentation.
 */
export interface CompanyData {
  /**
   * Industry classification (e.g., 'Technology', 'Healthcare').
   * Marked as optional since not all leads may have this info.
   */
  industry?: string;

  /**
   * The size of the company (e.g., '1-50', '51-200').
   */
  size?: string;

  /**
   * Revenue range or annual turnover of the company.
   */
  revenue?: string;

  /**
   * Geographical location or headquarters.
   */
  location?: string;

  /**
   * The official website of the company.
   */
  website?: string;

  /**
   * An array of technologies the company is known to use.
   */
  technologies?: string[];
}

/**
 * Zod schema for CompanyData, guaranteeing optional fields
 * and correct data types for company enrichment details.
 */
export const CompanyDataSchema = z.object({
  industry: z.string().optional(),
  size: z.string().optional(),
  revenue: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  technologies: z.array(z.string()).optional(),
});

/////////////////////////////////////////////////////////////////
// Lead Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * Lead interface is the core data structure representing
 * a prospective contact within the B2B Sales Intelligence
 * Platform. Enhanced security and validation measures
 * apply, given that lead data is classified as Confidential.
 */
export interface Lead {
  /**
   * Unique identifier for this lead object.
   * Read-only to avoid unintended mutations.
   */
  readonly id: string;

  /**
   * Primary email address associated with the lead.
   */
  email: string;

  /**
   * First name of the lead contact.
   */
  firstName: string;

  /**
   * Last name of the lead contact.
   */
  lastName: string;

  /**
   * Professional title or role of the lead contact.
   */
  title: string;

  /**
   * Company name where the lead is employed.
   */
  companyName: string;

  /**
   * Structured company information containing
   * enrichment data for AI-based insights.
   */
  companyData: CompanyData;

  /**
   * Numeric score assigned to the lead based on
   * AI-powered prioritization and analysis rules.
   */
  score: number;

  /**
   * Current status reflecting progress in the sales funnel.
   */
  status: LeadStatus;

  /**
   * Origin of this lead (e.g., imported list,
   * AI-generated, or manually added).
   */
  source: LeadSource;

  /**
   * Identifier referencing the Organization to which
   * this lead belongs. Must match the 'id' field
   * of an Organization entity.
   */
  organizationId: string;

  /**
   * ID of the user or owner assigned to manage
   * this lead in the sales cycle.
   */
  ownerId: string;

  /**
   * Timestamp representing when the lead record was created,
   * used as a reference for data auditing. Marked readonly.
   */
  readonly createdAt: Date;

  /**
   * Timestamp of the last update to the lead,
   * allowing historical tracking of modifications.
   */
  updatedAt: Date;
}

/**
 * Zod schema for the Lead interface, ensuring strong runtime
 * validations for all fields. The .strict() method is applied
 * to prevent the insertion of unknown keys.
 */
export const LeadSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    title: z.string(),
    companyName: z.string(),
    companyData: CompanyDataSchema,
    score: z.number(),
    status: LeadStatusSchema,
    source: LeadSourceSchema,
    organizationId: z.string(),
    ownerId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

/////////////////////////////////////////////////////////////////
// LeadFilters Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * LeadFilters interface describes criteria applied in an
 * AI-powered search or filtering operation for leads.
 */
export interface LeadFilters {
  /**
   * Filter on one or more lead status values.
   * Optional to allow flexible queries.
   */
  status?: LeadStatus[];

  /**
   * Filter on one or more lead source values.
   */
  source?: LeadSource[];

  /**
   * Defines a numeric score window for retrieving
   * leads within a specific priority range.
   */
  scoreRange?: {
    min: number;
    max: number;
  };

  /**
   * Retrieves leads created or updated within a
   * specific date range.
   */
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Zod schema for LeadFilters, ensuring optional fields
 * and valid data types for search parameters.
 */
export const LeadFiltersSchema = z.object({
  status: z.array(LeadStatusSchema).optional(),
  source: z.array(LeadSourceSchema).optional(),
  scoreRange: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
});

/////////////////////////////////////////////////////////////////
// LeadSort Interface & Schema
/////////////////////////////////////////////////////////////////

/**
 * LeadSort interface assists in ranking or ordering lead
 * records based on a chosen property or dimension (e.g.,
 * by 'score' in ascending or descending order).
 */
export interface LeadSort {
  /**
   * Indicates which Lead field to sort by, referencing keys
   * within the Lead interface such as 'score' or 'createdAt'.
   */
  field: keyof Lead;

  /**
   * Sorting direction: ascending ('asc') or descending ('desc').
   */
  direction: 'asc' | 'desc';
}

/**
 * Zod schema for LeadSort, restricting the 'field' property
 * to a valid subset of Lead keys and 'direction' to either
 * 'asc' or 'desc'.
 */
export const LeadSortSchema = z.object({
  field: z.enum([
    'id',
    'email',
    'firstName',
    'lastName',
    'title',
    'companyName',
    'companyData',
    'score',
    'status',
    'source',
    'organizationId',
    'ownerId',
    'createdAt',
    'updatedAt',
  ]),
  direction: z.enum(['asc', 'desc']),
});