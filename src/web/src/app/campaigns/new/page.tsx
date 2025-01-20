"use client";
/***************************************************************************************************
 * Next.js 13 Client Component for Creating New Campaigns
 * -----------------------------------------------------------------------------------------------
 * File Path: src/web/src/app/campaigns/new/page.tsx
 *
 * Description:
 *   This file defines a Next.js page component named "NewCampaignPage" that provides a user
 *   interface for creating new email campaigns. It integrates form validation, sequence building,
 *   error handling, loading states, success notifications, and AI-augmented email automation
 *   (template management, sequence builder, A/B testing engine).
 *
 * Requirements Addressed (from JSON spec / "requirements_addressed"):
 *  1. Email Automation:
 *     - Template management
 *     - Sequence builder
 *     - A/B testing engine
 *  2. Campaign Management:
 *     - Campaign creation and configuration
 *     - Enhanced error handling and user feedback
 *
 * Implementation & Steps:
 *   1) Initialize Next.js "useRouter" for navigation after successful creation (with version comment).
 *   2) Retrieve "createCampaign" function from the "useCampaigns" hook for campaign creation.
 *   3) Initialize "toast" notifications from "useToast" hook for user feedback.
 *   4) Define an internal "handleCreateCampaign" async function that:
 *       - Validates form data (delegated to CampaignForm).
 *       - Shows a local loading state in the UI.
 *       - Invokes "createCampaign" with the validated form data.
 *       - Displays toast notifications for success or error.
 *       - Navigates to the campaigns list on success.
 *       - Catches and handles errors with user-friendly messages.
 *       - Resets loading after completion.
 *   5) Implement "NewCampaignPage" component with a Shell layout wrapper.
 *   6) Render the "CampaignForm" component, passing "handleCreateCampaign" as "onSubmit".
 *   7) Setup optional component unmount cleanup in a useEffect if needed (demonstration).
 *   8) Export "NewCampaignPage" as default, fulfilling the React.FC signature.
 *
 **************************************************************************************************/

import React, { useState, useEffect } from 'react'; // react ^18.2.0
import { useRouter } from 'next/navigation'; // next/navigation ^14.0.0

/***************************************************************************************************
 * Internal Imports (IE1) - For correct usage based on "imports" in JSON spec
 * -------------------------------------------------------------------------------------------------
 * - Shell (default) from '@/components/layout/Shell'
 * - CampaignForm (default) from '@/components/campaigns/CampaignForm'
 * - createCampaign, CampaignFormData (named) from '@/hooks/useCampaigns'
 * - toast (named) from '@/hooks/useToast'
 **************************************************************************************************/
import Shell from '@/components/layout/Shell';
import CampaignForm from '@/components/campaigns/CampaignForm';
import { createCampaign, CampaignFormData } from '@/hooks/useCampaigns';
import { toast } from '@/hooks/useToast';

/***************************************************************************************************
 * handleCreateCampaign
 * -------------------------------------------------------------------------------------------------
 * Description:
 *   Handles the submission of new campaign form data. Implements loading states, error handling,
 *   success feedback via toast notifications, and final navigation to the campaign list.
 *
 * Steps from JSON spec "handleCreateCampaign":
 *   1) Validate form data (already done by CampaignForm & typed as CampaignFormData).
 *   2) Show loading state in UI (controlled by the caller).
 *   3) Call createCampaign with validated form data.
 *   4) On success: show a success toast, navigate to /campaigns.
 *   5) On failure: catch and show an error toast with the message, reset loading.
 *   6) Cleanup local state after completion.
 **************************************************************************************************/
async function handleCreateCampaign(
  campaignData: CampaignFormData,
  setLoading: (val: boolean) => void,
  router: ReturnType<typeof useRouter>
): Promise<void> {
  // 1) (Form data is validated in <CampaignForm>.)
  // 2) Show loading state
  setLoading(true);

  // For demonstration, we track analytics events as requested:
  // "campaign_creation_started", "campaign_creation_completed", "campaign_creation_failed"
  // to highlight how analytics might be integrated:
  // e.g., console.log(`[Analytics] campaign_creation_started`);
  console.log('[Analytics] campaign_creation_started');

  try {
    // 3) Call createCampaign with the validated form data
    const created = await createCampaign(campaignData);

    // 4) On success, show success toast and navigate
    console.log('[Analytics] campaign_creation_completed');
    toast({
      variant: 'success',
      title: 'Campaign Created',
      description: `Campaign "${created.name}" has been successfully created.`,
    });
    router.push('/campaigns');
  } catch (error) {
    // 5) Catch errors, show an error toast
    console.log('[Analytics] campaign_creation_failed', error);
    const errorMessage =
      (error as Error)?.message || 'An unknown error occurred while creating the campaign.';
    toast({
      variant: 'error',
      title: 'Creation Failed',
      description: errorMessage,
    });
  } finally {
    // 6) Cleanup: reset loading state
    setLoading(false);
  }
}

/***************************************************************************************************
 * NewCampaignPage
 * -------------------------------------------------------------------------------------------------
 * Description:
 *   Main Next.js page component for creating a new email campaign. This component
 *   wraps content in a "Shell" layout, provides an instance of <CampaignForm>
 *   for data input, and integrates the "handleCreateCampaign" logic for creation.
 *
 * Steps from JSON spec "NewCampaignPage":
 *   1) Initialize router for navigation (useRouter).
 *   2) Manage local loading state for UI feedback.
 *   3) Setup optional side-effect for unmount cleanup if needed.
 *   4) Render page with Shell layout.
 *   5) Inside layout, place <CampaignForm> referencing "handleCreateCampaign" as onSubmit.
 *   6) Return the rendered page to Next.js.
 *
 * Exports:
 *   - default: NewCampaignPage as a React.FC
 **************************************************************************************************/
const NewCampaignPage: React.FC = () => {
  // 1) Initialize Next.js router
  const router = useRouter();

  // 2) Local loading state
  const [loading, setLoading] = useState<boolean>(false);

  // 3) Setup optional cleanup on unmount (demonstration)
  useEffect(() => {
    return () => {
      // In case we had event listeners or intervals to clear:
      // console.log('Cleanup on unmount for NewCampaignPage');
    };
  }, []);

  // Wrapping the "handleCreateCampaign" with local "setLoading" & "router"
  const onSubmitCampaign = async (data: CampaignFormData) => {
    await handleCreateCampaign(data, setLoading, router);
  };

  // 4) Render the Shell layout
  return (
    <Shell className="min-h-screen flex flex-col">
      {/* Provide a basic heading per design guidelines */}
      <header className="px-6 py-4 border-b dark:border-neutral-800">
        <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
          Create New Campaign
        </h1>
      </header>

      {/* 5) Render the CampaignForm to gather user input for a new campaign */}
      <main className="flex-1 p-6">
        <CampaignForm
          onSubmit={onSubmitCampaign}
          // The form is generic, we use "Campaign" or "CampaignFormData" as typed
          // If needed, we can pass "campaign" prop = undefined to indicate 'new'.
        />

        {/* Optionally display a loading indicator */}
        {loading && (
          <p className="mt-4 text-sm text-blue-600 dark:text-blue-300">
            Creating campaign, please wait...
          </p>
        )}
      </main>
    </Shell>
  );
};

/***************************************************************************************************
 * Final Export
 * -------------------------------------------------------------------------------------------------
 * According to the JSON specification, we must export NewCampaignPage as default
 * with the type React.FC, fulfilling advanced enterprise-level coding style and
 * thorough commentary for maintainability.
 **************************************************************************************************/
export default NewCampaignPage;