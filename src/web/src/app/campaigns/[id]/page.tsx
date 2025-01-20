"use client";
/*************************************************************************************************
 * File: src/web/src/app/campaigns/[id]/page.tsx
 * 
 * Next.js page component for managing and displaying detailed campaign information. Incorporates:
 *  - Real-time data updates (via useCampaigns' polling or WebSocket expansions)
 *  - Optimistic UI for campaign updates
 *  - Error boundary for graceful fallback
 *  - Integration of CampaignForm (for editing) and CampaignMetrics (for analytics display)
 * 
 * Requirements Addressed (from JSON Specification):
 *  1) Campaign Management (Core Features/Email Automation)
 *  2) Analytics (Core Features/Analytics)
 * 
 * Implementation Steps:
 *  1) Extract campaign ID from route parameters using useParams
 *  2) Initialize optional real-time updates with the useCampaigns hook
 *  3) Fetch and manage initial campaign data, including error handling
 *  4) Set up optimistic updates for campaign modifications (handleCampaignUpdate)
 *  5) Render a loading skeleton or fallback UI while data is loading
 *  6) Wrap main content in an ErrorBoundary for robust error recovery
 *  7) Render the CampaignForm with validation
 *  8) Display real-time metrics using CampaignMetrics
 *  9) Clean up resources on unmount (the useCampaigns hook manages its intervals)
 *************************************************************************************************/

/* External Imports (with library versions) */
import React, { useCallback, useEffect, useState } from "react"; // react ^18.2.0
import { useParams } from "next/navigation"; // next/navigation ^14.0.0
import { ErrorBoundary } from "react-error-boundary"; // react-error-boundary ^4.0.0

/* Internal Imports */
import { useToast } from "@/hooks/useToast"; // workspace:*
import CampaignForm from "@/components/campaigns/CampaignForm";
import CampaignMetrics from "@/components/campaigns/CampaignMetrics";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { Campaign } from "@/types/campaign";

/*************************************************************************************************
 * FallbackUI Component
 * Minimal fallback UI displayed by the ErrorBoundary upon uncaught errors.
 *************************************************************************************************/
function FallbackUI() {
  return (
    <div className="p-4 bg-red-50 text-red-700 border border-red-500 rounded">
      <h1 className="text-lg font-semibold">An unexpected error occurred</h1>
      <p>Please try refreshing the page or contact support if the issue persists.</p>
    </div>
  );
}

/*************************************************************************************************
 * handleCampaignUpdate
 * 
 * Handles campaign form submissions with:
 *  1) Basic validation of updated data
 *  2) Optimistic UI update via updateCampaign
 *  3) Success/failure feedback with toast notifications
 *  4) Automatic data refreshing
 * 
 * Steps from JSON Spec for "handleCampaignUpdate":
 *  1) Validate updated campaign data
 *  2) Apply optimistic update to UI
 *  3) Call updateCampaign with retry logic
 *  4) Handle success with toast
 *  5) Implement error recovery on failure
 *  6) Refresh campaign data after successful update
 *  7) Update metrics display with new data (also covered by re-fetch or real-time approach)
 *************************************************************************************************/
async function handleCampaignUpdate(
  updatedCampaign: Campaign,
  updateFn: (id: string, changes: Partial<Campaign>) => Promise<Campaign>,
  toastFn: ReturnType<typeof useToast>,
  refetchFn: () => void
): Promise<void> {
  try {
    // 1) Basic validation; ensuring we at least have a name
    if (!updatedCampaign.name || !updatedCampaign.name.trim()) {
      throw new Error("Campaign name is required.");
    }

    // 2) & 3) Optimistic update is handled in updateFn, then we call the server
    const changes: Partial<Campaign> = { ...updatedCampaign };
    const result = await updateFn(updatedCampaign.id, changes);

    // 4) On success, show success toast
    toastFn.success(`Campaign "${result.name}" updated successfully!`);

    // 6) & 7) Refresh campaign data/metrics
    refetchFn();
  } catch (error) {
    // 5) Error recovery with toast
    const message =
      (error as Error)?.message || "An unknown error occurred while updating.";
    toastFn.error(message);
    throw error;
  }
}

/*************************************************************************************************
 * CampaignPage
 * 
 * Main page component for displaying and managing a campaign, fulfilling the JSON specification.
 * 
 * Implementation Outline:
 *  1) Extract campaign ID from route parameters
 *  2) Initialize the useCampaigns hook for real-time updates
 *  3) Fetch initial campaign data using fetchCampaigns
 *  4) Retrieve the campaign by ID from the store
 *  5) Handle loading and error states with a fallback or skeleton
 *  6) Wrap major UI in ErrorBoundary
 *  7) Render CampaignForm for editing
 *  8) Display real-time metrics with CampaignMetrics
 *  9) Clean up intervals (handled by useCampaigns) on unmount
 *************************************************************************************************/
function CampaignPage(): JSX.Element {
  // 1) Extract campaign ID from route parameters
  const params = useParams();
  const campaignId = (params?.id as string) || "";

  // Toast notification system
  const toast = useToast();

  // 2) Initialize useCampaigns for real-time data. We pass a realTimeInterval for demonstration
  const {
    campaigns,
    fetchCampaigns,
    getCampaignById,
    updateCampaign,
    loading,
    error,
  } = useCampaigns({ realTimeInterval: 20000, onError: (err) => toast.error(String(err)) });

  // 3) On mount, fetch the list of campaigns to populate the store. If needed, we can filter
  useEffect(() => {
    void fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4) Retrieve the campaign from store data
  const campaign = getCampaignById(campaignId);

  // 5) Basic loading or fallback check
  if (!campaign && loading) {
    // Minimal skeleton
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    );
  }

  // 6) Wrap main content in ErrorBoundary for robust error handling
  return (
    <ErrorBoundary FallbackComponent={FallbackUI}>
      <div className="w-full px-4 py-6 space-y-6">
        {/* If there's a known error but not in loading, display it */}
        {error && !loading && (
          <div className="p-4 bg-red-100 text-red-700 rounded border border-red-300">
            <p>
              <strong>Error:</strong> {(error as Error)?.message || String(error)}
            </p>
          </div>
        )}

        {/* 7) CampaignForm for editing campaign details */}
        {campaign && (
          <CampaignForm
            campaign={campaign}
            onSubmit={async (updatedData) =>
              handleCampaignUpdate(
                updatedData,
                updateCampaign,
                toast,
                () => void fetchCampaigns()
              )
            }
          />
        )}

        {/* 8) CampaignMetrics for real-time metrics */}
        {campaign && (
          <CampaignMetrics campaignId={campaign.id} className="mt-4" />
        )}
      </div>
    </ErrorBoundary>
  );
}

/*************************************************************************************************
 * Export
 *************************************************************************************************/
export default CampaignPage;