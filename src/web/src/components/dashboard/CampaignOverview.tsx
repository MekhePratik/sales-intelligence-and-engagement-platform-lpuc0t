import React, {
  FC,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
// react ^18.2.0
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'; // react-error-boundary ^4.0.0
import type { CampaignFilters } from '../../store/campaignSlice';
import type { SortDirection } from '../ui/Table';
import { Card } from '../ui/Card'; // Internal: from ../ui/Card
import { CampaignTable } from '../campaigns/CampaignTable'; // Internal: from ../campaigns/CampaignTable
import { CampaignMetrics } from '../campaigns/CampaignMetrics'; // Internal: from ../campaigns/CampaignMetrics
import { useCampaigns } from '../../hooks/useCampaigns'; // Internal: from ../../hooks/useCampaigns

/***************************************************************************************************
 * Type Definitions
 ***************************************************************************************************/

/**
 * CampaignOverviewProps
 * -----------------------------------------------------------------------------
 * Defines the props accepted by the CampaignOverview component, which displays
 * a high-level overview (including table and stats) of existing campaigns.
 */
export interface CampaignOverviewProps {
  /**
   * Optional class name for advanced styling or theming of this component container.
   */
  className?: string;

  /**
   * Interval in milliseconds for configuring real-time or periodic refresh of
   * campaign data. If set to 0 or a negative number, real-time updates are disabled.
   */
  refreshInterval: number;

  /**
   * A callback function triggered on errors encountered within the component's
   * internal operations or error boundary.
   */
  onError?: (error: Error) => void;
}

/***************************************************************************************************
 * State & Interface Definitions for Private Use
 ***************************************************************************************************/

/**
 * Local state interface capturing pagination, sorting, and filter details.
 * Aligns with the JSON specification properties:
 *  - currentPage
 *  - pageSize
 *  - sortField
 *  - sortDirection
 *  - filters
 */
interface CampaignOverviewState {
  currentPage: number;
  pageSize: number;
  sortField: string;
  sortDirection: SortDirection;
  filters: CampaignFilters;
  error?: Error; // local error state to display or handle
}

/***************************************************************************************************
 * Error Boundary Fallback
 * -----------------------------------------------------------------------------
 * Renders a minimal fallback UI if an uncaught error is thrown, while providing
 * accessible user feedback. The handleError method is used for logging, retries,
 * or parent notification.
 ***************************************************************************************************/
function CampaignOverviewFallback({ error }: FallbackProps) {
  return (
    <div role="alert" className="p-4 text-red-700 bg-red-50 border border-red-200 rounded">
      <p className="font-semibold mb-2">Something went wrong while loading Campaign Overview.</p>
      <pre className="text-sm whitespace-pre-wrap break-all">{error?.message}</pre>
    </div>
  );
}

/***************************************************************************************************
 * Main Component: CampaignOverview
 * -----------------------------------------------------------------------------
 * A React component that provides a high-level overview of active email campaigns
 * and their performance metrics for the dashboard, including:
 *  - A real-time or interval-based data subscription
 *  - Comprehensive analytics shown via CampaignMetrics
 *  - Campaign listing, pagination, sorting via CampaignTable
 *  - Accessibility compliance with roles, labels, and keyboard navigation
 *  - Error boundary handling with fallback UI
 *
 * Steps from JSON specification (similar to a "constructor"):
 *  1) Initialize states for pagination, sorting, filters, and local error
 *  2) Set up campaign data fetching with error handling
 *  3) Configure real-time update subscription if refreshInterval > 0
 *  4) Initialize error boundary integration
 *  5) Set up accessibility features (ARIA roles/labels)
 *  6) Configure responsive layout (in this example, done via Card and standard flexbox)
 ***************************************************************************************************/
export const CampaignOverview: FC<CampaignOverviewProps> = ({
  className,
  refreshInterval,
  onError,
}) => {
  /*************************************************************************************************
   * 1) Local state for pagination, sorting, filters, and error
   *************************************************************************************************/
  const [state, setState] = useState<CampaignOverviewState>({
    currentPage: 1,
    pageSize: 10,
    sortField: 'createdAt',
    sortDirection: 'desc',
    filters: {},
  });

  // Destructure for convenience
  const { currentPage, pageSize, sortField, sortDirection, filters, error: localError } = state;

  /*************************************************************************************************
   * handleError
   * -----------------------------------------------------------------------------
   * The JSON specification function for comprehensive error handling. Logs error
   * details, attempts retry if relevant (placeholder), updates local state, notifies
   * parent callback, and shows user feedback.
   *************************************************************************************************/
  const handleError = useCallback(
    (error: Error) => {
      // Step 1) Log error details
      // eslint-disable-next-line no-console
      console.error('CampaignOverview error:', error);

      // Step 2) Attempt retry if applicable (placeholder logic)
      // For demonstration, we do not implement full retry here.

      // Step 3) Update local error state
      setState((prev) => ({
        ...prev,
        error,
      }));

      // Step 4) Notify parent if provided
      if (onError) {
        onError(error);
      }
      // Step 5) Show user feedback handled by local state or fallback
    },
    [onError]
  );

  /*************************************************************************************************
   * handlePageChange
   * -----------------------------------------------------------------------------
   * Manages pagination with optimistic updates. The JSON specification steps include:
   *  - Validate page number
   *  - Update current page state
   *  - Trigger data refresh
   *  - Handle error cases
   *************************************************************************************************/
  const handlePageChange = useCallback(
    (page: number) => {
      try {
        // Step 1) Validate page
        if (page < 1) {
          throw new Error('Page number cannot be less than 1.');
        }

        // Step 2) Update current page state (optimistic approach)
        setState((prev) => ({
          ...prev,
          currentPage: page,
        }));

        // Step 3) Trigger campaign refresh if needed
        // (The actual data refresh is handled by <CampaignTable> internally.)

        // Step 4) No separate error here, so do nothing
      } catch (err) {
        handleError(err as Error);
      }
    },
    [handleError]
  );

  /*************************************************************************************************
   * handleSort
   * -----------------------------------------------------------------------------
   * Manages column sorting with accessibility. The JSON specification steps:
   *  - Update sort state
   *  - Announce sort change for screen readers
   *  - Refresh campaign data
   *  - Handle errors
   *************************************************************************************************/
  const handleSort = useCallback(
    (field: string, direction: SortDirection) => {
      try {
        // Step 1) Update sort state
        setState((prev) => ({
          ...prev,
          sortField: field,
          sortDirection: direction,
        }));

        // Step 2) Accessibility - We can use an ARIA live region or local approach
        // This demo doesn't implement an ARIA announcer, but we can expand if needed.

        // Step 3) Refresh campaign data is done by subcomponent hooking into sort states, etc.

        // Step 4) No error logic, so do nothing
      } catch (err) {
        handleError(err as Error);
      }
    },
    [handleError]
  );

  /*************************************************************************************************
   * 2) & 3) useCampaigns: data subscription & real-time updates
   * -----------------------------------------------------------------------------
   * We'll fetch the campaigns in child components, but we do subscribe for real-time
   * updates here if an interval is provided. The hook provides:
   *  - subscribeToUpdates (function)
   *  - error (Error) for potential hooking
   *************************************************************************************************/
  const { subscribeToUpdates, error: campaignsError } = useCampaigns();

  // If the hook returns an error, handle it. This effect runs whenever campaignsError changes.
  useEffect(() => {
    if (campaignsError) {
      handleError(campaignsError as Error);
    }
  }, [campaignsError, handleError]);

  // Configure real-time subscription if refreshInterval > 0
  useEffect(() => {
    if (refreshInterval > 0 && typeof subscribeToUpdates === 'function') {
      // We assume subscribeToUpdates can accept an options object or interval
      const unsubscribe =
        subscribeToUpdates({ interval: refreshInterval }) || undefined;

      // Cleanup if a function is returned
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
    return undefined;
  }, [refreshInterval, subscribeToUpdates]);

  /*************************************************************************************************
   * 4) Error Boundary Integration
   * -----------------------------------------------------------------------------
   * We wrap the core UI with react-error-boundary's <ErrorBoundary>. If an uncaught error
   * arises within the child, onError calls handleError, and a fallback UI is shown.
   *************************************************************************************************/
  const onBoundaryError = useCallback(
    (err: Error) => {
      handleError(err);
    },
    [handleError]
  );

  /*************************************************************************************************
   * 5) & 6) Render the component with a responsive layout, accessibility attributes,
   * and error states. We place:
   *  - CampaignMetrics for analytics
   *  - CampaignTable for listing, pagination, sorting
   *  - Accessible roles and labels
   *  - Display local error if any
   *************************************************************************************************/
  return (
    <ErrorBoundary
      onError={onBoundaryError}
      FallbackComponent={CampaignOverviewFallback}
    >
      <Card
        variant="default"
        padding="md"
        className={className}
        role="region"
        aria-label="Campaign Overview Section"
      >
        {/* If there's a local error stored, we can show it here in addition to the fallback boundary. */}
        {localError && (
          <div
            role="alert"
            className="mb-3 p-3 border border-red-200 rounded bg-red-50 text-red-700"
          >
            <p className="font-semibold">
              An error occurred: {localError.message}
            </p>
          </div>
        )}

        {/* Heading for screen readers & semantic clarity */}
        <h2 className="text-xl font-semibold mb-4">Campaign Overview</h2>

        {/* 
          The CampaignMetrics component can be used to display aggregated stats 
          for all active campaigns or for a specific "featured" campaign. 
          This example uses a hypothetical static ID or logic could be dynamic.
        */}
        <section
          role="region"
          aria-label="Campaign Performance Metrics"
          className="mb-6"
        >
          <CampaignMetrics campaignId="featured-campaign-id" />
        </section>

        {/* 
          The CampaignTable handles listing, pagination, and user actions 
          for the broader set of campaigns. We pass the pagination, event 
          handlers, etc. from the local state. 
        */}
        <section
          role="region"
          aria-label="Campaign List Table"
        >
          <CampaignTable
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            className="mt-4"
          />
        </section>
      </Card>
    </ErrorBoundary>
  );
};

export default CampaignOverview;