'use client';
/*************************************************************************************************
 * Global Loading Component
 * -----------------------------------------------------------------------------------------------
 * This component implements a skeleton UI for displaying a global loading state in a Next.js app,
 * particularly during page transitions and data fetching operations. It adheres to the following:
 *
 *  1. Implements accessibility (WCAG 2.1 AA) by including role="status" and aria-busy attributes.
 *  2. Uses ARIA labels to provide clarity to screen readers regarding loading content.
 *  3. Applies a responsive grid layout to display multiple Card-based skeletons consistently.
 *  4. Leverages motion-safe CSS classes for subtle pulse animations, respecting prefers-reduced-motion.
 *  5. Exposes data-testid for reliable testing and automation coverage.
 *  6. Combines enterprise-level performance optimizations for perceived load time.
 *
 * External Imports:
 *   - React ^18.2.0  -> Core library for building UI components
 *   - @radix-ui/react-card ^1.0.0 -> Card container for consistent scaffolding
 *
 * Internal Imports:
 *   - cn (from ../lib/utils) -> Conditional class name utility
 *
 * Exports:
 *   - Default: The Global Loading component (function Loading).
 *************************************************************************************************/

import * as React from 'react'; // react ^18.2.0
import { Card } from '@radix-ui/react-card'; // @radix-ui/react-card ^1.0.0
import { cn } from '../lib/utils'; // Conditional class name construction

/**
 * Loading
 * -----------------------------------------------------------------------------------------------
 * Enterprise-ready, production-compliant loading component. Renders an accessible, animated
 * skeleton UI during page transitions and data fetches.
 *
 * Steps Implemented:
 *  1. Main container is treated as a 'status' region, with aria-busy indicating ongoing loading.
 *  2. A responsive grid layout organizes multiple skeleton cards.
 *  3. Repeated Card structures convey a placeholder for typical page content.
 *  4. Pulse animation is applied, respecting prefers-reduced-motion for accessibility.
 *  5. Each Card includes ARIA attributes for screen reader support.
 *  6. Data attributes (data-testid) facilitate automated testing and QA workflows.
 *  7. Performance-optimized CSS classes minimize reflows and preserve user experience.
 *
 * @returns JSX.Element - Rendered loading skeleton component with accessibility features.
 */
export default function Loading(): JSX.Element {
  // Generate a small array to render multiple skeleton items
  const skeletonItems = Array.from({ length: 6 }, (_, i) => i + 1);

  return (
    <main
      role="status"
      aria-busy="true"
      aria-label="Page is currently loading content"
      data-testid="global-loading"
      className={cn(
        'grid',
        'grid-cols-1',
        'gap-6',
        'p-6',
        'sm:grid-cols-2',
        'lg:grid-cols-3'
      )}
    >
      {skeletonItems.map((item) => (
        <Card
          key={`skeleton-card-${item}`}
          data-testid="skeleton-card"
          aria-label="Loading content placeholder"
          className={cn(
            // Layout & appearance
            'flex',
            'flex-col',
            'gap-4',
            'rounded-lg',
            'border',
            'border-gray-200',
            'bg-white',
            'p-4',
            'shadow-sm',
            // Animation classes with motion-safe and motion-reduce
            'motion-safe:animate-pulse',
            'motion-reduce:animate-none'
          )}
        >
          {/* Skeleton Bar #1: Full width */}
          <div
            className="h-4 w-full rounded bg-gray-200"
            data-testid="skeleton-bar-1"
          />
          {/* Skeleton Bar #2: ~75% width */}
          <div
            className="h-4 w-3/4 rounded bg-gray-200"
            data-testid="skeleton-bar-2"
          />
          {/* Skeleton Bar #3: ~50% width */}
          <div
            className="h-4 w-1/2 rounded bg-gray-200"
            data-testid="skeleton-bar-3"
          />
        </Card>
      ))}
    </main>
  );
}