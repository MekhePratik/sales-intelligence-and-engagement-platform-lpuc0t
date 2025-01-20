//////////////////////////////////////////////////////////////////////////////
// External Imports
//////////////////////////////////////////////////////////////////////////////

import { z } from 'zod'; // zod ^3.22.0

//////////////////////////////////////////////////////////////////////////////
// Internal Imports
//////////////////////////////////////////////////////////////////////////////

/**
 * Importing Organization for referencing organizational structures (ID usage).
 */
import type { Organization } from './organization';

/**
 * Importing User for referencing owner structures (ID usage).
 */
import type { User } from './user';

/**
 * Importing ActivityType to reference lead-related events, specifically
 * LEAD_CREATED and LEAD_UPDATED, ensuring consistent event classification.
 */
import { ActivityType } from './activity';

//////////////////////////////////////////////////////////////////////////////
// Enums for Company Size, Revenue Range, Lead Status, and Lead Source
//////////////////////////////////////////////////////////////////////////////

/**
 * Enumerates possible company size ranges for enriched company data.
 * Reflects typical workforce brackets for B2B intelligence.
 */
export enum CompanySize {
  SMALL_1_50 = 'SMALL_1_50',
  MEDIUM_51_200 = 'MEDIUM_51_200',
  LARGE_201_1000 = 'LARGE_201_1000',
  ENTERPRISE_1000_PLUS = 'ENTERPRISE_1000_PLUS',
}

/**
 * Enumerates possible revenue ranges for enriched company data,
 * offering a standardized classification for B2B intelligence.
 */
export enum RevenueRange {
  LESS_THAN_1M = 'LESS_THAN_1M',
  FROM_1M_TO_10M = 'FROM_1M_TO_10M',
  FROM_10M_TO_50M = 'FROM_10M_TO_50M',
  FROM_50M_TO_250M = 'FROM_50M_TO_250M',
  MORE_THAN_250M = 'MORE_THAN_250M',
}

/**
 * Enumerates the possible statuses a Lead can have within the
 * sales intelligence platform. Provides a lifecycle state for
 * prioritization and workflow management.
 */
export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  CONVERTED = 'CONVERTED',
  CLOSED = 'CLOSED',
}

/**
 * Enumerates the possible sources by which a Lead may enter
 * the system. Allows for segmentation and attribution analysis.
 */
export enum LeadSource {
  WEBSITE = 'WEBSITE',
  LINKEDIN = 'LINKEDIN',
  REFERRAL = 'REFERRAL',
  MANUAL = 'MANUAL',
  OTHER = 'OTHER',
}

//////////////////////////////////////////////////////////////////////////////
// ActivityType Usage
//////////////////////////////////////////////////////////////////////////////

/**
 * Restricts ActivityType to only those relevant to leads.
 * This ensures our lead module references only lead-centric events.
 */
export type LeadRelatedActivityType =
  | ActivityType.LEAD_CREATED
  | ActivityType.LEAD_UPDATED;

//////////////////////////////////////////////////////////////////////////////
// Location Interface
//////////////////////////////////////////////////////////////////////////////

/**
 * Provides structured geographic information for a company or lead,
 * contributing to richer enrichment and filtering capabilities.
 */
export interface Location {
  /**
   * Country name or ISO country code.
   */
  country: string;

  /**
   * Region, state, or province within the specified country.
   */
  region: string;

  /**
   * City or locality within the specified region.
   */
  city: string;

  /**
   * Postal or ZIP code, optionally provided.
   */
  postalCode: string | null;
}

//////////////////////////////////////////////////////////////////////////////
// SocialProfiles Interface
//////////////////////////////////////////////////////////////////////////////

/**
 * Represents a company's social media profiles, enabling the platform to
 * display relevant links or analytics for key brand channels.
 */
export interface SocialProfiles {
  /**
   * LinkedIn profile URL, or null if not available.
   */
  linkedin: string | null;

  /**
   * Twitter handle or URL, or null if not available.
   */
  twitter: string | null;

  /**
   * Facebook page URL, or null if not available.
   */
  facebook: string | null;
}

//////////////////////////////////////////////////////////////////////////////
// CompanyData Interface
//////////////////////////////////////////////////////////////////////////////

/**
 * Declares comprehensive enrichment data for a company linked to a lead,
 * allowing refined segmentation and filtering by size, revenue, location, etc.
 */
export interface CompanyData {
  /**
   * Industry classification (e.g., Technology, Manufacturing).
   */
  industry: string;

  /**
   * Enumeration specifying company size brackets.
   */
  size: CompanySize;

  /**
   * Enumeration specifying revenue brackets.
   */
  revenue: RevenueRange;

  /**
   * Geographical attributes, including country, region, city, etc.
   */
  location: Location;

  /**
   * Official company website domain, if available.
   */
  website: string;

  /**
   * List of technologies used by the company (e.g., React, Node.js).
   */
  technologies: string[];

  /**
   * Social media presence information, containing primary channels.
   */
  socialProfiles: SocialProfiles;
}

//////////////////////////////////////////////////////////////////////////////
// Lead Interface
//////////////////////////////////////////////////////////////////////////////

/**
 * Core lead interface representing a sales prospect with enhanced security
 * and classification measures. Addresses AI-powered search, data enrichment,
 * lead scoring, and prioritization within the B2B sales intelligence platform.
 */
export interface Lead {
  /**
   * Unique identifier string for the lead entity.
   */
  id: string;

  /**
   * Email address of the lead.
   */
  email: string;

  /**
   * First name or given name of the lead.
   */
  firstName: string;

  /**
   * Last name or surname of the lead.
   */
  lastName: string;

  /**
   * Current job title or position held by the lead.
   */
  title: string;

  /**
   * Name of the company where the lead is employed.
   */
  companyName: string;

  /**
   * Detailed company enrichment data, including size, revenue, location, etc.
   */
  companyData: CompanyData;

  /**
   * Numerical lead score for prioritizing follow-up actions.
   */
  score: number;

  /**
   * Lifecycle status of the lead (New, Contacted, etc.).
   */
  status: LeadStatus;

  /**
   * Original source from which the lead was captured.
   */
  source: LeadSource;

  /**
   * String referencing the ID of the organization that owns this lead.
   */
  organizationId: Organization['id'];

  /**
   * String referencing the user ID who owns or manages this lead record.
   */
  ownerId: User['id'];

  /**
   * Timestamp indicating creation date of the lead record.
   */
  createdAt: Date;

  /**
   * Timestamp indicating last update to the lead record.
   */
  updatedAt: Date;

  /**
   * Timestamp indicating when the lead was last enriched via AI or external data sources.
   * Null if the lead has never been enriched.
   */
  lastEnriched: Date | null;

  /**
   * Indicates whether the lead data has been encrypted at rest,
   * ensuring compliance with Confidential classification.
   */
  isEncrypted: boolean;
}

//////////////////////////////////////////////////////////////////////////////
// Zod Schemas for Validation
//////////////////////////////////////////////////////////////////////////////

/**
 * Zod schema providing runtime validation for the Location interface.
 * Ensures structured location data adheres to declared property types.
 */
const LocationSchema = z.object({
  country: z.string(),
  region: z.string(),
  city: z.string(),
  postalCode: z.string().nullable(),
});

/**
 * Zod schema providing runtime validation for social media profile links under
 * the SocialProfiles interface.
 */
const SocialProfilesSchema = z.object({
  linkedin: z.string().nullable(),
  twitter: z.string().nullable(),
  facebook: z.string().nullable(),
});

/**
 * Zod schema enumerating valid CompanySize values for company data classification.
 */
const CompanySizeSchema = z.nativeEnum(CompanySize);

/**
 * Zod schema enumerating valid RevenueRange values for company data classification.
 */
const RevenueRangeSchema = z.nativeEnum(RevenueRange);

/**
 * Zod schema enumerating valid LeadStatus values for controlling the lead lifecycle.
 */
const LeadStatusSchema = z.nativeEnum(LeadStatus);

/**
 * Zod schema enumerating valid LeadSource values to log or attribute leads accurately.
 */
const LeadSourceSchema = z.nativeEnum(LeadSource);

/**
 * Zod schema for CompanyData, referencing nested enums and location profiles.
 * Ensures consistency for company enrichment data across the platform.
 */
const CompanyDataSchema = z.object({
  industry: z.string(),
  size: CompanySizeSchema,
  revenue: RevenueRangeSchema,
  location: LocationSchema,
  website: z.string(),
  technologies: z.array(z.string()),
  socialProfiles: SocialProfilesSchema,
});

/**
 * Primary Zod validation schema for lead records in the platform,
 * fulfilling data integrity and security classification requirements.
 */
export const LeadValidationSchema = z.object({
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
  lastEnriched: z.date().nullable(),
  isEncrypted: z.boolean(),
});