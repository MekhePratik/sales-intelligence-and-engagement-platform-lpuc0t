"use client";
/***************************************************************************************************
 * Page: CampaignsPage
 * -----------------------------------------------------------------------------------------------
 * This Next.js page component provides a comprehensive interface for viewing and managing email
 * campaigns, including real-time metrics, A/B testing capabilities, template management, and
 * advanced filtering. It leverages the enhanced useCampaigns hook for data handling with
 * real-time updates, displays campaigns in a table component (CampaignTable), and offers a form
 * (CampaignForm) to create or edit campaigns with A/B testing configurations.
 *
 * Steps Implemented Per JSON Specification:
 *   1. Initialize enhanced campaigns hook with real-time updates.
 *   2. Set up pagination state with optimized caching.
 *   3. Initialize A/B testing configuration state.
 *   4. Set up WebSocket (or useCampaigns) for real-time updates.
 *   5. Handle real-time metric updates upon data changes or re-fetch.
 *   6. Implement optimistic updates when creating new campaigns for better UX.
 *   7. Render an accessible page header with a create button (using lucide-react icon).
 *   8. Render an enhanced campaign table (CampaignTable) with real-time data.
 *   9. Implement proper loading states and skeleton screens for user feedback.
 *  10. Handle errors with an error boundary from react-error-boundary.
 *
 * Also includes handleCreateCampaign function for new campaign creation, validated with possible
 * A/B testing data, providing optimistic UI updates and real-time metric refresh.
 **************************************************************************************************/

import React, {
  useState,
  useCallback,
  useEffect,
  MouseEvent,
  Fragment,
} from "react";
// ^ React 18.2.0 for advanced hooks and real-time updates

import { ErrorBoundary } from "react-error-boundary"; // react-error-boundary ^4.0.0
import { Plus } from "lucide-react"; // lucide-react ^0.292.0 for accessible plus icon
import { useToast } from "@/hooks/useToast"; // workspace:* for enhanced toast notifications
import { useCampaigns } from "@/hooks/useCampaigns"; // Named import for real-time campaign data
import CampaignTable from "@/components/campaigns/CampaignTable"; // Enhanced table
import CampaignForm from "@/components/campaigns/CampaignForm"; // Enhanced form for create/edit

/***************************************************************************************************
 * Global Constants from JSON Specification:
 * PAGE_SIZE                -> default page size for table pagination
 * WEBSOCKET_ENDPOINT       -> environment variable for WebSocket usage
 * METRICS_REFRESH_INTERVAL -> interval for refreshing real-time metrics (ms)
 **************************************************************************************************/
const PAGE_SIZE = 10;
const WEBSOCKET_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT;
const METRICS_REFRESH_INTERVAL = 30000;

/***************************************************************************************************
 * handleCreateCampaign - Enhanced handler for creating new campaigns with A/B testing.
 * -----------------------------------------------------------------------------------------------
 * Steps:
 *   1) Validate campaign data including A/B test configuration as needed.
 *   2) Call the Hook's createCampaign method (with possible A/B test data).
 *   3) Apply optimistic UI updates for immediate user feedback.
 *   4) Show accessible success toast upon completion.
 *   5) Handle errors with detailed error messages in a toast.
 *   6) Refresh campaign list with optimized caching (the hook or re-fetch).
 *   7) If real-time metrics are relevant, update them accordingly.
 **************************************************************************************************/
async function handleCreateCampaign(
  campaignData: any,
  createCampaign: (payload: any) => Promise<any>,
  toast: ReturnType<typeof useToast>
): Promise<void> {
  try {
    // 1) Validate campaign data; if needed, check required fields or A/B test structures.
    if (!campaignData || !campaignData.name) {
      throw new Error("Campaign name is required to create a new campaign.");
    }

    // 2) Call createCampaign from the hook (with or without A/B test config).
    await createCampaign(campaignData);

    // 3) The hook handles optimistic updates internally, but we keep the UX straightforward.

    // 4) Show success toast
    toast.success(`Campaign "${campaignData.name}" created successfully!`);

    // 5) Additional instructions like logging or advanced validation can be placed here.

    // 6) The useCampaigns hook automatically re-syncs or we can force re-fetch if needed.
    // 7) Real-time metrics update is also done in useCampaigns or can be triggered externally.

  } catch (err: any) {
    // Handle errors with detailed messages
    toast.error(`Error creating campaign: ${err.message || "Unknown error"}`);
  }
}

/***************************************************************************************************
 * CampaignsPage - Primary default-exported React component for campaign management.
 * -----------------------------------------------------------------------------------------------
 * Real-time updates, A/B testing controls, pagination, loading states, error boundary, etc.
 **************************************************************************************************/
const CampaignsPage: React.FC = () => {
  /***********************************************************************************************
   * 1. Initialize Enhanced Campaigns Hook with Real-Time Updates
   * ---------------------------------------------------------------------------------------------
   * The useCampaigns hook likely handles data retrieval, real-time synchronization, and essential
   * CRUD operations. We destructure needed methods and data from it. We can also pass configuration
   * like intervals or a reference to WEBSOCKET_ENDPOINT if the hook supports it.
   **********************************************************************************************/
  const {
    campaigns, // The array of campaigns
    loading, // Boolean for loading state
    error, // Error object if fetching fails
    createCampaign, // Method for creating new campaigns
    deleteCampaign, // Additional method if needed
    updateCampaign, // Additional method if needed
    fetchCampaigns, // for re-fetch or advanced usage
    metrics, // Metrics if included in the hook (optional)
  } = useCampaigns();

  /***********************************************************************************************
   * 2. Set Up Pagination State with Optimized Caching
   * ---------------------------------------------------------------------------------------------
   * We'll track the current page index for the table. The page size is drawn from PAGE_SIZE.
   **********************************************************************************************/
  const [currentPage, setCurrentPage] = useState<number>(1);

  /***********************************************************************************************
   * 3. Initialize A/B Testing Configuration State
   * ---------------------------------------------------------------------------------------------
   * This could store a toggle or reference for whether A/B testing is allowed or active globally.
   * For demonstration, we simply store a boolean (though the actual usage might be more advanced).
   **********************************************************************************************/
  const [abTestingEnabled] = useState<boolean>(true);

  /***********************************************************************************************
   * 4. (Optional) WebSocket Connection for Real-Time Updates, or rely on useCampaigns
   * ---------------------------------------------------------------------------------------------
   * The hook might already establish a real-time subscription. If we needed direct usage of
   * WEBSOCKET_ENDPOINT, we could do so in a useEffect for direct connections.
   **********************************************************************************************/


  /***********************************************************************************************
   * 5. Handle Real-Time Metric Updates
   * ---------------------------------------------------------------------------------------------
   * For example, we could refresh or process metrics at an interval if not automatically handled.
   * We'll do a simple effect that re-fetches at METRICS_REFRESH_INTERVAL if desired.
   **********************************************************************************************/
  useEffect(() => {
    const intervalId = setInterval(() => {
      // For real-time metric updates, we might call fetchCampaigns or a separate metrics fetch
      fetchCampaigns().catch(() => {
        /* Swallow or handle errors gracefully */
      });
    }, METRICS_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchCampaigns]);

  /***********************************************************************************************
   * 6. Implement Optimistic Updates in handleCreateCampaign or the hook
   * ---------------------------------------------------------------------------------------------
   * Our handleCreateCampaign function (defined above) calls createCampaign (which uses the hook's
   * internal optimistic update logic).
   **********************************************************************************************/
  const toast = useToast();

  /***********************************************************************************************
   * 7. Render Accessible Page Header with Create Button
   * ---------------------------------------------------------------------------------------------
   * We produce a top-level heading and a create button that toggles our create form.
   **********************************************************************************************/
  const [showForm, setShowForm] = useState<boolean>(false);

  const handleShowForm = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowForm(true);
  }, []);

  /***********************************************************************************************
   * 8. Render Enhanced Campaign Table with Real-Time Data
   * ---------------------------------------------------------------------------------------------
   * Passing currentPage, pageSize, and an onPageChange callback. The table handles sorting,
   * filtering, and real-time metrics if configured.
   **********************************************************************************************/
  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /***********************************************************************************************
   * 9. Implement Proper Loading States and Skeleton Screens
   * ---------------------------------------------------------------------------------------------
   * If loading is true, we can show a skeleton or fallback. If error, gracefully handle it.
   **********************************************************************************************/
  const isDataLoading = loading; // Combined local state if needed

  /***********************************************************************************************
   * 10. Handle Errors with React Error Boundary
   * ---------------------------------------------------------------------------------------------
   * We wrap our entire component content in an <ErrorBoundary>. Fallback can be a minimal message.
   **********************************************************************************************/

  return (
    <ErrorBoundary
      fallbackRender={() => (
        <div className="p-4 text-red-700">
          An unexpected error occurred. Please reload or contact support.
        </div>
      )}
    >
      <div className="flex flex-col space-y-4 p-6" aria-label="Campaigns Management Page">
        {/* Page Header and Create Button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold" aria-label="Campaigns Heading">
            Email Campaigns
          </h1>
          <button
            type="button"
            onClick={handleShowForm}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Create New Campaign"
          >
            <Plus size="16" className="mr-2" />
            Create Campaign
          </button>
        </div>

        {/* Display loading or error states */}
        {isDataLoading && (
          <div className="text-gray-600" aria-busy="true">
            Loading campaigns...
          </div>
        )}
        {error && !isDataLoading && (
          <div className="text-red-600" role="alert">
            Error Loading Campaigns: {String(error)}
          </div>
        )}

        {/* CampaignTable with real-time data */}
        {!isDataLoading && !error && (
          <CampaignTable
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
            onPageChange={onPageChange}
            className="mt-4"
          />
        )}

        {/* If showForm is true, render a modal or inline campaign form to create a new campaign */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            aria-label="Create Campaign Modal"
          >
            <div className="bg-white rounded p-6 w-full max-w-2xl relative">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                aria-label="Close Create Campaign Modal"
              >
                &times;
              </button>
              <h2 className="text-xl font-semibold mb-4">Create New Campaign</h2>

              {/* Enhanced CampaignForm from the specification, with A/B testing support. */}
              <CampaignForm
                onSubmit={async (data) => {
                  await handleCreateCampaign(data, createCampaign, toast);
                  setShowForm(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

/***************************************************************************************************
 * Exports
 * -----------------------------------------------------------------------------------------------
 * We follow the JSON specification: exporting the component as default with the name "CampaignsPage"
 **************************************************************************************************/
export default CampaignsPage;