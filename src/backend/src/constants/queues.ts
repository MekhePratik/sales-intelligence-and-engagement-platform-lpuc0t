/**
 * This file defines the queue name constants used for background job processing
 * with the Bull queue system (Bull v4.0.2) in conjunction with Redis. These queues
 * orchestrate the asynchronous tasks required by the B2B Sales Intelligence and
 * Engagement Platform described in the technical specifications. They address
 * multiple critical workflows, including:
 *
 * 1. Job Queue Management:
 *    - Central to our async processing strategy.
 *    - Managed by Bull + Redis, supporting multiple worker processes.
 *
 * 2. Email Automation:
 *    - Templates, scheduling, sequences, and A/B testing.
 *    - Enhances personalized outreach capabilities at scale.
 *
 * 3. Lead Management:
 *    - AI-powered enrichment for contact data.
 *    - Intelligent lead scoring and prioritization.
 *
 * 4. Analytics:
 *    - Aggregating metrics for campaign performance tracking and ROI calculations.
 *    - Leveraging real-time rollups for rich dashboards.
 *
 * Each exported constant is used as the identifier for a distinct queue,
 * ensuring clarity and maintainability across different subsystems.
 */

/**
 * EMAIL_SEQUENCE_QUEUE
 * Queue name for processing automated email sequence jobs.
 * This includes scheduling, sending, and tracking tasks to
 * streamline email outreach capabilities.
 */
export const EMAIL_SEQUENCE_QUEUE: string = 'email-sequence';

/**
 * ANALYTICS_ROLLUP_QUEUE
 * Queue name for aggregating and processing analytics data,
 * enabling the creation of reports and dashboards to provide
 * insights into campaigns and user interactions.
 */
export const ANALYTICS_ROLLUP_QUEUE: string = 'analytics-rollup';

/**
 * DATA_ENRICHMENT_QUEUE
 * Queue name for AI-powered lead data enrichment operations.
 * Integrates with external APIs (e.g., OpenAI GPT-4) to gather
 * or enhance contact information for more accurate lead records.
 */
export const DATA_ENRICHMENT_QUEUE: string = 'data-enrichment';

/**
 * LEAD_SCORING_QUEUE
 * Queue name for AI-driven lead scoring and prioritization workflows,
 * supporting advanced filtering and ranking of leads.
 */
export const LEAD_SCORING_QUEUE: string = 'lead-scoring';

/**
 * CACHE_WARMUP_QUEUE
 * Queue name for proactive cache warming tasks, ensuring quicker responses
 * by pre-populating data in Redis for commonly accessed content.
 */
export const CACHE_WARMUP_QUEUE: string = 'cache-warmup';

/**
 * EMAIL_AB_TEST_QUEUE
 * Queue name for managing A/B testing workflows in email campaigns,
 * enabling variant creation, scheduling, and performance metrics tracking.
 */
export const EMAIL_AB_TEST_QUEUE: string = 'email-ab-test';

/**
 * CAMPAIGN_ANALYTICS_QUEUE
 * Queue name for handling real-time campaign performance tracking and ROI calculations.
 * Collects and processes data to inform strategic optimizations.
 */
export const CAMPAIGN_ANALYTICS_QUEUE: string = 'campaign-analytics';

/**
 * LEAD_SYNC_QUEUE
 * Queue name for synchronizing lead data with external CRM systems,
 * such as Salesforce and HubSpot, to maintain consistent records
 * across the organization’s sales stack.
 */
export const LEAD_SYNC_QUEUE: string = 'lead-sync';