/**
 * This file provides frontend constants for analytics metrics, time ranges,
 * and thresholds used throughout the B2B Sales Intelligence Platform’s web
 * application for displaying analytics, performance data, and KPIs.
 *
 * These constants address:
 * 1. Core Features (Analytics): campaign performance tracking, conversion
 *    analytics, and ROI calculation with specific thresholds and measurement periods.
 * 2. Success Criteria Tracking: including user adoption (80% active user rate),
 *    lead quality (40% improvement), time savings (60% reduction), and ROI
 *    (3x within 6 months).
 * 3. Performance Monitoring: offering granular time periods and specific
 *    thresholds for real-time metrics displays in the frontend.
 *
 * Detailed comments are included to ensure clarity and maintainability
 * in an enterprise-grade environment.
 */

// Importing the TimeRange type definition from the analytics module.
// This import is for internal usage and correlates to the TimeRange type
// that includes options such as DAY, WEEK, MONTH, QUARTER, YEAR, and CUSTOM.
import { TimeRange } from '../types/analytics';

/**
 * TIME_RANGES object:
 * Maps semantic time range identifiers to string values that may be used
 * throughout the web UI for analytics filtering and reporting periods.
 * 
 * Each property is exported as a string constant corresponding to a
 * descriptive label (e.g., "DAY" => "day"). These labels can be used in
 * data-fetch calls, chart displays, or advanced filters and support
 * alignment with the "TimeRange" type from the analytics definitions.
 */
export const TIME_RANGES = {
  /** Represents a single day range */
  DAY: 'day',
  /** Represents a week range */
  WEEK: 'week',
  /** Represents a month range */
  MONTH: 'month',
  /** Represents a quarter range (3 months) */
  QUARTER: 'quarter',
  /** Represents a yearly range (12 months) */
  YEAR: 'year',
  /**
   * Represents a custom range, allowing the user to pick
   * specific start/end dates for analytics
   */
  CUSTOM: 'custom',
} as const;

/**
 * METRIC_TYPES object:
 * Defines the various high-level categories of metrics we track for
 * analytics and key performance indicators in the application.
 *
 * This categorization allows the frontend to differentiate between
 * different metric contexts, e.g., leads vs. campaigns, and supports
 * consistent usage throughout multiple analytics screens.
 */
export const METRIC_TYPES = {
  /**
   * LEADS: Aiming to measure total leads, qualified leads, lead scoring,
   * and conversions attributable to lead management.
   */
  LEADS: 'leads',
  /**
   * CAMPAIGNS: Campaign performance tracking, including email metrics
   * such as open/click rates and bounce data.
   */
  CAMPAIGNS: 'campaigns',
  /**
   * PERFORMANCE: Used to represent general or overarching system
   * performance metrics, potentially inclusive of response times or
   * broader platform performance indicators.
   */
  PERFORMANCE: 'performance',
  /**
   * ENGAGEMENT: Represents engagement metrics such as email opens,
   * clicks, and potential user interactions across the platform.
   */
  ENGAGEMENT: 'engagement',
  /**
   * CONVERSION: Metrics tied to user or lead conversions, reflecting
   * how effectively the platform yields tangible outcomes.
   */
  CONVERSION: 'conversion',
  /**
   * ROI: Represents Return on Investment, vital for determining
   * economic impact and alignment with success criteria for stakeholders.
   */
  ROI: 'roi',
  /**
   * TIME_SAVINGS: Tracks reductions in manual labor or time spent
   * on prospecting and sales operations, measured as a percentage.
   */
  TIME_SAVINGS: 'time_savings',
  /**
   * USER_ADOPTION: Represents metrics related to user adoption rates,
   * reflecting active usage and overall adoption of the platform.
   */
  USER_ADOPTION: 'user_adoption',
} as const;

/**
 * CHART_PERIODS object:
 * Specifies the recognized intervals for data aggregation in charts
 * and other visual analytics components, typically used to present
 * metrics across hourly, daily, or extended time spans. These string
 * values can map to server-side queries or client-side grouping logic.
 */
export const CHART_PERIODS = {
  /** HOURLY: 1 hour grouping (e.g., "1h") */
  HOURLY: '1h',
  /** DAILY: 24 hour grouping (e.g., "24h") */
  DAILY: '24h',
  /** WEEKLY: 7 day grouping (e.g., "7d") */
  WEEKLY: '7d',
  /** MONTHLY: 30 day grouping (e.g., "30d") */
  MONTHLY: '30d',
  /** QUARTERLY: 90 day grouping (e.g., "90d") */
  QUARTERLY: '90d',
  /** YEARLY: 365 day grouping (e.g., "365d") */
  YEARLY: '365d',
} as const;

/**
 * TREND_INDICATORS object:
 * Provides string representations indicating whether a metric trend
 * is moving up, down, or remains neutral. Used in data visualizations
 * to highlight directionality and significance of changes in metrics.
 */
export const TREND_INDICATORS = {
  /** Indicates a positive/upward trend */
  UP: 'up',
  /** Indicates a negative/downward trend */
  DOWN: 'down',
  /** Indicates no significant change or a neutral trend */
  NEUTRAL: 'neutral',
} as const;

/**
 * METRIC_THRESHOLDS object:
 * Defines threshold values used throughout the application to gauge
 * performance or success of certain metrics. These thresholds align
 * with the business success criteria outlined in the system’s
 * technical specifications, such as a 40% improvement in lead quality.
 * 
 * Each property is a string, typically parsed or compared against
 * numeric values in the application to determine whether a metric
 * meets, exceeds, or falls below specific performance targets.
 */
export const METRIC_THRESHOLDS = {
  /**
   * GOOD_CONVERSION_RATE: Minimum acceptable conversion rate (percentage)
   * indicating a healthy level of leads converting to opportunities.
   */
  GOOD_CONVERSION_RATE: '40',
  /**
   * GOOD_OPEN_RATE: Benchmark for acceptable email open rate percentage
   * in campaign metrics.
   */
  GOOD_OPEN_RATE: '25',
  /**
   * GOOD_CLICK_RATE: Benchmark for acceptable email click-through
   * rate percentage in campaign metrics.
   */
  GOOD_CLICK_RATE: '10',
  /**
   * GOOD_LEAD_SCORE: Represents a threshold indicating a strong
   * or healthy lead scoring value.
   */
  GOOD_LEAD_SCORE: '80',
  /**
   * TARGET_USER_ADOPTION: The target percentage of active users within
   * 30 days, aligning with the success criteria for user adoption.
   */
  TARGET_USER_ADOPTION: '80',
  /**
   * TARGET_TIME_SAVINGS: The target percentage of reduction in
   * prospecting time the platform aims to deliver.
   */
  TARGET_TIME_SAVINGS: '60',
  /**
   * TARGET_ROI_MULTIPLIER: The multiplier goal for Return on Investment,
   * indicating a 3-fold ROI is desired within 6 months.
   */
  TARGET_ROI_MULTIPLIER: '3',
  /**
   * TARGET_LEAD_QUALITY_IMPROVEMENT: The target percentage for lead
   * quality improvement through refined AI-powered search and enrichment.
   */
  TARGET_LEAD_QUALITY_IMPROVEMENT: '40',
} as const;