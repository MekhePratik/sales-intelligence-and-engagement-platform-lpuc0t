import React, { FC, useEffect, useState, useCallback } from 'react'; // react ^18.2.0
import { useForm, FormProvider } from 'react-hook-form'; // react-hook-form ^7.45.0
import { z } from 'zod'; // zod ^3.22.0
import { zodResolver } from '@hookform/resolvers/zod'; // @hookform/resolvers/zod (implied version for zod ^3.22.0)
import { useToast } from '@/hooks/useToast'; // workspace:*

import Form, { FormField } from '../ui/Form';
import SequenceBuilder from '../sequences/SequenceBuilder';
import { Campaign, CampaignStatus } from '../../types/campaign';

// -----------------------------------------------------------------------------
// Additional enumerations or placeholders for missing items in the JSON spec
// (e.g., if "CampaignType" is required but not defined in campaign.ts).
// -----------------------------------------------------------------------------
export enum CampaignType {
  DRIP = 'DRIP',
  BROADCAST = 'BROADCAST',
  NURTURE = 'NURTURE',
}

// -----------------------------------------------------------------------------
// Placeholders for sub-schemas referenced in campaignSchema from the JSON spec.
// In a real system, these would be replaced with the actual definitions.
// -----------------------------------------------------------------------------
const sequenceStepSchema = z.object({
  // Example fields that define a single step in the campaign's email sequence
  id: z.string().uuid().optional(),
  stepType: z.string().default('EMAIL'),
  delayHours: z.number().optional(),
  content: z.string().optional(),
});

const campaignSettingsSchema = z.object({
  // Minimal placeholder settings, real usage might be more comprehensive
  sendingWindow: z.object({
    start: z.string().default('08:00'),
    end: z.string().default('17:00'),
  }).optional(),
  timezone: z.string().default('UTC'),
  maxEmailsPerDay: z.number().default(100),
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true),
  abTesting: z.boolean().default(false),
  retryStrategy: z.object({
    maxAttempts: z.number().default(3),
    delay: z.number().default(60),
  }).optional(),
  customHeaders: z.record(z.string()).optional(),
  securitySettings: z.object({
    dkimEnabled: z.boolean().default(false),
    spfEnabled: z.boolean().default(false),
  }).optional(),
}).optional();

const variantSchema = z.object({
  name: z.string().min(1).max(50),
  subject: z.string().max(200).optional(),
  body: z.string().optional(),
});

const metricSchema = z.object({
  name: z.string().min(1),
  value: z.number().default(0),
});

const goalSchema = z.object({
  goalName: z.string(),
  targetValue: z.number().optional(),
});

// -----------------------------------------------------------------------------
// The JSON specification's global campaignSchema reference
// This merges sub-schemas to form a robust structure for campaign data.
// -----------------------------------------------------------------------------
const campaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(CampaignType),
  status: z.nativeEnum(CampaignStatus).default(CampaignStatus.DRAFT),
  steps: z.array(sequenceStepSchema).default([]),
  settings: campaignSettingsSchema,
  abTest: z.object({
    enabled: z.boolean().default(false),
    variants: z.array(variantSchema).default([]),
    metrics: z.array(metricSchema).default([]),
  }),
  analytics: z.object({
    trackingEnabled: z.boolean().default(true),
    conversionGoals: z.array(goalSchema).default([]),
    roiMetrics: z.array(metricSchema).default([]),
  }),
  security: z.object({
    csrfToken: z.string(),
    rateLimit: z.number(),
    validationRetries: z.number(),
  }),
});

// -----------------------------------------------------------------------------
// Interface for the CampaignForm component props:
//   - campaign: optional existing campaign data to edit
//   - onSubmit: callback invoked when form is successfully submitted
// -----------------------------------------------------------------------------
export interface CampaignFormProps {
  campaign?: Campaign;
  onSubmit: (data: Campaign) => Promise<void>;
}

// -----------------------------------------------------------------------------
// The CampaignForm component (default export)
// Implements a form for creating/editing email campaigns with advanced features:
//   - Enhanced schema validation (Zod + react-hook-form)
//   - Sequence building (SequenceBuilder integration)
//   - A/B testing, analytics, and security placeholders from the JSON spec
//   - Real-time toast notifications for success/failure
// -----------------------------------------------------------------------------
const CampaignForm: FC<CampaignFormProps> = ({ campaign, onSubmit }) => {
  // Track local UI states (from the JSON specification)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isOptimistic, setIsOptimistic] = useState<boolean>(false);
  const [submissionAttempts, setSubmissionAttempts] = useState<number>(0);

  // Step 1 of constructor: Initialize form state using react-hook-form + zod
  // We fallback to a default object if no existing campaign is provided.
  const defaultValues = campaign || {
    name: '',
    description: '',
    type: CampaignType.DRIP,
    status: CampaignStatus.DRAFT,
    steps: [],
    settings: {},
    abTest: {
      enabled: false,
      variants: [],
      metrics: [],
    },
    analytics: {
      trackingEnabled: true,
      conversionGoals: [],
      roiMetrics: [],
    },
    security: {
      csrfToken: '',
      rateLimit: 5,
      validationRetries: 2,
    },
  };

  const methods = useForm<Campaign>({
    mode: 'onChange',
    resolver: zodResolver(campaignSchema),
    defaultValues,
  });

  const {
    handleSubmit: rhfHandleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = methods;

  const toast = useToast();

  // Step 2: Set up CSRF token validation (placeholder demonstration)
  const watchedSecurity = watch('security');
  useEffect(() => {
    if (!watchedSecurity || !watchedSecurity.csrfToken) {
      // Could show a warning or handle secure logic
    }
  }, [watchedSecurity]);

  // Step 3: Configure rate limiting (placeholder demonstration)
  useEffect(() => {
    if (watchedSecurity && watchedSecurity.rateLimit < 1) {
      // Adjust if needed, or enforce a minimum
      setValue('security.rateLimit', 1);
    }
  }, [watchedSecurity, setValue]);

  // Step 4: Initialize error boundary handlers
  // In a real app, we'd wrap this component with an ErrorBoundary
  // or use a separate library for error boundaries. Here we do minimal placeholders.

  // Step 5: Set up analytics tracking (placeholder demonstration)
  // You may incorporate advanced analytics capturing here.

  // Step 6: Configure A/B test parameters (placeholder)
  // If abTest is enabled, we might do additional logic, hooking into variants or metrics.

  // Step 7: Initialize accessibility features (placeholder)
  // This would typically involve advanced ARIA attributes or keyboard focus logic.

  // ---------------------------------------------------------------------------
  // handleSequenceUpdate
  // The method which receives updated steps from the SequenceBuilder. The JSON
  // specification includes advanced logic for validation, A/B test checks, analytics, etc.
  // ---------------------------------------------------------------------------
  const handleSequenceUpdate = useCallback(
    (updatedSteps: Array<unknown>) => {
      // 1) Validate sequence steps with sequenceStepSchema array
      const parsed = z.array(sequenceStepSchema).safeParse(updatedSteps);
      if (!parsed.success) {
        // If invalid, gather error info
        toast.error('Invalid sequence steps. Please review your configuration.');
        return;
      }

      // 2) Check A/B test compatibility if abTest is enabled
      const abTestEnabled = watch('abTest.enabled');
      if (abTestEnabled) {
        // Example placeholder logic: ensure steps count is within some limit
        if (parsed.data.length > 50) {
          toast.error('A/B testing sequences should not exceed 50 steps.');
          return;
        }
      }

      // 3) Update analytics tracking (placeholder)
      // Potentially call an analytics event or track usage. Here, just a console log:
      // console.log('[Analytics] Sequence steps updated.');

      // 4) Update form state with the new steps
      setValue('steps', parsed.data, { shouldValidate: true });

      // 5) Trigger form validation
      void trigger('steps');

      // 6) Update any accessibility attributes or re-focus logic (placeholder)
    },
    [setValue, toast, watch, trigger]
  );

  // ---------------------------------------------------------------------------
  // handleFormSubmission
  // The core submission handler that integrates the 10 steps from the JSON spec:
  // 1) Validate CSRF token
  // 2) Check rate limiting
  // 3) Validate form data
  // 4) Transform data if needed
  // 5) Apply optimistic updates
  // 6) Track analytics
  // 7) Call onSubmit
  // 8) Retry logic on failure
  // 9) Show notification
  // 10) Update A/B test metrics
  // ---------------------------------------------------------------------------
  const handleFormSubmission = useCallback(
    async (formData: Campaign) => {
      try {
        setIsLoading(true);
        setSubmissionAttempts((prev) => prev + 1);

        // 1) Validate CSRF token (placeholder check)
        if (!formData.security?.csrfToken) {
          throw new Error('Missing CSRF token.');
        }

        // 2) Check rate limiting: if submissionAttempts exceed rateLimit, block
        if (submissionAttempts >= (formData.security?.rateLimit || 5)) {
          throw new Error(
            'Rate limit exceeded. Please wait before attempting again.'
          );
        }

        // 3) Validate form data: already handled by zodResolver, but we can do extra checks here
        // For demonstration, assume zod has validated. If any critical field is empty, error out:
        if (!formData.name?.trim()) {
          throw new Error('Campaign name is required.');
        }

        // 4) Transform data if needed. Minimal example:
        const finalData: Campaign = {
          ...formData,
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
        };

        // 5) Apply optimistic updates
        setIsOptimistic(true);

        // 6) Track analytics event (placeholder)
        // console.log('[Analytics] Campaign form submission started.');

        // 7) Call onSubmit
        await onSubmit(finalData);

        // 8) No explicit multi-retry here, but we can handle a single failure scenario
        //    If an error occurs, the catch block will re-check submissionAttempts if needed.

        // 9) Show success notification
        toast.success(`Campaign "${finalData.name}" saved successfully!`);

        // 10) Update A/B test metrics placeholder
        // For demonstration, we might do a quick console log:
        // if (finalData.abTest?.enabled) {
        //   console.log('[A/B Testing] Updating variant metrics...');
        // }

        setIsOptimistic(false);
        setSubmissionAttempts(0);
      } catch (err) {
        // If error is encountered, either re-attempt or mark as error
        const message = (err as Error).message || 'Unknown submission error.';
        // If submissionAttempts < validationRetries, we could consider re-trying automatically
        const allowedRetries = watch('security.validationRetries');
        if (submissionAttempts < allowedRetries) {
          // We might do a partial retry or prompt the user to resend
          // For demonstration, show error but not automatically re-try
          toast.error(`Submission attempt failed: ${message}`);
        } else {
          toast.error(`Failed after multiple attempts: ${message}`);
        }
        setIsOptimistic(false);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    },
    [onSubmit, submissionAttempts, toast, watch]
  );

  // Decide if we are in "editing" mode or "creating" mode
  useEffect(() => {
    setIsEditing(!!campaign);
  }, [campaign]);

  return (
    <FormProvider {...methods}>
      <Form
        schema={campaignSchema}
        onSubmit={async () => {
          // The real submission is handled via handleFormSubmission to incorporate the steps
        }}
        className="w-full max-w-2xl mx-auto space-y-6"
      >
        {/* This is the main form layout. We rely on react-hook-form for actual submission */}
        <h2 className="text-xl font-bold">
          {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
        </h2>

        {/* Form Fields for name, description, type, status */}
        <FormField<Campaign>
          name="name"
          label="Campaign Name"
          placeholder="Enter a descriptive campaign name"
        />
        <FormField<Campaign>
          name="description"
          label="Description"
          placeholder="Brief campaign details..."
        />

        {/* Type and Status can be select fields or text inputs for demonstration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="text-sm font-medium text-gray-700">
              Campaign Type
            </label>
            <select
              id="type"
              className="mt-1 border rounded w-full p-2 text-sm"
              {...methods.register('type')}
            >
              {Object.values(CampaignType).map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className="text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status"
              className="mt-1 border rounded w-full p-2 text-sm"
              {...methods.register('status')}
            >
              {Object.values(CampaignStatus).map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sequence Builder Integration */}
        <div className="mt-4">
          <label className="text-sm font-semibold text-gray-800">
            Campaign Steps (Sequence)
          </label>
          <SequenceBuilder
            sequenceId={campaign?.id || 'new-campaign-sequence'}
            onSave={async () => {
              /* In real usage we'd save partial steps, but we rely on entire form submission */
            }}
            analyticsEnabled
            // We simulate receiving updated steps from handleSequenceUpdate
          />
          <button
            type="button"
            onClick={() => handleSequenceUpdate([])}
            className="text-xs mt-2 px-3 py-1 bg-gray-200 border rounded"
          >
            Simulate Sequence Update
          </button>
        </div>

        {/* Security and CSRF configuration example fields */}
        <h3 className="text-sm font-semibold mt-6">Security Controls</h3>
        <div className="grid grid-cols-3 gap-4">
          <FormField<Campaign>
            name="security.csrfToken"
            label="CSRF Token"
            placeholder="Token for XSRF protection"
          />
          <FormField<Campaign>
            name="security.rateLimit"
            label="Rate Limit"
            placeholder="Number of allowed submissions"
            type="number"
          />
          <FormField<Campaign>
            name="security.validationRetries"
            label="Validation Retries"
            placeholder="Allowed re-check attempts"
            type="number"
          />
        </div>

        {/* A/B Testing controls can be placed here if needed */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold">A/B Testing Configuration</h4>
          <div className="flex items-center space-x-2 mt-2">
            <input
              id="abtest-enabled"
              type="checkbox"
              {...methods.register('abTest.enabled')}
            />
            <label htmlFor="abtest-enabled" className="text-sm">
              Enable A/B Testing
            </label>
          </div>
        </div>

        {/* Submit button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={rhfHandleSubmit(handleFormSubmission)}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={isLoading || isOptimistic}
          >
            {isLoading || isOptimistic ? 'Saving...' : 'Save Campaign'}
          </button>
        </div>

        {/* Display top-level form errors if any */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-2 text-red-600 text-sm">
            Please correct the errors in the form before submitting.
          </div>
        )}
      </Form>
    </FormProvider>
  );
};

export default CampaignForm;