/**
 * This module provides centralized constants for key business metrics,
 * performance metrics, metric periods, threshold values, and aggregation types
 * in the B2B Sales Intelligence Platform. These constants enable standardized
 * naming and consistent references throughout analytics, monitoring, and
 * performance tracking functionalities across the application.
 *
 * Requirements Addressed:
 * 1. Analytics Core Features: Campaign performance tracking, conversion analytics, and ROI calculations.
 * 2. Performance Monitoring: Distributed tracing and monitoring using OpenTelemetry.
 * 3. Success Criteria Tracking: User adoption, lead quality, time savings, and ROI metrics.
 *
 * The constants defined here align with enterprise needs for robust telemetry,
 * enabling monitoring and reporting on critical KPIs and performance indicators
 * while maintaining consistency and avoiding hardcoded, repeated string values
 * throughout the codebase. The usage of these constants also reduces the risk
 * of typographical errors and eases maintenance.
 */

/* -------------------------------------------------------------------------- */
/*                              BUSINESS METRICS                              */
/* -------------------------------------------------------------------------- */

/**
 * BUSINESS_METRICS contains key names for business-related metrics
 * such as lead quality, conversion rates, ROI, and more.
 * Each property represents a unique string identifier used in
 * analytics dashboards, database records, or external reporting tools.
 */
export const BUSINESS_METRICS = {
  /**
   * Represents the lead conversion rate, typically expressed as a percentage
   * illustrating how many leads eventually convert into paying customers.
   */
  LEAD_CONVERSION_RATE: 'lead_conversion_rate_percent',

  /**
   * Represents the lead quality score, typically an integer or floating-point
   * value indicating the likelihood that a lead will convert.
   */
  LEAD_QUALITY_SCORE: 'lead_quality_score',

  /**
   * Tracks the percentage of emails that are opened by recipients,
   * used to measure the effectiveness of email campaigns.
   */
  EMAIL_OPEN_RATE: 'email_open_rate_percent',

  /**
   * Tracks the percentage of emails that receive a click on at least one link,
   * offering deeper insight into engagement levels.
   */
  EMAIL_CLICK_RATE: 'email_click_rate_percent',

  /**
   * Measures how many users are active or adopting the platform, expressed
   * as a percentage of total sign-ups or accounts.
   */
  USER_ADOPTION_RATE: 'user_adoption_rate_percent',

  /**
   * Quantifies the time saved in minutes due to automation or
   * improved processes facilitated by the platform.
   */
  TIME_SAVINGS: 'time_savings_minutes',

  /**
   * Denotes the return on investment ratio, generally calculated
   * as revenue generated over costs.
   */
  ROI_RATIO: 'roi_ratio',

  /**
   * Represents the success rate of campaigns, typically expressed
   * as a percentage based on campaign objectives (e.g., conversions).
   */
  CAMPAIGN_SUCCESS_RATE: 'campaign_success_rate_percent',

  /**
   * Indicates the revenue that each lead generates on average,
   * expressed in US dollars.
   */
  REVENUE_PER_LEAD: 'revenue_per_lead_usd',

  /**
   * Tracks the cost of acquiring each customer, expressed in US dollars.
   * Often used to calculate marketing spend effectiveness.
   */
  CUSTOMER_ACQUISITION_COST: 'customer_acquisition_cost_usd',

  /**
   * Reflects how many minutes it typically takes for a lead to receive
   * an initial response from a sales representative or automated system.
   */
  LEAD_RESPONSE_TIME: 'lead_response_time_minutes',

  /**
   * Reflects the average amount of time in days it takes for a potential
   * lead to move through the entire sales cycle from initial contact to close.
   */
  SALES_CYCLE_LENGTH: 'sales_cycle_length_days',
} as const;

/**
 * Named export for LEAD_CONVERSION_RATE metric key, facilitating direct usage
 * within other modules without referencing BUSINESS_METRICS constantly.
 */
export const { LEAD_CONVERSION_RATE, CAMPAIGN_SUCCESS_RATE } = BUSINESS_METRICS;

/* -------------------------------------------------------------------------- */
/*                             PERFORMANCE METRICS                            */
/* -------------------------------------------------------------------------- */

/**
 * PERFORMANCE_METRICS contains key names for vital system performance indicators,
 * such as API response times, caching behavior, and resource usage measures.
 * These strings identify metrics needed for real-time monitoring and alerting.
 */
export const PERFORMANCE_METRICS = {
  /**
   * Measures the time (in milliseconds) taken for the API to respond
   * to a request, crucial for evaluating user experience.
   */
  API_RESPONSE_TIME: 'api_response_time_ms',

  /**
   * Indicates time spent in database queries (in milliseconds),
   * helping to pinpoint slow query performance or insufficient indexing.
   */
  DB_QUERY_TIME: 'db_query_time_ms',

  /**
   * The percentage of requests served from cache,
   * reflecting caching efficiency across the platform.
   */
  CACHE_HIT_RATE: 'cache_hit_rate_percent',

  /**
   * Tracks the proportion of erroneous requests or operations,
   * usually aggregated over a given time window to signal quality issues.
   */
  ERROR_RATE: 'error_rate_percent',

  /**
   * The memory usage in megabytes across the application or server,
   * used to detect memory leaks or resource exhaustion.
   */
  MEMORY_USAGE: 'memory_usage_mb',

  /**
   * Expresses CPU utilization as a percentage,
   * critical for capacity planning and performance tuning.
   */
  CPU_USAGE: 'cpu_usage_percent',

  /**
   * Tracks the length of the request queue in asynchronous jobs or
   * incoming requests, indicating system load or backlog.
   */
  REQUEST_QUEUE_LENGTH: 'request_queue_length',

  /**
   * The number of currently active connections to the system,
   * including database or network connections.
   */
  ACTIVE_CONNECTIONS: 'active_connections_count',

  /**
   * Reflects the overall load on the system, including processes usage
   * and resource constraints, typically measured as an average over time.
   */
  SYSTEM_LOAD_AVERAGE: 'system_load_average',

  /**
   * Measures heap usage (in megabytes) in memory allocation,
   * usually relevant for Node.js server memory profiling.
   */
  HEAP_USAGE: 'heap_usage_mb',

  /**
   * Denotes the percentage of used disk space, helpful in
   * preventing storage-based outages.
   */
  DISK_USAGE: 'disk_usage_percent',

  /**
   * Reflects network round-trip latency (in milliseconds),
   * marking the time spent in transit.
   */
  NETWORK_LATENCY: 'network_latency_ms',
} as const;

/**
 * Named exports for frequently referenced performance metric keys,
 * supporting simpler imports in performance analysis modules.
 */
export const { API_RESPONSE_TIME, SYSTEM_LOAD_AVERAGE } = PERFORMANCE_METRICS;

/* -------------------------------------------------------------------------- */
/*                              METRIC PERIODS                                */
/* -------------------------------------------------------------------------- */

/**
 * METRIC_PERIODS provides commonly used durations for aggregating
 * or segmenting metric data. These string values align with time-based
 * rollups in dashboards, reports, or scheduled queries.
 */
export const METRIC_PERIODS = {
  /**
   * One minute interval for capturing real-time or near-real-time trends.
   */
  MINUTE: '1m',

  /**
   * One hour interval, often used for hourly performance snapshots.
   */
  HOURLY: '1h',

  /**
   * Twenty-four hour interval for daily aggregation and reporting.
   */
  DAILY: '24h',

  /**
   * One week interval, useful for analyzing weekly trends.
   */
  WEEKLY: '7d',

  /**
   * One month interval (30 days) for monthly reports,
   * acknowledging slight variation in actual month lengths.
   */
  MONTHLY: '30d',

  /**
   * One quarter interval (90 days) for quarterly business reviews
   * and performance tracking.
   */
  QUARTERLY: '90d',

  /**
   * One year interval (365 days) for annual summaries and strategic planning.
   */
  YEARLY: '365d',

  /**
   * A custom period that can be defined dynamically for
   * specialized analysis or ad-hoc queries.
   */
  CUSTOM: 'custom',
} as const;

/**
 * Named exports for time segments frequently required in analytics,
 * particularly for short-term and extended analyses.
 */
export const { MINUTE, YEARLY } = METRIC_PERIODS;

/* -------------------------------------------------------------------------- */
/*                           METRIC THRESHOLD VALUES                          */
/* -------------------------------------------------------------------------- */

/**
 * METRIC_THRESHOLDS outlines warning and critical threshold values
 * for various system and performance metrics. These thresholds aid in
 * proactive monitoring, alerting, and capacity planning.
 */
export const METRIC_THRESHOLDS = {
  /**
   * Warning threshold for API response time in milliseconds. Exceeding
   * this value might indicate the need for performance investigation.
   */
  API_RESPONSE_TIME_WARNING: '200',

  /**
   * Critical threshold for API response time in milliseconds. Surpassing
   * this value typically triggers alerts or pages to on-call engineers.
   */
  API_RESPONSE_TIME_CRITICAL: '500',

  /**
   * Warning threshold for error rate percentage. Exceeding this limit
   * suggests systemic issues that could degrade user experience.
   */
  ERROR_RATE_WARNING: '1',

  /**
   * Critical threshold for error rate percentage. Sustained high error
   * rates may cause production incidents requiring immediate attention.
   */
  ERROR_RATE_CRITICAL: '5',

  /**
   * Warning threshold for memory usage percentage. Reaching or exceeding
   * this level warrants investigating potential memory leaks.
   */
  MEMORY_USAGE_WARNING: '80',

  /**
   * Critical threshold for memory usage percentage. Surpassing this threshold
   * risks system destabilization or out-of-memory errors.
   */
  MEMORY_USAGE_CRITICAL: '90',

  /**
   * Warning threshold for CPU usage percentage. If usage nears this level,
   * review resource allocation or investigate performance bottlenecks.
   */
  CPU_USAGE_WARNING: '70',

  /**
   * Critical threshold for CPU usage percentage. Persistently exceeding this
   * threshold can degrade application responsiveness or cause timeouts.
   */
  CPU_USAGE_CRITICAL: '90',

  /**
   * Warning threshold for heap usage in Node.js environments. Investigate
   * memory consumption patterns or GC (Garbage Collection) tuning if exceeded.
   */
  HEAP_USAGE_WARNING: '75',

  /**
   * Critical threshold for heap usage in Node.js. Surpassing this limit often
   * leads to process instability or forced restarts.
   */
  HEAP_USAGE_CRITICAL: '85',

  /**
   * Warning threshold for disk usage percentage. Approaching this limit may
   * indicate the need for storage planning or data cleanup.
   */
  DISK_USAGE_WARNING: '80',

  /**
   * Critical threshold for disk usage percentage. Cross this limit only
   * in exceptional circumstances, as it risks data write failures.
   */
  DISK_USAGE_CRITICAL: '90',

  /**
   * Warning threshold for cache hit rate percentage. Declines below this level
   * suggest caching inefficiencies or misconfigurations.
   */
  CACHE_HIT_RATE_WARNING: '85',

  /**
   * Critical threshold for cache hit rate percentage. Persistent cache misses
   * could significantly degrade application performance.
   */
  CACHE_HIT_RATE_CRITICAL: '70',
} as const;

/**
 * Named exports of threshold values essential for quick reference
 * in system monitoring and alerting workflows.
 */
export const { HEAP_USAGE_WARNING, CACHE_HIT_RATE_CRITICAL } = METRIC_THRESHOLDS;

/* -------------------------------------------------------------------------- */
/*                           METRIC AGGREGATION TYPES                         */
/* -------------------------------------------------------------------------- */

/**
 * METRIC_AGGREGATIONS provides constants for different aggregation
 * operations. These are commonly employed in query builders,
 * analytics dashboards, or data pipelines to compute metric values.
 */
export const METRIC_AGGREGATIONS = {
  /**
   * Sums all data points over a specified interval or data set.
   */
  SUM: 'sum',

  /**
   * Calculates the average (mean) of the data set.
   */
  AVG: 'avg',

  /**
   * Retrieves the minimum value from the data set.
   */
  MIN: 'min',

  /**
   * Retrieves the maximum value from the data set.
   */
  MAX: 'max',

  /**
   * Counts the number of data points within the data set.
   */
  COUNT: 'count',

  /**
   * Calculates the median value, splitting the data set evenly in half.
   */
  MEDIAN: 'median',

  /**
   * Computes the standard deviation, reflecting variation in the data.
   */
  STDDEV: 'stddev',

  /**
   * The 50th percentile of the data, representing a median measure.
   */
  P50: 'p50',

  /**
   * The 75th percentile of the data, indicating a boundary where
   * 75% of data points fall below this value.
   */
  P75: 'p75',

  /**
   * The 90th percentile of the data, used for insights into upper
   * ranges of performance or outliers.
   */
  P90: 'p90',

  /**
   * The 95th percentile, reflecting a common high-end measure in
   * performance analytics (e.g., latency).
   */
  P95: 'p95',

  /**
   * The 99th percentile, crucial for capturing near-worst-case
   * performance scenarios in highly sensitive systems.
   */
  P99: 'p99',

  /**
   * A generalized percentile operation where the specific percentile
   * rank is determined at runtime.
   */
  PERCENTILE: 'percentile',
} as const;

/**
 * Named exports for aggregation operations frequently employed
 * in data processing or statistic evaluations.
 */
export const { MEDIAN, PERCENTILE } = METRIC_AGGREGATIONS;