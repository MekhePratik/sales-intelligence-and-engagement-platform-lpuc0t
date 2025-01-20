/*************************************************************************************************
 * LeadMetrics.tsx
 *
 * A React component that displays key lead metrics and performance indicators on the dashboard,
 * including total leads, qualified leads, converted leads, and average lead score, with real-time
 * performance indicators and trend analysis. This file implements the specifications for:
 *
 *  1. Lead Management: Visualization of lead scoring and prioritization.
 *  2. Analytics: Campaign performance tracking and conversion analytics.
 *
 * The component below uses:
 *  - Card: Internal UI component for consistent, accessible layout.
 *  - useAnalytics: Custom hook that retrieves and manages analytics data with error handling.
 *  - formatMetric: Memoized utility function for locale-driven numeric and percentage formatting.
 *  - getTrendIcon: Memoized utility function for rendering a trend icon with accessibility attributes.
 *  - React Hooks for state management, memoization, and side effects.
 *
 * Exports:
 *  - LeadMetrics: Optimized, memoized React component for displaying lead metrics.
 *  - timeRange, locale as named members exposed on the LeadMetricsProps.
 *
 *************************************************************************************************/

import React from 'react'; // react ^18.2.0
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'; // @heroicons/react ^2.0.18
import { debounce } from 'lodash'; // lodash ^4.17.21

/*************************************************************************************************
 * Internal Imports
 *************************************************************************************************/
import { Card } from '../ui/Card';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { AnalyticsMetrics, TrendIndicator } from '../../types/analytics';

/*************************************************************************************************
 * Additional Type Imports & Definitions
 *
 * The specification mentions a "LeadMetricsTypes" interface with fields:
 *   total, qualified, converted, averageScore, trends.
 * For clarity, we define a local type alias for the 'Locale' to align with
 * the JSON specification's requirement to have 'locale' as a prop.
 *************************************************************************************************/
type Locale = string; // Basic assumption for locale strings (e.g., 'en-US', 'fr-FR').

export interface LeadMetricsTypes {
  total: number;
  qualified: number;
  converted: number;
  averageScore: number;
  trends: Record<string, TrendIndicator>;
}

/*************************************************************************************************
 * JSON Specification: "formatMetric"
 * -----------------------------------------------------------------------------------------------
 * Description:
 *   Formats numeric metrics with appropriate units, decimals, and internationalization support.
 *
 * Decorators: ['memo']
 * Parameters:
 *   - value: number
 *   - format: string
 *   - locale: string (treated as 'Locale')
 * Returns:
 *   - string: Formatted metric value with appropriate units and localization
 *
 * Steps:
 *   1) Validate input value and format type
 *   2) Apply locale-specific number formatting
 *   3) Format based on type (percentage, number, decimal)
 *   4) Add appropriate units and symbols
 *   5) Handle edge cases and invalid values
 *   6) Return formatted string
 *************************************************************************************************/
export const formatMetric = React.memo(function formatMetric(
  value: number,
  format: string,
  locale: Locale
): string {
  // Step 1: Validate input values; if invalid, return a fallback string.
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'N/A';
  }

  // Fall back to a basic format if none provided.
  const safeFormat = format || 'number';
  const safeLocale = locale || 'en-US';

  try {
    // Step 2: Setup a base Intl.NumberFormat with the provided locale.
    const formatter = new Intl.NumberFormat(safeLocale, {
      style: 'decimal',
      maximumFractionDigits: 2,
    });

    // Step 3: Differentiate between 'percentage', 'decimal', and 'number' or other format types.
    let formattedValue = formatter.format(value);

    if (safeFormat === 'percentage') {
      // Multiply the value by 100 internally for a percentage display (e.g., 0.35 -> 35%).
      const pctFormat = new Intl.NumberFormat(safeLocale, {
        style: 'percent',
        maximumFractionDigits: 2,
      });
      formattedValue = pctFormat.format(value);
    } else if (safeFormat === 'decimal') {
      // Keep the decimal approach but ensure up to 2 decimals.
      const decimalFormat = new Intl.NumberFormat(safeLocale, {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      formattedValue = decimalFormat.format(value);
    }
    // For 'number', we already have our default approach.

    // Step 4 & 5: Optionally add units or handle special edge cases.
    // (No extra symbol addition is strictly required by the specification; you could adapt as needed.)

    // Step 6: Return the final formatted string.
    return formattedValue;
  } catch {
    // In case of any unexpected error, fallback to a safe string.
    return 'N/A';
  }
});

/*************************************************************************************************
 * JSON Specification: "getTrendIcon"
 * -----------------------------------------------------------------------------------------------
 * Description:
 *   Returns appropriate trend icon component with accessibility attributes.
 *
 * Decorators: ['memo']
 * Parameters:
 *   - trend: TrendIndicator
 *   - ariaLabel: string
 * Returns:
 *   - JSX.Element: Accessible trend icon component with styling
 *
 * Steps:
 *   1) Determine trend direction
 *   2) Select appropriate icon component
 *   3) Apply color and animation classes
 *   4) Add accessibility attributes
 *   5) Return enhanced icon component
 *************************************************************************************************/
export const getTrendIcon = React.memo(function getTrendIcon(
  trend: TrendIndicator,
  ariaLabel: string
): JSX.Element {
  // Step 1: Identify direction from trend indicator (UP, DOWN, NEUTRAL).
  // Step 2 & 3: Choose icons; apply color. We'll default neutral to a hidden icon for brevity.
  let IconComponent: React.ElementType | null = null;
  let iconColorClass = '';

  if (trend === 'UP') {
    IconComponent = ArrowUpIcon;
    iconColorClass = 'text-green-500';
  } else if (trend === 'DOWN') {
    IconComponent = ArrowDownIcon;
    iconColorClass = 'text-red-500';
  } else {
    // If NEUTRAL or unknown, we won't render an actual icon. We could do a neutral icon if desired.
    IconComponent = null;
  }

  // Step 4: Return a minimal element if no icon is appropriate.
  if (!IconComponent) {
    return <span aria-hidden="true" className="inline-block w-4 h-4" />;
  }

  // Step 5: Return the icon component with the relevant ARIA label and styling.
  return (
    <span role="img" aria-label={ariaLabel} className="inline-flex items-center">
      <IconComponent className={`w-5 h-5 ${iconColorClass}`} />
    </span>
  );
});

/*************************************************************************************************
 * JSON Specification: "LeadMetrics" Class
 * -----------------------------------------------------------------------------------------------
 * Decorators: ['memo']
 * Parameters: [ {TimeRange: 'timeRange'}, {Locale: 'locale'} ]
 * Properties: [ {TimeRange: 'timeRange'}, {Locale: 'locale'} ]
 * Functions:
 *   renderMetricCard(title: string, value: number, trend: TrendIndicator, ariaLabel: string)
 *     1) Format metric value with localization
 *     2) Generate trend icon with accessibility
 *     3) Apply loading state if needed
 *     4) Handle error states
 *     5) Render card with all accessibility attributes
 *     6) Apply performance optimizations
 *
 * The main component below merges the specification instructions into a React functional component.
 *************************************************************************************************/

import type { TimeRange } from '../../types/analytics';

// Define a local prop interface to exposures required by specification.
export interface LeadMetricsProps {
  timeRange: TimeRange;
  locale: Locale;
}

/*************************************************************************************************
 * LeadMetrics
 * -----------------------------------------------------------------------------------------------
 * The primary dashboard component that visualizes lead metrics from the analytics store. This
 * includes total leads, qualified leads, converted leads, average lead score, and associated
 * trend icons or up/down indicators. The data is fetched via the useAnalytics hook.
 *
 * Steps in the body:
 *  1) Retrieve analytics data (loading, error, data) using the provided timeRange.
 *  2) Define renderMetricCard to encapsulate the rendering of a single metric.
 *  3) Handle various states: error, loading, and actual data display.
 *  4) Render multiple metric cards for total, qualified, converted, and average lead score.
 *  5) Ensure accessibility, including ARIA labels for icons and role assignments.
 *  6) Apply performance optimizations including memoization for the entire component.
 *************************************************************************************************/
export const LeadMetrics = React.memo(function LeadMetrics({
  timeRange,
  locale,
}: LeadMetricsProps): JSX.Element {
  // 1) Use the analytics hook to fetch data relevant to the provided time range.
  //    We include a slight debounce as a demonstration of controlling update frequency.
  const { data, loading, error } = useAnalytics(timeRange, { debounceDelay: 500 });

  /*************************************************************************************************
   * JSON Spec: "renderMetricCard" Implementation
   * -----------------------------------------------------------------------------------------------
   * Renders an individual metric within a Card, providing:
   *   - Title (e.g., "Total Leads")
   *   - Value (number)
   *   - TrendIndicator (UP, DOWN, NEUTRAL)
   *   - ariaLabel for accessibility
   *
   * Steps:
   *   1) Format metric value
   *   2) Generate trend icon
   *   3) If loading, we show a skeleton or placeholder
   *   4) If error, show an error message
   *   5) Return a <Card> with ARIA attributes
   *   6) Performance optimizations by avoiding unnecessary re-renders
   *************************************************************************************************/
  function renderMetricCard(
    title: string,
    value: number,
    trend: TrendIndicator,
    ariaLabel: string
  ): JSX.Element {
    // Step 1: Format the metric using our memoized utility
    const displayValue = formatMetric(value, 'number', locale);

    // Step 2: Generate the trend icon
    const iconElement = getTrendIcon(trend, ariaLabel);

    // Step 3 + 4: If loading or error, handle fallback states internally
    // We do minimal inline handling here, but typically you'd have more elaborate logic.
    let bodyContent: JSX.Element | string = displayValue;
    if (loading) {
      bodyContent = 'Loading...';
    }
    if (error) {
      bodyContent = `Error: ${error.message || 'Unable to load metric'}`;
    }

    // Step 5: Render a Card with appropriate labeling for screen readers
    return (
      <Card
        variant="default"
        padding="md"
        className="flex flex-col items-start justify-between"
        aria-label={title}
      >
        <div className="flex flex-row items-center justify-start gap-2 w-full">
          <h2 className="text-sm font-semibold text-slate-700 flex-1">{title}</h2>
          {iconElement}
        </div>
        <div className="mt-1 text-2xl font-bold" aria-live="polite" aria-atomic="true">
          {bodyContent}
        </div>
      </Card>
    );
  }

  // 2) If there's no data or we haven't fetched anything yet (and we're not loading), show fallback.
  //    This is a minor check; you might prefer a more robust approach depending on UI requirements.
  if (!data && !loading && !error) {
    return <p className="text-sm text-gray-500">No metrics data available.</p>;
  }

  // 3) Access the portion of data that corresponds to lead metrics if available. The specification
  //    references lead metrics via "data.leads", but that depends on how the analytics slice is shaped.
  //    We'll demonstrate a safe optional chain.
  const leadMetricsData = (data?.leads || {}) as Partial<LeadMetricsTypes>;

  // The "trends" object might contain a mapping of each metric's trend. We default to NEUTRAL if we can't find it.
  const trends = leadMetricsData.trends || {};

  const totalTrend = trends.total || 'NEUTRAL';
  const qualifiedTrend = trends.qualified || 'NEUTRAL';
  const convertedTrend = trends.converted || 'NEUTRAL';
  const avgScoreTrend = trends.averageScore || 'NEUTRAL';

  // 4) Render container with multiple metric cards. Each card calls renderMetricCard with appropriate props.
  return (
    <section
      className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
      role="region"
      aria-labelledby="lead-metrics-section"
    >
      <h1 id="lead-metrics-section" className="sr-only">
        Lead Metrics
      </h1>

      {renderMetricCard(
        'Total Leads',
        leadMetricsData.total ?? 0,
        totalTrend,
        'Trend for total leads'
      )}
      {renderMetricCard(
        'Qualified Leads',
        leadMetricsData.qualified ?? 0,
        qualifiedTrend,
        'Trend for qualified leads'
      )}
      {renderMetricCard(
        'Converted Leads',
        leadMetricsData.converted ?? 0,
        convertedTrend,
        'Trend for converted leads'
      )}
      {renderMetricCard(
        'Average Score',
        leadMetricsData.averageScore ?? 0,
        avgScoreTrend,
        'Trend for average score'
      )}
    </section>
  );
});

/*************************************************************************************************
 * Named Exports
 *
 * According to the JSON specification:
 *  - We expose "LeadMetrics" as the main component.
 *  - The props "timeRange" and "locale" are also exported.
 *************************************************************************************************/
export type { TimeRange, Locale };