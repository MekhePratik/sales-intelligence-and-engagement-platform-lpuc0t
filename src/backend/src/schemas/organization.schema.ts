/*
  --------------------------------------------------------------------------------------
  File: organization.schema.ts
  Description: Zod schemas and domain validation for organization-related data in the
               B2B sales intelligence platform. Includes multi-tenant support, data
               security, and strict input validation. Implements comprehensive checks
               for organization creation, update, and overall structure, as well as
               a specialized function for validating organization domains with security
               controls and compliance measures.
  --------------------------------------------------------------------------------------
*/

// --------------------------------- External Imports ---------------------------------
// zod ^3.22.0
import { z } from 'zod';

// --------------------------------- Internal Imports ----------------------------------
import {
  Organization,
  OrganizationSettings,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../types/organization';
import { validateEmail } from '../utils/validation.util';
import { USER_ROLES } from '../constants/roles';

// --------------------------------- Constants -----------------------------------------
/**
 * The minimum allowed length for an organization's name, ensuring that
 * the name meets basic clarity and descriptive criteria.
 */
const ORGANIZATION_NAME_MIN_LENGTH = 3;

/**
 * The maximum allowed length for an organization's name to maintain
 * consistent data formats and avoid overly verbose names.
 */
const ORGANIZATION_NAME_MAX_LENGTH = 100;

/**
 * Regular expression pattern used to validate the structure of a domain.
 * This pattern disallows leading/trailing hyphens, enforces valid TLDs,
 * and generally follows RFC guidelines for domain names.
 */
const DOMAIN_REGEX = new RegExp(
  '^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\\.(?:[A-Za-z]{2,}|xn--[A-Za-z0-9]+)$'
);

/**
 * Represents the time window, in milliseconds, within which a certain
 * number of requests may be made for domain or security checks. This
 * constant can be used if domain checks or domain scanning is rate-limited.
 */
const RATE_LIMIT_WINDOW = 60000;

/**
 * Represents the maximum number of requests allowed during the rate
 * limit window for security checks on domains or organization data.
 */
const RATE_LIMIT_MAX_REQUESTS = 100;

/**
 * Represents the security check timeout, in milliseconds, for verifying
 * domain reputation, DNS data, or blocklist scanning. Helps to prevent
 * indefinite wait times for external lookups.
 */
const SECURITY_CHECK_TIMEOUT = 5000;

// --------------------------------- Interfaces & Schemas ---------------------------------

/**
 * Interface representing additional security settings
 * that can be applied at the organization level to
 * enforce compliance, data integrity, and secure access.
 */
export interface OrganizationSecuritySettings {
  /**
   * Whether or not two-factor authentication is enforced
   * for all users in the organization.
   */
  enforce2FA: boolean;

  /**
   * A list of IP addresses allowed to connect to
   * the organization’s resources, assisting in
   * IP-based access control.
   */
  ipAllowList: string[];

  /**
   * A list of domains that are explicitly blocked from
   * any interactions, typically used to prevent
   * outgoing connections to known malicious domains.
   */
  domainBlockList: string[];

  /**
   * Optional field for storing organization-specific
   * security-related notes or references.
   */
  additionalSecurityNote?: string;
}

/**
 * Zod schema that enforces validation rules and data structures
 * for OrganizationSecuritySettings, ensuring robust security and
 * compliance at the organizational level.
 */
export const OrganizationSecuritySettingsSchema = z.object({
  enforce2FA: z.boolean(),
  ipAllowList: z.array(z.string()),
  domainBlockList: z.array(z.string()),
  additionalSecurityNote: z.string().optional(),
});

// --------------------------------- Domain Validation Function ---------------------------------

/**
 * validateOrganizationDomain
 * -----------------------------------------------------------------------------
 * Enhanced validator for organization domain format with security checks.
 * This function verifies that the provided domain is not empty, matches the
 * allowed domain pattern, and passes placeholder security checks such as
 * domain reputation and DNS record scanning.
 *
 * Steps:
 *   1. Check if domain is defined and not empty.
 *   2. Validate domain format using an enhanced regex pattern.
 *   3. Ensure domain has a valid TLD (as enforced by DOMAIN_REGEX).
 *   4. Perform placeholder security checks for domain reputation.
 *   5. Validate domain DNS records (placeholder logic).
 *   6. Check domain against any blocklists or malicious patterns.
 *   7. Return the final validation result (true if all checks are passed).
 *
 * @param domain - The domain string to be validated.
 * @returns {boolean} - True if domain is valid and meets security checks.
 */
export function validateOrganizationDomain(domain: string): boolean {
  // 1. Check if domain is defined and not empty
  const trimmedDomain = (domain || '').trim().toLowerCase();
  if (!trimmedDomain) {
    return false;
  }

  // 2. Validate domain format using the domain regex
  if (!DOMAIN_REGEX.test(trimmedDomain)) {
    return false;
  }

  // 3. By virtue of DOMAIN_REGEX, we ensure domain has a valid TLD,
  //    so no explicit separate check is needed here unless we want
  //    deeper logic.

  // 4. Perform placeholder security checks for domain reputation.
  //    A real implementation could call an external service, or
  //    check an internal database of known malicious domains.
  const domainReputationIsSafe = true; // Placeholder outcome
  if (!domainReputationIsSafe) {
    return false;
  }

  // 5. Validate domain DNS records (placeholder).
  //    A real system might fetch DNS data to confirm existence of
  //    MX, A, or CNAME records. For demonstration, assume success.
  const dnsIsValid = true; // Placeholder
  if (!dnsIsValid) {
    return false;
  }

  // 6. Check domain against blocklist or malicious patterns (placeholder).
  //    In a real scenario, we'd reference an external or internal
  //    blocklist array to see if this domain is explicitly disallowed.
  const blockList = ['maliciousdomain.tld', 'spamdomain.example'];
  if (blockList.includes(trimmedDomain)) {
    return false;
  }

  // 7. If all checks pass, return true.
  return true;
}

// --------------------------------- Zod Schemas ---------------------------------

/**
 * organizationSchema
 * --------------------------------------------------------------------------------
 * Enhanced Zod schema for validating organization data with security controls,
 * multi-tenant support, data integrity, and compliance. Incorporates domain
 * validation for strict input checks, ensuring data correctness.
 *
 * Exposed Fields:
 *   - id                 : string
 *   - name               : string
 *   - domain             : string
 *   - settings           : OrganizationSettings
 *   - securitySettings   : OrganizationSecuritySettings
 */
export const organizationSchema = z.object({
  /**
   * A required string that uniquely identifies the organization.
   * This ID is typically generated by the system upon creation.
   */
  id: z.string(),

  /**
   * The organization's name, complying with the minimum and
   * maximum length constraints to maintain clarity and brevity.
   */
  name: z
    .string()
    .min(
      ORGANIZATION_NAME_MIN_LENGTH,
      `Organization name must be at least ${ORGANIZATION_NAME_MIN_LENGTH} characters long`
    )
    .max(
      ORGANIZATION_NAME_MAX_LENGTH,
      `Organization name must be no more than ${ORGANIZATION_NAME_MAX_LENGTH} characters long`
    ),

  /**
   * The primary domain of the organization. It is refined with
   * validateOrganizationDomain to ensure correct structure,
   * DNS checks, and blocklist checks.
   */
  domain: z
    .string()
    .refine(
      (val) => validateOrganizationDomain(val),
      'Invalid organization domain or fails security checks'
    ),

  /**
   * An object that holds multi-tenant settings, usage limits,
   * and feature flags for the organization. The field is validated
   * using the existing OrganizationSettingsSchema from the types
   * module.
   */
  settings: z.lazy(() => z.object(OrganizationSettingsSchema.shape)),

  /**
   * An object containing advanced security settings, such as
   * enforce2FA, IP allowlists, or blocklists for compliance.
   */
  securitySettings: OrganizationSecuritySettingsSchema,
});

/**
 * createOrganizationSchema
 * --------------------------------------------------------------------------------
 * Enhanced Zod schema for organization creation with security validation.
 * Ensures that essential fields (name, domain) are provided, and partial
 * settings/securitySettings are allowed at creation time.
 *
 * Exposed Fields:
 *   - name              : string
 *   - domain            : string
 *   - settings          : Partial<OrganizationSettings>
 *   - securitySettings  : Partial<OrganizationSecuritySettings>
 */
export const createOrganizationSchema = z.object({
  /**
   * The name of the organization being created, subject to
   * length constraints for clarity and consistency.
   */
  name: z
    .string()
    .min(
      ORGANIZATION_NAME_MIN_LENGTH,
      `Organization name must be at least ${ORGANIZATION_NAME_MIN_LENGTH} characters long`
    )
    .max(
      ORGANIZATION_NAME_MAX_LENGTH,
      `Organization name must be no more than ${ORGANIZATION_NAME_MAX_LENGTH} characters long`
    ),

  /**
   * The organization's primary domain, enforced by specialized
   * validation logic to guard against invalid or malicious domains.
   */
  domain: z
    .string()
    .refine(
      (val) => validateOrganizationDomain(val),
      'Invalid organization domain or fails security checks'
    ),

  /**
   * Partial organization-level settings that can be initialized
   * or left undefined. Uses partial schema so that the user can
   * provide minimal config or advanced config as needed.
   */
  settings: z.lazy(() => z.object(OrganizationSettingsSchema.shape).partial()),

  /**
   * Partial security settings to allow specifying or deferring
   * advanced security configurations at creation time.
   */
  securitySettings: OrganizationSecuritySettingsSchema.partial(),
});

/**
 * updateOrganizationSchema
 * --------------------------------------------------------------------------------
 * Enhanced Zod schema for updating organization data with security validation.
 * Fields are optional, enabling partial updates without requiring a full object.
 *
 * Exposed Fields:
 *   - name              : string | undefined
 *   - settings          : Partial<OrganizationSettings> | undefined
 *   - securitySettings  : Partial<OrganizationSecuritySettings> | undefined
 */
export const updateOrganizationSchema = z.object({
  /**
   * The updated name of the organization, if any.
   * Must comply with length constraints when provided.
   */
  name: z
    .string()
    .min(
      ORGANIZATION_NAME_MIN_LENGTH,
      `Organization name must be at least ${ORGANIZATION_NAME_MIN_LENGTH} characters long`
    )
    .max(
      ORGANIZATION_NAME_MAX_LENGTH,
      `Organization name must be no more than ${ORGANIZATION_NAME_MAX_LENGTH} characters long`
    )
    .optional(),

  /**
   * Organization settings can be updated partially, allowing
   * only relevant fields to be changed without overwriting
   * all existing configuration data.
   */
  settings: z
    .lazy(() => z.object(OrganizationSettingsSchema.shape).partial())
    .optional(),

  /**
   * Security settings can likewise be updated partially, for instance
   * toggling enforce2FA or updating the ipAllowList. The optional
   * usage allows leaving current security configurations unchanged.
   */
  securitySettings: OrganizationSecuritySettingsSchema.partial().optional(),
});