import React, {
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
  Fragment,
  CSSProperties
} from 'react' // ^18.2.0

/*
  External Imports (Chart Visualization and Utility)
*/
import {
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart
} from 'recharts' // ^2.7.0
import { cn } from 'class-variance-authority' // ^0.7.0

/*
  Internal Imports (Hooks and Types)
  - useAnalytics: custom hook returning { data, timeRange, setTimeRange, isLoading, trends, thresholds }
  - TimeRange, AnalyticsMetrics, MetricType: for typed definitions of analytics data
  - CHART_PERIODS: constants that define chart period groupings
*/
import { useAnalytics } from '../../hooks/useAnalytics'
import { TimeRange, AnalyticsMetrics, MetricType } from '../../types/analytics'
import { CHART_PERIODS } from '../../constants/metrics'

////////////////////////////////////////////////////////////////////////////////
// INTERFACES & TYPES
////////////////////////////////////////////////////////////////////////////////

/**
 * Props for the ChartTooltip component, which displays
 * enhanced tooltip information for a single chart data point.
 * 
 * @property payload     The data payload array provided by Recharts for the hovered item.
 * @property active      Boolean indicating whether the tooltip is currently active/shown.
 * @property label       The label associated with the hovered data point (e.g., date/time).
 * @property thresholds  An object mapping metric keys to boolean values indicating if threshold is met.
 */
interface ChartTooltipProps {
  payload?: any
  active?: boolean
  label?: string
  thresholds: Record<string, boolean>
}

/**
 * Enhanced custom tooltip component for the performance chart,
 * with trend indicators and threshold comparison.
 * 
 * Decorators:
 *  - React.memo ensures the component only re-renders as needed.
 * 
 * Implementation Steps:
 *  1. Check if tooltip is active and if a valid payload is present.
 *  2. Extract relevant metric info from the data payload.
 *  3. Determine if the current data point meets or exceeds thresholds.
 *  4. Apply appropriate styling based on threshold success/failure and trend direction.
 *  5. Render a richly formatted tooltip UI with metric values, trend arrows, and threshold labels.
 */
export const ChartTooltip = memo(function ChartTooltip({
  payload,
  active,
  label,
  thresholds
}: ChartTooltipProps) {
  // Guard clauses to ensure tooltip only displays valid data
  if (!active || !payload || !payload.length) {
    return null
  }

  // We expect the Recharts payload for a single data point:
  //  payload[0].payload has the custom fields from formatChartData().
  const dataPoint = payload[0].payload

  // Extract data we might have placed during formatting:
  //  metricValue - for the chart's primary metric
  //  difference - numeric difference from previous data point
  //  trendDirection - 'UP' | 'DOWN' | 'NEUTRAL'
  //  meetsThreshold - boolean indicating threshold success
  const {
    metricValue,
    difference,
    trendDirection,
    meetsThreshold,
    dateLabel
  } = dataPoint

  // Evaluate threshold from the "thresholds" prop, if we have a known key name:
  // For demonstration, we might check "thresholds['conversion.rate']" or a generic key
  // you could pass to the data points. This example uses meetsThreshold at the data point level.
  const thresholdMet = meetsThreshold

  // Compute a CSS class for the trend arrow or text color
  // Trend direction can be used for up/down arrow styling or color highlighting
  const trendClass = cn(
    'font-bold',
    trendDirection === 'UP' ? 'text-green-600' : '',
    trendDirection === 'DOWN' ? 'text-red-600' : '',
    trendDirection === 'NEUTRAL' ? 'text-gray-600' : ''
  )

  // A string or symbol for the arrow representation
  const arrowSymbol =
    trendDirection === 'UP'
      ? '↑'
      : trendDirection === 'DOWN'
      ? '↓'
      : '→'

  // Specific color or label for threshold
  const thresholdClass = thresholdMet ? 'text-green-600' : 'text-red-600'
  const thresholdLabel = thresholdMet ? 'Threshold Reached' : 'Below Threshold'

  // Render the final tooltip
  return (
    <div className="p-2 bg-white rounded shadow-lg border border-gray-200 max-w-xs">
      <div className="text-sm font-medium text-gray-800">
        {/* The label is typically the x-axis value, such as a date/time */}
        {dateLabel || label}
      </div>
      <div className="flex items-center mt-1">
        <span className={trendClass} style={{ marginRight: 8 }}>
          {arrowSymbol}
        </span>
        <span className="font-semibold text-gray-800 mr-2">Value:</span>
        <span className="text-gray-800">{metricValue}</span>
      </div>
      <div className="flex items-center mt-1">
        <span className="font-semibold text-gray-800 mr-2">Δ Diff:</span>
        <span className="text-gray-700">
          {difference > 0 ? `+${difference}` : `${difference}`}
        </span>
      </div>
      <div className="flex items-center mt-1">
        <span className="font-semibold text-gray-800 mr-2">Trend:</span>
        <span className={trendClass}>{trendDirection}</span>
      </div>
      <div className="flex items-center mt-1">
        <span className="font-semibold text-gray-800 mr-2">Threshold:</span>
        <span className={thresholdClass}>{thresholdLabel}</span>
      </div>
    </div>
  )
})

////////////////////////////////////////////////////////////////////////////////
// FORMAT CHART DATA
////////////////////////////////////////////////////////////////////////////////

/**
 * formatChartData
 * 
 * Enhanced data formatting utility with trend calculation and threshold comparison.
 * 
 * @param data         The full AnalyticsMetrics object from the analytics hook.
 * @param metricType   The type of metric we plan to chart (e.g., MetricType.CAMPAIGNS, etc.).
 * @param thresholds   A record of boolean or numeric thresholds from the parent context (unused here if we rely on separate logic).
 * 
 * Returns an array of data points for Recharts, each containing:
 *   - dateLabel: string or Date representation
 *   - metricValue: number
 *   - difference: number difference from the previous data point
 *   - trendDirection: 'UP' | 'DOWN' | 'NEUTRAL'
 *   - meetsThreshold: boolean indicating if threshold is met
 *   - any additional fields required for custom tooltips
 * 
 * Implementation Steps:
 *  1. Extract & validate the relevant metric(s) from "data" based on "metricType".
 *  2. Calculate any trends or growth percentages across consecutive points.
 *  3. Compare values against thresholds if applicable.
 *  4. Transform data to a Recharts-compatible format with x-axis labels and numeric values.
 *  5. Add timestamps or date labels for the x-axis, possibly simulating timeseries.
 *  6. Sort data points chronologically if needed.
 *  7. Apply optional data aggregation for large data sets.
 */
export function formatChartData(
  data: AnalyticsMetrics | null,
  metricType: MetricType,
  thresholds: Record<string, boolean>
): Array<{
  dateLabel: string
  metricValue: number
  difference: number
  trendDirection: 'UP' | 'DOWN' | 'NEUTRAL'
  meetsThreshold: boolean
}> {
  if (!data) {
    return []
  }

  // For demonstration, we create a small array of timeseries points
  // representing 5 intervals. In a real system, you'd fetch timeseries.
  // We'll pick a single metric field to visualize based on metricType.
  // We'll treat each data point as if it advanced in time (day by day, etc.).
  const now = new Date()
  const labelPrefix = metricType.toString().toLowerCase()

  // 1. Determine the base numeric metric from "data" to anchor visual.
  let baseValue = 0
  switch (metricType) {
    case MetricType.CAMPAIGNS:
      baseValue = data.campaigns.openRate
      break
    case MetricType.CONVERSION:
      baseValue = data.conversion.rate
      break
    case MetricType.ENGAGEMENT:
      // For demonstration, use clickRate
      baseValue = data.campaigns.clickRate
      break
    case MetricType.LEADS:
      // We'll interpret averageScore
      baseValue = data.leads.averageScore
      break
    case MetricType.PERFORMANCE:
      // Arbitrary example: we can use conversion + campaigns
      baseValue = data.conversion.rate + data.campaigns.openRate
      break
    case MetricType.ROI:
      // No direct field in AnalyticsMetrics but we can treat 'conversion.rate * 2' for example
      baseValue = data.conversion.rate * 2
      break
    case MetricType.TIME_SAVINGS:
      // Placeholder, not directly in AnalyticsMetrics. We'll do 60 for demonstration
      baseValue = 60
      break
    case MetricType.USER_ADOPTION:
      // Another placeholder, we can interpret from data. We'll do 80 from the success criteria
      baseValue = 80
      break
    default:
      // Fallback if no recognized type
      baseValue = 0
      break
  }

  // 2. We'll build 5 data points around the chosen base value, injecting mild variance.
  //    We'll also incorporate a naive trend calculation from consecutive data points.
  const points: Array<{
    dateLabel: string
    metricValue: number
    difference: number
    trendDirection: 'UP' | 'DOWN' | 'NEUTRAL'
    meetsThreshold: boolean
  }> = []

  let previousValue = baseValue - 2
  for (let i = 0; i < 5; i++) {
    const dateObj = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const simulatedValue = previousValue + Math.round(Math.random() * 4 - 2)
    const difference = simulatedValue - previousValue
    let trendDirection: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL'
    if (difference > 0) {
      trendDirection = 'UP'
    } else if (difference < 0) {
      trendDirection = 'DOWN'
    }

    // 3. Compare the current data point vs threshold. For demonstration,
    // we treat all thresholds in 'thresholds' as a single dimension or pick a key.
    // We will guess a typical key: e.g. 'conversion.rate' or 'leads.averageScore'.
    // Because they are booleans, we will pick a single field from the hook if we had it.
    // We'll just pick the first available property if any exist.
    const meetsThreshold =
      Object.keys(thresholds).length > 0
        ? thresholds[Object.keys(thresholds)[0]]
        : false

    // 4. Construct each data point
    points.push({
      dateLabel: `${labelPrefix}-${dateObj.toLocaleDateString()}`,
      metricValue: simulatedValue,
      difference,
      trendDirection,
      meetsThreshold
    })
    previousValue = simulatedValue
  }

  // 5. Sort the points in ascending chronological order (oldest first).
  //    At the moment, we generated them in descending time, so reverse.
  points.reverse()

  // 6. (Data Aggregation Step) - In a real scenario, if large data sets exist,
  //    we'd do grouping or binning by intervals. For demonstration, skip.

  // 7. Return the final array consistent with Recharts data shape.
  return points
}

////////////////////////////////////////////////////////////////////////////////
// PERFORMANCE CHART COMPONENT
////////////////////////////////////////////////////////////////////////////////

/**
 * Props for the PerformanceChart component, capturing:
 *  - metricType: A MetricType representing which metric to visualize
 *  - title:      A display title for the chart
 *  - showLegend: Boolean controlling whether to show the Recharts legend
 *  - thresholds: An object that can be used to display threshold status in the chart or tooltip
 */
export interface PerformanceChartProps {
  metricType: MetricType
  title: string
  showLegend: boolean
  thresholds: Record<string, boolean>
}

/**
 * Main performance chart component with enhanced features and optimizations.
 * 
 * Decorators:
 *  - React.memo for performance benefits in an enterprise-grade environment.
 * 
 * Implementation Steps:
 *  1. Initialize analytics hook with memoized callbacks for fetching data.
 *  2. Process and format chart data with trend calculation via formatChartData.
 *  3. Set up chart configuration including axes, grid, lines, and optional legend.
 *  4. Implement error boundary and loading states (in real usage, a try/catch boundary or parent error boundary).
 *  5. Render the responsive chart with accessibility features and Recharts Tooltip.
 *  6. Include an enhanced tooltip (ChartTooltip) that compares threshold and trend statuses.
 *  7. Provide optional user controls for selecting time range or toggling chart intervals.
 *  8. Add threshold visualization or highlight if needed (e.g., reference lines).
 */
export const PerformanceChart = memo(function PerformanceChart({
  metricType,
  title,
  showLegend,
  thresholds
}: PerformanceChartProps) {
  /**
   * 1. Initialize analytics hook. For demonstration, we use a fixed time range 'MONTH'
   *    but in a real scenario, this could be passed as a prop or managed via local state.
   */
  const {
    data,
    isLoading,
    timeRange,
    setTimeRange,
    error
  } = useAnalytics('MONTH')

  /**
   * 2. Process formatChartData in a memoized manner to avoid unnecessary recalculations
   */
  const chartData = useMemo(() => {
    return formatChartData(data, metricType, thresholds)
  }, [data, metricType, thresholds])

  /**
   * 3. Prepare a function for handling user time range changes if you wish
   *    to offer a UI-based approach. For demonstration, we'll have a simple
   *    selection that calls setTimeRange.
   */
  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      setTimeRange(range)
    },
    [setTimeRange]
  )

  /**
   * 4. Loading and error states can be handled here. You might show a spinner or an
   *    alert message if there's a network or server error. For exhaustive coverage,
   *    we show these states extensively in an enterprise-ready approach.
   */
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-4">
        <p className="text-gray-500 text-sm">Loading chart data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-4">
        <p className="text-red-600 text-sm">
          Error loading analytics data: {error}
        </p>
      </div>
    )
  }

  /**
   * 5. If there's no data or the chartData array is empty, show a fallback.
   */
  if (!data || chartData.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No {metricType.toLowerCase()} data available for this timeframe.
      </div>
    )
  }

  /**
   * 6. Render the chart using Recharts. The <ResponsiveContainer> automatically
   *    adjusts to the parent container's width/height, making the chart fully responsive.
   */
  return (
    <div className="w-full h-80 flex flex-col">
      {/* Title */}
      <div className="flex items-center justify-between p-2 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {/* Example: simple time range toggler, cycling through a few TimeRange options */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleTimeRangeChange('WEEK')}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs"
          >
            WEEK
          </button>
          <button
            type="button"
            onClick={() => handleTimeRangeChange('MONTH')}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs"
          >
            MONTH
          </button>
          <button
            type="button"
            onClick={() => handleTimeRangeChange('QUARTER')}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs"
          >
            QUARTER
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            {/* 7. Cartesian axes, grid, and optional legend */}
            <XAxis
              dataKey="dateLabel"
              stroke="#475569"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              stroke="#475569"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

            {showLegend && <Legend verticalAlign="top" height={30} />}

            {/* 8. Enhanced Tooltip with threshold and trend indicators */}
            <RechartsTooltip
              content={
                <ChartTooltip
                  thresholds={thresholds}
                />
              }
            />

            {/* Single line representing the metricValue. Stroke color can be dynamic. */}
            <Line
              type="monotone"
              dataKey="metricValue"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name={metricType.toString()}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})