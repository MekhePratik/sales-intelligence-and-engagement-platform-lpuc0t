////////////////////////////////////////////////////////////////////////////////
// External Imports (Third-party)
////////////////////////////////////////////////////////////////////////////////

import { v4 as uuidv4 } from 'uuid'; // uuid ^9.0.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////
import {
  Campaign,
  CampaignSchema,
  CampaignStatus,
  CampaignType,
  CampaignSettings,
  CampaignMetrics,
} from '../../src/types/campaign';

////////////////////////////////////////////////////////////////////////////////
// Default Structures: Derived from JSON Specification
////////////////////////////////////////////////////////////////////////////////

/**
 * Default security controls mapped from JSON specification to match the
 * internal SecuritySettings interface while storing unsupported fields
 * in extraSecurityFlags.
 */
const defaultSecurityControls = {
  encryptTemplates: true,
  secureLinkTracking: true,
  extraSecurityFlags: {
    dataClassification: 'CONFIDENTIAL',
    auditLoggingEnabled: true,
    ipRestrictions: [],
    unsubscribes: true,
    bounces: true,
    abTestingConfig: {
      enabled: false,
      variants: [],
      winningCriteria: 'OPEN_RATE',
      testDuration: '24h',
    },
  },
};

/**
 * Default data retention policy. This is required by the CampaignSettings
 * interface but not explicitly defined in the JSON specification,
 * so we set sensible defaults for testing.
 */
const defaultDataRetention = {
  retentionDays: 90,
  autoArchive: false,
  autoDelete: false,
};

/**
 * Default campaign settings mapped from JSON specification, reconciling with
 * the actual CampaignSettings interface fields. Additional JSON fields that
 * are not present in the interface are placed in the securityControls.extraSecurityFlags.
 */
export const defaultCampaignSettings: CampaignSettings = {
  sendingWindow: {
    start: '09:00',
    end: '17:00',
  },
  timezone: 'UTC',
  maxEmailsPerDay: 100,
  trackOpens: true,
  trackClicks: true,
  abTesting: false,
  dataRetention: defaultDataRetention,
  securityControls: defaultSecurityControls,
};

/**
 * Default campaign metrics structure that covers performance tracking,
 * conversion analytics, and ROI calculations, fulfilling the requirements
 * for analytics testing.
 */
export const defaultCampaignMetrics: CampaignMetrics = {
  totalLeads: 0,
  emailsSent: 0,
  emailsOpened: 0,
  emailsClicked: 0,
  responses: 0,
  conversions: 0,
  bounces: 0,
  unsubscribes: 0,
  variantPerformance: [],
  roi: {
    cost: 0,
    revenue: 0,
    roiValue: 0,
    note: '',
  },
  conversionFunnel: {
    initialTouch: 0,
    engagement: 0,
    opportunity: 0,
    conversion: 0,
  },
};

////////////////////////////////////////////////////////////////////////////////
// Helper: Generate Base Metrics If Requested
////////////////////////////////////////////////////////////////////////////////

/**
 * Generates a populated set of metrics if includeMetrics is true; otherwise,
 * returns a mostly zeroed structure for minimal test coverage.
 */
function createMetrics(includeMetrics: boolean): CampaignMetrics {
  if (!includeMetrics) {
    return { ...defaultCampaignMetrics };
  }
  return {
    totalLeads: 100,
    emailsSent: 80,
    emailsOpened: 40,
    emailsClicked: 10,
    responses: 15,
    conversions: 5,
    bounces: 2,
    unsubscribes: 1,
    variantPerformance: [],
    roi: {
      cost: 100,
      revenue: 300,
      roiValue: 3.0,
      note: 'Sample ROI calculation for testing',
    },
    conversionFunnel: {
      initialTouch: 100,
      engagement: 50,
      opportunity: 20,
      conversion: 5,
    },
  };
}

////////////////////////////////////////////////////////////////////////////////
// Campaign Factory Function
////////////////////////////////////////////////////////////////////////////////

/**
 * Generates a comprehensive mock campaign with full structure for test usage.
 * - Creates a unique UUID for the campaign ID
 * - Initializes default settings and metrics
 * - Applies partial overrides from the caller
 * - Optionally includes fully populated metrics
 * - Validates the final result against the CampaignSchema
 *
 * @param overrides Partial<Campaign> - Optional fields to override defaults
 * @param includeMetrics boolean - If true, populates the CampaignMetrics with
 *                                non-zero placeholders for analytics testing
 * @returns Campaign - Complete campaign object meeting the schema definition
 */
export function generateMockCampaign(
  overrides: Partial<Campaign> = {},
  includeMetrics: boolean = true
): Campaign {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Base campaign with sensible defaults
  const base: Campaign = {
    id: uuidv4(),
    name: 'Mock Campaign',
    description: 'Auto-generated mock campaign for tests',
    type: CampaignType.OUTREACH,
    status: CampaignStatus.DRAFT,
    steps: [],
    organizationId: 'org-123',
    creatorId: 'user-123',
    targetLeads: [],
    metrics: createMetrics(includeMetrics),
    settings: { ...defaultCampaignSettings },
    goals: {
      description: 'Default campaign goal',
      targetValue: 100,
      dueDate: null,
    },
    auditTrail: [],
    startDate: now,
    endDate: tomorrow,
    createdAt: now,
    updatedAt: now,
  };

  // Combine base campaign with any overrides
  const merged: Campaign = {
    ...base,
    ...overrides,
    // If overrides.metrics present, spread over the base metrics:
    metrics: {
      ...base.metrics,
      ...(overrides.metrics || {}),
    },
    // If overrides.settings present, merge them carefully:
    settings: {
      ...base.settings,
      ...(overrides.settings || {}),
      securityControls: {
        ...base.settings.securityControls,
        ...(overrides.settings?.securityControls || {}),
        extraSecurityFlags: {
          ...base.settings.securityControls.extraSecurityFlags,
          ...(overrides.settings?.securityControls?.extraSecurityFlags || {}),
        },
      },
    },
  };

  // Validate merged campaign data against the schema
  return CampaignSchema.parse(merged);
}

////////////////////////////////////////////////////////////////////////////////
// Named Mock Campaigns for Various Testing Scenarios
////////////////////////////////////////////////////////////////////////////////

/**
 * Draft campaign object for testing basic creation scenarios.
 */
export const draftCampaign: Campaign = generateMockCampaign(
  {
    id: 'camp-draft-001',
    name: 'Draft Campaign',
    description: 'Test fixture for a draft campaign scenario',
    status: CampaignStatus.DRAFT,
    metrics: {
      totalLeads: 10,
      emailsSent: 0,
      emailsOpened: 0,
      responses: 0,
    },
  },
  false
);

/**
 * Active campaign object for testing an in-progress scenario. This includes
 * non-zero metrics, indicating partial engagement from leads.
 */
export const activeCampaign: Campaign = generateMockCampaign({
  id: 'camp-active-002',
  name: 'Active Campaign',
  description: 'Test fixture for an active campaign scenario',
  status: CampaignStatus.ACTIVE,
  metrics: {
    totalLeads: 50,
    emailsSent: 45,
    emailsOpened: 20,
    emailsClicked: 5,
    conversions: 2,
  },
});

/**
 * Completed campaign object to test a scenario where a campaign has concluded
 * and exhibits final metrics data.
 */
export const completedCampaign: Campaign = generateMockCampaign({
  id: 'camp-completed-003',
  name: 'Completed Campaign',
  description: 'Test fixture for a fully completed campaign scenario',
  status: CampaignStatus.COMPLETED,
  metrics: {
    totalLeads: 200,
    emailsSent: 190,
    emailsOpened: 130,
    emailsClicked: 50,
    responses: 40,
    conversions: 25,
    bounces: 5,
    unsubscribes: 8,
  },
});

/**
 * A/B Test campaign object demonstrating usage of abTesting in settings.
 * This scenario is intended for testing sequence builder logic, A/B testing
 * engine, and associated variant-level metrics or distribution.
 */
export const abTestCampaign: Campaign = generateMockCampaign({
  id: 'camp-abtest-004',
  name: 'AB Test Campaign',
  description: 'Test fixture for a campaign with A/B testing enabled',
  type: CampaignType.NURTURE,
  status: CampaignStatus.ACTIVE,
  settings: {
    abTesting: true,
    securityControls: {
      extraSecurityFlags: {
        abTestingConfig: {
          enabled: true,
          variants: ['VariantA', 'VariantB'],
          winningCriteria: 'CLICK_RATE',
          testDuration: '48h',
        },
      },
    },
  },
  metrics: {
    totalLeads: 120,
    emailsSent: 100,
    emailsOpened: 60,
    emailsClicked: 30,
    responses: 10,
    conversions: 4,
    bounces: 2,
    unsubscribes: 3,
  },
});

////////////////////////////////////////////////////////////////////////////////
// Exported Array of Mock Campaigns
////////////////////////////////////////////////////////////////////////////////

/**
 * Collection of mock campaigns addressing multiple scenarios:
 * - Draft
 * - Active
 * - Completed
 * - A/B Testing
 */
export const mockCampaigns: Campaign[] = [
  draftCampaign,
  activeCampaign,
  completedCampaign,
  abTestCampaign,
];