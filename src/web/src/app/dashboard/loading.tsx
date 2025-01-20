import React from 'react'; // react ^18.2.0
import { Card } from '../../components/ui/Card'; // Internal Card component for skeleton containers

/*************************************************************************************************
 * SkeletonPulse
 *
 * Reusable skeleton component with pulsing animation.
 * Steps:
 *   1) Apply base skeleton styles (bg-gray-200 dark:bg-gray-800).
 *   2) Add pulsing animation class (animate-pulse).
 *   3) Merge provided className with base styles.
 *   4) Return div element with combined styles.
 *************************************************************************************************/
function SkeletonPulse(className: string): JSX.Element {
  const baseClasses = 'bg-gray-200 dark:bg-gray-800 animate-pulse rounded';
  const combined = className ? `${baseClasses} ${className}` : baseClasses;
  return <div className={combined} />;
}

/*************************************************************************************************
 * StatsSkeleton
 *
 * Loading skeleton for quick stats section.
 * Steps:
 *   1) Create responsive grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-4).
 *   2) Render four Card components with skeleton content.
 *   3) Add large skeleton for metric value (h-8 w-24).
 *   4) Add smaller skeleton for label (h-4 w-16).
 *   5) Include proper spacing and padding.
 *************************************************************************************************/
function StatsSkeleton(): JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={`stats-${index}`} padding="md" variant="default" className="space-y-2">
          <SkeletonPulse('h-8 w-24') /* Large skeleton for metric value */ />
          <SkeletonPulse('h-4 w-16') /* Smaller skeleton for metric label */ />
        </Card>
      ))}
    </div>
  );
}

/*************************************************************************************************
 * ChartSkeleton
 *
 * Loading skeleton for analytics charts.
 * Steps:
 *   1) Create chart container with appropriate dimensions.
 *   2) Add skeleton bars in grid pattern.
 *   3) Include skeleton legend items.
 *   4) Maintain aspect ratio matching actual chart.
 *************************************************************************************************/
function ChartSkeleton(): JSX.Element {
  return (
    <Card variant="default" padding="md" className="w-full space-y-4">
      {/* Chart container maintaining a controlled height to mirror loaded chart dimensions */}
      <div className="w-full h-64 space-y-4">
        {/* Skeleton legend items */}
        <div className="flex space-x-3">
          <SkeletonPulse('h-4 w-16') />
          <SkeletonPulse('h-4 w-16') />
        </div>
        {/* Skeleton bars in a grid pattern */}
        <div className="grid grid-cols-12 gap-2 h-32">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonPulse key={`bar-${index}`} className="w-full h-full" />
          ))}
        </div>
        {/* Additional legend or info row */}
        <div className="flex space-x-4">
          <SkeletonPulse('h-4 w-20') />
          <SkeletonPulse('h-4 w-28') />
          <SkeletonPulse('h-4 w-20') />
        </div>
      </div>
    </Card>
  );
}

/*************************************************************************************************
 * ActivitySkeleton
 *
 * Loading skeleton for recent activity list.
 * Steps:
 *   1) Create list container with proper spacing.
 *   2) Render multiple activity item skeletons.
 *   3) Include circular avatar placeholder.
 *   4) Add text line skeletons for details.
 *   5) Maintain consistent item height and padding.
 *************************************************************************************************/
function ActivitySkeleton(): JSX.Element {
  return (
    <Card variant="default" padding="md" className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`activity-${index}`} className="flex items-center space-x-3">
          {/* Circular avatar placeholder */}
          <SkeletonPulse('rounded-full h-10 w-10') />
          {/* Text lines for activity details */}
          <div className="flex-1 space-y-2">
            <SkeletonPulse('h-4 w-1/2') />
            <SkeletonPulse('h-3 w-1/3') />
          </div>
        </div>
      ))}
    </Card>
  );
}

/*************************************************************************************************
 * Loading (Default Export)
 *
 * Main loading state component for the dashboard page.
 * Render Logic:
 *   1) Render main container with dashboard layout grid.
 *   2) Display StatsSkeleton for quick stats section.
 *   3) Show ChartSkeleton for analytics charts.
 *   4) Include ActivitySkeleton for recent activity.
 *   5) Add aria-busy="true" for accessibility.
 *   6) Apply proper spacing between sections.
 *   7) Ensure responsive layout matches loaded state.
 *************************************************************************************************/
const Loading: React.FC = () => {
  return (
    <main
      className="grid gap-6 p-4 md:p-6"
      aria-busy="true"
    >
      <StatsSkeleton />
      <ChartSkeleton />
      <ActivitySkeleton />
    </main>
  );
};

export default Loading;