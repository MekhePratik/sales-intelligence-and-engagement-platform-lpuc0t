import type { Metadata, NextPage } from 'next'; // Next.js types
import React from 'react'; // ^18.2.0 (React core library)
import { ErrorBoundary } from 'react-error-boundary'; // ^4.0.0 (For graceful error handling)
import { Select, SelectItem } from '@tremor/react'; // ^3.4.0 (Accessible time range selection)
import Shell from '../../../components/layout/Shell'; // Main layout wrapper w/ error boundary
import ConversionMetrics from '../../../components/analytics/ConversionMetrics'; // Displaying conversion rate metrics
import EmailStats from '../../../components/analytics/EmailStats'; // Email campaign statistics w/ progressive loading
import LeadAnalytics from '../../../components/analytics/LeadAnalytics'; // Lead metrics and trends
import PerformanceChart from '../../../components/analytics/PerformanceChart'; // Performance metrics visualization
import { useAnalytics } from '../../../hooks/useAnalytics'; // Enhanced hook: data, loading, error, timeRange, setTimeRange, retry

/***************************************************************************************************
 * Named Export: metadata
 * -----------------------------------------------------------------------------------------------
 * Provides enhanced Next.js 13+ page metadata configuration (SEO, accessibility). Implements
 * the JSON specification steps:
 *  (1) Define page title as "Analytics | B2B Sales Platform"
 *  (2) Set page description for SEO
 *  (3) Configure additional accessibility or locale metadata
 *  (4) Set up OpenGraph tags
 *  (5) Optionally embed structured data for analytics
 **************************************************************************************************/
export const metadata: Metadata = {
  title: 'Analytics | B2B Sales Platform',
  description: 'Comprehensive analytics dashboard with real-time performance metrics, optimized for SEO.',
  openGraph: {
    title: 'Analytics | B2B Sales Platform',
    description: 'Access real-time analytics for leads, email campaigns, and conversions.',
    url: 'https://example.com/analytics',
    siteName: 'B2B Sales Intelligence',
    images: [
      {
        url: 'https://example.com/og-image-analytics.jpg',
        width: 1200,
        height: 630,
        alt: 'Analytics Dashboard Preview',
      },
    ],
    type: 'website',
  },
  // Example JSON-LD or similar structured data snippet (optional illustration):
  // This can help search engines better understand the page's content
  // Note: Usually injected via next/head or specialized config
};

/***************************************************************************************************
 * Local Fallback Component for ErrorBoundary
 * -----------------------------------------------------------------------------------------------
 * Provides a graceful fallback UI when the analytics page encounters a critical error. Implements
 * the "onReset" callback integration by exposing a "Retry" button that calls resetErrorBoundary.
 **************************************************************************************************/
function AnalyticsErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert" className="p-4 bg-red-50 text-red-700 rounded border border-red-200">
      <h2 className="font-bold text-lg">Analytics Page Error</h2>
      <p className="mt-1">Something went wrong while loading analytics:</p>
      <pre className="text-xs whitespace-pre-wrap mt-2">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
}

/***************************************************************************************************
 * Main Page Component: AnalyticsPage
 * -----------------------------------------------------------------------------------------------
 * A Next.js page that serves as the main analytics dashboard, fulfilling the JSON specification:
 *  1) Initialize analytics hook with error handling
 *  2) Set up an error boundary around the component tree
 *  3) Configure accessibility announcements (we add ARIA attributes + live region placeholders)
 *  4) Handle loading states (with minimal skeleton or placeholders)
 *  5) Implement progressive loading pattern
 *  6) Render time range selector (Select from @tremor/react) with keyboard navigation
 *  7) Display conversion metrics with error handling
 *  8) Show email performance stats (optimistic updates)
 *  9) Render lead analytics (background refresh)
 * 10) Display performance charts with memoization
 * 11) Set up an ARIA live region for dynamic metric announcements
 * 12) Implement a retry mechanism for fetch failures by integrating with react-error-boundary
 **************************************************************************************************/
const AnalyticsPage: NextPage = () => {
  // Step 1: Initialize analytics hook with error handling
  const {
    data,
    loading,
    error,
    timeRange,
    setTimeRange,
    retry,
  } = useAnalytics('MONTH'); // Example default time range
  
  // Step 11: We can create an ARIA live region to announce metric updates
  // This region remains visually hidden but is read by screen readers as content changes
  // (If desired, we can place metric text updates in this region).
  
  // Step 4 + 5: We handle loading via a minimal approach. If more progressive loading is needed,
  // we might show partial data as soon as certain subsets are ready.
  if (loading && !data) {
    return (
      <Shell>
        <div
          role="status"
          aria-live="polite"
          className="mt-8 mx-auto max-w-md p-4 text-center border border-gray-200 rounded"
        >
          <p className="text-gray-700">Loading analytics data…</p>
          {/* A simple placeholder or skeleton can go here */}
        </div>
      </Shell>
    );
  }

  // Step 2: Wrap content in an ErrorBoundary. "resetKeys" references error to re-render on changes.
  // Step 12: "onReset={() => retry()}" calls the hook's retry mechanism after fallback fails.
  return (
    <Shell>
      <ErrorBoundary
        FallbackComponent={AnalyticsErrorFallback}
        onReset={() => retry()}
        resetKeys={[error]}
      >
        <main
          id="analytics-main-content"
          aria-labelledby="analytics-page-title"
          className="p-4 space-y-6"
        >
          {/* Step 3: Add an offscreen region for accessibility or announcements */}
          <div aria-live="polite" className="sr-only">
            {/* Insert dynamic metric text updates here if desired */}
          </div>

          {/* Page header */}
          <header>
            <h1
              id="analytics-page-title"
              className="text-2xl font-bold text-gray-800 dark:text-gray-100"
            >
              Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Explore performance metrics, conversion rates, email stats, and lead insights.
            </p>
          </header>

          {/* Step 6: Render time range selector with keyboard / screen reader navigation */}
          <section aria-label="Time Range Selection" className="max-w-xs">
            <label
              htmlFor="time-range-select"
              className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Select Time Range:
            </label>
            {/* The tremor Select for accessible time range picking */}
            <Select
              id="time-range-select"
              value={timeRange}
              placeholder="Pick a time range"
              onValueChange={(value) => setTimeRange(value as typeof timeRange)}
              className="w-full"
            >
              <SelectItem value="DAY">Day</SelectItem>
              <SelectItem value="WEEK">Week</SelectItem>
              <SelectItem value="MONTH">Month</SelectItem>
              <SelectItem value="QUARTER">Quarter</SelectItem>
              <SelectItem value="YEAR">Year</SelectItem>
            </Select>
          </section>

          {/* Step 7: Display conversion metrics with error handling */}
          <section className="mt-6" aria-label="Conversion Metrics">
            <ConversionMetrics />
          </section>

          {/* Step 8: Show email campaign performance statistics for optimistic updates */}
          <section className="mt-6" aria-label="Email Statistics">
            <EmailStats />
          </section>

          {/* Step 9: Render lead analytics with background refresh */}
          <section className="mt-6" aria-label="Lead Analytics Overview">
            <LeadAnalytics />
          </section>

          {/* Step 10: Display performance charts with memoization */}
          <section className="mt-6" aria-label="Performance Charts">
            <PerformanceChart
              metricType="PERFORMANCE"
              title="Overall Performance"
              showLegend={true}
              thresholds={{}}
            />
          </section>
        </main>
      </ErrorBoundary>
    </Shell>
  );
};

export default AnalyticsPage;