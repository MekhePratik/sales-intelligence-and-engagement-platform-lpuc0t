import React, {
  memo,
  useCallback,
  useMemo,
  useEffect,
  useState,
  useRef,
} from 'react'; // react ^18.2.0
import { useIntl } from 'react-intl'; // react-intl ^6.4.0
import { Card } from '../ui/Card'; // Accessible container with variant & padding
import type { CampaignMetrics } from '../../types/campaign'; // Interface for campaign metrics
import { useCampaigns } from '../../hooks/useCampaigns'; // Hook for data ops, includes getCampaignById, useMetricsQuery

/*************************************************************************************************
 * Interface: CampaignMetricsProps
 * -----------------------------------------------------------------------------
 * Defines the props accepted by CampaignMetrics component:
 *  - campaignId (string): The unique ID of the campaign for which metrics are displayed.
 *  - className (optional): Additional class names for custom styling.
 *************************************************************************************************/
interface CampaignMetricsProps {
  campaignId: string;
  className?: string;
}

/*************************************************************************************************
 * calculatePercentage (useMemo)
 * -----------------------------------------------------------------------------
 * Calculates a percentage (numerator / denominator * 100) with:
 *  1) Input validation (null/undefined checks)
 *  2) Denominator guard for division by zero
 *  3) Proper rounding to two decimals
 *  4) Returns 0 if invalid
 *
 * Decorated with React's useMemo to avoid unnecessary recalculations.
 *************************************************************************************************/
function useCalculatePercentage(numerator: number, denominator: number): number {
  return useMemo(() => {
    // Step 1: Validate input parameters
    if (
      numerator === null ||
      numerator === undefined ||
      denominator === null ||
      denominator === undefined
    ) {
      return 0;
    }

    // Step 2: Check if denominator is zero to prevent division errors
    if (denominator === 0) {
      return 0;
    }

    // Step 3: Calculate raw percentage
    const raw = (numerator / denominator) * 100;

    // Step 4: Round to 2 decimal places
    const rounded = Math.round(raw * 100) / 100;

    // Step 5: Return the resulting value or 0 if invalid
    return Number.isFinite(rounded) ? rounded : 0;
  }, [numerator, denominator]);
}

/*************************************************************************************************
 * formatMetricNumber
 * -----------------------------------------------------------------------------
 * Formats numeric values based on locale and a format type.
 * Implementation Steps:
 *  1) Retrieve current locale from useIntl
 *  2) Apply number formatting with Intl.NumberFormat
 *  3) Handle edge cases for invalid or non-finite values
 *  4) Return the properly localized/rounded string
 *************************************************************************************************/
function formatMetricNumber(value: number, formatType: string): string {
  // Step 1: Get the current locale from useIntl (moved as param for convenience in this approach)
  // Since we need the locale from within a React component, we'll do the actual usage below
  return ''; // Placeholder, actual usage occurs in the component with the correct locale
}

/*************************************************************************************************
 * Component: CampaignMetrics
 * -----------------------------------------------------------------------------
 * Displays campaign performance metrics with enhanced accessibility and error handling.
 * Decorators: memo
 * Implementation includes:
 *  - Error & loading states
 *  - i18n number formatting
 *  - Layout inside Card container with ARIA attributes
 *  - Summaries of metrics with derived percentages
 *************************************************************************************************/
const CampaignMetrics: React.FC<CampaignMetricsProps> = memo((props) => {
  /***********************************************************************************************
   * Local Props & State Initialization
   **********************************************************************************************/
  const { campaignId, className } = props;
  const { formatMessage, formatNumber, locale } = useIntl(); // Step 3: i18n context
  const { useMetricsQuery } = useCampaigns(); // Hook usage from useCampaigns
  const { data: metrics, error, isLoading } = useMetricsQuery(campaignId);

  // Optional effect for performance monitoring (Step 5 in constructor steps)
  useEffect(() => {
    // Example performance config or logging (no-op here)
  }, []);

  /***********************************************************************************************
   * Helper: Perform numeric formatting using the actual locale from useIntl
   **********************************************************************************************/
  const formatNumberWithType = useCallback(
    (value: number, formatType: string) => {
      // Step 1: We already have 'locale'. Let's fallback if needed
      const safeLocale = locale || 'en-US';

      // Step 2 & 3: Basic approach, branching format type
      try {
        switch (formatType) {
          case 'decimal':
            return new Intl.NumberFormat(safeLocale, {
              style: 'decimal',
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(value);

          case 'integer':
            return new Intl.NumberFormat(safeLocale, {
              style: 'decimal',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);

          case 'percent':
            // Convert a fraction (0.5 -> '50%'), so user of function
            // should pass the fraction not the raw percentage
            return new Intl.NumberFormat(safeLocale, {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value);

          default:
            // If no match, treat as decimal
            return new Intl.NumberFormat(safeLocale, {
              style: 'decimal',
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(value);
        }
      } catch {
        // Step 4: If invalid or non-finite, fallback
        return '0';
      }
    },
    [locale]
  );

  /***********************************************************************************************
   * Derive additional metrics with memoized calls
   * For instance, open rate, click rate, etc. using useCalculatePercentage
   **********************************************************************************************/
  const openRate = useCalculatePercentage(
    metrics?.emailsOpened ?? 0,
    metrics?.emailsSent ?? 0
  );
  const clickRate = useCalculatePercentage(
    metrics?.emailsClicked ?? 0,
    metrics?.emailsSent ?? 0
  );
  const responseRate = useCalculatePercentage(
    metrics?.responses ?? 0,
    metrics?.emailsSent ?? 0
  );
  const bounceRate = useCalculatePercentage(
    metrics?.bounces ?? 0,
    metrics?.emailsSent ?? 0
  );
  const unsubscribeRate = useCalculatePercentage(
    metrics?.unsubscribes ?? 0,
    metrics?.emailsSent ?? 0
  );
  const conversionRate = useCalculatePercentage(
    metrics?.conversions ?? 0,
    metrics?.emailsSent ?? 0
  );

  /***********************************************************************************************
   * Rendering logic (render function steps)
   **********************************************************************************************/
  // 1) Handle loading state
  if (isLoading) {
    return (
      <Card
        variant="default"
        padding="md"
        className={className}
        role="region"
        aria-label={formatMessage({ id: 'campaignMetrics.loading', defaultMessage: 'Loading Campaign Metrics' })}
      >
        <div aria-busy="true" aria-live="polite">
          {formatMessage({ id: 'loading.skeleton', defaultMessage: 'Loading metrics...' })}
        </div>
      </Card>
    );
  }

  // 2) Handle error state
  if (error) {
    return (
      <Card
        variant="default"
        padding="md"
        className={className}
        role="region"
        aria-label={formatMessage({ id: 'campaignMetrics.error', defaultMessage: 'Error Displaying Campaign Metrics' })}
      >
        <div role="alert" aria-live="assertive">
          {formatMessage({ id: 'campaignMetrics.errorMessage', defaultMessage: 'Failed to load campaign metrics.' })}
        </div>
      </Card>
    );
  }

  // 3) Render main Card container with ARIA labels
  return (
    <Card
      variant="default"
      padding="md"
      className={className}
      role="region"
      aria-label={formatMessage({ id: 'campaignMetrics.title', defaultMessage: 'Campaign Metrics' })}
      tabIndex={0}
    >
      {/* 4) Display engagement metrics with precise formatting */}
      <header className="mb-4">
        <h2 className="text-xl font-semibold">
          {formatMessage({ id: 'campaignMetrics.header', defaultMessage: 'Campaign Engagement Metrics' })}
        </h2>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-describedby="campaign-metrics-desc">
        {/* Total Leads */}
        <div>
          <p className="text-sm font-medium">
            {formatMessage({ id: 'campaignMetrics.totalLeads', defaultMessage: 'Total Leads' })}
          </p>
          <p>
            {formatNumberWithType(metrics?.totalLeads ?? 0, 'integer')}
          </p>
        </div>

        {/* Emails Sent */}
        <div>
          <p className="text-sm font-medium">
            {formatMessage({ id: 'campaignMetrics.emailsSent', defaultMessage: 'Emails Sent' })}
          </p>
          <p>
            {formatNumberWithType(metrics?.emailsSent ?? 0, 'integer')}
          </p>
        </div>

        {/* Emails Opened + Open Rate */}
        <div>
          <p className="text-sm font-medium">
            {formatMessage({ id: 'campaignMetrics.emailsOpened', defaultMessage: 'Emails Opened' })}
          </p>
          <p className="flex flex-col">
            <span>
              {formatNumberWithType(metrics?.emailsOpened ?? 0, 'integer')}
            </span>
            <span className="text-xs text-gray-500">
              {formatMessage({
                id: 'campaignMetrics.openRate',
                defaultMessage: 'Open Rate: {value}%',
              }, {
                value: openRate.toFixed(2),
              })}
            </span>
          </p>
        </div>

        {/* Emails Clicked + Click Rate */}
        <div>
          <p className="text-sm font-medium">
            {formatMessage({ id: 'campaignMetrics.emailsClicked', defaultMessage: 'Emails Clicked' })}
          </p>
          <p className="flex flex-col">
            <span>
              {formatNumberWithType(metrics?.emailsClicked ?? 0, 'integer')}
            </span>
            <span className="text-xs text-gray-500">
              {formatMessage({
                id: 'campaignMetrics.clickRate',
                defaultMessage: 'Click Rate: {value}%',
              }, {
                value: clickRate.toFixed(2),
              })}
            </span>
          </p>
        </div>

        {/* Responses + Response Rate */}
        <div>
          <p className="text-sm font-medium">
            {formatMessage({ id: 'campaignMetrics.responses', defaultMessage: 'Responses' })}
          </p>
          <p className="flex flex-col">
            <span>
              {formatNumberWithType(metrics?.responses ?? 0, 'integer')}
            </span>
            <span className="text-xs text-gray-500">
              {formatMessage({
                id: 'campaignMetrics.responseRate',
                defaultMessage: 'Response Rate: {value}%',
              }, {
                value: responseRate.toFixed(2),
              })}
            </span>
          </p>
        </div>

        {/* Conversions + Conversion Rate */}
        <div>
          <p className="text-sm font-medium">
            {formatMessage({ id: 'campaignMetrics.conversions', defaultMessage: 'Conversions' })}
          </p>
          <p className="flex flex-col">
            <span>
              {formatNumberWithType(metrics?.conversions ?? 0, 'integer')}
            </span>
            <span className="text-xs text-gray-500">
              {formatMessage({
                id: 'campaignMetrics.conversionRate',
                defaultMessage: 'Conversion Rate: {value}%',
              }, {
                value: conversionRate.toFixed(2),
              })}
            </span>
          </p>
        </div>

        {/* Bounces + Bounce Rate */}
        <div>
          <p className="text-sm font-medium">
            {formatMessage({ id: 'campaignMetrics.bounces', defaultMessage: 'Bounces' })}
          </p>
          <p className="flex flex-col">
            <span>
              {formatNumberWithType(metrics?.bounces ?? 0, 'integer')}
            </span>
            <span className="text-xs text-gray-500">
              {formatMessage({
                id: 'campaignMetrics.bounceRate',
                defaultMessage: 'Bounce Rate: {value}%',
              }, {
                value: bounceRate.toFixed(2),
              })}
            </span>
          </p>
        </div>

        {/* Unsubscribes + Unsubscribe Rate */}
        <div>
          <p className="text-sm font-medium">
            {formatMessage({ id: 'campaignMetrics.unsubscribes', defaultMessage: 'Unsubscribes' })}
          </p>
          <p className="flex flex-col">
            <span>
              {formatNumberWithType(metrics?.unsubscribes ?? 0, 'integer')}
            </span>
            <span className="text-xs text-gray-500">
              {formatMessage({
                id: 'campaignMetrics.unsubscribeRate',
                defaultMessage: 'Unsubscribe Rate: {value}%',
              }, {
                value: unsubscribeRate.toFixed(2),
              })}
            </span>
          </p>
        </div>
      </section>

      {/* 7) + 8) The card wrapper is keyboard focusable and has an aria-label, fulfilling keyboard nav & screen reader usage */}
      <div id="campaign-metrics-desc" className="sr-only">
        {formatMessage({
          id: 'campaignMetrics.screenReaderDesc',
          defaultMessage: 'These metrics represent the performance and engagement rates for the selected campaign.',
        })}
      </div>
    </Card>
  );
});

export default CampaignMetrics;