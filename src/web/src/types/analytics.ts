/**
 * This file provides comprehensive TypeScript type definitions
 * for analytics-related data structures, metrics, and interfaces
 * used throughout the B2B Sales Intelligence Platform’s web application.
 *
 * These definitions support:
 * 1. Core Features: Analytics (campaign performance tracking, conversion analytics, ROI)
 * 2. Success Criteria Tracking: user adoption, lead quality, time savings, ROI
 *
 * Each interface and type is designed with enterprise-grade,
 * production-level standards based on the system’s technical specifications.
 * Extensive comments are included to facilitate clarity, maintainability,
 * and future scalability of the analytics module.
 */

/**
 * Enumeration describing trend indicators for metrics such as
 * conversion rate fluctuations or performance changes over time.
 * Possible values:
 * - UP: Indicates a positive (upward) trend
 * - DOWN: Indicates a negative (downward) trend
 * - NEUTRAL: Indicates a steady or no significant trend
 */
export enum TrendIndicator {
  UP = 'UP',
  DOWN = 'DOWN',
  NEUTRAL = 'NEUTRAL',
}

/**
 * Interface representing conversion-related metrics:
 * - rate: Numerical representation of the current conversion rate
 * - trend: Direction of the conversion trend based on historical data
 * - previousPeriod: The historical conversion value that allows
 *   comparative analysis to measure improvements or declines
 */
export interface ConversionMetrics {
  /**
   * Current conversion rate (e.g., 0.35 for 35%)
   */
  rate: number;
  /**
   * Indicates if the conversion rate is trending up, down, or neutral
   */
  trend: TrendIndicator;
  /**
   * Conversion rate (numerical) from a previous period for comparison
   */
  previousPeriod: number;
}

/**
 * Interface representing lead-specific metrics, aligning with
 * the goal of improving lead quality and streamlining prospecting:
 * - total: Total number of leads for a given timeframe
 * - qualified: Count of leads that meet defined qualification criteria
 * - converted: Count of leads successfully converted into opportunities or deals
 * - averageScore: Mean lead scoring value computed across all leads
 */
export interface LeadMetrics {
  /**
   * Total leads tracked
   */
  total: number;
  /**
   * Leads that are qualified based on scoring or rules
   */
  qualified: number;
  /**
   * Leads that have been converted to active deals or opportunities
   */
  converted: number;
  /**
   * Average lead score representing the overall lead quality metric
   */
  averageScore: number;
}

/**
 * Interface representing campaign performance metrics to enable
 * campaign performance tracking, open rates, click rates, and
 * other engagement indicators:
 * - sent: Total count of sent emails
 * - opened: Total count of opened emails
 * - clicked: Total count of clicked links
 * - bounced: Total count of failed or bounced emails
 * - openRate: Percentage of sent emails that were opened
 * - clickRate: Percentage of sent emails that generated a click
 */
export interface CampaignMetrics {
  /**
   * Total number of emails sent in a particular campaign
   */
  sent: number;
  /**
   * Number of emails that have been opened
   */
  opened: number;
  /**
   * Number of emails in which recipients clicked at least one link
   */
  clicked: number;
  /**
   * Number of emails that bounced or failed delivery
   */
  bounced: number;
  /**
   * Open percentage, typically calculated as (opened / sent) * 100
   */
  openRate: number;
  /**
   * Click percentage, typically calculated as (clicked / sent) * 100
   */
  clickRate: number;
}

/**
 * Type representing supported time range options
 * for analytics queries and filtering:
 * - DAY
 * - WEEK
 * - MONTH
 * - QUARTER
 * - YEAR
 * - CUSTOM (allows specifying a particular date range)
 */
export type TimeRange =
  | 'DAY'
  | 'WEEK'
  | 'MONTH'
  | 'QUARTER'
  | 'YEAR'
  | 'CUSTOM';

/**
 * Interface aggregating multiple metrics within a single analytics
 * response object. This aligns with the platform’s needs to track:
 * - Lead metrics (e.g., total leads, average score)
 * - Campaign metrics (e.g., emails sent, open/click rates)
 * - Conversion metrics (e.g., conversion rate, trends)
 * - Time range (e.g., day, week, month) for scoping data
 */
export interface AnalyticsMetrics {
  /**
   * Lead metrics summarizing lead statuses and scores
   */
  leads: LeadMetrics;
  /**
   * Campaign performance metrics, including open rate and click rate
   */
  campaigns: CampaignMetrics;
  /**
   * Conversion-related metrics such as conversion rate and trends
   */
  conversion: ConversionMetrics;
  /**
   * Time range for which these analytics apply (DAY, WEEK, MONTH, etc.)
   */
  timeRange: TimeRange;
}

/**
 * Enum describing the categories of metrics that can be fetched or
 * displayed within the analytics system. This enables modular
 * queries for different metric types:
 * - LEADS: Represents all lead-related analytics
 * - CAMPAIGNS: Reflects campaign performance data
 * - PERFORMANCE: General performance metrics, e.g., system metrics
 * - ENGAGEMENT: Engagement metrics such as open/click activity
 * - CONVERSION: Conversion-focused metrics and trends
 */
export enum MetricType {
  LEADS = 'LEADS',
  CAMPAIGNS = 'CAMPAIGNS',
  PERFORMANCE = 'PERFORMANCE',
  ENGAGEMENT = 'ENGAGEMENT',
  CONVERSION = 'CONVERSION',
}

/**
 * Interface describing pagination metadata typically returned
 * alongside lists of analytics data to provide context on pages,
 * total item counts, and items per page:
 * - page: Current page number
 * - perPage: Number of items per page
 * - total: Total count of items or records
 */
export interface PaginationMeta {
  /**
   * The current page number
   */
  page: number;
  /**
   * The number of records displayed per page
   */
  perPage: number;
  /**
   * The total number of records available
   */
  total: number;
}