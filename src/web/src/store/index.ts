/**
 * Root Redux store configuration file that combines all feature slices and configures
 * the global store with middleware, performance monitoring, caching, and enhanced type safety.
 *
 * This file implements the following requirements based on the technical specification:
 *
 * 1. State Management:
 *    - Centralized Redux store for leads, campaigns, analytics, and authentication slices.
 *    - Enhanced middleware pipeline for advanced performance monitoring and caching.
 *
 * 2. Performance Optimization:
 *    - Client-side caching strategies for Redux actions and selectors.
 *    - Example placeholders for performance monitoring middleware.
 *    - Normalized state shape via slice reducers and strict serializable checks.
 *
 * 3. Type Safety:
 *    - Strict TypeScript checks enforced across interfaces and store setup.
 *    - Comprehensive type definitions for RootState, AppDispatch, and custom hooks.
 */

////////////////////////////////////////////////////////////////////////////////
// External Imports (with version information)
////////////////////////////////////////////////////////////////////////////////
import { configureStore, Middleware, MiddlewareAPI, Dispatch, AnyAction } from '@reduxjs/toolkit' // version ^2.0.0
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux' // version ^9.0.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports: Redux Slice Reducers
// Importing reducers from the local feature slices with typed definitions.
////////////////////////////////////////////////////////////////////////////////
import { reducer as authReducer } from './authSlice'
import { reducer as campaignReducer } from './campaignSlice'
import { reducer as leadReducer } from './leadSlice'
import { reducer as analyticsReducer } from './analyticsSlice'

////////////////////////////////////////////////////////////////////////////////
// Interface: RootState
// Type definition for the complete Redux store state with strict null checks.
////////////////////////////////////////////////////////////////////////////////
export interface RootState {
  /**
   * Authentication slice state.
   * Matches the return type of our auth slice reducer.
   */
  auth: ReturnType<typeof authReducer>;

  /**
   * Campaign slice state.
   * Matches the return type of our campaign slice reducer.
   */
  campaigns: ReturnType<typeof campaignReducer>;

  /**
   * Lead slice state.
   * Matches the return type of our lead slice reducer.
   */
  leads: ReturnType<typeof leadReducer>;

  /**
   * Analytics slice state.
   * Matches the return type of our analytics slice reducer.
   */
  analytics: ReturnType<typeof analyticsReducer>;
}

////////////////////////////////////////////////////////////////////////////////
// Type: AppDispatch
// Defines the store's dispatch function type with action inference.
////////////////////////////////////////////////////////////////////////////////
/**
 * We will declare AppDispatch after we create our store so that
 * it references the actual store.dispatch function.
 *
 * Due to TypeScript ordering, we declare the type after the store
 * is instantiated to ensure correct inference.
 */
export type AppDispatch = typeof store.dispatch; // declared below

////////////////////////////////////////////////////////////////////////////////
// Middleware Placeholders
// Demonstrating placeholders for performance monitoring, caching, and error tracking.
// In a production environment, each of these would be replaced with real logic.
////////////////////////////////////////////////////////////////////////////////

/**
 * Example performance monitoring middleware for measuring action durations,
 * logging performance metrics, or integrating with external monitoring services.
 */
const performanceMonitoringMiddleware: Middleware = (api: MiddlewareAPI) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
  // Start a timer or performance measurement
  const startTime = performance.now();

  // Pass the action down the chain
  const result = next(action);

  // End the timer and log or store the duration
  const endTime = performance.now();
  const duration = endTime - startTime;

  // Example: Logging for demonstration
  // In production, this might integrate with analytics or monitoring dashboards
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[Performance] Action "${action.type}" took ${duration.toFixed(2)} ms.`);
  }

  return result;
};

/**
 * Example cache management middleware for intercepting actions that can be cached
 * and returning data from a local or session cache if available. In real scenarios,
 * we would detect specific action types or payloads here.
 */
const cacheManagementMiddleware: Middleware = (api: MiddlewareAPI) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
  // Potentially check action type or meta for caching instructions
  // This is a placeholder; real logic might do time-based or data-based caching
  return next(action);
};

/**
 * Example error tracking middleware for catching errors from reducers or unhandled
 * promise rejections in thunks, then forwarding them to an external logging or
 * alert system (e.g., Sentry, Datadog, etc.).
 */
const errorTrackingMiddleware: Middleware = (api: MiddlewareAPI) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
  try {
    return next(action);
  } catch (error) {
    // In production, we'd send error details to a monitoring service
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[Error Tracking] Caught an error in Redux middleware:', error);
    }
    // Rethrow or handle gracefully as needed
    throw error;
  }
};

////////////////////////////////////////////////////////////////////////////////
// Function: makeStore
// Creates and configures the Redux store with enhanced middleware, monitoring,
// caching, error tracking, and all feature slice reducers.
////////////////////////////////////////////////////////////////////////////////
/**
 * Steps from the specification:
 * 1. Configure store with combined reducers and strict type checking.
 * 2. Add Redux Toolkit default middleware with serialization checks.
 * 3. Add performance monitoring middleware.
 * 4. Add cache management middleware.
 * 5. Add error tracking middleware.
 * 6. Enable Redux DevTools in development with detailed configuration.
 * 7. Configure state persistence and rehydration (placeholder).
 * 8. Return configured store instance with all enhancements.
 */
export function makeStore() {
  // Combine the feature slice reducers under their respective keys
  // based on the JSON specification naming requirements.
  const rootReducer = {
    auth: authReducer,
    campaigns: campaignReducer,
    leads: leadReducer,
    analytics: analyticsReducer,
  };

  // Create the Redux store with configureStore from Redux Toolkit
  const store = configureStore({
    reducer: rootReducer,

    // 2) Add Redux Toolkit default middleware with strict serializable checks
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Strictly check for serializable data in actions and state
        serializableCheck: true,
      })
        // 3) Performance monitoring
        .concat(performanceMonitoringMiddleware)
        // 4) Cache management
        .concat(cacheManagementMiddleware)
        // 5) Error tracking
        .concat(errorTrackingMiddleware),

    // 6) Enable Redux DevTools in non-production builds
    devTools: process.env.NODE_ENV !== 'production',
  });

  // 7) State persistence and rehydration placeholder:
  // In a real application, we might configure redux-persist or another library here.

  // 8) Return the store with all enhancements
  return store;
}

////////////////////////////////////////////////////////////////////////////////
// Global Store Instance
// We instantiate the store so we can export it for the application usage.
////////////////////////////////////////////////////////////////////////////////
/**
 * The configured Redux store instance with all slices and
 * enhanced middlewares we declared above.
 */
export const store = makeStore();

////////////////////////////////////////////////////////////////////////////////
// Re-declare AppDispatch to reference "store.dispatch"
////////////////////////////////////////////////////////////////////////////////
export type { AppDispatch };

////////////////////////////////////////////////////////////////////////////////
// useAppDispatch / useAppSelector
// Type-safe hooks for dispatching actions and selecting state in React components.
////////////////////////////////////////////////////////////////////////////////

/**
 * useAppDispatch:
 * Returns a typed dispatch function for dispatching actions in classless components.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * useAppSelector:
 * Returns a typed selector function with strict typing of the Redux store state.
 * It guards against usage of incorrect slice names or property paths.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;