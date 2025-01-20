'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  SyntheticEvent,
} from 'react';
// react ^18.2.0

import { useParams } from 'next/navigation'; // next/navigation ^14.0.0
import { ErrorBoundary } from 'react-error-boundary'; // react-error-boundary ^4.0.0

// Local UI Components
import { Tabs } from '@/components/ui/Tabs'; // workspace:*
import SequenceBuilder from '@/components/sequences/SequenceBuilder'; // from src/web/src/components/sequences/SequenceBuilder
import SequenceTimeline from '@/components/sequences/SequenceTimeline'; // from src/web/src/components/sequences/SequenceTimeline

// Hooks
import { useSequences } from '@/hooks/useSequences'; // from src/web/src/hooks/useSequences

// Types
import type { Metadata } from 'next';
import type { Sequence } from '@/types/sequence';

/**
 * generateMetadata
 * ---------------------------------------------------------------------------
 * Dynamically builds page metadata for the sequence details page,
 * including SEO-optimized title, description, and OpenGraph tags.
 * Steps:
 *  1) Extract sequence ID from params
 *  2) Fetch sequence details from a hypothetical API
 *  3) Generate SEO-friendly title and description
 *  4) Add OpenGraph metadata for social sharing
 *  5) Return complete metadata object
 */
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const { id } = params;
  // Hypothetical fetch to retrieve basic name info
  let seqName = `Sequence ${id}`;
  try {
    const res = await fetch(`https://example.com/api/sequences/${id}`, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data: Partial<Sequence> = await res.json();
      if (data.name) {
        seqName = data.name;
      }
    }
  } catch {
    // Fallback if fetch fails
  }

  const description = `Detailed information and performance metrics for sequence "${seqName}".`;

  return {
    title: `Sequence: ${seqName}`,
    description,
    openGraph: {
      title: `Sequence: ${seqName}`,
      description,
      url: `https://example.com/sequences/${id}`,
    },
  };
}

/**
 * SequenceDetailsPage
 * ---------------------------------------------------------------------------
 * Main page component displaying and managing details about a specific email
 * sequence with real-time updates, timelines, step builder, and performance metrics.
 * Implements:
 *  1) Extract sequence ID from route params
 *  2) Initialize sequence data with useSequences
 *  3) Set up real-time updates (in the hook)
 *  4) Initialize tab state with React.useState
 *  5) Implement memoized callback handlers for performance
 *  6) Handle optimistic updates
 *  7) Implement error recovery
 *  8) Render sequence builder with drag-and-drop
 *  9) Display interactive timeline visualization
 * 10) Show real-time performance metrics
 * 11) Implement accessibility features
 * 12) Clean up subscriptions on unmount if necessary
 */
export default function SequenceDetailsPage(
  { params }: { params: { id: string } }
): JSX.Element {
  // (1) Extract sequence ID
  const routeParams = useParams();
  const sequenceId = params?.id || routeParams?.id || '';

  // (2) Initialize data from our sequences hook
  //     Typically you might pass sequenceId to a specialized hook or filter the array.
  const { sequences, analytics } = useSequences(sequenceId, {});
  const [sequence, setSequence] = useState<Sequence | null>(null);

  // (4) Initialize a basic tab for demonstration
  const [activeTab, setActiveTab] = useState<string>('builder');

  // Filter or find the matching sequence from sequences array
  useEffect(() => {
    if (sequences && sequences.length > 0) {
      const found = sequences.find((s) => s.id === sequenceId);
      if (found) {
        setSequence(found);
      }
    }
  }, [sequences, sequenceId]);

  // (5) Memoized error handler
  const onError = useCallback((error: Error) => {
    /* Basic fallback or logging */
    console.error('SequenceDetailsPage error:', error);
  }, []);

  // (6) & (7) are integrated within the SequenceBuilder or SequenceTimeline 
  // components, which handle optimistic updates and error boundaries.

  // (10) & (11) Real-time performance metrics and accessibility are 
  // considered throughout the UI. The analytics object can be displayed
  // or used for advanced metrics. We'll do a simple display below.

  // (12) If we needed unmount cleanup, we'd implement it here:
  // useEffect(() => {
  //   return () => {
  //     // e.g., unsubscribe from services
  //   };
  // }, []);

  return (
    <ErrorBoundary
      onError={onError}
      fallbackRender={({ error }) => (
        <div className="p-4 text-red-500">
          <p className="font-semibold">Error Loading Sequence Details:</p>
          <pre>{error.message}</pre>
        </div>
      )}
    >
      <div className="w-full h-full flex flex-col p-4" aria-label="Sequence Details Page">
        <h1 className="text-xl font-bold mb-2">
          Sequence Details
        </h1>

        {sequence ? (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Viewing details for Sequence: <strong>{sequence.name}</strong>
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Loading sequence data...</p>
        )}

        {/* Simple Tabs for switching view */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          tabs={[
            { label: 'Builder', value: 'builder' },
            { label: 'Timeline', value: 'timeline' },
            { label: 'Metrics', value: 'metrics' },
          ]}
        />

        {/* Tab Panels */}
        <div className="mt-4">
          {activeTab === 'builder' && sequence && (
            <SequenceBuilder
              sequenceId={sequence.id}
              onSave={async (updatedSeq) => {
                // Could handle final persist or show a toast
                console.log('Sequence saved:', updatedSeq.name);
              }}
              analyticsEnabled={true}
            />
          )}

          {activeTab === 'timeline' && sequence && (
            <SequenceTimeline
              sequence={sequence}
              onUpdate={(updatedSequence) => {
                // Just update local state for demonstration
                setSequence(updatedSequence);
              }}
              onError={onError}
            />
          )}

          {activeTab === 'metrics' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Real-Time Metrics</h2>
              {analytics ? (
                <div className="text-sm space-y-1">
                  <p>Total Sequences in Campaign: {analytics.totalSequences}</p>
                  <p>Active Sequences: {analytics.activeSequences}</p>
                  <p>Avg. Open Rate: {analytics.averageOpenRate.toFixed(2)}%</p>
                  <p>Avg. Click Rate: {analytics.averageClickRate.toFixed(2)}%</p>
                  <p>Total Conversions: {analytics.totalConversions}</p>
                </div>
              ) : (
                <p>No analytics available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}