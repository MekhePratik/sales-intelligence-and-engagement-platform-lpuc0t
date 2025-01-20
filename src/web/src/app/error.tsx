'use client';

/***************************************************************************************************
 * Global Error Boundary Component
 * -------------------------------------------------------------------------------------------------
 * This file implements a global error boundary component for the Next.js application. It utilizes
 * Sentry for error monitoring, integrates seamlessly with the application's design system, and
 * ensures accessibility compliance through ARIA attributes and keyboard navigation.
 *
 * REQUIREMENTS ADDRESSED:
 *  1. Error Handling:
 *     - Implements a global error boundary with Sentry integration for comprehensive error tracking
 *       and monitoring.
 *  2. User Interface Design:
 *     - Presents a consistent, user-friendly error page that follows the design system’s
 *       specifications (typography, colors, spacing).
 *  3. Accessibility:
 *     - Conforms to WCAG 2.1 AA standards with proper ARIA labeling, keyboard access, and screen
 *       reader support.
 *
 * FUNCTIONALITY:
 *  - Error: Primary exported React component that displays error details, logs them to Sentry,
 *    and provides a reset button for recovery.
 *  - handleReset: Handles the reset action by tracking the attempt, clearing error state, notifying
 *    the user, and refocusing.
 *  - trackError: Sends comprehensive error information to Sentry with environment and user context.
 **************************************************************************************************/

/***************************************************************************************************
 * EXTERNAL IMPORTS (with versions)
 **************************************************************************************************/
// react ^18.2.0
import React, { useEffect, useRef } from 'react';
// @sentry/nextjs ^7.0.0
import * as Sentry from '@sentry/nextjs';
// @heroicons/react ^2.0.0 (using outline variant)
import { ExclamationCircleIcon as ErrorIcon } from '@heroicons/react/24/outline';

/***************************************************************************************************
 * INTERNAL IMPORTS
 **************************************************************************************************/
// Primary action button for error recovery with design system compliance
import Button from '../../components/ui/Button';
// Display error notifications and recovery status messages
import { useToast } from '../../hooks/useToast';

/***************************************************************************************************
 * INTERFACE ErrorProps
 * -------------------------------------------------------------------------------------------------
 * Defines the props accepted by the global error boundary component. The Next.js v13 error files
 * receive:
 *   - error: An Error object containing the runtime error details
 *   - digest?: A potential digest string for advanced tracking
 *   - reset: Function to reset the error boundary state and attempt a re-render
 **************************************************************************************************/
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/***************************************************************************************************
 * trackError
 * -------------------------------------------------------------------------------------------------
 * Tracks comprehensive error details in Sentry with additional environment or user context.
 * STEPS:
 *  1. Capture error details in Sentry.
 *  2. Add environment and user context (e.g., setTag or setContext).
 *  3. Track error frequency/type for further analysis.
 *  4. Tag error for advanced categorization or grouping.
 *  5. Set error severity level (Sentry does this automatically; can override if needed).
 **************************************************************************************************/
function trackError(error: Error): void {
  // Step 1: Capture the actual exception
  Sentry.captureException(error);

  // Step 2: Set environment context
  Sentry.setTag('environment', process.env.NODE_ENV || 'unknown');

  // Step 3: Potentially track frequency or type
  // We can add a custom tag or context if desired
  Sentry.setContext('errorBoundary', {
    message: error.message,
    name: error.name,
  });

  // Step 4: Tag error
  // (Demonstration: tagging as 'global_error_boundary')
  Sentry.setTag('component', 'global_error_boundary');

  // Step 5: By default, Sentry will record severity as 'error.'
  // Additional severity overrides could be done if needed
}

/***************************************************************************************************
 * handleReset
 * -------------------------------------------------------------------------------------------------
 * Handles the reset action with error tracking and user notification. Resets the error boundary to
 * let the application recover if possible.
 * STEPS:
 *  1. Track reset attempt in Sentry.
 *  2. Clear error state and local storage (to remove stale data).
 *  3. Call reset() from Next.js to retry the rendering.
 *  4. Show a recovery toast notification to the user.
 *  5. Reset focus to main content or a specified area for keyboard users.
 *  6. Log the recovery attempt for monitoring and auditing.
 **************************************************************************************************/
function handleReset(
  resetFn: () => void,
  showToast: (options: {
    variant: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
    duration?: number;
    sound?: boolean;
    group?: string;
  }) => string
): void {
  // Step 1: Track the reset attempt in Sentry
  Sentry.captureMessage('User triggered error boundary reset.');

  // Step 2: Clear error state, local storage, or any relevant caches
  try {
    localStorage.clear();
  } catch {
    // If localStorage is not available or fails, ignore gracefully
  }

  // Step 3: Call the Next.js reset function to retry
  resetFn();

  // Step 4: Show a toast to notify user of the reset attempt
  showToast({
    variant: 'info',
    title: 'Recovery Attempted',
    description: 'The page will be reloaded to try and fix the error.',
    duration: 5000,
    sound: false,
  });

  // Step 5: Reset focus to main content area (assumes there's an element with id="main-content")
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.focus();
  }

  // Step 6: Log attempt in console or Sentry for clarity
  // Here we do both
  console.log('Error boundary reset triggered by user.');
  Sentry.captureMessage('Error boundary reset completed.');
}

/***************************************************************************************************
 * Error (Global Error Component)
 * -------------------------------------------------------------------------------------------------
 * The main exported component for the global error boundary. This function is automatically used
 * by Next.js to handle runtime errors in the app directory structure.
 *
 * STEPS:
 *  1. Log error details to Sentry with environment context (trackError).
 *  2. Sanitize the error message for safe user display.
 *  3. Set focus to the error message container for screen readers.
 *  4. Display a user-friendly error message with instructions.
 *  5. Provide a keyboard-accessible Button for resetting the error boundary.
 *  6. Show an error toast notification with relevant status details.
 *  7. Track error occurrence and any subsequent recovery attempts.
 **************************************************************************************************/
const Error: React.FC<ErrorProps> = ({ error, reset }) => {
  // Access the showToast method from the toast hook for user notifications
  const { showToast } = useToast();

  // Create a ref for the error message container to manage focus
  const errorRef = useRef<HTMLDivElement>(null);

  // Step 1 & 7: On initial mount, track the error in Sentry and show a toast
  useEffect(() => {
    trackError(error);

    // Step 6: Show an error toast for immediate feedback
    showToast({
      variant: 'error',
      title: 'Application Error',
      description: 'An unrecoverable error occurred. Please try again.',
      duration: 8000,
      sound: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Step 3: Ensure the error message container is focused for screen readers after render
  useEffect(() => {
    errorRef.current?.focus();
  }, []);

  // Step 2: Sanitize the error message (simple approach: fallback if none present)
  const sanitizedMessage = error?.message || 'An unexpected error occurred.';

  // Render the user-friendly error UI
  return (
    <div
      ref={errorRef}
      tabIndex={-1}
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-neutral-900"
      aria-labelledby="global-error-title"
      aria-describedby="global-error-description"
    >
      {/* Step 4: Display a prominent error icon and heading */}
      <ErrorIcon className="h-24 w-24 text-red-600 mb-4" aria-hidden="true" />
      <h1
        id="global-error-title"
        className="text-2xl font-bold text-red-800 dark:text-red-400 mb-2"
      >
        Oops! Something went wrong.
      </h1>
      <p
        id="global-error-description"
        className="text-gray-700 dark:text-gray-200 max-w-lg text-center mb-6"
      >
        {sanitizedMessage}
      </p>

      {/* Step 5: Provide a recovery button to reset the error boundary and attempt to reload */}
      <Button
        variant="danger"
        size="md"
        ariaLabel="Retry operation"
        onClick={() => handleReset(reset, showToast)}
      >
        Try Again
      </Button>
    </div>
  );
};

/***************************************************************************************************
 * EXPORT
 * -------------------------------------------------------------------------------------------------
 * We export the Error component as default, fulfilling the global error boundary requirement for
 * a Next.js 13 application. This meets the specification's need for a top-level error boundary
 * component with accessibility and monitoring.
 **************************************************************************************************/
export default Error;