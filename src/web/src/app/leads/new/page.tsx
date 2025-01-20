import React from 'react';
import type { Metadata } from 'next'; // next ^14.0.0
import { useRouter } from 'next/navigation'; // next/navigation ^14.0.0

/***************************************************************************************************
 * Internal Imports (IE1) - Satisfying JSON specification "imports" section
 * -------------------------------------------------------------------------------------------------
 * - Shell: default import from '../../../components/layout/Shell'
 * - LeadForm: default import from '../../../components/leads/LeadForm'
 * - useLeads -> we specifically import { createLead, LeadCreationError } from '../../../hooks/useLeads'
 * - useToast -> we specifically import { showToast } from '../../../hooks/useToast'
 **************************************************************************************************/
import Shell from '../../../components/layout/Shell';
import LeadForm from '../../../components/leads/LeadForm';
import { createLead, LeadCreationError } from '../../../hooks/useLeads';
import { showToast } from '../../../hooks/useToast';

/***************************************************************************************************
 * generateMetadata (IE3, S1, S2)
 * -------------------------------------------------------------------------------------------------
 * Generates Next.js metadata (v14.0.0) for the page. Includes:
 *  - Title, description
 *  - OpenGraph meta
 *  - Potential canonical or other SEO expansions
 *
 * Steps (from JSON specification):
 *  1. Return comprehensive metadata object with title and description
 *  2. Include OpenGraph metadata for social sharing
 *  3. Add canonical URL for SEO (omitted or placed if needed)
 **************************************************************************************************/
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'New Lead | B2B Sales Platform',
    description: 'Create a new lead with enriched data and real-time validation',
    openGraph: {
      title: 'Create New Lead - B2B Sales Platform',
      description: 'Add a new lead with automated data enrichment',
    },
  };
}

/***************************************************************************************************
 * handleLeadCreation (from JSON specification)
 * -------------------------------------------------------------------------------------------------
 * Enhanced handler for new lead creation with comprehensive error handling. The form itself initiates
 * the creation process, but on success, we pass the resulting lead to this function to:
 *  1) Validate final success state and show a success message
 *  2) Perform user feedback via screen readers (toast is ARIA-ready)
 *  3) Navigate to leads list route
 *  4) Handle specific error or navigation issues gracefully
 *  5) Log or track for monitoring
 *
 * @param formData - The fully created lead object from the LeadForm's onSuccess callback
 * @param router   - The Next.js router instance for navigation
 **************************************************************************************************/
async function handleLeadCreation(formData: unknown, router: ReturnType<typeof useRouter>): Promise<void> {
  try {
    // Steps: Show success toast for screen readers + user feedback
    showToast({
      variant: 'success',
      title: 'Lead Created',
      description: 'A new lead was successfully created.',
      sound: false,
      group: 'lead-creation',
    });

    // Navigate to /leads after successful creation
    router.push('/leads');
  } catch (navErr) {
    // Gracefully handle navigation errors
    console.error('Navigation error after lead creation:', navErr);
    // In a production environment, we might show a fallback message or retry
  }

  // Log or monitor the lead creation event
  // console.info('New lead creation completed:', formData);
}

/***************************************************************************************************
 * NewLeadPage (IE2, S1, S2)
 * -------------------------------------------------------------------------------------------------
 * Next.js page component for creating new leads with real-time validation and accessibility support.
 *
 * Steps from JSON specification:
 *  1) Initialize router for navigation handling
 *  2) Setup toast notifications with accessibility (already in handleLeadCreation)
 *  3) Render accessible page layout with the Shell wrapper
 *  4) Implement keyboard navigation or pass-through approach (the Shell + Next.js handle it)
 *  5) Provide error feedback and handle form submission with loading states
 *  6) Provide real-time data enrichment or validations through the LeadForm
 **************************************************************************************************/
export default function NewLeadPage(): JSX.Element {
  // 1) Initialize router for navigation
  const router = useRouter();

  return (
    <Shell className="min-h-screen bg-gray-50">
      {/* Landmark region for main content, focusing on WCAG 2.1 AA compliance */}
      <main
        id="main-content"
        aria-label="Create New Lead Section"
        className="max-w-screen-lg mx-auto px-4 py-8"
      >
        {/* Heading structure for better screen reader comprehension */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            Create a New Lead
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            Provide the details below to create a new lead with AI-powered data enrichment and real-time validation.
          </p>
        </header>

        {/* 5) & 6) The form checks data completeness, handles errors, and calls onSuccess. */}
        <LeadForm
          enableEnrichment
          onSuccess={(createdLead) => {
            // Pass the final lead object to our handleLeadCreation function
            void handleLeadCreation(createdLead, router);
          }}
        />
      </main>
    </Shell>
  );
}