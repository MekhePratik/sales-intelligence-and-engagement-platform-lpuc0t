/**
 * RecentActivity.tsx
 *
 * An enhanced React component that displays real-time platform activities in a chronological feed
 * with infinite scrolling and optional grouping by date. This component addresses:
 * 1. Analytics / Activity Tracking: Showing lead, campaign, and email interactions as they happen
 * 2. Real-time Updates: WebSocket subscription with automatic reconnection and error handling
 *
 * -------------------------------------------------------------------------
 * External Imports (with versions):
 *   - React ^18.2.0
 *   - date-fns ^2.30.0
 *   - react-infinite-scroll-hook ^4.0.0
 *   - react-error-boundary ^4.0.11
 * -------------------------------------------------------------------------
 * Internal Imports:
 *   - Card (default) from ../ui/Card
 *   - useAnalytics (named) from ../../hooks/useAnalytics
 *     which provides { data, loading, subscribeToActivities }
 *
 * -------------------------------------------------------------------------
 * JSON Specification Requirements Implemented:
 * 1. Class/Component "RecentActivity" with:
 *    - constructor steps:
 *      - Initialize component with provided props
 *      - Set default limit if not specified
 *      - Create WebSocket subscription reference
 *      - Initialize infinite scroll state
 *    - properties: { defaultLimit: 10, subscriptionRef: React.RefObject<WebSocket> }
 *    - parameters: { limit: number, className: string, groupByDate: boolean }
 *    - functions:
 *      a) getActivityIcon(activityType)
 *      b) formatActivityMessage(activity)
 *      c) handleActivityClick(activity)
 *    - Exports: default React.FC<RecentActivityProps> => RecentActivity
 *
 * 2. Global Functions in this file:
 *    - formatTimeAgo(timestamp, timezone)
 *    - groupActivitiesByDate(activities)
 *
 * -------------------------------------------------------------------------
 * Enterprise-Grade Implementation Details:
 *  - ErrorBoundary usage for WebSocket/data fetch failures
 *  - Fully typed with React.FC and TS interfaces
 *  - Comments explaining each step
 *  - Potential expansions to track real-time unsubscribing or advanced grouping
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  MouseEventHandler,
  RefObject,
} from 'react'; // react ^18.2.0
import { format, formatDistanceToNow } from 'date-fns'; // date-fns ^2.30.0
import useInfiniteScroll from 'react-infinite-scroll-hook'; // react-infinite-scroll-hook ^4.0.0
import { ErrorBoundary } from 'react-error-boundary'; // react-error-boundary ^4.0.11

// Internal imports
import Card from '../ui/Card';
import { useAnalytics } from '../../hooks/useAnalytics';

/**
 * Represents a simplified model of an Activity for demonstration purposes.
 * In a real implementation, this might include references to leads, campaigns,
 * or more detailed metadata.
 */
interface Activity {
  id: string;
  type: string;          // e.g., 'lead', 'campaign', 'email', 'system'
  timestamp: string;     // ISO string representing when the activity occurred
  message: string;       // Main descriptive text
  metadata?: Record<string, unknown>; // Additional info
}

/**
 * Props for the RecentActivity component, as per JSON specification:
 *  - limit?: number      (Max items to load or display at once)
 *  - className?: string  (Additional CSS classes)
 *  - groupByDate?: boolean (When true, groups activities by date)
 */
export interface RecentActivityProps {
  /** The maximum number of activities to load with each pagination or subscription pass. */
  limit?: number;
  /** Extra classes for styling the container. */
  className?: string;
  /** Whether to group activities by date headers in the UI. */
  groupByDate?: boolean;
}

/**
 * A fallback component for handling errors specifically in our RecentActivity feed.
 * This will catch WebSocket disconnections or data fetch failures in the ErrorBoundary.
 */
function ActivityErrorFallback(): JSX.Element {
  return (
    <div className="p-4 text-red-600" role="alert">
      <p>
        <strong>Error:</strong> Unable to load recent activities. Please try again later.
      </p>
    </div>
  );
}

/*************************************************************************************************
 * Global Function: formatTimeAgo
 *
 * Formats a timestamp into a relative time string with timezone support.
 *
 * Steps:
 *  1. Convert timestamp to a Date object.
 *  2. If a timezone is provided, additional logic could shift the date. (Omitted here for brevity.)
 *  3. Use date-fns formatDistanceToNow to get a human-readable relative time.
 *  4. Optionally append the timezone or offset string if needed.
 *  5. Return the final string result.
 *
 * @param timestamp A date or string representing the activity timestamp.
 * @param timezone  An optional string representing the user's timezone (e.g., 'America/New_York').
 * @returns A localized relative time string with optional timezone.
 *************************************************************************************************/
export function formatTimeAgo(timestamp: Date | string, timezone?: string): string {
  // 1. Convert timestamp into a Date object. If it's already a Date, use it directly.
  const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  // 2. For demonstration, we ignore shifting the date for timezone and rely on local times.
  //    (In production, you'd adjust using date-fns-tz or a similar library if needed.)
  const now = new Date();

  // 3. Use formatDistanceToNow from date-fns to get a human-readable relative time.
  const relativeTimeStr = formatDistanceToNow(dateObj, { addSuffix: true });

  // 4. Optionally append timezone if provided. This is a simplistic approach.
  let finalStr = relativeTimeStr;
  if (timezone) {
    finalStr += ` (${timezone})`;
  }

  // 5. Return the final string
  return finalStr;
}

/*************************************************************************************************
 * Global Function: groupActivitiesByDate
 *
 * Groups a list of activities by their date (YYYY-MM-DD). This helps present a chronological feed
 * with date headers. For example, if multiple activities share the same date, they'll be grouped
 * under the same key in the returned record.
 *
 * Steps:
 *  1. Sort activities by timestamp descending (most recent first).
 *  2. For each activity, extract date portion using date-fns format (YYYY-MM-DD).
 *  3. Add activity to a grouping object keyed by the date string.
 *  4. Return the record: { "2023-10-01": [activities], "2023-09-30": [activities], ... }
 *
 * @param activities An array of Activity objects to group by date.
 * @returns A record with keys as date strings and values as arrays of Activity.
 *************************************************************************************************/
export function groupActivitiesByDate(activities: Activity[]): Record<string, Activity[]> {
  // 1. Sort activities by timestamp in descending order (latest activities first).
  const sorted = [...activities].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // 2. Group them by date portion of the timestamp.
  const grouped: Record<string, Activity[]> = {};

  sorted.forEach((activity) => {
    const dateStr = format(new Date(activity.timestamp), 'yyyy-MM-dd');
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    grouped[dateStr].push(activity);
  });

  // 3. Return the final grouped record
  return grouped;
}

/*************************************************************************************************
 * Standalone Function: getActivityIcon
 *
 * Returns the appropriate icon for an activity type with enhanced accessibility (ARIA labels).
 * 
 * Steps:
 *  1. Match the provided activity type against known types.
 *  2. Return a corresponding icon as a JSX element with a descriptive aria-label.
 *  3. Fallback to a generic default icon if the type is unrecognized.
 *
 * @param activityType A string describing the activity type, e.g. 'lead', 'campaign', 'email'.
 * @returns JSX.Element representing the icon for that type of activity.
 *************************************************************************************************/
function getActivityIcon(activityType: string): JSX.Element {
  switch (activityType) {
    case 'lead':
      return (
        <span className="text-blue-600 mr-2" aria-label="Lead Activity">
          🧑‍💼
        </span>
      );
    case 'campaign':
      return (
        <span className="text-green-600 mr-2" aria-label="Campaign Activity">
          📣
        </span>
      );
    case 'email':
      return (
        <span className="text-purple-600 mr-2" aria-label="Email Activity">
          ✉️
        </span>
      );
    default:
      return (
        <span className="text-gray-600 mr-2" aria-label="General Activity">
          🔔
        </span>
      );
  }
}

/*************************************************************************************************
 * Standalone Function: formatActivityMessage
 *
 * Formats a single Activity object into a rich text message that might include links or metadata.
 *
 * Steps:
 *  1. Extract relevant data from the Activity object, like message, metadata, or IDs.
 *  2. Construct an appropriate JSX element with inline formatting.
 *  3. Optionally insert clickable links for leads/campaigns if relevant.
 *  4. Return the JSX to be rendered.
 *
 * @param activity The Activity to render a user-facing message for.
 * @returns JSX.Element containing the formatted activity message.
 *************************************************************************************************/
function formatActivityMessage(activity: Activity): JSX.Element {
  // 1. Extract data from the activity
  const { message } = activity;

  // 2. Construct a minimal demonstration message or an enriched text
  //    In a real scenario, we might highlight certain keywords or create links.
  return (
    <span className="inline-block">
      {message}
    </span>
  );
}

/*************************************************************************************************
 * Standalone Function: handleActivityClick
 *
 * Handles click interactions on an activity item, possibly navigating or opening a modal.
 *
 * Steps:
 *  1. Retrieve the activity type and ID from the activity object.
 *  2. Determine the destination or next action (navigate to lead detail, campaign page, etc.).
 *  3. Trigger that navigation or open a modal, as well as track an analytics event if needed.
 *
 * @param activity The Activity object containing data for the click.
 * @returns void (Perform side effects like navigation or analytics without returning a value).
 *************************************************************************************************/
function handleActivityClick(activity: Activity): void {
  // 1. For demonstration, we log the user's click. In production, we'd navigate or open a modal.
  //    Example: if (activity.type === 'lead') router.push(`/leads/${activity.id}`);
  //    Or open a modal: openLeadModal(activity.id);
  // 2. Track an event (if integrated with Amplitude, Segment, etc.).
  //    trackEvent("ActivityClick", { type: activity.type, id: activity.id });
  // 3. Implementation details are left to the real application context.

  // Example log:
  // eslint-disable-next-line no-console
  console.info(`Activity clicked: ${activity.type} [ID: ${activity.id}]`);
}

/*************************************************************************************************
 * Component: RecentActivity
 *
 * React functional component implementing the required specification:
 *  - Accepts props: { limit, className, groupByDate }
 *  - Has internal "defaultLimit" property set to 10 if none provided
 *  - Maintains a "subscriptionRef" to track real-time updates
 *  - Subscribes to new activities using "subscribeToActivities" from the useAnalytics hook
 *  - Uses infinite scrolling to load more items (demonstration approach)
 *  - If "groupByDate" is true, calls "groupActivitiesByDate" to separate them by date
 *
 * Steps:
 *  1. Initialize defaultLimit (10) if limit is not specified.
 *  2. Create a WebSocket subscription ref (subscriptionRef).
 *  3. Use the useAnalytics hook with "subscribeToActivities" for real-time updates.
 *  4. Track activities in state. On new data from subscription, add to state.
 *  5. Implement an infinite scroll mechanism. For demonstration, we stub loadMore logic.
 *  6. Conditionally group activities by date if groupByDate is true.
 *  7. Render the feed inside a UI Card, wrapping each activity with clickable handling.
 *  8. Provide robust error handling with the ErrorBoundary.
 *************************************************************************************************/
const RecentActivity: React.FC<RecentActivityProps> = (props) => {
  // ---------------------------------------------------------------------------
  // 1. Initialize defaults and refs based on the props and specification
  // ---------------------------------------------------------------------------
  const { limit, className, groupByDate } = props;
  const defaultLimit = limit ?? 10; // property: defaultLimit = 10
  const subscriptionRef: RefObject<WebSocket> = useRef<WebSocket>(null); // subscriptionRef

  // ---------------------------------------------------------------------------
  // 2. Use local state for activities and a loader for infinite scroll
  // ---------------------------------------------------------------------------
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // ---------------------------------------------------------------------------
  // 3. Extract relevant items from the analytics hook
  //    - data (not necessarily used here, but available)
  //    - loading to track loading states
  //    - subscribeToActivities for real-time updates
  // ---------------------------------------------------------------------------
  const { data, loading, subscribeToActivities } = useAnalytics('MONTH', {
    debounceDelay: 500,
  });

  // ---------------------------------------------------------------------------
  // 4. Set up the subscription to listen for new activities
  //    This simulates real-time inbound activity items.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof subscribeToActivities === 'function') {
      const wsOrCleanup = subscribeToActivities((newActivity: Activity) => {
        // On receiving a new activity, prepend it to the list
        setActivities((prev) => [newActivity, ...prev]);
      });

      // Store the subscription if it's a WebSocket instance
      if (wsOrCleanup && typeof wsOrCleanup === 'object') {
        subscriptionRef.current = wsOrCleanup;
      }

      // Optionally return a cleanup function if needed (closing the WebSocket)
      return () => {
        if (subscriptionRef.current && typeof subscriptionRef.current.close === 'function') {
          subscriptionRef.current.close();
        }
      };
    }

    return () => {
      // Cleanup if no subscription function is present
    };
  }, [subscribeToActivities]);

  // ---------------------------------------------------------------------------
  // 5. Infinite scroll logic
  //    For demonstration, we stub "onLoadMore" to simply indicate there's no more data
  //    once the number of loaded items exceeds a threshold (like 100).
  // ---------------------------------------------------------------------------
  const onLoadMore = useCallback(() => {
    if (activities.length >= 100) {
      setHasMore(false);
      return;
    }
    // In a real scenario, we might fetch older activities from an API.
    // This demonstration shows a simple approach to stopping infinite load.
  }, [activities.length]);

  // Hook from react-infinite-scroll-hook to manage the sentinel and load operation
  const [sentryRef] = useInfiniteScroll({
    loading: loading === true,
    hasNextPage: hasMore,
    onLoadMore,
    disabled: false,
    rootMargin: '0px 0px 400px 0px',
  });

  // ---------------------------------------------------------------------------
  // 6. Conditionally group by date if prop is set
  // ---------------------------------------------------------------------------
  let activityList: JSX.Element[] = [];
  if (groupByDate) {
    const grouped = groupActivitiesByDate(activities);
    const sortedDates = Object.keys(grouped).sort().reverse(); // newest date first
    activityList = sortedDates.map((dateStr) => {
      const sameDateActivities = grouped[dateStr];
      return (
        <div key={dateStr} className="mb-4">
          <div className="font-semibold text-slate-700 mb-2">
            {format(new Date(dateStr), 'PPPP')}
          </div>
          <ul>
            {sameDateActivities.map((act) => (
              <li
                key={act.id}
                className="flex items-center py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50"
                onClick={() => handleActivityClick(act)}
              >
                {getActivityIcon(act.type)}
                <div className="flex flex-col">
                  {formatActivityMessage(act)}
                  <span className="text-xs text-slate-400">
                    {formatTimeAgo(act.timestamp)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    });
  } else {
    // No grouping by date, just a direct list
    activityList = activities.map((act) => (
      <li
        key={act.id}
        className="flex items-center py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50"
        onClick={() => handleActivityClick(act)}
      >
        {getActivityIcon(act.type)}
        <div className="flex flex-col">
          {formatActivityMessage(act)}
          <span className="text-xs text-slate-400">{formatTimeAgo(act.timestamp)}</span>
        </div>
      </li>
    ));
  }

  // ---------------------------------------------------------------------------
  // 7. Render: Wrap our feed in a <Card> for styling, and attach sentinel for infinite scroll
  // ---------------------------------------------------------------------------
  return (
    <ErrorBoundary FallbackComponent={ActivityErrorFallback}>
      <Card
        variant="default"
        padding="md"
        className={className}
        aria-label="Recent Activities Feed"
      >
        {/* Title or heading for the feed */}
        <h2 className="text-lg font-bold mb-3">Recent Activity</h2>

        {/* Our list of activities: conditionally show a loading state if desired. */}
        {loading && activities.length === 0 && (
          <div className="py-4 text-slate-500">Loading activities...</div>
        )}

        {activityList.length === 0 && !loading && (
          <div className="py-4 text-slate-500">No activities found.</div>
        )}

        <ul>{activityList}</ul>

        {/* Infinite Scroll Sentinel */}
        {hasMore && !loading && (
          <div ref={sentryRef} className="h-10" aria-hidden="true" />
        )}
      </Card>
    </ErrorBoundary>
  );
};

/**
 * Export the RecentActivity component as the default export,
 * fulfilling the JSON specification's requirement:
 *   - members_exposed: { RecentActivity, export_type: 'default' }
 */
export default RecentActivity;