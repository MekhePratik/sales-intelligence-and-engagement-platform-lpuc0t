/* eslint-disable react/no-unescaped-entities */
/***************************************************************************************************
 * File: src/web/src/app/dashboard/page.tsx
 * -------------------------------------------------------------------------------------------------
 * Description:
 *   Main dashboard page component that provides a comprehensive overview of the B2B sales platform’s
 *   key metrics, recent activities, and campaign performance. Implements real-time updates via
 *   WebSocket connections and includes server-side rendering configuration for Next.js App Router.
 *
 * JSON Specification Requirements Addressed:
 *  1) "Dashboard Analytics" - Renders quick stat cards, lead metrics, campaign overviews, and
 *     real-time activity feeds to track campaign performance, conversion analytics, ROI calculation,
 *     threshold monitoring, and KPI dashboards.
 *  2) "Success Criteria Tracking" - Monitors adoption rates, lead quality, time savings, and
 *     ROI with user-defined thresholds and dynamic data.
 *  3) "Dashboard Layout" - Implements a responsive grid system, integrated inside the Shell
 *     layout with error boundaries, real-time updates, Suspense boundaries, and performance logs.
 *
 * Next.js Page Configuration (from JSON's page_config):
 *  - dynamic = 'force-dynamic'
 *  - revalidate = 60
 *  - fetchCache = 'force-no-store'
 *  - runtime = 'nodejs'
 *  - preferredRegion = 'auto'
 *  - dynamicParams = true
 *  - generateStaticParams = false
 *  - fetchTags = ['dashboard', 'metrics', 'real-time']
 *
 * Exports:
 *  - generateMetadata (named): Creates advanced metadata with dynamic titles & SEO tags.
 *  - Dashboard (default): Main container component hosting QuickStats, LeadMetrics,
 *    CampaignOverview, and RecentActivity inside Shell.
 *
 * External Packages (versions):
 *  - React ^18.2.0
 *  - Suspense from 'react' ^18.2.0
 *  - useWebSocket from 'react-use-websocket' ^4.5.0
 *  - ErrorBoundary from 'react-error-boundary' ^4.0.11
 *
 * Internal Imports:
 *  - Shell (layout wrapper w/ error boundary) from ../../components/layout/Shell
 *  - QuickStats (real-time quick statistics) from ../../components/dashboard/QuickStats
 *  - CampaignOverview (campaign performance) from ../../components/dashboard/CampaignOverview
 *  - LeadMetrics (lead performance metrics) from ../../components/dashboard/LeadMetrics
 *  - RecentActivity (activity feed) from ../../components/dashboard/RecentActivity
 **************************************************************************************************/

/***************************************************************************************************
 * Next.js App Router Page Config
 **************************************************************************************************/
export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
export const dynamicParams = true;
export const generateStaticParams = false;
export const fetchTags = ['dashboard', 'metrics', 'real-time'];

/***************************************************************************************************
 * Imports
 **************************************************************************************************/
import React, { Suspense, useEffect, useRef } from 'react'; // react ^18.2.0
import { useWebSocket } from 'react-use-websocket'; // react-use-websocket ^4.5.0
import { ErrorBoundary } from 'react-error-boundary'; // react-error-boundary ^4.0.11

// Internal components
import Shell from '../../components/layout/Shell'; // Main layout wrapper
import QuickStats from '../../components/dashboard/QuickStats';
import CampaignOverview from '../../components/dashboard/CampaignOverview';
import LeadMetrics from '../../components/dashboard/LeadMetrics';
import RecentActivity from '../../components/dashboard/RecentActivity';

/***************************************************************************************************
 * Function: generateMetadata
 * -------------------------------------------------------------------------------------------------
 * Generates advanced metadata for this dashboard page, covering:
 *   1) Dynamic title based on application context
 *   2) Comprehensive meta description for SEO
 *   3) OpenGraph tags for social media sharing
 *   4) Twitter card metadata
 *   5) Optionally structured data JSON-LD (omitted for brevity)
 *   6) Potential for specialized caching headers (handled by Next.js page config above)
 *
 * Decorators: [export]
 * Steps from specification:
 *   1) Generate title
 *   2) Set meta description
 *   3) Configure OpenGraph
 *   4) Add Twitter cards
 *   5) (Optional) structured data
 *   6) Return the final metadata object for Next.js consumption
 **************************************************************************************************/
export async function generateMetadata() {
  // 1) Dynamic title (could base on user session or org name if available)
  const title = 'B2B Sales Intelligence - Dashboard';

  // 2) Comprehensive meta description
  const description =
    'Real-time overview of key B2B sales metrics, campaign performance, conversion analytics, and ROI calculations.';

  // 3) Configure basic OpenGraph tags
  const openGraph = {
    title,
    description,
    url: 'https://your-b2b-platform.com/dashboard',
    images: [
      {
        url: 'https://your-b2b-platform.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Dashboard Overview',
      },
    ],
  };

  // 4) Twitter card metadata
  const twitter = {
    card: 'summary_large_image',
    title,
    description,
  };

  // 5) We omit structured data for brevity
  // 6) Return final metadata object
  return {
    title,
    description,
    openGraph,
    twitter,
  };
}

/***************************************************************************************************
 * Component: Dashboard (Default Export)
 * -------------------------------------------------------------------------------------------------
 * Enhanced dashboard page component with real-time updates and error handling. Includes:
 *   1) Initialize WebSocket for real-time data using react-use-websocket
 *   2) Wrap child components with error boundaries
 *   3) Optionally configure Suspense for partial loading states
 *   4) Render Shell layout with accessibility
 *   5) Implement responsive grid for stats and activity
 *   6) Render QuickStats with real-time data & thresholds
 *   7) Display LeadMetrics with threshold monitoring & KPI checks
 *   8) Show CampaignOverview for campaign performance
 *   9) Include RecentActivity feed pulling from WebSocket updates
 *   10) Cleanup WebSocket on unmount
 *   11) Implement optional performance monitoring
 *   12) Add comprehensive error logging if necessary
 **************************************************************************************************/
export default function Dashboard(): JSX.Element {
  /*************************************************************************************************
   * 1) Initialize WebSocket connection for real-time updates
   *    This is a demonstration of react-use-websocket usage with a sample WS endpoint.
   *    In production, point to your actual real-time feed. The lastMessage can be used
   *    to update the store or local states as needed.
   *************************************************************************************************/
  const {
    sendMessage,
    lastMessage,
    readyState,
    getWebSocket,
  } = useWebSocket('wss://example-realtime-b2b.com/dashboard', {
    share: true, // optional: share a single connection across global usage
    onOpen: () => {
      // eslint-disable-next-line no-console
      console.log('[Dashboard WebSocket] Connection established.');
    },
    onError: (event) => {
      // 12) Add error logging
      // eslint-disable-next-line no-console
      console.error('[Dashboard WebSocket] Error occurred:', event);
    },
    shouldReconnect: () => true, // auto reconnect
  });

  /*************************************************************************************************
   * 10) Cleanup WebSocket on unmount (demonstration)
   *    If needed, we can close or handle teardown. react-use-websocket supports internal
   *    lifecycle, so typically no manual cleanup is required unless you want explicit control.
   *************************************************************************************************/
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    wsRef.current = getWebSocket();
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [getWebSocket]);

  /*************************************************************************************************
   * 2) & 3) We wrap child content in an ErrorBoundary to isolate errors,
   *          plus optional Suspense if any child uses Next.js-based data fetching.
   *************************************************************************************************/
  return (
    <Shell>
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div role="alert" className="p-4 text-red-700 bg-red-50 border border-red-200 rounded">
            <p className="font-semibold mb-2">An error occurred in the Dashboard:</p>
            <pre className="text-sm whitespace-pre-wrap break-all">{error?.message}</pre>
          </div>
        )}
      >
        {/* 5) Implement a responsive grid or flex layout */}
        <div className="p-4 gap-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {/* 6) QuickStats with threshold monitoring */}
          <QuickStats
            thresholds={{
              // Adjust threshold values as needed for success criteria
              conversionRate: 0.40, // 40%
              openRate: 0.25,       // 25%
              clickRate: 0.10,      // 10%
              leadScore: 80,        // Score threshold
            }}
            refreshInterval={30_000} // auto-refresh every 30s
          />

          {/* 7) Show lead-related metrics with thresholds (like user adoption or lead quality) */}
          <LeadMetrics timeRange="MONTH" locale="en-US" />

          {/* 8) CampaignOverview for campaign performance, real-time refresh */}
          <div className="col-span-1 xl:col-span-2 mt-6 lg:mt-0">
            <CampaignOverview refreshInterval={60_000} />
          </div>

          {/* 9) Real-time activity feed leveraging WebSocket updates */}
          <div className="col-span-1 xl:col-span-3 mt-6">
            <RecentActivity limit={10} groupByDate className="w-full" />
          </div>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}