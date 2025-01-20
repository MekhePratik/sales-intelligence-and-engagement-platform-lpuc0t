/**
 * Redux Toolkit slice for managing analytics state, metrics, and data fetching
 * in the web application with enhanced caching, error handling, and type safety.
 *
 * This slice addresses:
 * 1. Core Features (Analytics): Campaign performance tracking, conversion analytics,
 *    and ROI calculation.
 * 2. Success Criteria Tracking: KPIs including user adoption, lead quality,
 *    time savings, and ROI.
 *
 * Implementation Details:
 * - Maintains an "AnalyticsState" interface with data, error, loading status,
 *   active time range, request ID, and a cache for fetched analytics results.
 * - Provides a createAsyncThunk ("fetchAnalytics") to fetch analytics data from
 *   the API, leveraging local state cache to avoid redundant network requests.
 * - Handles request deduplication by conditionally preventing parallel fetch
 *   actions for the same time range.
 * - Incorporates robust error handling and updates "error" state upon failures.
 * - Exports a selector ("selectAnalytics") to allow granular data access by
 *   parsing a metric path from the analytics state.
 *
 * External Dependencies:
 *   - @reduxjs/toolkit ^2.0.0
 *   - axios (provided by the imported API client)
 *
 * Internal Imports:
 *   - api (AxiosInstance) from ../lib/api
 *   - { AnalyticsMetrics, TimeRange } from ../types/analytics
 *   - { TIME_RANGES, METRIC_THRESHOLDS } from ../constants/metrics
 *   - Redux store root state for typed selectors (if available)
 *
 * All functions are extensively documented for enterprise-grade maintainability.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit' // ^2.0.0
import type { PayloadAction } from '@reduxjs/toolkit'

import type { AnalyticsMetrics, TimeRange } from '../types/analytics'
import api from '../lib/api' // AxiosInstance with advanced interceptors
import { TIME_RANGES, METRIC_THRESHOLDS } from '../constants/metrics'

/**
 * Defines the structure for this slice's error state
 * to ensure consistent tracking of error details.
 */
interface AnalyticsError {
  code: string | null
  message: string | null
}

/**
 * Defines the structure for an individual cache entry in our redux store,
 * mapping each TimeRange to a record containing the fetched analytics data
 * and a timestamp for expiration checks.
 */
interface AnalyticsCacheEntry {
  data: AnalyticsMetrics
  timestamp: number
}

/**
 * Defines the shape of our analytics state object, including:
 * - data: The last successfully fetched AnalyticsMetrics or null
 * - loading: Boolean indicating an active network request
 * - error: AnalyticsError object (code, message)
 * - timeRange: Current active time range in uppercase form (e.g., 'MONTH')
 * - requestId: Tracks the unique request ID for concurrency or dedup checks
 * - cache: A lookup table storing data for various time ranges
 */
interface AnalyticsState {
  data: AnalyticsMetrics | null
  loading: boolean
  error: AnalyticsError
  timeRange: TimeRange
  requestId: string | null
  cache: {
    [key in TimeRange]?: AnalyticsCacheEntry
  }
}

/**
 * Initial state for the analytics slice. Defaults to:
 * - data: null
 * - loading: false
 * - error: { code: null, message: null }
 * - timeRange: 'MONTH' (aligns with success criteria to highlight monthly analysis)
 * - requestId: null
 * - cache: empty object for storing fetched analytics by time range
 */
const initialState: AnalyticsState = {
  data: null,
  loading: false,
  error: { code: null, message: null },
  timeRange: 'MONTH', // Using 'MONTH' to align with the TimeRange union
  requestId: null,
  cache: {},
}

/**
 * fetchAnalytics: An async thunk for retrieving analytics data, including:
 * 1. Checking locally cached data for the specified time range.
 * 2. Returning cached data if still valid.
 * 3. Checking for an existing in-flight request for the same time range.
 * 4. Making the API call if needed and transforming the response.
 * 5. Updating the redux slice cache upon success.
 * 6. Handling errors with detailed error states.
 * 7. Returning the final AnalyticsMetrics object on success.
 */
export const fetchAnalytics = createAsyncThunk<
  AnalyticsMetrics,
  { timeRange: TimeRange },
  {
    rejectValue: {
      code: string
      message: string
    }
  }
>(
  'analytics/fetchAnalytics',
  async (args, thunkAPI) => {
    const { timeRange } = args
    const { getState, requestId, signal, rejectWithValue } = thunkAPI
    const state = getState() as { analytics: AnalyticsState }

    try {
      // 1) Check cache validity and return cached data if present and fresh
      const cachedEntry = state.analytics.cache[timeRange]
      if (cachedEntry) {
        // Here you could implement an expiration mechanism or time-based check
        // For demonstration, we assume any cachedEntry is valid until we decide otherwise
        return cachedEntry.data
      }

      // 2) Deduplicate requests by comparing the current requestId with the stored requestId
      // If a request for the same time range is in flight, we can optionally cancel or skip
      if (state.analytics.requestId && state.analytics.requestId === requestId) {
        // If the slice is already tracking the same request, skip or return
        // We'll just return the last known data or a placeholder
        if (state.analytics.data) {
          return state.analytics.data
        }
      }

      // 3) Make the actual API call to fetch analytics data
      // This is an example endpoint. Adjust as needed for your backend.
      const response = await api.get<AnalyticsMetrics>('/analytics', {
        params: {
          // The TimeRange is uppercase in code, but you might pass
          // a corresponding string to the backend. Adjust as needed.
          timeRange: timeRange,
        },
        signal: signal, // Allows cancellation if the thunk is aborted
      })

      const analyticsData = response.data

      // 4) You can transform the data here if needed to match local shape
      // For now, we assume the response matches AnalyticsMetrics directly.

      // 5) Return the AnalyticsMetrics so it updates the store
      return analyticsData
    } catch (error: any) {
      // 6) Capture and return a structured error to be handled by the extraReducer
      return rejectWithValue({
        code: error.code ?? 'FETCH_ERROR',
        message: error.message ?? 'Failed to fetch analytics data.',
      })
    }
  },
  {
    // Optional condition callback to run before the payloadCreator
    // This can help skip dispatch if a fetch is already ongoing for that time range.
    condition: (args, { getState }) => {
      const state = getState() as { analytics: AnalyticsState }

      // If we are already loading data, we skip a new request for the same time range.
      if (state.analytics.loading && state.analytics.timeRange === args.timeRange) {
        return false
      }
      return true
    },
  }
)

/**
 * selectAnalytics: A selector function for accessing analytics data with
 * optional metric path drilling. Supports scenarios like extracting:
 * - "leads.total"
 * - "campaigns.openRate"
 * - "conversion.trend"
 * etc.
 *
 * @param state      The Redux root state containing analytics slice
 * @param metricPath A dot-separated string path specifying what metric to extract
 * @returns          The requested metric value or null if not found/available
 */
export function selectAnalytics(
  state: any,
  metricPath: string
): any {
  // 1) Access root analytics slice data
  const analyticsData = state?.analytics?.data
  if (!analyticsData) {
    return null
  }

  // 2) If no metricPath is provided, return entire data
  if (!metricPath) {
    return analyticsData
  }

  // 3) Parse the path and traverse the object
  const parts = metricPath.split('.')
  let result: any = analyticsData

  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = result[part]
    } else {
      // 4) If at any point the path is invalid, return null
      return null
    }
  }

  // 5) Return the final resolved metric or null if anything was missing
  return result
}

/**
 * analyticsSlice:
 * The main Redux slice for analytics state management, providing:
 *  - initialState
 *  - reducers (for local state updates such as changing timeRange)
 *  - extraReducers (to handle asyncThunk actions like fetchAnalytics)
 */
export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    /**
     * setTimeRange: updates the active timeRange in state.
     * This allows the UI to change the period without immediately refetching data.
     */
    setTimeRange(state, action: PayloadAction<TimeRange>) {
      state.timeRange = action.payload
    },
  },
  extraReducers: (builder) => {
    // Handle the pending state of the fetchAnalytics thunk
    builder.addCase(fetchAnalytics.pending, (state, action) => {
      state.loading = true
      state.error = { code: null, message: null }
      // Track the requestId so we can identify future concurrency
      state.requestId = action.meta.requestId
    })

    // Handle a successful fetch
    builder.addCase(fetchAnalytics.fulfilled, (state, action) => {
      state.loading = false
      state.error = { code: null, message: null }
      state.data = action.payload
      state.requestId = null

      // Update cache with newly fetched data keyed by the specified timeRange
      const argRange = action.meta.arg.timeRange
      state.cache[argRange] = {
        data: action.payload,
        timestamp: Date.now(),
      }
    })

    // Handle a rejected fetch
    builder.addCase(fetchAnalytics.rejected, (state, action) => {
      state.loading = false
      state.requestId = null
      // If rejectWithValue was called, we can use it here
      if (action.payload) {
        state.error = {
          code: action.payload.code,
          message: action.payload.message,
        }
      } else {
        state.error = {
          code: 'UNKNOWN_ERROR',
          message: action.error.message || 'An unknown error occurred.',
        }
      }
    })
  },
})

/**
 * Exports:
 * - The reducer as the default export for usage in store configuration.
 * - Slice actions for local state modifications, e.g., setTimeRange.
 * - The fetchAnalytics thunk for dispatching asynchronous fetch requests.
 * - The selectAnalytics selector for fine-grained data selection.
 */
export default analyticsSlice.reducer
export const { setTimeRange } = analyticsSlice.actions
export { fetchAnalytics, selectAnalytics }