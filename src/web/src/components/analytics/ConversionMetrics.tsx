/****************************************************************************************************
 * ConversionMetrics.tsx
 *
 * A React component that displays conversion rate metrics, their trends compared to a previous
 * period, progress toward a 40% improvement target, and various accessibility and performance
 * optimizations. Includes advanced error handling via an ErrorBoundary, loading states via MUI
 * Skeleton, tooltips for details, and responsive design best practices.
 *
 * Technical Specification Implementation Notes:
 * ---------------------------------------------------------------------------------------------------
 * 1) Utilizes the custom useAnalytics hook (src/web/src/hooks/useAnalytics.ts) to retrieve:
 *    - data: AnalyticsMetrics | null
 *    - loading: boolean (named isLoading in this component)
 *    - error: string | null
 *    - timeRange: TimeRange
 *    - trends: Record<string, TrendResult> (contains direction, change, and threshold boolean)
 *    - thresholds: Record<string, boolean>
 *
 * 2) Renders the conversion rate, compares it to the baseline from data.conversion.previousPeriod,
 *    and calculates progress toward a 40% improvement target (or a user-provided threshold).
 *
 * 3) Incorporates three helper functions per the JSON specification:
 *    a) formatPercentage(...) => Formats decimal [0..1] to a localized percentage string.
 *    b) getTrendIcon(...)    => Returns an animated trend icon (up, down, or minus).
 *    c) getTargetProgress(...) => Calculates how far (percentage) from a 40% improvement the
 *       current conversion rate is, returning status (ahead, behind, on-track).
 *
 * 4) Wraps core UI within an ErrorBoundary to catch unexpected rendering errors, displaying
 *    fallback content. Uses MUI Skeleton for loading placeholders.
 *
 * 5) Leverages the Card component (src/web/src/components/ui/Card.tsx) as a container with
 *    consistent styling. Adds tooltips for additional detail on trend changes using
 *    @radix-ui/react-tooltip.
 *
 * 6) Follows enterprise-grade coding standards, including:
 *    - Thorough inline comments.
 *    - Accessibility with ARIA attributes.
 *    - Responsive design via CSS utility classes.
 *    - Detailed error, success, and loading states.
 *
 * External Libraries (All with pinned versions in comments):
 * ---------------------------------------------------------------------------------------------------
 * import React from 'react'                             // ^18.2.0
 * import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid'  // ^2.0.18
 * import { motion } from 'framer-motion'                // ^10.0.0
 * import clsx from 'clsx'                               // ^2.0.0
 * import * as Tooltip from '@radix-ui/react-tooltip'     // ^1.0.0
 * import { Skeleton } from '@mui/material'              // ^5.0.0
 * import { ErrorBoundary } from 'react-error-boundary'   // ^4.0.0
 *
 * Internal Modules:
 * ---------------------------------------------------------------------------------------------------
 * import { useAnalytics } from '../../hooks/useAnalytics'
 * import Card from '../ui/Card'
 *
 * Export:
 * ---------------------------------------------------------------------------------------------------
 * export default ConversionMetrics (React.FC<ConversionMetricsProps>)
 ****************************************************************************************************/

import React, { memo, useMemo } from 'react' // ^18.2.0
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid' // ^2.0.18
import { motion } from 'framer-motion' // ^10.0.0
import clsx from 'clsx' // ^2.0.0
import * as Tooltip from '@radix-ui/react-tooltip' // ^1.0.0
import { Skeleton } from '@mui/material' // ^5.0.0
import { ErrorBoundary } from 'react-error-boundary' // ^4.0.0

// Internal imports
import { useAnalytics } from '../../hooks/useAnalytics'
import Card from '../ui/Card'

// The TrendIndicator enum is available in the analytics domain (TrendIndicator.UP, etc.);
// we replicate minimal references for clarity if needed. In an enterprise environment,
// this might come from a well-known shared location. Shown here for completeness only.
enum TrendIndicator {
  UP = 'UP',
  DOWN = 'DOWN',
  NEUTRAL = 'NEUTRAL',
}

/***************************************************************************************************
 * formatPercentage
 *
 * Description (from JSON spec):
 *  "Formats a decimal number as a percentage string with proper rounding and localization."
 *
 * Parameters:
 *  - value: number => The decimal value in [0..1]. e.g. 0.35 for 35%.
 *  - decimals: number => The number of decimal places to include in the final percentage.
 *
 * Returns: string => The resulting localized percentage string with a '%' suffix.
 *
 * Implementation Steps:
 *  1. Validate that 'value' is a number. If not, default to "0%".
 *  2. Multiply by 100 to convert decimal fraction to a percentage.
 *  3. Round to the specified decimal places. (use Number.toFixed or Intl)
 *  4. Format using Intl.NumberFormat for glimpses of localization (en-US fallback).
 *  5. Append '%' symbol to the result.
 **************************************************************************************************/
function formatPercentage(value: number, decimals: number): string {
  // Step 1: Fallback if the input is not a valid number
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%'
  }

  // Step 2: Convert the decimal fraction to a percentage
  const percentageValue = value * 100

  // Step 3: Round to the specified decimal places
  const rounded = Number(percentageValue.toFixed(decimals))

  // Step 4: Format using Intl.NumberFormat for locale-friendly grouping if desired
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const formattedNumber = formatter.format(rounded)

  // Step 5: Append '%' symbol
  return `${formattedNumber}%`
}

/***************************************************************************************************
 * getTrendIcon (memoized)
 *
 * Description (from JSON spec):
 *  "Returns the appropriate animated icon component based on trend direction."
 *
 * Parameters:
 *  - trend: TrendIndicator => The enumerated direction of the trend (UP, DOWN, NEUTRAL).
 *
 * Returns: JSX.Element => A small, animated Framer Motion wrapper containing the icon. Colors:
 *  - UP => green
 *  - DOWN => red
 *  - NEUTRAL => gray
 *
 * Implementation Steps:
 *  1. Switch on the TrendIndicator to determine which icon to render.
 *  2. Wrap the icon in a <motion.div> for subtle scale/opacity transitions.
 *  3. Apply color classes based on the direction (e.g., text-green-500).
 *  4. Return the animated icon element.
 **************************************************************************************************/
const getTrendIcon = memo(function getTrendIcon(trend: TrendIndicator): JSX.Element {
  // Step 1: Determine icon + color
  let IconComponent = MinusIcon
  let colorClass = 'text-gray-500'

  if (trend === TrendIndicator.UP) {
    IconComponent = ArrowUpIcon
    colorClass = 'text-green-600'
  } else if (trend === TrendIndicator.DOWN) {
    IconComponent = ArrowDownIcon
    colorClass = 'text-red-600'
  }

  // Step 2: Wrap icon in motion.div for simple entry animation
  return (
    <motion.div
      initial={{ scale: 0.75, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center"
      aria-hidden="true"
    >
      <IconComponent className={clsx('w-5 h-5', colorClass)} />
    </motion.div>
  )
})

/***************************************************************************************************
 * TargetProgress interface
 *
 * The JSON specification references returning "progress details including percentage and status."
 * We'll define an interface to represent that return type. The 'status' field can be:
 *  - 'ahead': indicates exceeding 40% improvement
 *  - 'behind': indicates negative improvement
 *  - 'on-track': indicates partial improvement in an acceptable range
 **************************************************************************************************/
interface TargetProgress {
  progress: number
  status: 'ahead' | 'behind' | 'on-track'
}

/***************************************************************************************************
 * getTargetProgress
 *
 * Description (from JSON spec):
 *  "Calculates progress towards 40% improvement target"
 *
 * Parameters:
 *  - currentRate: number => The current conversion rate (e.g. 0.35 for 35%).
 *  - baselineRate: number => The baseline or previous period's conversion rate.
 *
 * Returns: TargetProgress => { progress, status }
 *
 * Implementation Steps:
 *  1. If baselineRate <= 0, skip normal division & handle edge case (treat improvement as 100%?).
 *  2. Compute improvement = ((currentRate - baselineRate) / baselineRate) * 100
 *  3. Compare improvement to the 40% target:
 *     - If improvement < 0 => behind
 *     - If improvement >= 40 => ahead
 *     - Otherwise => on-track
 *  4. Return progress details object
 **************************************************************************************************/
function getTargetProgress(currentRate: number, baselineRate: number): TargetProgress {
  // Step 1: Edge case => if baseline is zero or negative
  if (baselineRate <= 0) {
    // If baselineRate is 0 and current is > 0, it can be a big jump, treat it as 100% or more
    return { progress: 100, status: 'ahead' }
  }

  // Step 2: Calculate improvement in percentage
  const improvement = ((currentRate - baselineRate) / baselineRate) * 100

  // Step 3: Compare to 40% target
  let status: 'ahead' | 'behind' | 'on-track' = 'on-track'
  if (improvement < 0) {
    status = 'behind'
  } else if (improvement >= 40) {
    status = 'ahead'
  }

  // Step 4: Return progress details
  return {
    progress: parseFloat(improvement.toFixed(2)),
    status,
  }
}

/***************************************************************************************************
 * ConversionMetricsProps interface
 *
 * Based on JSON specification:
 *  - "properties": [{ "className": "string" }, { "targetThreshold": "number" }]
 *  The component will accept an optional className to style the container, and
 *  a support for a custom improvement threshold if desired (defaults to 40).
 *  For completeness, we'll preserve the default as 40 in usage.
 **************************************************************************************************/
export interface ConversionMetricsProps {
  /**
   * Optional CSS className for the outer container of the component.
   */
  className?: string

  /**
   * A numeric threshold for target improvement (defaults to 40% if not provided).
   */
  targetThreshold?: number
}

/***************************************************************************************************
 * ConversionMetrics (memoized)
 *
 * Description:
 *  "Component that displays conversion rate metrics, trends, target progress with animations
 *   and accessibility features."
 *
 * Implementation Plan:
 *  1. Wrap the entire rendering logic in an <ErrorBoundary> to catch unhandled exceptions.
 *  2. Use the useAnalytics hook to gather analytics data (loading, error, data).
 *  3. Handle loading state via <Skeleton>.
 *  4. Handle error state by rendering a descriptive fallback.
 *  5. If data is present, extract currentRate, previousRate, trend, and compute improvement progress.
 *  6. Format the rates and improvement as percentages using formatPercentage.
 *  7. Obtain the appropriate trend icon with getTrendIcon(data.conversion.trend).
 *  8. Render the Card with tooltips that show context on hover (e.g., difference from last period).
 *  9. Provide ARIA attributes for screen readers describing the data.
 * 10. Respect optional className and custom targetThreshold (defaulting to 40).
 **************************************************************************************************/
const ConversionMetrics: React.FC<ConversionMetricsProps> = memo((props) => {
  /***********************************************************************************************
   * 1. Destructure props, set default for targetThreshold if none provided.
   **********************************************************************************************/
  const {
    className,
    targetThreshold = 40, // default if not specified
  } = props

  /***********************************************************************************************
   * 2. Access analytics state. We retrieve:
   *    - data (AnalyticsMetrics | null)
   *    - loading (boolean)
   *    - error (string | null)
   **********************************************************************************************/
  const {
    data,
    loading: isLoading,
    error,
  } = useAnalytics('MONTH') // example default timeRange

  /***********************************************************************************************
   * 3. Memoize extraction of relevant metrics. For demonstration, we just focus on conversion
   *    rates (current vs. previous) and a trend.
   *
   *    - If data is null, rates can default to 0.
   **********************************************************************************************/
  const currentRate: number = useMemo(() => {
    if (!data) return 0
    return data.conversion.rate
  }, [data])

  const previousRate: number = useMemo(() => {
    if (!data) return 0
    return data.conversion.previousPeriod
  }, [data])

  const currentTrend: TrendIndicator = useMemo(() => {
    if (!data) return TrendIndicator.NEUTRAL
    return data.conversion.trend
  }, [data])

  /***********************************************************************************************
   * 4. Prepare derived target progress info. We can override 40 with targetThreshold if desired.
   *
   *    We define a local function that compares the improvement result from getTargetProgress
   *    with the user-provided threshold rather than a baked-in 40%. If the user wants to track a
   *    50% target, we can apply logic accordingly. Here, we simply compute the improvement; we
   *    then see if it's above or below 'targetThreshold'.
   **********************************************************************************************/
  const targetProgress = useMemo(() => {
    const progressData = getTargetProgress(currentRate, previousRate)
    // If user-specified threshold is different from 40, we compare:
    let status: 'ahead' | 'behind' | 'on-track' = 'on-track'
    if (progressData.progress < 0) {
      status = 'behind'
    } else if (progressData.progress >= targetThreshold) {
      status = 'ahead'
    } else {
      status = 'on-track'
    }
    return {
      progress: progressData.progress,
      status,
    }
  }, [currentRate, previousRate, targetThreshold])

  /***********************************************************************************************
   * 5. Render function. We handle the UI states: loading, error, success. We'll do so inside
   *    the ErrorBoundary fallback to catch deeper exceptions.
   **********************************************************************************************/
  function renderContent(): JSX.Element {
    // Handle loading
    if (isLoading) {
      return (
        <Card className="my-4">
          <div className="flex flex-col gap-2">
            <div className="text-xl font-semibold text-gray-700">Conversion Metrics</div>
            <Skeleton variant="rectangular" width="100%" height={28} />
          </div>
        </Card>
      )
    }

    // Handle error
    if (error) {
      return (
        <Card className="my-4">
          <div
            role="alert"
            aria-live="assertive"
            className="text-red-600 text-sm font-medium"
          >
            Failed to load conversion metrics: {error}
          </div>
        </Card>
      )
    }

    // Handle success
    // If data is not null, we can confidently read from it
    if (data) {
      // Format both the current and previous conversion rates as percentages
      const currentRateStr = formatPercentage(currentRate, 1)
      const previousRateStr = formatPercentage(previousRate, 1)
      const trendIconEl = getTrendIcon(currentTrend)

      // Also highlight progress info
      const progressStr = `${targetProgress.progress.toFixed(1)}%` // improvement vs. baseline
      let progressColor = 'text-gray-500'
      if (targetProgress.status === 'ahead') progressColor = 'text-green-600'
      if (targetProgress.status === 'behind') progressColor = 'text-red-600'

      return (
        <Card className="my-4">
          <div className="flex flex-col gap-4" aria-label="Conversion Metrics">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">
                Conversion Rate
              </h2>
            </div>

            {/* Main display with current rate, trend icon, and previous comparison */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {/* Current Rate + Trend */}
              <div className="flex items-center space-x-2">
                <span
                  aria-label={`Current Conversion Rate is ${currentRateStr}`}
                  className="text-3xl font-bold text-slate-900"
                >
                  {currentRateStr}
                </span>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <span className="cursor-help" aria-hidden="true">
                      {trendIconEl}
                    </span>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="text-xs bg-black text-white px-2 py-1 rounded shadow-lg"
                      side="top"
                      sideOffset={4}
                    >
                      Trend compared to previous period.
                      <Tooltip.Arrow className="fill-black" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </div>

              {/* Previous Rate Comparison */}
              <div className="mt-2 sm:mt-0 flex items-center space-x-1 text-sm text-gray-600">
                <span>Previous:</span>
                <span className="font-medium">{previousRateStr}</span>
              </div>
            </div>

            {/* Improvement Progress vs. Target */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-row items-center gap-2">
                <span className="text-sm text-gray-500">Progress to Goal:</span>
                <span
                  className={clsx('text-sm font-medium', progressColor)}
                  aria-label={`Progress is ${progressStr}, status is ${targetProgress.status}`}
                >
                  {progressStr}
                </span>
              </div>
              <div className="mt-1 sm:mt-0 text-sm text-gray-500">
                Target: <span className="font-medium">{targetThreshold}%</span> improvement
              </div>
            </div>
          </div>
        </Card>
      )
    }

    // If no data, we show a subtle placeholder
    return (
      <Card className="my-4">
        <div className="text-sm text-gray-500">
          No conversion data available.
        </div>
      </Card>
    )
  }

  /***********************************************************************************************
   * 6. Return the entire content wrapped in an ErrorBoundary for robust error handling.
   **********************************************************************************************/
  return (
    <ErrorBoundary
      fallbackRender={({ error: boundaryError }) => (
        <Card className="my-4">
          <div className="text-red-600 text-sm font-medium" role="alert">
            A critical error occurred in ConversionMetrics. Please try again later.
            <div className="mt-2 text-xs break-words">
              {boundaryError?.message}
            </div>
          </div>
        </Card>
      )}
    >
      <section className={clsx('w-full', className)}>{renderContent()}</section>
    </ErrorBoundary>
  )
})

/***************************************************************************************************
 * Export
 *
 * The JSON specification indicates publishing this component as a default export with the name
 * "ConversionMetrics". The members_exposed: ConversionMetrics is of type React.FC<ConversionMetricsProps>.
 **************************************************************************************************/
export default ConversionMetrics