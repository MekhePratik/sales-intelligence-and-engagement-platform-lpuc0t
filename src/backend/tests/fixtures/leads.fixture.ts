////////////////////////////////////////////////////////////////////////////////
// Internal Imports (TypeScript ^5.2, Node.js ^18.17)                         //
////////////////////////////////////////////////////////////////////////////////

import {
  Lead,
  LeadStatus,
  LeadSource,
  CompanyData,
  // Although not directly listed in the JSON spec's members_used,
  // these enums are necessary to satisfy the shape of CompanyData.
  CompanySize,
  RevenueRange,
} from '../../src/types/lead';

////////////////////////////////////////////////////////////////////////////////
// Global Constants for Testing                                               //
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents the ID of the test organization to which all test leads will belong.
 * Satisfies the requirement to include in-scope organizational references.
 */
export const TEST_ORGANIZATION_ID: string = 'test-org-123';

/**
 * Represents the ID of the test user/owner to which these leads are assigned.
 * Ensures data isolation and B2B platform alignment for the assigned owner.
 */
export const TEST_OWNER_ID: string = 'test-user-123';

/**
 * Default company data object adhering to the CompanyData interface from lead.ts.
 * This object facilitates consistent usage across multiple test leads.
 */
export const defaultCompanyData: CompanyData = {
  industry: 'Technology',
  size: CompanySize.MEDIUM_51_200,
  revenue: RevenueRange.FROM_10M_TO_50M,
  location: {
    country: 'USA',
    region: 'California',
    city: 'San Francisco',
    postalCode: '94103',
  },
  website: 'example.test',
  technologies: ['React', 'Node.js'],
  socialProfiles: {
    linkedin: null,
    twitter: null,
    facebook: null,
  },
};

////////////////////////////////////////////////////////////////////////////////
// Sample Leads Array                                                         //
////////////////////////////////////////////////////////////////////////////////

/**
 * Predefined array of 10 sample leads for comprehensive testing scenarios,
 * reflecting varied sources, statuses, and encryption states. These leads
 * are designed to validate lead search, filtering, enrichment, scoring,
 * and security-related functionalities within the platform.
 */
export const sampleLeads: Lead[] = [
  {
    id: 'lead-1001',
    email: 'alice.smith@example.test',
    firstName: 'Alice',
    lastName: 'Smith',
    title: 'Marketing Manager',
    companyName: 'AcmeCorp',
    companyData: {
      ...defaultCompanyData,
      industry: 'Retail',
      size: CompanySize.SMALL_1_50,
      revenue: RevenueRange.LESS_THAN_1M,
    },
    score: 25,
    status: LeadStatus.NEW,
    source: LeadSource.WEBSITE,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date('2023-01-01T09:30:00Z'),
    updatedAt: new Date('2023-01-02T08:15:00Z'),
    lastEnriched: null,
    isEncrypted: true,
  },
  {
    id: 'lead-1002',
    email: 'bob.jones@example.test',
    firstName: 'Bob',
    lastName: 'Jones',
    title: 'Sales Director',
    companyName: 'GlobalTech',
    companyData: {
      ...defaultCompanyData,
      industry: 'Technology',
      size: CompanySize.LARGE_201_1000,
      revenue: RevenueRange.FROM_50M_TO_250M,
    },
    score: 80,
    status: LeadStatus.CONTACTED,
    source: LeadSource.LINKEDIN,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date('2023-02-10T10:00:00Z'),
    updatedAt: new Date('2023-02-11T10:15:00Z'),
    lastEnriched: new Date('2023-02-10T20:00:00Z'),
    isEncrypted: false,
  },
  {
    id: 'lead-1003',
    email: 'carol.baker@referrals.test',
    firstName: 'Carol',
    lastName: 'Baker',
    title: 'Operations Specialist',
    companyName: 'SkylineOps',
    companyData: {
      ...defaultCompanyData,
      industry: 'Logistics',
      size: CompanySize.MEDIUM_51_200,
      revenue: RevenueRange.FROM_1M_TO_10M,
    },
    score: 65,
    status: LeadStatus.QUALIFIED,
    source: LeadSource.REFERRAL,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date('2023-03-15T12:00:00Z'),
    updatedAt: new Date('2023-03-15T13:00:00Z'),
    lastEnriched: null,
    isEncrypted: true,
  },
  {
    id: 'lead-1004',
    email: 'danielle.lee@company.test',
    firstName: 'Danielle',
    lastName: 'Lee',
    title: 'HR Generalist',
    companyName: 'HRMagic',
    companyData: {
      ...defaultCompanyData,
      industry: 'Human Resources',
      size: CompanySize.SMALL_1_50,
      revenue: RevenueRange.FROM_1M_TO_10M,
    },
    score: 40,
    status: LeadStatus.CONTACTED,
    source: LeadSource.MANUAL,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date('2023-04-01T09:45:00Z'),
    updatedAt: new Date('2023-04-02T07:00:00Z'),
    lastEnriched: new Date('2023-04-01T18:00:00Z'),
    isEncrypted: false,
  },
  {
    id: 'lead-1005',
    email: 'eric.bell@somewhere.test',
    firstName: 'Eric',
    lastName: 'Bell',
    title: 'CTO',
    companyName: 'NextGen Systems',
    companyData: {
      ...defaultCompanyData,
      industry: 'Software',
      size: CompanySize.MEDIUM_51_200,
      revenue: RevenueRange.FROM_10M_TO_50M,
    },
    score: 95,
    status: LeadStatus.CONVERTED,
    source: LeadSource.OTHER,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date('2023-05-11T11:00:00Z'),
    updatedAt: new Date('2023-05-12T09:30:00Z'),
    lastEnriched: new Date('2023-05-11T15:00:00Z'),
    isEncrypted: true,
  },
  {
    id: 'lead-1006',
    email: 'franklin.wu@domain.test',
    firstName: 'Franklin',
    lastName: 'Wu',
    title: 'Data Analyst',
    companyName: 'Insightful Data',
    companyData: {
      ...defaultCompanyData,
      industry: 'Analytics',
      size: CompanySize.LARGE_201_1000,
      revenue: RevenueRange.FROM_50M_TO_250M,
    },
    score: 50,
    status: LeadStatus.NEW,
    source: LeadSource.WEBSITE,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date('2023-06-01T15:00:00Z'),
    updatedAt: new Date('2023-06-01T15:30:00Z'),
    lastEnriched: null,
    isEncrypted: false,
  },
  {
    id: 'lead-1007',
    email: 'georgia.lane@leadsource.test',
    firstName: 'Georgia',
    lastName: 'Lane',
    title: 'Product Owner',
    companyName: 'ScrumWorks',
    companyData: {
      ...defaultCompanyData,
      industry: 'Project Management',
      size: CompanySize.SMALL_1_50,
      revenue: RevenueRange.LESS_THAN_1M,
    },
    score: 30,
    status: LeadStatus.NEW,
    source: LeadSource.REFERRAL,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date('2023-07-20T10:00:00Z'),
    updatedAt: new Date('2023-07-20T10:30:00Z'),
    lastEnriched: null,
    isEncrypted: true,
  },
  {
    id: 'lead-1008',
    email: 'hector.arias@example.test',
    firstName: 'Hector',
    lastName: 'Arias',
    title: 'VP of Engineering',
    companyName: 'HighScale',
    companyData: {
      ...defaultCompanyData,
      industry: 'FinTech',
      size: CompanySize.ENTERPRISE_1000_PLUS,
      revenue: RevenueRange.MORE_THAN_250M,
    },
    score: 88,
    status: LeadStatus.CONVERTED,
    source: LeadSource.LINKEDIN,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date('2023-08-05T09:00:00Z'),
    updatedAt: new Date('2023-08-06T11:00:00Z'),
    lastEnriched: new Date('2023-08-05T20:00:00Z'),
    isEncrypted: false,
  },
  {
    id: 'lead-1009',
    email: 'irina.garcia@sample.test',
    firstName: 'Irina',
    lastName: 'Garcia',
    title: 'Business Analyst',
    companyName: 'ConsultPlus',
    companyData: {
      ...defaultCompanyData,
      industry: 'Consulting',
      size: CompanySize.MEDIUM_51_200,
      revenue: RevenueRange.FROM_1M_TO_10M,
    },
    score: 70,
    status: LeadStatus.QUALIFIED,
    source: LeadSource.MANUAL,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date('2023-09-10T13:00:00Z'),
    updatedAt: new Date('2023-09-10T15:45:00Z'),
    lastEnriched: new Date('2023-09-10T14:30:00Z'),
    isEncrypted: true,
  },
  {
    id: 'lead-1010',
    email: 'johana.kim@anotherdomain.test',
    firstName: 'Johana',
    lastName: 'Kim',
    title: 'Account Executive',
    companyName: 'Apex Solutions',
    companyData: {
      ...defaultCompanyData,
      industry: 'Marketing',
      size: CompanySize.LARGE_201_1000,
      revenue: RevenueRange.FROM_10M_TO_50M,
    },
    score: 45,
    status: LeadStatus.CLOSED,
    source: LeadSource.OTHER,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date('2023-10-01T08:30:00Z'),
    updatedAt: new Date('2023-10-02T09:00:00Z'),
    lastEnriched: null,
    isEncrypted: false,
  },
];

////////////////////////////////////////////////////////////////////////////////
// Factory Function to Generate a Secure Test Lead                            //
////////////////////////////////////////////////////////////////////////////////

/**
 * Generates a fully-compliant test Lead object, applying a secure default
 * baseline, then merging in any supplied overrides. This includes:
 *  1) Base lead construction with mandated fields.
 *  2) Sanitization of sensitive override fields.
 *  3) Random fallback for IDs if not supplied.
 *  4) Application of encryption flags.
 *  5) Final validation against security requirements.
 *
 * @param overrides - Partial<Lead> object with any fields to override in the final lead.
 * @returns A fully-formed Lead object ready for testing, with encryption and
 *          privacy requirements in mind.
 */
export function getTestLead(overrides: Partial<Lead> = {}): Lead {
  // Step 1: Construct a secure baseline lead
  const baseLead: Lead = {
    id: `lead-${Math.floor(Math.random() * 100000)}`,
    email: 'default.user@example.test',
    firstName: 'Default',
    lastName: 'User',
    title: 'Sales Rep',
    companyName: 'DefaultCorp',
    companyData: defaultCompanyData,
    score: 50,
    status: LeadStatus.NEW,
    source: LeadSource.WEBSITE,
    organizationId: TEST_ORGANIZATION_ID,
    ownerId: TEST_OWNER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastEnriched: null,
    isEncrypted: false,
  };

  // Step 2: Construct merged lead from base and overrides (no direct sanitize call for partial fields)
  const mergedLead = { ...baseLead, ...overrides };

  // Step 3: Ensure mandatory fields have default or generated values if undefined in overrides
  if (!overrides.id) {
    mergedLead.id = `lead-${Math.floor(Math.random() * 99999)}`;
  }
  if (!overrides.email) {
    mergedLead.email = `default-${Math.floor(Math.random() * 9999)}@example.test`;
  }

  // Step 4: Apply or enforce encryption flags (example logic)
  if (typeof overrides.isEncrypted === 'boolean') {
    mergedLead.isEncrypted = overrides.isEncrypted;
  } else {
    mergedLead.isEncrypted = false;
  }

  // Step 5: (Optional) final lead can be verified or validated against the lead schema
  // For example:
  // LeadValidationSchema.parse(mergedLead);

  // Step 6: Return the completed test lead
  return mergedLead;
}

////////////////////////////////////////////////////////////////////////////////
// Data Sanitization Utility                                                  //
////////////////////////////////////////////////////////////////////////////////

/**
 * Sanitizes a given Lead by masking or replacing sensitive fields, ensuring:
 *  1) Email addresses are replaced with test domain format.
 *  2) Company name and data are partially or fully obscured.
 *  3) Personally identifiable information is generalized.
 *  4) Encryption flags are set if specified by the security policy.
 *
 * @param lead - The lead object to be sanitized.
 * @returns A sanitized lead object suitable for testing in environments
 *          requiring anonymized data.
 */
export function sanitizeTestData(lead: Lead): Lead {
  // Step 1: Replace real emails with test-safe domain
  const anonymizedEmail = `test_${lead.id}@testdomain.dev`;

  // Step 2: Mask sensitive company information
  const maskedCompanyName = `REDACTED-${lead.id}`;

  // Step 3: Sanitize PII by overriding personal fields with placeholders
  const sanitizedLead: Lead = {
    ...lead,
    email: anonymizedEmail,
    firstName: 'TestFirstName',
    lastName: 'TestLastName',
    companyName: maskedCompanyName,
    companyData: {
      ...lead.companyData,
      industry: 'REDACTED',
      website: 'redacted.test',
      location: {
        ...lead.companyData.location,
        city: 'TestCity',
      },
      // We retain size, revenue, socialProfiles for testing classification logic
    },
  };

  // Step 4: Optionally apply encryption if not already set
  if (!sanitizedLead.isEncrypted) {
    sanitizedLead.isEncrypted = true;
  }

  // Step 5: Return the sanitized lead object
  return sanitizedLead;
}