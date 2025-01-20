/**
 * Centralized route configuration constants for the B2B sales intelligence platform.
 * Defines all application routes and navigation paths for consistent routing across components.
 * Includes TypeScript-based parameter handling, minimal runtime validation,
 * and comprehensive documentation for enterprise-level maintainability and clarity.
 *
 * This file addresses:
 * - Core Features Navigation (Lead Management, Email Automation, Analytics, Integrations)
 * - User Interface Design (Consistent routes for layout structure and navigation)
 * - Security Controls (Support for authenticated and role-based routing)
 *
 * No external or internal imports are used in this file to avoid additional dependencies.
 */

/* ------------------------------------------------------------------
 * AUTHENTICATION ROUTES
 * 
 * Contains route constants for user authentication flows including:
 * - Login, registration, password resets
 * - Two-factor authentication (MFA) flows
 * - Email verification
 *
 * All routes under /auth typically require unauthenticated or partially
 * authenticated states before usage.
 * ------------------------------------------------------------------ */

/**
 * Authentication-related route constants.
 */
export const AUTH_ROUTES = {
  /**
   * Route to user login page.
   * Typically requires the user to be logged out.
   */
  LOGIN: '/auth/login',

  /**
   * Route to user registration page for new account creation.
   */
  REGISTER: '/auth/register',

  /**
   * Route to initiate the forgot password flow.
   * Users provide email/username to receive reset instructions.
   */
  FORGOT_PASSWORD: '/auth/forgot-password',

  /**
   * Route to reset password, typically visited from
   * an emailed token/link to complete the password reset.
   */
  RESET_PASSWORD: '/auth/reset-password',

  /**
   * Route to verify the user’s email address.
   * May require a token-based query parameter for confirmation.
   */
  VERIFY_EMAIL: '/auth/verify-email',

  /**
   * Route to set up multi-factor authentication (MFA),
   * such as TOTP or app-based authorization.
   */
  MFA_SETUP: '/auth/mfa-setup',

  /**
   * Route to verify multi-factor authentication (MFA)
   * after the user has enabled it.
   */
  MFA_VERIFY: '/auth/mfa-verify'
} as const;

/* ------------------------------------------------------------------
 * DASHBOARD ROUTES
 *
 * Main navigation routes for users after successful authentication.
 * Typically requires user to be logged in and have appropriate roles.
 * ------------------------------------------------------------------ */

/**
 * Core dashboard and sub-navigation routes.
 */
export const DASHBOARD_ROUTES = {
  /**
   * Primary dashboard home route.
   * Displays high-level metrics and quick actions.
   */
  HOME: '/dashboard',

  /**
   * Leads management route. Overlaps with LEAD_ROUTES, 
   * but often used in main navigation for quick access.
   */
  LEADS: '/leads',

  /**
   * Campaigns management route. Overlaps with CAMPAIGN_ROUTES,
   * used in main nav for marketing or sales campaigns.
   */
  CAMPAIGNS: '/campaigns',

  /**
   * Sequences management route. Overlaps with SEQUENCE_ROUTES,
   * focusing on email sequences or outreach steps.
   */
  SEQUENCES: '/sequences',

  /**
   * Route for analytics dashboards.
   * Displays performance metrics, charts, and insights.
   */
  ANALYTICS: '/analytics',

  /**
   * General settings page route.
   * Includes user account, notifications, app configurations, etc.
   */
  SETTINGS: '/settings',

  /**
   * Integrations page route for configuring external CRM, email, or
   * other third-party service connections.
   */
  INTEGRATIONS: '/integrations',

  /**
   * Team management route for organization administrators
   * to invite users, manage roles, and control accesses.
   */
  TEAM: '/team',

  /**
   * User profile route. Displays personal info, 
   * identity verification options, and custom preferences.
   */
  PROFILE: '/profile'
} as const;

/* ------------------------------------------------------------------
 * LEAD ROUTES
 *
 * Dedicated routes for lead management, including
 * viewing lists, creating new leads, and accessing dynamic pages
 * such as detail, edit, and related activities.
 * ------------------------------------------------------------------ */

/**
 * All lead-related route constants.
 * Some routes include dynamic [id] params for individual leads.
 */
export const LEAD_ROUTES = {
  /**
   * Default listing of all leads view.
   */
  LIST: '/leads',

  /**
   * Route for creating a new lead record.
   */
  NEW: '/leads/new',

  /**
   * Detail view for an individual lead with a dynamic [id] parameter.
   */
  DETAIL: '/leads/[id]',

  /**
   * Lead-editing view for a specific lead, with a dynamic [id] parameter.
   */
  EDIT: '/leads/[id]/edit',

  /**
   * Displays the activity feed or event logs associated with a lead.
   */
  ACTIVITIES: '/leads/[id]/activities',

  /**
   * Shows campaigns that a particular lead is associated with.
   */
  CAMPAIGNS: '/leads/[id]/campaigns',

  /**
   * Route for bulk importing leads.
   */
  IMPORT: '/leads/import',

  /**
   * Route for bulk exporting leads to a CSV or other file format.
   */
  EXPORT: '/leads/export',

  /**
   * Route for applying bulk actions to selected leads (tagging, scoring, etc.).
   */
  BULK_ACTIONS: '/leads/bulk'
} as const;

/**
 * Builds a fully qualified lead detail route using the provided leadId.
 * Validates that leadId is a non-empty string.
 *
 * @param leadId - The unique identifier for the lead to be viewed.
 * @returns The constructed route string for the Lead Detail page.
 */
export function buildLeadDetailRoute(leadId: string): string {
  if (!leadId || !leadId.trim()) {
    throw new Error('Invalid leadId provided for buildLeadDetailRoute');
  }
  return `/leads/${encodeURIComponent(leadId)}`;
}

/**
 * Builds the route for editing a specific lead.
 *
 * @param leadId - The unique identifier for the lead to be edited.
 * @returns The constructed route string for the Lead Edit page.
 */
export function buildLeadEditRoute(leadId: string): string {
  if (!leadId || !leadId.trim()) {
    throw new Error('Invalid leadId provided for buildLeadEditRoute');
  }
  return `/leads/${encodeURIComponent(leadId)}/edit`;
}

/**
 * Builds the route for viewing the activity feed of a specific lead.
 *
 * @param leadId - The unique identifier for the lead whose activities are being viewed.
 * @returns The constructed route string for the Lead Activities page.
 */
export function buildLeadActivitiesRoute(leadId: string): string {
  if (!leadId || !leadId.trim()) {
    throw new Error('Invalid leadId provided for buildLeadActivitiesRoute');
  }
  return `/leads/${encodeURIComponent(leadId)}/activities`;
}

/**
 * Builds the route for viewing campaigns associated with a specific lead.
 *
 * @param leadId - The unique identifier for the lead whose campaigns are being viewed.
 * @returns The constructed route string for the Lead Campaigns page.
 */
export function buildLeadCampaignsRoute(leadId: string): string {
  if (!leadId || !leadId.trim()) {
    throw new Error('Invalid leadId provided for buildLeadCampaignsRoute');
  }
  return `/leads/${encodeURIComponent(leadId)}/campaigns`;
}

/* ------------------------------------------------------------------
 * CAMPAIGN ROUTES
 *
 * Routes covering campaign lifecycle management, including
 * creation, viewing, editing, analytics, sequences, and settings.
 * ------------------------------------------------------------------ */

/**
 * Campaign-oriented route constants, supporting dynamic [id] parameters.
 */
export const CAMPAIGN_ROUTES = {
  /**
   * Default listing of all campaigns.
   */
  LIST: '/campaigns',

  /**
   * Route for creating a new campaign.
   */
  NEW: '/campaigns/new',

  /**
   * Detail view for an individual campaign with a dynamic [id].
   */
  DETAIL: '/campaigns/[id]',

  /**
   * Editing route for updating an existing campaign.
   */
  EDIT: '/campaigns/[id]/edit',

  /**
   * Analytics route for a specific campaign to view performance metrics.
   */
  ANALYTICS: '/campaigns/[id]/analytics',

  /**
   * Route for managing sequences associated with a specific campaign.
   */
  SEQUENCES: '/campaigns/[id]/sequences',

  /**
   * Shows all leads included in or targeted by a specific campaign.
   */
  LEADS: '/campaigns/[id]/leads',

  /**
   * Route for configuring custom campaign settings.
   */
  SETTINGS: '/campaigns/[id]/settings',

  /**
   * Templates route, generally for pre-defined campaign content.
   */
  TEMPLATES: '/campaigns/templates'
} as const;

/**
 * Builds the campaign detail route for a given campaign ID.
 *
 * @param campaignId - The unique identifier for the campaign.
 * @returns The constructed route string for the Campaign Detail page.
 */
export function buildCampaignDetailRoute(campaignId: string): string {
  if (!campaignId || !campaignId.trim()) {
    throw new Error('Invalid campaignId provided for buildCampaignDetailRoute');
  }
  return `/campaigns/${encodeURIComponent(campaignId)}`;
}

/**
 * Builds the editing route for a specific campaign.
 *
 * @param campaignId - The unique identifier for the campaign to be edited.
 * @returns The constructed route string for the Campaign Edit page.
 */
export function buildCampaignEditRoute(campaignId: string): string {
  if (!campaignId || !campaignId.trim()) {
    throw new Error('Invalid campaignId provided for buildCampaignEditRoute');
  }
  return `/campaigns/${encodeURIComponent(campaignId)}/edit`;
}

/**
 * Builds the analytics route for a specific campaign.
 *
 * @param campaignId - The unique identifier for the campaign whose analytics to view.
 * @returns The constructed route string for the Campaign Analytics page.
 */
export function buildCampaignAnalyticsRoute(campaignId: string): string {
  if (!campaignId || !campaignId.trim()) {
    throw new Error('Invalid campaignId provided for buildCampaignAnalyticsRoute');
  }
  return `/campaigns/${encodeURIComponent(campaignId)}/analytics`;
}

/**
 * Builds the sequences route for a specific campaign,
 * allowing management of related email or outreach sequences.
 *
 * @param campaignId - The unique identifier for the campaign to manage sequences.
 * @returns The constructed route string for the Campaign Sequences page.
 */
export function buildCampaignSequencesRoute(campaignId: string): string {
  if (!campaignId || !campaignId.trim()) {
    throw new Error('Invalid campaignId for buildCampaignSequencesRoute');
  }
  return `/campaigns/${encodeURIComponent(campaignId)}/sequences`;
}

/**
 * Builds the leads route for a specific campaign,
 * allowing viewing of leads targeted by or associated with that campaign.
 *
 * @param campaignId - The unique identifier for the campaign whose leads to view.
 * @returns The constructed route string for the Campaign Leads page.
 */
export function buildCampaignLeadsRoute(campaignId: string): string {
  if (!campaignId || !campaignId.trim()) {
    throw new Error('Invalid campaignId for buildCampaignLeadsRoute');
  }
  return `/campaigns/${encodeURIComponent(campaignId)}/leads`;
}

/**
 * Builds the settings route for a given campaign,
 * allowing customization of advanced campaign-level configuration.
 *
 * @param campaignId - The unique identifier for the campaign whose settings to manage.
 * @returns The constructed route string for the Campaign Settings page.
 */
export function buildCampaignSettingsRoute(campaignId: string): string {
  if (!campaignId || !campaignId.trim()) {
    throw new Error('Invalid campaignId for buildCampaignSettingsRoute');
  }
  return `/campaigns/${encodeURIComponent(campaignId)}/settings`;
}

/* ------------------------------------------------------------------
 * SEQUENCE ROUTES
 *
 * Routes for managing sequences, which can be stand-alone or
 * associated with specific campaigns, including creation,
 * viewing details, editing steps, analytics, and A/B testing.
 * ------------------------------------------------------------------ */

/**
 * Sequence-oriented route constants, supporting dynamic [id] parameters.
 */
export const SEQUENCE_ROUTES = {
  /**
   * Default listing of all sequences in the system.
   */
  LIST: '/sequences',

  /**
   * Route for creating a new sequence.
   */
  NEW: '/sequences/new',

  /**
   * Detail view for an individual sequence with a dynamic [id].
   */
  DETAIL: '/sequences/[id]',

  /**
   * Editing route for updating an existing sequence.
   */
  EDIT: '/sequences/[id]/edit',

  /**
   * Analytics route for a specific sequence to assess performance metrics.
   */
  ANALYTICS: '/sequences/[id]/analytics',

  /**
   * Templates route for a given sequence, typically used to store
   * or reference common message templates.
   */
  TEMPLATES: '/sequences/[id]/templates',

  /**
   * Settings route for sequence-level configurations,
   * including scheduling or advanced options.
   */
  SETTINGS: '/sequences/[id]/settings',

  /**
   * A/B testing route for a specific sequence, enabling test variations
   * of messaging and scheduling.
   */
  A_B_TEST: '/sequences/[id]/ab-test'
} as const;

/**
 * Builds the detail route for a sequence by ID.
 *
 * @param sequenceId - Unique identifier for the sequence.
 * @returns The constructed route string for the Sequence Detail page.
 */
export function buildSequenceDetailRoute(sequenceId: string): string {
  if (!sequenceId || !sequenceId.trim()) {
    throw new Error('Invalid sequenceId for buildSequenceDetailRoute');
  }
  return `/sequences/${encodeURIComponent(sequenceId)}`;
}

/**
 * Builds the edit route for a sequence by ID.
 *
 * @param sequenceId - Unique identifier for the sequence to be edited.
 * @returns The constructed route string for the Sequence Edit page.
 */
export function buildSequenceEditRoute(sequenceId: string): string {
  if (!sequenceId || !sequenceId.trim()) {
    throw new Error('Invalid sequenceId for buildSequenceEditRoute');
  }
  return `/sequences/${encodeURIComponent(sequenceId)}/edit`;
}

/**
 * Builds the analytics route for a sequence, allowing
 * performance data to be displayed.
 *
 * @param sequenceId - Unique identifier for the sequence to display analytics.
 * @returns The constructed route string for the Sequence Analytics page.
 */
export function buildSequenceAnalyticsRoute(sequenceId: string): string {
  if (!sequenceId || !sequenceId.trim()) {
    throw new Error('Invalid sequenceId for buildSequenceAnalyticsRoute');
  }
  return `/sequences/${encodeURIComponent(sequenceId)}/analytics`;
}

/**
 * Builds the templates route for a sequence, controlling
 * content templates used in the steps of that sequence.
 *
 * @param sequenceId - Unique identifier for the sequence.
 * @returns The constructed route string for the Sequence Templates page.
 */
export function buildSequenceTemplatesRoute(sequenceId: string): string {
  if (!sequenceId || !sequenceId.trim()) {
    throw new Error('Invalid sequenceId for buildSequenceTemplatesRoute');
  }
  return `/sequences/${encodeURIComponent(sequenceId)}/templates`;
}

/**
 * Builds the settings route for a sequence.
 *
 * @param sequenceId - Unique identifier for the sequence whose settings to manage.
 * @returns The constructed route string for the Sequence Settings page.
 */
export function buildSequenceSettingsRoute(sequenceId: string): string {
  if (!sequenceId || !sequenceId.trim()) {
    throw new Error('Invalid sequenceId for buildSequenceSettingsRoute');
  }
  return `/sequences/${encodeURIComponent(sequenceId)}/settings`;
}

/**
 * Builds the A/B testing route for a sequence, enabling
 * test variations of messaging and scheduling.
 *
 * @param sequenceId - Unique identifier for the sequence to run A/B tests on.
 * @returns The constructed route string for the Sequence A/B Test page.
 */
export function buildSequenceABTestRoute(sequenceId: string): string {
  if (!sequenceId || !sequenceId.trim()) {
    throw new Error('Invalid sequenceId for buildSequenceABTestRoute');
  }
  return `/sequences/${encodeURIComponent(sequenceId)}/ab-test`;
}

/* ------------------------------------------------------------------
 * API ROUTES
 *
 * These are backend endpoints exposed to clients (and sometimes external
 * integrations) for data interactions. They often require authentication
 * or API keys. The below constants serve as references for internal usage.
 * ------------------------------------------------------------------ */

/**
 * API endpoint constants.
 */
export const API_ROUTES = {
  /**
   * Authentication-related backend endpoints (login, register, tokens).
   */
  AUTH: '/api/auth',

  /**
   * CRUD endpoints for leads.
   */
  LEADS: '/api/leads',

  /**
   * CRUD endpoints for campaigns.
   */
  CAMPAIGNS: '/api/campaigns',

  /**
   * CRUD endpoints for sequences.
   */
  SEQUENCES: '/api/sequences',

  /**
   * Analytics endpoints for retrieving performance metrics.
   */
  ANALYTICS: '/api/analytics',

  /**
   * Webhook endpoints for external or internal event notifications.
   */
  WEBHOOKS: '/api/webhooks',

  /**
   * Integrations endpoints for CRMs, email providers, or other third-party apps.
   */
  INTEGRATIONS: '/api/integrations',

  /**
   * User management endpoints, such as retrieving user lists or updating user profiles.
   */
  USERS: '/api/users',

  /**
   * Team management endpoints, covering organizational unit operations,
   * membership handling, etc.
   */
  TEAMS: '/api/teams',

  /**
   * General settings endpoint, typically for reading and updating application-wide configurations.
   */
  SETTINGS: '/api/settings'
} as const;

/* ------------------------------------------------------------------
 * QUERY PARAM CONSTANTS
 *
 * Common query parameter keys used throughout the application 
 * (e.g. pagination, sorting, filtering).
 * ------------------------------------------------------------------ */

/**
 * Standardized query parameter keys for consistent usage across routes and APIs.
 */
export const QUERY_PARAMS = {
  /**
   * Represents the current page index or number for pagination.
   */
  PAGE: 'page',

  /**
   * Represents the items per page or limit for pagination.
   */
  LIMIT: 'limit',

  /**
   * Represents the field/column to sort results on.
   */
  SORT: 'sort',

  /**
   * Represents the sort order, typically 'asc' or 'desc'.
   */
  ORDER: 'order',

  /**
   * Represents a general search string or keyword filter.
   */
  SEARCH: 'q',

  /**
   * Represents a filter key/value in advanced queries.
   */
  FILTER: 'filter',

  /**
   * Represents a view mode or perspective (list, grid, or custom).
   */
  VIEW: 'view',

  /**
   * Represents a particular tab or sub-section in multi-tab interfaces.
   */
  TAB: 'tab',

  /**
   * Represents a status value filter (e.g. 'active', 'archived').
   */
  STATUS: 'status'
} as const;

/* ------------------------------------------------------------------
 * ROUTE PARAM CONSTANTS
 *
 * Common dynamic parameter placeholders used in path-based routing,
 * reflecting parameter segments like [id] or [leadId].
 * ------------------------------------------------------------------ */

/**
 * Symbols used to indicate dynamic path segments. 
 * Framework-specific usage might vary, but these placeholders 
 * assist in building or parsing dynamic routes.
 */
export const ROUTE_PARAMS = {
  /**
   * Generic placeholder for generic identifiers in routes.
   */
  ID: '[id]',

  /**
   * Placeholder for campaign-specific route segments.
   */
  CAMPAIGN_ID: '[campaignId]',

  /**
   * Placeholder for sequence-specific route segments.
   */
  SEQUENCE_ID: '[sequenceId]',

  /**
   * Placeholder for lead-specific route segments.
   */
  LEAD_ID: '[leadId]',

  /**
   * Placeholder for template-specific route segments (e.g., email templates).
   */
  TEMPLATE_ID: '[templateId]'
} as const;