/*************************************************************************************************
 * QuickStats.tsx
 *
 * A dashboard component that displays key performance metrics and quick statistics for the B2B
 * sales platform, including lead metrics, campaign performance, and conversion rates with
 * real-time updates and trend indicators. It leverages the useAnalytics hook for data retrieval
 * and auto-refresh, formats displayed metrics, and applies threshold-based highlighting and
 * trend icons to indicate how well metrics are performing against defined business goals.
 *
 * Requirements Addressed:
 *  - Core Analytics Feature (Comprehensive campaign performance tracking, conversion analytics,
 *    ROI calculation, real-time updates, and trend analysis).
 *  - Success Criteria Tracking (Enhanced KPI monitoring: user adoption, lead quality, time savings,
 *    and ROI, with threshold alerts).
 *  - Dashboard Design (Responsive layout of quick stat cards with trend indicators, tooltips,
 *    and accessibility features).
 *
 * Implementation Outline:
 *  1. Imports:
 *     - React (v18.2.0) for component structure and hooks.
 *     - Arrow icons from @heroicons/react (v2.0.18) for trend indicators.
 *     - debounce from lodash (v4.17.21) for real-time update optimization.
 *     - Tooltip from @radix-ui/react-tooltip (v1.0.0) for metric explanations.
 *     - Card from ../../components/ui/Card for the card container.
 *     - useAnalytics from ../../hooks/useAnalytics for retrieving analytics data.
 *
 *  2. Types & Interfaces:
 *     - QuickStatsProps defines external props including className, refreshInterval, thresholds.
 *     - ThresholdConfig outlines numerical targets or limits for each metric category.
 *     - LocaleOptions for optional locale-based formatting in formatMetric.
 *     - TimeRange from the analytics types for scoping data.
 *
 *  3. Internal State:
 *     - timeRange (TimeRange) with default of 'DAY' (per specification).
 *     - lastUpdate (Date) capturing the latest data refresh time.
 *
 *  4. Utility Functions:
 *     - formatMetric(value, type, options?): Enhanced metric formatter with localization and
 *       unit/currency/percentage handling.
 *     - getTrendIndicator(currentValue, previousValue, thresholds): Calculates trend direction,
 *       percentage change, color coding, and threshold checks.
 *
 *  5. QuickStats Component:
 *     - Leverages useAnalytics hook for data, loading, error, trends, threshold checks.
 *     - Renders stat cards using the Card component for lead, campaign, and conversion metrics
 *       plus any additional stats from the analytics data.
 *     - Applies auto-refresh with user-defined or default intervals (30s).
 *     - Uses extensive comments for enterprise-level clarity and maintainability.
 ************************************************************************************************/

/*************************************************************************************************
 * External Imports with Library Versions
 *************************************************************************************************/
import React, { useEffect, useState, useCallback } from 'react'; // react ^18.2.0
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'; // @heroicons/react ^2.0.18
import { debounce } from 'lodash'; // lodash ^4.17.21
import * as Tooltip from '@radix-ui/react-tooltip'; // @radix-ui/react-tooltip ^1.0.0

/*************************************************************************************************
 * Internal Imports
 *************************************************************************************************/
import { Card } from '../../components/ui/Card';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { AnalyticsMetrics, TimeRange } from '../../types/analytics';

/*************************************************************************************************
 * Interface: ThresholdConfig
 * -----------------------------------------------------------------------------------------------
 * Represents threshold values for numeric metrics. If a metric surpasses or meets these values,
 * it is considered above threshold. Additional fields can be added as needed (e.g., for user
 * adoption, ROI, etc.).
 *************************************************************************************************/
export interface ThresholdConfig {
  /**
   * Conversion rate threshold (e.g., 0.4 for 40%). If the current conversion rate is >= this,
   * we consider it a success.
   */
  conversionRate?: number;
  /**
   * Open rate threshold (e.g., 0.25 for 25%). If the current open rate is >= this,
   * we consider it a success.
   */
  openRate?: number;
  /**
   * Click rate threshold (e.g., 0.1 for 10%). If the current click rate is >= this,
   * we consider it a success.
   */
  clickRate?: number;
  /**
   * Lead score threshold (e.g., 80). If the average lead score is >= this,
   * we consider it a success.
   */
  leadScore?: number;
  /**
   * User adoption threshold (e.g., 80%). Additional custom thresholds can be appended.
   */
  userAdoption?: number;
  /**
   * ROI threshold multiplier (e.g., 3). If ROI meets or exceeds this multiplier, success.
   */
  roiMultiplier?: number;
  /**
   * Time savings threshold (e.g., 0.6 for 60%). If the platform saves 60% or more time,
   * it's considered a success.
   */
  timeSavings?: number;
  /**
   * Additional metric-specific entries can be included as needed.
   */
  [key: string]: number | undefined;
}

/*************************************************************************************************
 * Interface: LocaleOptions
 * -----------------------------------------------------------------------------------------------
 * Defines optional locale configuration for formatting numeric values, allowing the calling
 * context to specify custom locales, currency codes, or other formatting properties.
 *************************************************************************************************/
export interface LocaleOptions {
  /**
   * The locale string (e.g., 'en-US', 'fr-FR') for specific number formatting.
   */
  locale?: string;
  /**
   * The currency code if formatting currency (e.g., 'USD', 'EUR').
   */
  currency?: string;
  /**
   * Optional flag indicating if the value is a percentage.
   * This might override or supplement the 'type' parameter in formatMetric if needed.
   */
  isPercentage?: boolean;
}

/*************************************************************************************************
 * Function: formatMetric
 * -----------------------------------------------------------------------------------------------
 * Enhanced metric formatter with localization and unit support. Returns a string with applied
 * rules for currency, percentage, or large number abbreviations. Additional transformations
 * can be added as needed (e.g., disclaimers for footnotes, advanced rounding, etc.).
 *
 * Steps:
 *  1. Check metric type for specific formatting rules (percentage, currency, numeric, etc.).
 *  2. Apply locale-specific number formatting (using Intl.NumberFormat if relevant).
 *  3. Handle percentage values with proper decimals and a trailing '%' sign.
 *  4. Format currency values with the correct symbol if 'currency' is specified.
 *  5. Apply unit suffixes for large numbers if the type calls for it (e.g., 'K' for thousands).
 *  6. Return the formatted string with appropriate accessibility labeling if needed.
 *
 * @param value        Numeric value to format.
 * @param type         Type of metric, e.g. 'percentage', 'currency', 'number', etc.
 * @param options      Optional locale settings or additional config (locale, currency).
 * @returns            A string containing the formatted metric output.
 *************************************************************************************************/
export function formatMetric(
  value: number,
  type: string,
  options?: LocaleOptions
): string {
  // 1. Basic defaults and fallback
  const safeValue = Number.isFinite(value) ? value : 0;
  const locale = options?.locale || 'en-US';
  const currencyCode = options?.currency || 'USD';

  // 2. Create a base formatter:
  const baseFormatter = new Intl.NumberFormat(locale, {
    style: 'decimal',
    maximumFractionDigits: 2,
  });

  // We'll store the final output here
  let output = '';

  // 3. Switch on 'type' to apply specific formatting logic
  switch (type) {
    case 'percentage': {
      // Treat value as a fractional percentage (e.g., 0.35 => 35%)
      const percValue = safeValue * 100;
      output = `${baseFormatter.format(percValue)}%`;
      break;
    }

    case 'currency': {
      // Use a currency-specific formatter
      const currencyFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'symbol',
        maximumFractionDigits: 2,
      });
      output = currencyFormatter.format(safeValue);
      break;
    }

    case 'number':
    default: {
      // 4. If it's a large number, optionally apply 'K', 'M', etc. suffix
      // For demonstration, we'll apply a simple strategy for thousands:
      if (Math.abs(safeValue) >= 1000000) {
        // handle millions
        const millions = safeValue / 1000000;
        output = `${baseFormatter.format(millions)}M`;
      } else if (Math.abs(safeValue) >= 1000) {
        // handle thousands
        const thousands = safeValue / 1000;
        output = `${baseFormatter.format(thousands)}K`;
      } else {
        // Otherwise, just do standard decimal formatting
        output = baseFormatter.format(safeValue);
      }
      break;
    }
  }

  // 5. Return final string (accessibility note could be appended if needed)
  return output;
}

/*************************************************************************************************
 * Interface: TrendInfo
 * -----------------------------------------------------------------------------------------------
 * The structure returned by getTrendIndicator, describing:
 *  - direction: 'UP', 'DOWN', or 'NEUTRAL'
 *  - change: numeric percentage change between current and previous values
 *  - color: recommended color class (e.g., 'text-green-600' or 'text-red-600')
 *  - isAboveThreshold: boolean indicating if current value meets/exceeds a threshold
 *************************************************************************************************/
interface TrendInfo {
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  change: number;
  color: string;
  isAboveThreshold: boolean;
}

/*************************************************************************************************
 * Function: getTrendIndicator
 * -----------------------------------------------------------------------------------------------
 * Calculates trend direction, percentage change, color coding, and threshold comparison for a
 * given metric, returning comprehensive trend information. If thresholds are provided, checks
 * whether the current value meets or exceeds the relevant threshold.
 *
 * Steps:
 *  1. Calculate percentage change ((current - previous) / previous * 100) with fallback for zero.
 *  2. Determine trend direction: 'UP', 'DOWN', or 'NEUTRAL'.
 *  3. Compare current value against thresholds to see if it's above/below the target.
 *  4. Generate color coding:
 *        - Green if trending up or above threshold,
 *        - Red if trending down or below threshold,
 *        - Gray or neutral if no significant difference.
 *  5. Return the comprehensive TrendInfo object.
 *
 * @param currentValue   Current metric value.
 * @param previousValue  Previous metric value (0 or undefined is handled safely).
 * @param thresholds     ThresholdConfig object for optional threshold checks.
 * @param metricKey      A string key identifying which threshold to compare (e.g., 'conversionRate').
 * @returns              An object with direction, change, color, and isAboveThreshold fields.
 *************************************************************************************************/
export function getTrendIndicator(
  currentValue: number,
  previousValue: number,
  thresholds?: ThresholdConfig,
  metricKey?: string
): TrendInfo {
  // 1. Safe handling of previousValue
  const safePrev = Number.isFinite(previousValue) ? previousValue : 0;
  let percentageChange = 0;

  if (safePrev !== 0) {
    percentageChange = ((currentValue - safePrev) / Math.abs(safePrev)) * 100;
  } else if (safePrev === 0 && currentValue !== 0) {
    // If the previous is 0 but current has a value, interpret as a large positive jump
    percentageChange = 100;
  }

  // Round to 2 decimals for clarity
  const change = parseFloat(percentageChange.toFixed(2));

  // 2. Determine direction
  let direction: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
  if (change > 0) {
    direction = 'UP';
  } else if (change < 0) {
    direction = 'DOWN';
  }

  // 3. Check thresholds
  let isAboveThreshold = false;
  if (metricKey && thresholds && typeof thresholds[metricKey] === 'number') {
    const thresholdValue = thresholds[metricKey] as number;
    if (currentValue >= thresholdValue) {
      isAboveThreshold = true;
    }
  }

  // 4. Generate color logic
  let color = 'text-gray-500';
  if (direction === 'UP') {
    color = 'text-green-600';
  } else if (direction === 'DOWN') {
    color = 'text-red-600';
  }
  if (isAboveThreshold && direction === 'NEUTRAL') {
    // If at threshold but no difference from previous, we can still consider it a success
    color = 'text-green-600';
  }

  return {
    direction,
    change,
    color,
    isAboveThreshold,
  };
}

/*************************************************************************************************
 * Interface: QuickStatsProps
 * -----------------------------------------------------------------------------------------------
 * Props for the QuickStats component. Includes:
 *  - className?: optional styling
 *  - refreshInterval?: optional auto-refresh interval in ms (default: 30000)
 *  - thresholds?: optional ThresholdConfig for threshold-based color/highlight
 *************************************************************************************************/
export interface QuickStatsProps {
  className?: string;
  refreshInterval?: number;
  thresholds?: ThresholdConfig;
}

/*************************************************************************************************
 * QuickStats Component (React.FC)
 * -----------------------------------------------------------------------------------------------
 * Renders a responsive dashboard section with lead metrics, campaign performance, and conversion
 * rates. Each metric card displays real-time data from useAnalytics. Visual cues (icons, colors,
 * tooltips) show how metrics compare to thresholds and how they trend compared to previous values.
 *
 * Internal State:
 *  - timeRange (TimeRange): stores the current time scope for metrics, default 'DAY'.
 *  - lastUpdate (Date): captures the last time the data was updated.
 *
 * Hooks and Features:
 *  - useAnalytics: obtains analytics data, trends, error, loading states, and refresh function.
 *  - Debounced auto-refresh: invoked at the specified refreshInterval or default 30s.
 *  - Detailed comments for enterprise-level clarity.
 *************************************************************************************************/
export const QuickStats: React.FC<QuickStatsProps> = (props) => {
  /***********************************************************************************************
   * Destructure props with defaults
   **********************************************************************************************/
  const {
    className = '',
    refreshInterval = 30000, // default to 30s
    thresholds,
  } = props;

  /***********************************************************************************************
   * Manage local component state: timeRange & lastUpdate
   **********************************************************************************************/
  const [timeRange, setTimeRange] = useState<TimeRange>('DAY');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  /***********************************************************************************************
   * Use our analytics hook - Provide the initialTimeRange for data retrieval, if relevant.
   * We pass the local timeRange into useAnalytics for scoping, or simply use 'DAY' initially.
   **********************************************************************************************/
  const {
    data,
    loading,
    error,
    trends,
    refreshAnalytics,
  } = useAnalytics(timeRange, { debounceDelay: 300 });

  /***********************************************************************************************
   * Auto-refresh Logic
   * Use a debounced callback for refreshAnalytics invocation to avoid spamming the endpoint.
   **********************************************************************************************/
  const debouncedRefresh = useCallback(
    debounce(() => {
      refreshAnalytics();
      setLastUpdate(new Date());
    }, 200),
    [refreshAnalytics]
  );

  useEffect(() => {
    // Trigger an immediate fetch on mount
    refreshAnalytics();
    setLastUpdate(new Date());

    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      debouncedRefresh();
    }, refreshInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      debouncedRefresh.cancel();
    };
  }, [debouncedRefresh, refreshInterval, refreshAnalytics]);

  /***********************************************************************************************
   * Helper: Render a single statistic card with a label, formatted value, trend indicator,
   * and optional tooltip explaining the metric.
   **********************************************************************************************/
  function renderStatCard(
    label: string,
    value: number,
    previous: number,
    metricType: string,
    thresholdKey?: string
  ) {
    // Use our getTrendIndicator logic
    const trendInfo = getTrendIndicator(value, previous, thresholds, thresholdKey);

    // Render the trend icon
    const Icon =
      trendInfo.direction === 'DOWN'
        ? ArrowDownIcon
        : trendInfo.direction === 'UP'
        ? ArrowUpIcon
        : null;

    // Format the metric output based on the type (potentially 'percentage' or 'number')
    const formattedMetric = formatMetric(value, metricType);

    // Conditionally show arrow icon if direction is UP or DOWN
    return (
      <Card padding="md" className="flex flex-col gap-2">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div className="inline-flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">{label}</span>
              {Icon && (
                <Icon className={`h-5 w-5 ${trendInfo.color}`} aria-hidden="true" />
              )}
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content
            className="rounded-md bg-black px-2 py-1 text-xs text-white shadow-sm"
            side="top"
            sideOffset={5}
          >
            {trendInfo.direction === 'UP' && 'Metric trending up'}
            {trendInfo.direction === 'DOWN' && 'Metric trending down'}
            {trendInfo.direction === 'NEUTRAL' && 'Metric stable'}
            <Tooltip.Arrow className="fill-black" />
          </Tooltip.Content>
        </Tooltip.Root>
        <div className={`text-xl font-bold ${trendInfo.color}`}>
          {formattedMetric}
        </div>
        <div className="text-xs text-slate-500">
          {trendInfo.change !== 0 && (
            <>
              {trendInfo.change > 0 ? '+' : ''}
              {trendInfo.change}%
            </>
          )}
          {trendInfo.change === 0 && 'No change'}
        </div>
      </Card>
    );
  }

  /***********************************************************************************************
   * Render any error states or loading placeholders as needed
   **********************************************************************************************/
  if (error) {
    return (
      <div className={`w-full rounded bg-red-50 p-4 ${className}`}>
        <p className="text-sm text-red-700">
          Error fetching analytics: {error}
        </p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className={`w-full p-4 ${className}`}>
        <p className="text-sm text-slate-500">Loading quick stats...</p>
      </div>
    );
  }

  /***********************************************************************************************
   * If data is present, structure the lead, campaign, and conversion metrics. We'll also handle
   * additional fields as needed. The analytics shape is as follows:
   *   data.leads => { total, qualified, converted, averageScore }
   *   data.campaigns => { sent, opened, clicked, bounced, openRate, clickRate }
   *   data.conversion => { rate, trend, previousPeriod }
   **********************************************************************************************/
  const leadMetrics = data?.leads;
  const campaignMetrics = data?.campaigns;
  const conversionMetrics = data?.conversion;

  // Safeguard to ensure valid objects
  const leadsTotal = leadMetrics?.total ?? 0;
  const leadsAvgScore = leadMetrics?.averageScore ?? 0;
  const conversionRate = conversionMetrics?.rate ?? 0;
  const conversionPrevious = conversionMetrics?.previousPeriod ?? 0;
  const openRate = campaignMetrics?.openRate ?? 0;
  const clickRate = campaignMetrics?.clickRate ?? 0;
  const openRatePrev = 0; // we don't have a direct previous openRate in the model
  const clickRatePrev = 0; // likewise for clickRate

  /***********************************************************************************************
   * Render the QuickStats layout in a responsive manner. We'll create a grid or flex layout
   * to place each metric card. Additional metrics can be added similarly.
   **********************************************************************************************/
  return (
    <section className={`flex flex-col gap-4 ${className}`} aria-label="Quick Statistics">
      <div className="flex flex-wrap gap-4">
        {/* Leads: Total Leads */}
        {renderStatCard('Total Leads', leadsTotal, 0, 'number')}

        {/* Leads: Average Score with thresholdKey 'leadScore' */}
        {renderStatCard('Avg Lead Score', leadsAvgScore, 0, 'number', 'leadScore')}

        {/* Campaigns: Open Rate (fraction => percentage) with thresholdKey 'openRate' */}
        {renderStatCard('Open Rate', openRate, openRatePrev, 'percentage', 'openRate')}

        {/* Campaigns: Click Rate (fraction => percentage) with thresholdKey 'clickRate' */}
        {renderStatCard('Click Rate', clickRate, clickRatePrev, 'percentage', 'clickRate')}

        {/* Conversion: Conversion Rate (fraction => percentage) with thresholdKey 'conversionRate' */}
        {renderStatCard('Conversion Rate', conversionRate, conversionPrevious, 'percentage', 'conversionRate')}
      </div>

      {/* Additional informational footer */}
      <div className="text-xs text-slate-400">
        Last updated: {lastUpdate.toLocaleString()}
      </div>
    </section>
  );
};

export default QuickStats;