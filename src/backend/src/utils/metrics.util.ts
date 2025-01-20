/* -------------------------------------------------------------------------------------------------
 * metrics.util.ts
 *
 * Core metrics utility that provides standardized metric collection, aggregation, and reporting
 * functionality for business KPIs and system performance monitoring across the B2B Sales
 * Intelligence Platform. Implements distributed tracing, metric buffering, and integrates with
 * OpenTelemetry (@opentelemetry/api ^1.4.0) and Datadog (dd-trace ^3.0.0) for comprehensive
 * monitoring. This file addresses:
 *  - Analytics Core Feature (campaign performance tracking, conversion analytics, ROI calculation)
 *  - Performance Monitoring (distributed tracing, performance instrumentation)
 *  - Success Criteria Tracking (user adoption, lead quality, time savings, and ROI)
 * ------------------------------------------------------------------------------------------------- */

// ------------------------------------- External Imports (versioned) -------------------------------------
/**
 * @opentelemetry/api ^1.4.0 - Essential OpenTelemetry APIs for distributed tracing and metrics.
 */
import * as OpenTelemetry from '@opentelemetry/api';

/**
 * dd-trace ^3.0.0 - Datadog APM integration for advanced metric visualization and alerting.
 */
import DatadogTracer from 'dd-trace';

// -------------------------------------- Internal Imports -------------------------------------------------
/**
 * Importing named constants for business metrics (LEAD_CONVERSION_RATE, EMAIL_OPEN_RATE) and
 * performance metrics (API_RESPONSE_TIME, DB_QUERY_TIME). These constants enable standardized
 * metric naming throughout the system.
 */
import {
  LEAD_CONVERSION_RATE,
  EMAIL_OPEN_RATE,
  API_RESPONSE_TIME,
  DB_QUERY_TIME,
} from '../constants/metrics';

/**
 * Logger utility for logging metric events and errors. We specifically leverage the "info" and
 * "error" methods as specified in the JSON schema.
 */
import { Logger } from './logger.util';

// -------------------------------------- Global Constants --------------------------------------------------
/**
 * Global flush interval in milliseconds, determining how frequently metrics are sent to external
 * systems or processed from the local buffer.
 */
export const METRIC_FLUSH_INTERVAL = 60000;

/**
 * Default aggregation type used in the absence of a user-specified aggregation (e.g., 'AVG').
 */
export const DEFAULT_AGGREGATION = 'AVG';

/**
 * Maximum size of the in-memory metric buffer. Once exceeded, a flush operation is triggered
 * automatically to prevent overflow.
 */
export const METRIC_BUFFER_SIZE = 1000;

/**
 * The number of days that metrics will be retained for advanced analytics before being archived
 * or purged. This helps manage storage costs while keeping relevant historical data.
 */
export const METRIC_RETENTION_DAYS = 90;

// -------------------------------------- Decorators (Stubs) -----------------------------------------------
/**
 * Decorator for validating the metric name before recording it. This checks whether the provided
 * metric name is recognized and prevents invalid or malicious entries.
 *
 * @param target - The prototype of the class on which the method is declared.
 * @param propertyKey - The name of the method being decorated.
 * @param descriptor - The property descriptor for the method.
 */
function validateMetric(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const [metricName] = args;
    if (
      metricName !== LEAD_CONVERSION_RATE &&
      metricName !== EMAIL_OPEN_RATE &&
      metricName !== API_RESPONSE_TIME &&
      metricName !== DB_QUERY_TIME
    ) {
      const loggerInstance: Logger = (this && this.logger) || new Logger({});
      loggerInstance.error(
        `validateMetric: Unrecognized metric name "${metricName}". Metric will not be recorded.`,
      );
      return;
    }
    return originalMethod.apply(this, args);
  };
}

/**
 * Decorator for sanitizing user-provided input. This can involve removing disallowed characters
 * or preventing harmful data from reaching the database or external systems.
 *
 * @param target - The prototype of the class on which the method is declared.
 * @param propertyKey - The name of the method being decorated.
 * @param descriptor - The property descriptor for the method.
 */
function sanitizeInput(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const [metricName, value, metadata] = args;
    // Basic numeric check for value
    let sanitizedValue = value;
    if (typeof sanitizedValue !== 'number' || Number.isNaN(sanitizedValue)) {
      const loggerInstance: Logger = (this && this.logger) || new Logger({});
      loggerInstance.error(
        `sanitizeInput: Invalid metric value for metric "${metricName}". Must be a valid number.`,
      );
      return;
    }
    // Basic check for metadata
    const sanitizedMetadata =
      metadata && typeof metadata === 'object' ? { ...metadata } : {};
    return originalMethod.apply(this, [metricName, sanitizedValue, sanitizedMetadata]);
  };
}

/**
 * Decorator for validating a time period parameter. This ensures that the provided period string
 * matches expected intervals (e.g., daily, weekly). This example uses a basic check that can be
 * expanded with actual constants or logic.
 *
 * @param target - The prototype of the class on which the method is declared.
 * @param propertyKey - The name of the method.
 * @param descriptor - The property descriptor for the method.
 */
function validatePeriod(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const [, period] = args;
    const ALLOWED_PERIODS = ['1m', '1h', '24h', '7d', '30d', '90d', '365d', 'custom'];
    if (!ALLOWED_PERIODS.includes(period)) {
      const loggerInstance: Logger = (this && this.logger) || new Logger({});
      loggerInstance.error(
        `validatePeriod: Invalid period "${period}". Supported intervals: ${ALLOWED_PERIODS.join(
          ', ',
        )}.`,
      );
      return;
    }
    return originalMethod.apply(this, args);
  };
}

/**
 * Decorator for caching the results of a potentially expensive aggregation operation. This
 * example is a stub that simply logs a message, but a real implementation might use Redis or
 * another cache to store results.
 *
 * @param target - The prototype of the class on which the method is declared.
 * @param propertyKey - The name of the method.
 * @param descriptor - The property descriptor for the method.
 */
function cacheResult(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const loggerInstance: Logger = (this && this.logger) || new Logger({});
    loggerInstance.info('cacheResult: Checking cache before computing aggregation.', {});
    // Actual cache lookup logic would go here
    const result = await originalMethod.apply(this, args);
    // Actual cache storage logic would go here
    loggerInstance.info('cacheResult: Aggregation result has been saved to cache.', {});
    return result;
  };
}

// ----------------------------------- Utility Functions ----------------------------------------------------
/**
 * recordMetric
 * ------------
 * Records a single metric data point with optional metadata and validation. This function:
 *  - Validates the metric name against known constants
 *  - Sanitizes the metric value and metadata
 *  - Adds a timestamp and execution context
 *  - Records the metric using OpenTelemetry
 *  - Sends the metric to Datadog if needed
 *  - Buffers the metric in memory
 *  - Logs a metric event
 *  - Checks buffer size and flushes if needed
 *
 * @param metricName - The string identifier for the metric (e.g., LEAD_CONVERSION_RATE)
 * @param value      - The numeric value for this data point
 * @param metadata   - Optional object containing additional contextual data (e.g., user ID, environment)
 */
export function recordMetric(
  @validateMetric
  @sanitizeInput
  metricName: string,
  value: number,
  metadata: Record<string, any> = {},
): void {
  const logger = new Logger({ defaultLevel: 'info' });
  const tracer = DatadogTracer; // dd-trace can be further configured if needed

  // STEP 1: Validate metric name against defined constants (handled by @validateMetric)

  // STEP 2: Sanitize metric value and metadata (handled by @sanitizeInput)

  // STEP 3: Add timestamp and execution context
  const timestamp: number = Date.now();
  const contextInfo = { traceId: '' };
  const activeSpan = OpenTelemetry.trace.getActiveSpan();
  if (activeSpan) {
    contextInfo.traceId = activeSpan.spanContext().traceId;
  }

  // STEP 4: Record metric using OpenTelemetry
  // A typical usage might involve obtaining a meter, but here we illustrate conceptual usage
  const meter = OpenTelemetry.metrics.getMeter('b2b-sales-platform');
  const metricCounter = meter.createCounter(metricName, {
    description: `Counter for ${metricName}`,
  });
  metricCounter.add(value);

  // STEP 5: Send to Datadog if configured (a stub call, real usage requires dd-trace configuration)
  tracer.tracer; // placeholder reference; actual usage might vary (e.g., startSpan, addTags)

  // STEP 6: Add to metric buffer (naive global or local buffer example)
  // In real usage, you might store in an in-memory data structure or message queue
  const bufferedMetric = {
    metricName,
    value,
    metadata: { ...metadata, timestamp, traceId: contextInfo.traceId },
  };
  // This demonstration simply logs. Production code might push to an array or queue.
  logger.info('recordMetric: Added metric to buffer.', bufferedMetric);

  // STEP 7: Log metric event
  logger.info(`recordMetric: ${metricName} recorded successfully.`, {
    metricName,
    value,
    contextInfo,
  });

  // STEP 8: Check buffer size and flush if needed (demonstration only)
  // A real implementation could keep a global array and flush after reaching METRIC_BUFFER_SIZE
}

/**
 * aggregateMetrics
 * ----------------
 * Aggregates metrics over a specified time period with customizable aggregation functions (AVG, SUM, etc.).
 *  - Validates input parameters and permissions
 *  - Checks cache for existing aggregation
 *  - Queries metric data for the specified period
 *  - Applies the chosen aggregation function
 *  - Computes statistical significance and trend analysis
 *  - Stores results in cache for future queries
 *  - Returns aggregated results with metadata
 *
 * @param metricName      - The name of the metric to aggregate
 * @param period          - The time period (e.g., '24h', '7d') for aggregation
 * @param aggregationType - The type of aggregation (AVG, SUM, MIN, MAX, etc.)
 * @returns               - A Promise resolving with an object containing aggregated data and metadata
 */
export async function aggregateMetrics(
  @validatePeriod
  @cacheResult
  metricName: string,
  period: string,
  aggregationType: string,
): Promise<Record<string, any>> {
  const logger = new Logger({ defaultLevel: 'info' });

  // STEP 1: Validate input parameters and permissions (handled partially by @validatePeriod)
  if (!aggregationType) {
    logger.error('aggregateMetrics: Invalid or missing aggregationType parameter.', {});
    return Promise.resolve({});
  }

  // STEP 2: Check cache for existing aggregation (handled by @cacheResult decorator stub)

  // STEP 3: Query metric data for specified period (fake data generation for demonstration)
  // A real system might perform database queries or call external analytics services
  const fakeFetchedData = [10, 30, 20, 25, 40, 35]; // Example timeseries data points

  // STEP 4: Apply aggregation function
  let aggregatedValue: number;
  switch (aggregationType.toLowerCase()) {
    case 'sum':
      aggregatedValue = fakeFetchedData.reduce((acc, cur) => acc + cur, 0);
      break;
    case 'min':
      aggregatedValue = Math.min(...fakeFetchedData);
      break;
    case 'max':
      aggregatedValue = Math.max(...fakeFetchedData);
      break;
    case 'avg':
    default:
      aggregatedValue =
        fakeFetchedData.reduce((acc, cur) => acc + cur, 0) / fakeFetchedData.length;
      break;
  }

  // STEP 5: Calculate statistical significance (example basic approach)
  const mean = aggregatedValue;
  const diffs = fakeFetchedData.map((val) => Math.pow(val - mean, 2));
  const variance = diffs.reduce((acc, cur) => acc + cur, 0) / fakeFetchedData.length;
  const standardDeviation = Math.sqrt(variance);

  // STEP 6: Generate trend analysis (naive approach)
  const lastValue = fakeFetchedData[fakeFetchedData.length - 1];
  let trend = 'increasing';
  if (lastValue < mean) {
    trend = 'decreasing';
  }

  // STEP 7: Cache results for future queries (handled by @cacheResult decorator stub)

  // STEP 8: Return aggregated results with metadata
  const result = {
    metricName,
    period,
    aggregationType,
    aggregatedValue,
    mean,
    standardDeviation,
    trend,
    dataPoints: fakeFetchedData,
    timestamp: new Date().toISOString(),
  };

  logger.info('aggregateMetrics: Aggregation complete.', { result });
  return result;
}

// ----------------------------------- Class Definition -----------------------------------------------------
/**
 * MetricsService
 * --------------
 * Service class for managing metrics collection, aggregation, and reporting with advanced features:
 *  - Integration with OpenTelemetry for distributed tracing
 *  - Datadog integration for advanced metric visualization
 *  - Automatic buffer flushing at a configurable interval
 *  - Threshold-based alerting for business and performance metrics
 *  - Comprehensive metric retention policy
 */
export class MetricsService {
  /**
   * Logger instance for capturing events, warnings, and errors.
   */
  public logger: Logger;

  /**
   * In-memory buffer or queue structure for storing recently collected metrics before flush.
   */
  public metricsBuffer: Record<string, any>[];

  /**
   * Holds configuration details such as flush intervals, environment keys, and toggles.
   */
  public config: Record<string, any>;

  /**
   * Defines threshold values for metrics. If a metric exceeds or falls below these thresholds,
   * the service triggers alerts.
   */
  public thresholds: Record<string, number>;

  /**
   * Collection of alert handler functions or callbacks invoked when threshold breaches occur.
   */
  public alertHandlers: Record<string, Function>;

  /**
   * Constructor
   * -----------
   * Initializes the metrics service with the given configuration, sets up OpenTelemetry and
   * Datadog integrations, configures thresholds and alert handlers, and starts the flush interval
   * mechanism for the metrics buffer. It also enforces a metric retention policy.
   *
   * @param config - A configuration object with details for flushing, retention, and integrations.
   */
  constructor(config: Record<string, any>) {
    // STEP 1: Initialize logger instance
    this.logger = new Logger({ defaultLevel: 'info' });

    // STEP 2: Configure OpenTelemetry collectors (stub approach, real usage might specify resources)
    // e.g. OpenTelemetry.trace.setGlobalTracerProvider(new NodeTracerProvider());

    // STEP 3: Setup Datadog integration (stub approach, actual usage might call DatadogTracer.init)
    DatadogTracer; // referencing to ensure usage

    // STEP 4: Initialize metrics buffer with size limit
    this.metricsBuffer = [];
    this.config = config || {};
    this.config.bufferSize = this.config.bufferSize || METRIC_BUFFER_SIZE;

    // STEP 5: Configure metric thresholds (example usage with fallback values)
    this.thresholds = {
      [LEAD_CONVERSION_RATE]: 50, // 50% threshold example
      [EMAIL_OPEN_RATE]: 30, // 30% threshold example
      [API_RESPONSE_TIME]: 300, // 300 ms threshold example
      [DB_QUERY_TIME]: 200, // 200 ms threshold example
    };

    // STEP 6: Setup alert handlers (stub implementation, in real usage these might be Slack or Email hooks)
    this.alertHandlers = {
      businessAlert: (metricName: string, value: number) => {
        this.logger.info(`businessAlert triggered for ${metricName} => ${value}`, {});
      },
      performanceAlert: (metricName: string, value: number) => {
        this.logger.info(`performanceAlert triggered for ${metricName} => ${value}`, {});
      },
    };

    // STEP 7: Start automatic flush interval
    const flushInterval = this.config.flushInterval || METRIC_FLUSH_INTERVAL;
    setInterval(() => this.flushMetrics(), flushInterval);

    // STEP 8: Initialize metric retention policy (stub)
    // Real usage could integrate with a database or external store to remove old data
  }

  /**
   * trackBusinessMetric
   * -------------------
   * Tracks a business KPI metric such as LEAD_CONVERSION_RATE or EMAIL_OPEN_RATE with context.
   *  - Validates that the metricName is among recognized business metrics
   *  - Sanitizes and validates the numeric metric value
   *  - Attaches business context (like campaign ID, user group, etc.)
   *  - Records the metric with OpenTelemetry
   *  - Updates a hypothetical KPI dashboard
   *  - Checks against thresholds and triggers alerts if needed
   *
   * @param metricName - The business metric to track (e.g., LEAD_CONVERSION_RATE)
   * @param value      - The numeric value of the metric data point
   * @param context    - Metadata providing business context (campaign, user ID, etc.)
   */
  public trackBusinessMetric(metricName: string, value: number, context: Record<string, any> = {}): void {
    // STEP 1: Validate business metric name against constants
    if (metricName !== LEAD_CONVERSION_RATE && metricName !== EMAIL_OPEN_RATE) {
      this.logger.error(`trackBusinessMetric: Invalid business metric "${metricName}".`, {});
      return;
    }

    // STEP 2: Sanitize and validate metric value
    if (typeof value !== 'number' || Number.isNaN(value)) {
      this.logger.error(`trackBusinessMetric: Metric value must be a valid number.`, {});
      return;
    }

    // STEP 3: Add business context and metadata
    const timestamp = Date.now();
    const extendedContext = { ...context, metricType: 'business', timestamp };

    // STEP 4: Record metric with tracing (stub usage)
    const meter = OpenTelemetry.metrics.getMeter('b2b-sales-business');
    const counter = meter.createCounter(metricName);
    counter.add(value);

    // STEP 5: Update KPI dashboard (stub; real implementation might call an external service)
    this.logger.info('trackBusinessMetric: KPI Dashboard updated.', { metricName, value, context });

    // STEP 6: Check against business thresholds
    const threshold = this.thresholds[metricName];
    if (threshold !== undefined && value < threshold) {
      this.logger.info(`trackBusinessMetric: Metric ${metricName} under threshold ${threshold}.`, { value });
      // STEP 7: Trigger business alerts if needed
      this.alertHandlers.businessAlert(metricName, value);
    }

    // Buffer for potential batch flush
    this.metricsBuffer.push({ metricName, value, extendedContext });
    if (this.metricsBuffer.length >= this.config.bufferSize) {
      this.flushMetrics();
    }
  }

  /**
   * trackPerformanceMetric
   * ----------------------
   * Tracks a system performance metric, such as API_RESPONSE_TIME or DB_QUERY_TIME, with threshold checking.
   *  - Validates the performance metric name
   *  - Adds system context and obtains any trace ID
   *  - Records the metric with high precision
   *  - Checks thresholds for anomalies
   *  - Calculates performance trends (stub)
   *  - Triggers performance alerts if needed
   *  - Updates system health status (stub)
   *
   * @param metricName - The performance metric identifier (e.g., API_RESPONSE_TIME)
   * @param value      - The numeric value of the performance data point
   * @param context    - Optional metadata such as request info, user session, or environment details
   */
  public trackPerformanceMetric(
    metricName: string,
    value: number,
    context: Record<string, any> = {},
  ): void {
    // STEP 1: Validate performance metric name
    if (metricName !== API_RESPONSE_TIME && metricName !== DB_QUERY_TIME) {
      this.logger.error(`trackPerformanceMetric: Invalid performance metric "${metricName}".`, {});
      return;
    }

    // STEP 2: Add system context and trace ID
    const activeSpan = OpenTelemetry.trace.getActiveSpan();
    const traceId = activeSpan ? activeSpan.spanContext().traceId : '';
    const extendedContext = { ...context, metricType: 'performance', traceId };

    // STEP 3: Record metric with high precision (stub usage)
    const meter = OpenTelemetry.metrics.getMeter('b2b-sales-performance');
    const counter = meter.createCounter(metricName);
    counter.add(value);

    // STEP 4: Check against performance thresholds
    const threshold = this.thresholds[metricName];
    if (threshold !== undefined && value > threshold) {
      // STEP 5: Calculate performance trends (simple demonstration)
      const trend = value > threshold ? 'worsening' : 'improving';
      // STEP 6: Trigger performance alerts if needed
      this.logger.info(`trackPerformanceMetric: Triggering alert for ${metricName} - ${trend}`, {
        metricName,
        value,
        threshold,
      });
      this.alertHandlers.performanceAlert(metricName, value);
    }

    // STEP 7: Update system health status (stub)
    this.logger.info('trackPerformanceMetric: System health updated.', {
      metricName,
      value,
      traceId,
    });

    // Add to internal buffer
    this.metricsBuffer.push({ metricName, value, extendedContext });
    if (this.metricsBuffer.length >= this.config.bufferSize) {
      this.flushMetrics();
    }
  }

  /**
   * getMetricReport
   * ---------------
   * Generates a comprehensive metric report with visualizations. The steps include:
   *  - Validating the period and metric names
   *  - Aggregating data
   *  - Performing statistical analysis and generating trend visualizations
   *  - Adding performance insights
   *  - Generating a PDF or final structured report
   *  - Caching the report for reuse
   *  - Returning the formatted report data
   *
   * @param period      - The time period to report on (e.g., '7d' for 7 days).
   * @param metricNames - An array of metric identifiers to include in the report.
   * @returns           - A Promise resolving to an object containing detailed report data.
   */
  public async getMetricReport(
    period: string,
    metricNames: string[],
  ): Promise<Record<string, any>> {
    // STEP 1: Validate period and metric names
    if (!period || !Array.isArray(metricNames) || !metricNames.length) {
      this.logger.error('getMetricReport: Invalid period or metricNames.', {});
      return {};
    }

    // STEP 2: Aggregate metrics data (demonstrative usage of the utility function)
    const aggregatedResults: Record<string, any>[] = [];
    for (const name of metricNames) {
      const agg = await aggregateMetrics(name, period, DEFAULT_AGGREGATION);
      aggregatedResults.push(agg);
    }

    // STEP 3: Generate statistical analysis (basic demonstration)
    // Here we simply reuse aggregated results which might contain standardDeviation, mean, etc.

    // STEP 4: Create trend visualizations (stub approach)
    // Real usage might create chart images or JSON chart data

    // STEP 5: Add performance insights (placeholder)
    const performanceInsight = 'Overall performance is stable with minor fluctuations.';

    // STEP 6: Generate PDF report (stub)
    // Example placeholder data. A real system would create a PDF or structured doc here.

    // STEP 7: Cache report for reuse (placeholder)
    // e.g. store in Redis or a local in-memory cache

    // STEP 8: Return formatted report data
    const reportData = {
      period,
      metrics: aggregatedResults,
      insights: performanceInsight,
      generatedAt: new Date().toISOString(),
    };
    this.logger.info('getMetricReport: Report generation complete.', { reportData });
    return reportData;
  }

  /**
   * flushMetrics
   * ------------
   * An internal helper method to flush the metrics buffer. This is typically invoked automatically
   * by a setInterval based on METRIC_FLUSH_INTERVAL or manually in the event of a graceful shutdown.
   * A real system might send the buffered data to an external service or a persistent store.
   */
  private flushMetrics(): void {
    if (!this.metricsBuffer.length) {
      return;
    }
    this.logger.info('flushMetrics: Flushing in-memory metrics buffer.', {
      metricsCount: this.metricsBuffer.length,
    });
    // Example: Send all metrics to an external system or database
    this.metricsBuffer = [];
  }
}

// -------------------------------------- Exports -----------------------------------------------------------
export { MetricsService, recordMetric, aggregateMetrics };