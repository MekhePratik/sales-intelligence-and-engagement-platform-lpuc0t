import React, {
  memo,
  useEffect,
  useMemo,
  useState,
  useCallback,
  FC,
  JSX,
} from 'react';
// External library imports (with version comments)
import { ArrowUpIcon } from '@heroicons/react/24/outline'; // ^2.0.18
import { ArrowDownIcon } from '@heroicons/react/24/outline'; // ^2.0.18

// Internal imports
import Card from '../ui/Card'; // Container component for consistent styling
import { useAnalytics } from '../../hooks/useAnalytics'; // Provides { data, loading, error, ... } for real-time analytics
import type { CampaignMetrics } from '../../types/analytics'; // Type definitions for campaign metrics

/****************************************************************************
 * PROPS INTERFACE
 * EmailStatsProps declares the public API of the EmailStats component.
 *  - className?: optional custom class names for styling
 *  - refreshInterval?: optional interval (ms) to auto-refresh analytics data
 *  - showTrends?: whether to display trend arrows and percentage changes
 ***************************************************************************/
export interface EmailStatsProps {
  /**
   * Optional additional class names for styling customization.
   */
  className?: string;

  /**
   * Optional refresh interval in milliseconds for automatically
   * triggering analytics data refresh (e.g., 30000 for 30s).
   */
  refreshInterval?: number;

  /**
   * If true, the component renders trend indicators for key metrics.
   */
  showTrends?: boolean;
}

/****************************************************************************
 * formatPercentage
 * ----------------------------------------------------------------------------
 * A memoized function that formats a decimal number as a percentage string.
 *
 * Steps:
 * 1. Validate the incoming number and check for edge conditions like NaN.
 * 2. Multiply the input value by 100.
 * 3. Round to the specified decimal places, ensuring numerical stability.
 * 4. Convert to a localized string if desired (here we use toFixed for simplicity).
 * 5. Append the '%' symbol.
 * 6. Return the formatted string.
 ***************************************************************************/
export const formatPercentage = memo(function formatPercentage(
  value: number,
  decimals: number
): string {
  // 1. Validate the input number and handle edge cases
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  // 2. Multiply by 100 to convert to a percentage
  const multiplied = value * 100;

  // 3. Round the percentage
  const rounded = Number.isFinite(decimals)
    ? parseFloat(multiplied.toFixed(decimals))
    : Math.round(multiplied);

  // 4. (Optional) Here we could do advanced localization, but we'll keep it simple
  // 5. Append '%' for final output
  return `${rounded}%`;
});

/****************************************************************************
 * getTrendIndicator
 * ----------------------------------------------------------------------------
 * A memoized function that returns a JSX element indicating the
 * trend direction with color coding, tooltips, and ARIA labels.
 *
 * Steps:
 * 1. Calculate the change as a percentage difference between current and previous.
 * 2. Determine if the trend is up, down, or neutral.
 * 3. Apply color coding based on direction (green for up, red for down).
 * 4. Provide a tooltip and ARIA labels for accessibility.
 * 5. Return the fully styled component with an ArrowUp or ArrowDown icon.
 ***************************************************************************/
export const getTrendIndicator = memo(function getTrendIndicator(
  current: number,
  previous: number,
  metricName: string
): JSX.Element {
  // 1. Calculate percentage change
  let percentageChange = 0;
  if (previous !== 0 && !isNaN(previous)) {
    percentageChange = ((current - previous) / previous) * 100;
  } else if (previous === 0 && current !== 0) {
    // If previous is zero but current is nonzero, treat it as a large positive shift
    percentageChange = 100;
  }

  // 2. Determine direction
  let direction: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
  if (percentageChange > 0) {
    direction = 'UP';
  } else if (percentageChange < 0) {
    direction = 'DOWN';
  }

  // Round to one decimal place for display in tooltip
  const changeString = percentageChange.toFixed(1);

  // 3. Color coding
  let colorClass = 'text-gray-500';
  if (direction === 'UP') {
    colorClass = 'text-green-600';
  } else if (direction === 'DOWN') {
    colorClass = 'text-red-600';
  }

  // 4. Construct ARIA label and tooltip text
  let ariaLabel = `${metricName} is unchanged`;
  let tooltipLabel = `${metricName}: no significant change`;

  if (direction === 'UP') {
    ariaLabel = `${metricName} increased by ${changeString}%`;
    tooltipLabel = `Increased by ${changeString}%`;
  } else if (direction === 'DOWN') {
    ariaLabel = `${metricName} decreased by ${Math.abs(Number(changeString))}%`;
    tooltipLabel = `Decreased by ${Math.abs(Number(changeString))}%`;
  }

  // 5. Return a styled indicator
  if (direction === 'UP') {
    return (
      <span
        className={`inline-flex items-center ${colorClass}`}
        aria-label={ariaLabel}
        title={tooltipLabel}
      >
        <ArrowUpIcon className="h-4 w-4 mr-1" />
        {changeString}%
      </span>
    );
  } else if (direction === 'DOWN') {
    return (
      <span
        className={`inline-flex items-center ${colorClass}`}
        aria-label={ariaLabel}
        title={tooltipLabel}
      >
        <ArrowDownIcon className="h-4 w-4 mr-1" />
        {Math.abs(Number(changeString))}%
      </span>
    );
  }

  // Neutral or zero
  return (
    <span
      className="inline-flex items-center text-gray-500"
      aria-label="No meaningful change"
      title="No change detected"
    >
      ~0%
    </span>
  );
});

/****************************************************************************
 * EmailStats (React.FC)
 * ----------------------------------------------------------------------------
 * A production-ready component that shows email campaign performance
 * statistics derived from real-time analytics data. This includes:
 *  - Sent count
 *  - Opened count
 *  - Clicked count
 *  - Bounced count
 *  - Open rate %
 *  - Click rate %
 *  - Optional trend indicators
 *  - Automatic refresh intervals
 *  - Error boundary checks & skeleton loading
 *  - Performance monitoring hooks
 *
 * Steps for the "constructor" equivalent in a functional component:
 *  1. Parse and store props (className, refreshInterval, showTrends).
 *  2. Set up the analytics hook from useAnalytics with a default time range.
 *  3. If refreshInterval is defined, use a periodic setInterval to refresh data.
 *  4. Configure a simple inline error boundary by conditionally rendering errors.
 *  5. Initialize a performance monitoring marker on mount.
 *
 * Steps for "render":
 *  1. If loading, render a skeleton or loading UI.
 *  2. Validate that data exists and is properly structured.
 *  3. Calculate display percentages using formatPercentage.
 *  4. Render trend indicators if showTrends is true, using getTrendIndicator.
 *  5. Ensure responsive layout using appropriate Tailwind classes for widths.
 *  6. Display an error fallback if error occurs.
 *  7. Return the final, optimized UI within a Card component.
 ***************************************************************************/
const EmailStats: FC<EmailStatsProps> = ({
  className,
  refreshInterval,
  showTrends,
}) => {
  // 2. Use the analytics hook with an initial time range of 'MONTH' (example choice)
  const {
    data,
    loading,
    error,
    refreshAnalytics,
  } = useAnalytics('MONTH', { debounceDelay: 300 });

  // 3. If refreshInterval is provided, set up automatic refresh
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const timerId = setInterval(() => {
        refreshAnalytics();
      }, refreshInterval);
      return () => clearInterval(timerId);
    }
  }, [refreshInterval, refreshAnalytics]);

  // 4. Initialize performance monitoring marker
  useEffect(() => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('EmailStatsMounted');
    }
  }, []);

  // 5. Provide an inline check for error boundary
  if (error) {
    return (
      <Card className={`p-6 bg-red-50 text-red-700 ${className || ''}`}>
        <h2 className="text-lg font-semibold mb-2">Analytics Error</h2>
        <p>Failed to load email campaign statistics. {error}</p>
      </Card>
    );
  }

  // 1. Handle loading state with a skeleton or simple loading text
  if (loading) {
    return (
      <Card className={`p-6 ${className || ''}`} variant="bordered">
        <h2 className="text-lg font-semibold mb-2">Loading Email Stats...</h2>
        <p className="text-sm text-gray-500">Please wait while we retrieve data.</p>
      </Card>
    );
  }

  // 2. Validate data structure
  let campaignMetrics: CampaignMetrics | null = null;
  if (data && data.campaigns) {
    campaignMetrics = data.campaigns;
  }
  if (!campaignMetrics) {
    return (
      <Card className={`p-6 bg-yellow-50 text-yellow-800 ${className || ''}`}>
        <h2 className="text-lg font-semibold mb-2">No Campaign Data</h2>
        <p>No email campaign metrics were found for this time range.</p>
      </Card>
    );
  }

  // Prepare the metrics
  const { sent, opened, clicked, bounced, openRate, clickRate } = campaignMetrics;

  // 3. Convert openRate and clickRate to a user-friendly format
  const formattedOpenRate = formatPercentage(openRate, 2);
  const formattedClickRate = formatPercentage(clickRate, 2);

  // 4. Conditionally build trend indicators
  //    In this simplified example, we pass 0 for 'previous' since the current
  //    data does not contain the previous period. A real scenario might
  //    retrieve that from the analytics hook's trends object.
  const openTrendIndicator = showTrends
    ? getTrendIndicator(openRate, 0, 'Open Rate')
    : null;
  const clickTrendIndicator = showTrends
    ? getTrendIndicator(clickRate, 0, 'Click Rate')
    : null;

  // 7. Return the final UI structure, ensuring an accessible layout
  return (
    <Card className={`w-full overflow-hidden ${className || ''}`} variant="default">
      <div className="mb-4">
        <h2 className="text-xl font-bold" aria-label="Email Campaign Statistics">
          Email Campaign Performance
        </h2>
      </div>

      {/* Display the main metrics in a responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {/* Sent */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Sent</span>
          <span className="text-lg font-semibold">{sent}</span>
        </div>

        {/* Opened */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Opened</span>
          <span className="text-lg font-semibold">{opened}</span>
        </div>

        {/* Clicked */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Clicked</span>
          <span className="text-lg font-semibold">{clicked}</span>
        </div>

        {/* Bounced */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Bounced</span>
          <span className="text-lg font-semibold">{bounced}</span>
        </div>

        {/* Open Rate */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Open Rate</span>
          <div className="inline-flex items-center gap-2">
            <span className="text-lg font-semibold">{formattedOpenRate}</span>
            {openTrendIndicator}
          </div>
        </div>

        {/* Click Rate */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Click Rate</span>
          <div className="inline-flex items-center gap-2">
            <span className="text-lg font-semibold">{formattedClickRate}</span>
            {clickTrendIndicator}
          </div>
        </div>
      </div>
    </Card>
  );
};

/****************************************************************************
 * Export the EmailStats component as default for use in other modules.
 ***************************************************************************/
export default memo(EmailStats);