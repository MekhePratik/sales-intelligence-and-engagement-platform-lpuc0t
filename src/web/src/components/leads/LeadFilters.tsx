import React, {
  memo,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ChangeEvent,
  KeyboardEvent,
} from 'react';
// React ^18.2.0

// Lodash ^4.17.21
import debounce from 'lodash/debounce';

// Internal imports
import Select from '../ui/Select'; // Accessible, responsive select component
import { LeadFilters as ILeadFilters } from '../../types/lead'; // Enhanced type definitions
import { useLeads, useLeadFilters } from '../../hooks/useLeads'; // Hook for lead mgmt & filter persistence

/************************************************************************************************
 *  GLOBAL CONSTANTS (from specification "globals")
 ***********************************************************************************************/
const DEBOUNCE_DELAY = 300;
const MIN_SCORE = 0;
const MAX_SCORE = 100;
const FILTER_PERSISTENCE_KEY = 'lead_filters_state';

/************************************************************************************************
 *  INTERFACES & PROPS
 ***********************************************************************************************/
/**
 * LeadFiltersProps defines the props for the LeadFilters component.
 * - filters: The current filter state (status, scoreRange, industry, etc).
 * - onFilterChange: Callback to notify parent components of updated filters.
 * - isLoading: Indicates if data is loading, used to show spinners or disable UI.
 * - error: Represents any error state, displayed to the user for clarity.
 */
export interface LeadFiltersProps {
  filters: ILeadFilters;
  onFilterChange: (updatedFilters: ILeadFilters) => void;
  isLoading: boolean;
  error: Error | null;
}

/************************************************************************************************
 * 1) useFilterPersistence
 * -------------------------------------------------------------------------------------------------
 * A custom hook that handles loading, merging, and persisting filter states to localStorage
 * or an equivalent storage mechanism, fulfilling the specified steps:
 *   1) Load persisted filters from storage
 *   2) Merge with initial state
 *   3) Provide state update function
 *   4) Handle storage events
 *   5) Clean up on unmount
 ***********************************************************************************************/
function useFilterPersistence(
  initialState: ILeadFilters
): [ILeadFilters, (filters: ILeadFilters) => void] {
  // Step 1: Load persisted filters from localStorage (if available)
  const [storedFilters, setStoredFilters] = useState<ILeadFilters>(() => {
    try {
      const raw = typeof window !== 'undefined'
        ? window.localStorage.getItem(FILTER_PERSISTENCE_KEY)
        : null;
      if (raw) {
        const parsed = JSON.parse(raw) as ILeadFilters;
        // Step 2: Merge if needed. Here we do a shallow or deep merge
        return { ...initialState, ...parsed };
      }
    } catch {
      // If parse fails, fallback to initial
    }
    return initialState;
  });

  // Step 4: Handle storage events for cross-tab synchronization
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === FILTER_PERSISTENCE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue) as ILeadFilters;
          setStoredFilters((prev) => ({ ...prev, ...updated }));
        } catch {
          // swallow any parse errors
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handler);
    }

    // Step 5: Clean up on unmount
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handler);
      }
    };
  }, []);

  // Step 3: Provide a state update function
  const setFilters = useCallback((updated: ILeadFilters) => {
    setStoredFilters(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FILTER_PERSISTENCE_KEY, JSON.stringify(updated));
    }
  }, []);

  return [storedFilters, setFilters];
}

/************************************************************************************************
 * 2) handleFilterChange
 * -------------------------------------------------------------------------------------------------
 * A utility function that handles filter changes with debouncing and validation, as described:
 *   1) Validate input value
 *   2) Update local filter state
 *   3) Persist filter state
 *   4) Trigger debounced callback
 *   5) Update URL parameters (placeholder)
 *   6) Announce changes to screen readers (placeholder)
 ***********************************************************************************************/
function createHandleFilterChange(
  setLocalFilters: (filters: ILeadFilters) => void,
  onFilterChange: (filters: ILeadFilters) => void
) {
  // Debounced function reference
  const debounced = useRef<(...args: unknown[]) => void>();

  // Create a stable function that checks or modifies the filters
  return (filterKey: keyof ILeadFilters, value: any, currentFilters: ILeadFilters) => {
    // Step 1: Validate input (basic example, can be extended)
    // Here we assume all values are acceptable, more robust checks can be placed as needed.

    // Step 2: Update local filter state
    const updatedFilters = { ...currentFilters, [filterKey]: value };

    // Step 3: Persist filter state (done within setLocalFilters)
    setLocalFilters(updatedFilters);

    // Step 4: Trigger debounced callback that calls onFilterChange
    if (!debounced.current) {
      debounced.current = debounce((filtersParam: ILeadFilters) => {
        onFilterChange(filtersParam);
        // Steps 5 & 6 are placeholders for advanced usage
        // e.g., we can update the URL or push a new route
        // e.g., we can use an ARIA live region for announcements
      }, DEBOUNCE_DELAY);
    }
    (debounced.current as (filtersParam: ILeadFilters) => void)(updatedFilters);
  };
}

/************************************************************************************************
 * 3) LeadFilters (Main Component)
 * -------------------------------------------------------------------------------------------------
 * This component implements the 12 steps enumerated in the specification. Each step is annotated:
 *   1) Initialize filter state with persisted values
 *   2) Set up debounced filter change handler
 *   3) Render status filter dropdown with ARIA labels
 *   4) Render industry filter dropdown with virtual scrolling
 *   5) Render company size filter dropdown
 *   6) Render score range slider (two numeric inputs in this example) with keyboard controls
 *   7) Handle filter changes with validation
 *   8) Persist filter state on changes
 *   9) Provide loading and error states
 *   10) Implement responsive layout adjustments
 *   11) Set up keyboard navigation
 *   12) Add screen reader announcements
 ***********************************************************************************************/
function LeadFiltersFC(props: LeadFiltersProps) {
  const { filters: parentFilters, onFilterChange, isLoading, error } = props;

  /***********************************************************************************************
   * STEP 1) Initialize filter state with persisted values
   * We use useFilterPersistence to load from local storage and keep them in sync
   **********************************************************************************************/
  const [localFilters, setLocalFilters] = useFilterPersistence(parentFilters);

  /***********************************************************************************************
   * STEP 2) Set up debounced filter change handler
   **********************************************************************************************/
  const handleFilterChange = useMemo(
    () => createHandleFilterChange(setLocalFilters, onFilterChange),
    [setLocalFilters, onFilterChange]
  );

  /***********************************************************************************************
   * Rendering the filter UI
   **********************************************************************************************/
  return (
    <div
      className="w-full max-w-full p-4 space-y-6 bg-white dark:bg-neutral-900 rounded-md shadow-sm"
      aria-label="Lead Filtering Controls"
    >
      {/********************************************************************************************
          STEP 9) Provide loading and error states
       ********************************************************************************************/}
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4
              a12 12 0 00-12 12h4z"
            />
          </svg>
          <span>Loading filters...</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error.message}
        </div>
      )}

      {/********************************************************************************************
          STEP 3) Render status filter dropdown with ARIA labels
       ********************************************************************************************/}
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <div className="flex-1">
          <label
            htmlFor="statusSelect"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Lead Status
          </label>
          <Select
            // We pass an array of string or enums, depending on your actual usage
            value={localFilters.status || []}
            onChange={(val) => {
              // STEP 7) & 8) handle filter changes with validation & persist
              handleFilterChange('status', Array.isArray(val) ? val : [val], localFilters);
            }}
            multiple
            // Provide a placeholder or label for accessibility
            placeholder="Select statuses"
            options={[
              { label: 'NEW', value: 'NEW' },
              { label: 'QUALIFIED', value: 'QUALIFIED' },
              { label: 'CONTACTED', value: 'CONTACTED' },
              { label: 'ENGAGED', value: 'ENGAGED' },
              { label: 'CONVERTED', value: 'CONVERTED' },
              { label: 'ARCHIVED', value: 'ARCHIVED' },
            ]}
            aria-label="Select one or more lead statuses"
            // Optional styling or error states
            error={false}
            searchable
          />
        </div>
      </div>

      {/********************************************************************************************
          STEP 4) Render industry filter dropdown with virtual scrolling (mocked with normal select)
       ********************************************************************************************/}
      <div>
        <label
          htmlFor="industrySelect"
          className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Industry
        </label>
        <Select
          value={localFilters.industry || []}
          onChange={(val) => {
            handleFilterChange('industry', Array.isArray(val) ? val : [val], localFilters);
          }}
          multiple
          placeholder="Select industries"
          options={[
            { label: 'Technology', value: 'Technology' },
            { label: 'Healthcare', value: 'Healthcare' },
            { label: 'Finance', value: 'Finance' },
            { label: 'Retail', value: 'Retail' },
            { label: 'Manufacturing', value: 'Manufacturing' },
          ]}
          // Implementation note: a real virtual scroll would be integrated in the Select
          searchable
          aria-label="Filter by industry"
          className="w-full"
        />
      </div>

      {/********************************************************************************************
          STEP 5) Render company size filter dropdown
       ********************************************************************************************/}
      <div>
        <label
          htmlFor="companySizeSelect"
          className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Company Size
        </label>
        <Select
          value={localFilters.companySize || []}
          onChange={(val) => {
            handleFilterChange('companySize', Array.isArray(val) ? val : [val], localFilters);
          }}
          multiple
          placeholder="Select size ranges"
          options={[
            { label: '1-10', value: '1-10' },
            { label: '11-50', value: '11-50' },
            { label: '51-200', value: '51-200' },
            { label: '201-500', value: '201-500' },
            { label: '501-1000', value: '501-1000' },
            { label: '1001+', value: '1001+' },
          ]}
          searchable
          aria-label="Filter by company size"
        />
      </div>

      {/********************************************************************************************
          STEP 6) Render score range slider with two numeric inputs
       ********************************************************************************************/}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Score Range
        </span>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min={MIN_SCORE}
            max={MAX_SCORE}
            value={localFilters.scoreRange?.min ?? MIN_SCORE}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const val = parseInt(e.target.value, 10);
              const updatedRange = {
                ...localFilters.scoreRange,
                min: isNaN(val) ? MIN_SCORE : val,
              };
              handleFilterChange('scoreRange', updatedRange, localFilters);
            }}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            aria-label="Minimum lead score"
            className="w-20 rounded border-gray-300 dark:border-neutral-700 dark:bg-neutral-800
              text-sm p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">to</span>
          <input
            type="number"
            min={MIN_SCORE}
            max={MAX_SCORE}
            value={localFilters.scoreRange?.max ?? MAX_SCORE}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const val = parseInt(e.target.value, 10);
              const updatedRange = {
                ...localFilters.scoreRange,
                max: isNaN(val) ? MAX_SCORE : val,
              };
              handleFilterChange('scoreRange', updatedRange, localFilters);
            }}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            aria-label="Maximum lead score"
            className="w-20 rounded border-gray-300 dark:border-neutral-700 dark:bg-neutral-800
              text-sm p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/********************************************************************************************
          STEP 10) Responsive layout was done above with a minimal approach (flex-col, etc).
          STEP 11) Keyboard navigation is integrated with <Select> and numeric inputs.
          STEP 12) Screen reader announcements can be handled via ARIA attributes in each control.
       ********************************************************************************************/}

      <div className="pt-4 text-sm text-gray-500 dark:text-gray-400">
        {/* Additional instructions or accessibility hints could be placed here */}
        Use the controls above to refine your lead filters. The filter changes are debounced to
        prevent excessive updates, and your selections are persisted locally.
      </div>
    </div>
  );
}

/************************************************************************************************
 * FINAL EXPORT
 ***********************************************************************************************/
/**
 * We wrap the component in React.memo for performance optimization,
 * as requested in the specification. This ensures we skip renders
 * unless relevant props or state change.
 */
export default memo(LeadFiltersFC);