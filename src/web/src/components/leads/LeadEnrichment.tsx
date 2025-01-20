/** 
 * LeadEnrichment.tsx
 * -------------------------------------------------------------------
 * A React component that handles AI-powered enrichment for lead data
 * using OpenAI integration. It provides company and contact information
 * enrichment capabilities with real-time updates, enhanced error handling,
 * retry mechanisms, and basic rate limiting safeguards. Integrates with 
 * existing hooks for lead management (useLeads) and toast notifications 
 * (useToast).
 *
 * External Dependencies:
 *   - react ^18.2.0 (Core React functionality)
 *   - @tanstack/react-query ^5.0.0 (For mutation hook)
 *
 * Internal Dependencies:
 *   - { Lead } from '../../types/lead'    [id: string, companyData: CompanyData]
 *   - Button from '../ui/Button'          [variant: string, isLoading: boolean props]
 *   - { useLeads } from '../../hooks/useLeads'   [updateLead function]
 *   - { useToast } from '../../hooks/useToast'   [showToast function]
 *
 * JSON Specification Requirements (Class Outline / Steps):
 *   Class Name: LeadEnrichment
 *   Properties:
 *     - isEnriching: boolean
 *     - error: Error | null
 *     - retryCount: number
 *     - rateLimitRemaining: number
 *
 *   Functions:
 *     - handleEnrichment:
 *         1. Check rate limit remaining
 *         2. Validate lead data completeness
 *         3. Implement optimistic update
 *         4. Call backend enrichment API
 *         5. Handle specific error codes
 *         6. Implement retry mechanism for recoverable errors
 *         7. Update lead with enriched data
 *         8. Show detailed success/error toast
 *         9. Update rate limit counters
 *        10. Log enrichment metrics
 *        11. Call onEnrichmentComplete callback
 *
 *     - handleRetry:
 *         1. Check retry count against maximum
 *         2. Implement exponential backoff
 *         3. Attempt re-enrichment
 *         4. Update retry metrics
 *
 *     - render (functional approach):
 *         1. Render enrichment button with rate limit info
 *         2. Show detailed loading state during enrichment
 *         3. Display current enrichment status and progress
 *         4. Show retry button for failed attempts
 *         5. Display rate limit warnings
 *         6. Handle and display specific error states
 *
 * Exports:
 *   default React.FC<LeadEnrichmentProps> named "LeadEnrichment"
 * -------------------------------------------------------------------
 */

import React, { useState, useCallback } from 'react';
// @tanstack/react-query ^5.0.0
import { useMutation } from '@tanstack/react-query';
// Internal imports
import { Lead } from '../../types/lead'; // Only using: id (string), companyData (CompanyData)
import Button from '../ui/Button';       // { variant, isLoading }
import { useLeads } from '../../hooks/useLeads'; // { updateLead }
import { useToast } from '../../hooks/useToast'; // { showToast }

/**
 * The props for the LeadEnrichment component.
 * 
 * @interface LeadEnrichmentProps
 * @property {Lead} lead - The lead object to be enriched (only id, companyData needed).
 * @property {Function} onEnrichmentComplete - Callback invoked when enrichment finishes.
 */
interface LeadEnrichmentProps {
  lead: Pick<Lead, 'id' | 'companyData'>;
  onEnrichmentComplete: (updatedData: Record<string, unknown>) => void;
}

/**
 * The LeadEnrichment component internal state fields as described:
 * - isEnriching
 * - error
 * - retryCount
 * - rateLimitRemaining
 */
export interface LeadEnrichmentState {
  isEnriching: boolean;
  error: Error | null;
  retryCount: number;
  rateLimitRemaining: number;
}

/**
 * Mock function simulating a backend AI enrichment API call to GPT-4 or similar service.
 * In a real environment, this would be replaced with actual network calls 
 * (e.g., fetch/axios to your server endpoint or direct OpenAI usage).
 * 
 * @param {string} leadId - The unique lead identifier.
 * @returns {Promise<Record<string, unknown>>} - AI-enriched data for the lead.
 */
async function aiEnrichmentApi(leadId: string): Promise<Record<string, unknown>> {
  // Simulate some random outcomes for demonstration
  return new Promise((resolve, reject) => {
    const artificialDelay = Math.floor(Math.random() * 1800) + 400; // ~400-2200ms
    setTimeout(() => {
      // 20% chance of error, 10% chance specifically to simulate rate limit
      const randomOutcome = Math.random();
      if (randomOutcome < 0.1) {
        // Simulate rate limit / 429 error
        const rateLimitError = new Error('Rate limit exceeded');
        (rateLimitError as any).status = 429;
        return reject(rateLimitError);
      }
      if (randomOutcome < 0.3) {
        // Simulate general error
        return reject(new Error('AI enrichment service failed unexpectedly.'));
      }
      // Otherwise, success path: return some enriched data
      resolve({
        enrichedIndustry: 'Artificial Intelligence',
        enrichedRevenue: '50M',
        gptRecommendation: 'High-value lead with strong tech synergy',
        leadId,
      });
    }, artificialDelay);
  });
}

/**
 * The main React functional component implementing the full specification:
 *   - Provides an interface to enrich a lead with AI data
 *   - Incorporates real-time status, error handling, retries, and rate limiting
 *   - Exports default as React.FC<LeadEnrichmentProps>
 */
const LeadEnrichment: React.FC<LeadEnrichmentProps> = ({ lead, onEnrichmentComplete }) => {
  // -------------------------------------------------------------------------------------------
  // State variables fulfilling the property requirements
  // -------------------------------------------------------------------------------------------
  const [isEnriching, setIsEnriching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(3); 
  // Here, we assume a small hypothetical limit of 3 calls left.

  // -------------------------------------------------------------------------------------------
  // Hooks for lead updates and notifications
  // -------------------------------------------------------------------------------------------
  const { updateLead } = useLeads(); 
  const { showToast } = useToast();

  // -------------------------------------------------------------------------------------------
  // 1) handleEnrichment: The main AI enrichment process
  // -------------------------------------------------------------------------------------------
  const enrichmentMutation = useMutation(aiEnrichmentApi, {
    onMutate: async (enrichTargetId) => {
      // Step 3: Implement optimistic update if desired:
      // For demonstration, we just log that we are about to mutate.
      // Real usage could do an immediate partial 'updateLead' call if you want a local change.
      // eslint-disable-next-line no-console
      console.log('Optimistic update attempt for Enrichment:', enrichTargetId);
      setIsEnriching(true);
      setError(null);
    },
    onSuccess: async (data, enrichTargetId) => {
      // Step 7: Update lead with enriched data
      // For demonstration, we assume the new data merges into the lead object.
      await updateLead(enrichTargetId, {
        // We might store the GPT recommendation or new fields in companyData
        companyName: lead.companyData?.website ?? 'Unknown',
        // Provide placeholder for illustration; real usage merges data as appropriate
      });

      // Step 8: Show success toast
      showToast({
        variant: 'success',
        title: 'Enrichment Complete',
        description: `Lead ${enrichTargetId} has been successfully enriched.`,
      });

      // Step 9: Update rate limit counters (artificially decrement by 1)
      setRateLimitRemaining((prev) => Math.max(prev - 1, 0));

      // Step 10: Log enrichment metrics
      // eslint-disable-next-line no-console
      console.log('AI Enrichment success. Metrics logged.', data);

      // Step 11: Call onEnrichmentComplete callback
      onEnrichmentComplete(data);
    },
    onError: async (err: any, enrichTargetId) => {
      setError(err);
      // Step 5: Handle specific error codes, e.g., 429 for rate limit
      if (err?.status === 429 || /limit/i.test(err?.message ?? '')) {
        showToast({
          variant: 'error',
          title: 'Rate Limit Exceeded',
          description: `Enrichment cannot proceed. Try again later. ${err.message || ''}`,
        });
      } else {
        showToast({
          variant: 'error',
          title: 'Enrichment Failed',
          description: err?.message || 'Unknown AI Enrichment error occurred.',
        });
      }
      setIsEnriching(false);
    },
    onSettled: () => {
      // Clear isEnriching once everything is done or failed
      setIsEnriching(false);
    },
  });

  /**
   * handleEnrichment 
   * -------------------------------------------------------------------
   * Orchestrates the main steps as specified in the JSON. This function:
   * 1. Checks rate limit
   * 2. Validates lead data completeness (demo check)
   * 3. Implements optimistic updates (via onMutate in the useMutation)
   * 4. Calls the backend AI enrichment API
   * 5. Handles specific error codes (done in onError)
   * 6. Implements a retry mechanism if certain errors occur (delegated or with handleRetry)
   * 7. Updates lead with enriched data (in onSuccess)
   * 8. Shows success/error toast (in onSuccess / onError)
   * 9. Updates rate limit counters (onSuccess)
   * 10. Logs enrichment metrics (onSuccess)
   * 11. Calls onEnrichmentComplete (onSuccess)
   */
  const handleEnrichment = useCallback(async (): Promise<void> => {
    // Step 1: Check rate limit
    if (rateLimitRemaining <= 0) {
      showToast({
        variant: 'error',
        title: 'Enrichment Blocked',
        description: 'Rate limit reached. Please wait before trying again.',
      });
      return;
    }

    // Step 2: Validate lead data completeness (check ID)
    if (!lead?.id) {
      showToast({
        variant: 'warning',
        title: 'Invalid Lead Data',
        description: 'Cannot enrich a lead without a valid ID.',
      });
      return;
    }

    try {
      // Step 4: Actually call the backend enrichment API (through useMutation)
      enrichmentMutation.mutate(lead.id);
    } catch (err: any) {
      setError(err);
      showToast({
        variant: 'error',
        title: 'Unexpected Error',
        description: err?.message || 'Unable to start enrichment.',
      });
      setIsEnriching(false);
    }
  }, [lead?.id, rateLimitRemaining, showToast, enrichmentMutation, lead]);

  // -------------------------------------------------------------------------------------------
  // 2) handleRetry: Manages retry attempts for failed enrichment
  // -------------------------------------------------------------------------------------------
  const handleRetry = useCallback(async (): Promise<void> => {
    // Step 1: Check retry count against maximum (arbitrary max of 3)
    const maxRetries = 3;
    if (retryCount >= maxRetries) {
      showToast({
        variant: 'warning',
        title: 'Max Retries Reached',
        description: 'No more retry attempts allowed for this lead.',
      });
      return;
    }

    // Step 2: Implement a simple exponential backoff
    // E.g., 500ms * 2^retryCount
    const backoffMs = 500 * Math.pow(2, retryCount);
    await new Promise((res) => setTimeout(res, backoffMs));

    // Step 3: Attempt re-enrichment
    setRetryCount((prev) => prev + 1);
    await handleEnrichment();

    // Step 4: Update retry metrics
    // This is a placeholder for advanced logging or state updates
    // eslint-disable-next-line no-console
    console.log('Retry attempt number:', retryCount + 1);
  }, [retryCount, handleEnrichment, showToast]);

  // -------------------------------------------------------------------------------------------
  // 3) render function approach: produce the JSX
  // -------------------------------------------------------------------------------------------
  const renderEnrichmentUI = (): JSX.Element => {
    /**
     * 1. Render enrichment button with rate limit info
     * 2. Show loading state if isEnriching
     * 3. Display status or error
     * 4. Show retry button if there's an error
     * 5. Display warnings if rate limit is low
     * 6. Handle and display specific error states
     */
    return (
      <div className="p-4 border border-gray-200 rounded-md shadow-sm max-w-md">
        <h3 className="text-lg font-semibold mb-2">AI Enrichment</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enhance lead <span className="font-medium">#{lead.id}</span> with AI insights.
        </p>

        {/* (1) The main Enrich button */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            isLoading={isEnriching}
            onClick={handleEnrichment}
            disabled={isEnriching || rateLimitRemaining <= 0}
          >
            {isEnriching ? 'Enriching...' : 'Enrich Now'}
          </Button>

          {/* (5) Rate limit info/warning */}
          {rateLimitRemaining <= 1 ? (
            <span className="text-red-600 text-sm">
              Nearly out of enrichment attempts. (Remaining: {rateLimitRemaining})
            </span>
          ) : (
            <span className="text-gray-500 text-sm">
              Rate Limit: {rateLimitRemaining} left
            </span>
          )}
        </div>

        {/* (3) Display status or error */}
        {error && (
          <div className="mt-3 text-sm text-red-600">
            <p>Error: {error.message}</p>
          </div>
        )}

        {/* (4) Retry button if there's an error */}
        {error && (
          <Button
            variant="outline"
            className="mt-3"
            onClick={handleRetry}
            disabled={isEnriching}
          >
            Retry Enrichment
          </Button>
        )}

        {/* Additional debugging info about retries */}
        {retryCount > 0 && (
          <p className="mt-2 text-xs text-yellow-600">
            Retry Attempts: {retryCount}
          </p>
        )}
      </div>
    );
  };

  // Return the final UI structure
  return renderEnrichmentUI();
};

export default LeadEnrichment;