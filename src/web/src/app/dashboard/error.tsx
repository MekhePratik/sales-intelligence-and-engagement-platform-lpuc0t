"use client";
/***************************************************************************************************
 * Error Boundary Component for the Dashboard
 * -----------------------------------------------------------------------------------------------
 * This file implements an error boundary for the dashboard page. It captures runtime errors and
 * displays a user-friendly fallback UI. The boundary is integrated with Sentry for monitoring,
 * and it provides accessible controls for retrying or reporting errors.
 *
 * Technical Specification References:
 *  - Global error boundary with Sentry integration (Technical Specs/2.4 Cross-Cutting Concerns)
 *  - Consistent UI design system (Technical Specs/3.1 USER INTERFACE DESIGN/Design System Specs)
 *  - Accessibility compliance (WCAG 2.1 AA, ARIA labels, keyboard navigation)
 *
 * External Dependencies (with versions):
 *  - react ^18.2.0
 *  - @sentry/nextjs ^7.0.0
 *  - @heroicons/react ^2.0.0
 *
 * Internal Dependencies:
 *  - Button (from ../../components/ui/Button)
 *  - useToast (from ../../hooks/useToast)
 *
 * Implementation Details:
 *  1. React class-based error boundary with Sentry capture in componentDidCatch.
 *  2. Static getDerivedStateFromError to manage error state properties.
 *  3. Two supporting async functions: handleRetry and handleReport.
 *  4. Accessible fallback UI with an error icon, color-coded message, and actionable buttons.
 *  5. Detailed comments for enterprise-level clarity and maintainability.
 **************************************************************************************************/

import React from "react";
// Sentry (7.0.0) for error reporting
import * as Sentry from "@sentry/nextjs";
// Button (internal component)
import Button from "../../components/ui/Button";
// Custom toast hook for showing notifications
import { useToast } from "../../hooks/useToast";
// Error icon (heroicons/react ^2.0.0) for visual indication of an error
import { ExclamationTriangleIcon as ErrorIcon } from "@heroicons/react/24/outline";

/***************************************************************************************************
 * ErrorBoundaryProps
 * -----------------------------------------------------------------------------------------------
 * TypeScript interface describing the props for the ErrorBoundary. Typically, we only require
 * a "children" prop to wrap the portion of UI we want to protect. Additional props can be added
 * if we need specialized fallback UI or extended configuration options.
 **************************************************************************************************/
export interface ErrorBoundaryProps {
  /**
   * The child components that will be wrapped by this error boundary.
   */
  children?: React.ReactNode;
}

/***************************************************************************************************
 * ErrorBoundaryState
 * -----------------------------------------------------------------------------------------------
 * Defines the shape of our error boundary's internal state:
 *  - hasError: Whether an error has been caught.
 *  - error: The actual Error object, if one exists.
 *  - isRetrying: Whether we are in the process of retrying a failed operation.
 **************************************************************************************************/
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

/***************************************************************************************************
 * ErrorBoundary
 * -----------------------------------------------------------------------------------------------
 * A React class component that implements a production-grade error boundary for the dashboard page.
 * Integrates with Sentry for error logging and provides a fallback UI with accessible recovery
 * or reporting options.
 *
 * Detailed Steps (from the JSON specification):
 *  1) constructor(props): Initialize the state with hasError = false, error = null, isRetrying = false.
 *  2) static getDerivedStateFromError(error): Updates the state to indicate an error was caught.
 *  3) componentDidCatch(error, errorInfo): Logs error details to Sentry and updates any tracking metrics.
 *  4) handleRetry(): Clears error state, shows a toast for retry attempt, and attempts recovery logic.
 *  5) handleReport(): Gathers error context, sends to Sentry for analysis, and shows a confirmation toast.
 **************************************************************************************************/
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * The constructor sets up the initial state, ensuring no error is flagged initially. The 'isRetrying'
   * flag is also initialized to false.
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);

    // Step 1: Initialize the error boundary with default state
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
    };

    // Binding our class methods to ensure correct context for callbacks
    this.handleRetry = this.handleRetry.bind(this);
    this.handleReport = this.handleReport.bind(this);
  }

  /**
   * React static lifecycle method: getDerivedStateFromError
   * Called right after an error is thrown in a child component. This method updates the
   * component state to reflect that an error has occurred. The rendered fallback UI is
   * triggered via hasError. The error object is stored for potential usage in fallback rendering.
   *
   * @param error The error object that was thrown.
   * @returns An update to the component's state, indicating it has an error and storing the error.
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Step 1: Capture error details
    // Step 2: Update component state with error information
    // Step 3: Return new state object
    return {
      hasError: true,
      error,
    };
  }

  /**
   * React lifecycle method: componentDidCatch
   * Called after an error is thrown, providing the error and additional info (e.g., stack trace).
   * This implementation sends the error details to Sentry, logs context, and updates metrics.
   *
   * @param error The error encountered.
   * @param errorInfo Additional info about which component tree node(s) were involved.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Step 1: Log error to Sentry
    Sentry.captureException(error, { extra: errorInfo });

    // Step 2: Capture error context and stack trace (handled internally by Sentry)
    // Step 3: Update error tracking metrics (could integrate with another APM solution)
  }

  /**
   * handleRetry
   * -----------------------------------------------------------------------------------------------
   * Async method triggered by the "Retry" button in our fallback UI. Follows the JSON specification:
   *  1) Set loading (isRetrying=true)
   *  2) Clear error state, thus resetting the boundary
   *  3) Show a toast indicating a retry attempt
   *  4) Attempt potential recovery logic (dummy in this example)
   *  5) Handle potential failures
   *  6) Clear loading state
   */
  async handleRetry(): Promise<void> {
    // Access the toast system to display notifications
    const { showToast } = useToast();

    try {
      // Step 1: Set loading state
      this.setState({ isRetrying: true });

      // Step 2: Clear error state & reset boundary
      // In a real scenario, we might reload data or forcibly re-mount children
      this.setState({ hasError: false, error: null });

      // Step 3: Show a toast announcing the retry attempt
      showToast({
        variant: "info",
        title: "Retrying...",
        description: "Attempting to recover from the error.",
        duration: 5000,
      });

      // Step 4: Implementation of recovery logic would go here.

      // Step 5: Handle potential retry failures
      // For demonstration, we assume success, but if a failure occurs, we could:
      //   throw new Error("Retry failed for demonstration");

    } catch (retryError) {
      // If a retry fails, display an error toast
      showToast({
        variant: "error",
        title: "Retry Failed",
        description: String(retryError),
        duration: 8000,
      });
      // Revert boundary or keep error state
      this.setState({ hasError: true, error: retryError as Error });
    } finally {
      // Step 6: Clear loading state
      this.setState({ isRetrying: false });
    }
  }

  /**
   * handleReport
   * -----------------------------------------------------------------------------------------------
   * Async method triggered by the "Report" button in our fallback UI. Follows the JSON specification:
   *  1) Collect error context from the state
   *  2) Gather user environment data
   *  3) Submit the report to Sentry
   *  4) Show confirmation toast
   *  5) Clear or reset any necessary local data
   */
  async handleReport(): Promise<void> {
    const { showToast } = useToast();
    try {
      // Step 1: Collect error context (this.state.error)
      const currentError = this.state.error;

      // Step 2: Gather user environment info (navigator.platform, etc.)
      const userInfo = {
        platform: typeof navigator !== "undefined" ? navigator.platform : "Unknown",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      };

      // Step 3: Submit a message or exception to Sentry with extra context
      Sentry.captureException(currentError, {
        tags: { location: "ErrorBoundary" },
        extra: {
          userEnvironment: userInfo,
        },
      });

      // Step 4: Show confirmation toast
      showToast({
        variant: "success",
        title: "Error Reported",
        description: "Our team has been notified of the issue.",
        duration: 6000,
      });

      // Step 5: Clear report data if necessary
      // (No local data to clear in this demonstration)
    } catch (reportError) {
      // If reporting fails unexpectedly, we can show a toast or revert
      showToast({
        variant: "error",
        title: "Report Failed",
        description: String(reportError),
        duration: 8000,
      });
    }
  }

  /**
   * Render the children if no error is detected, or a fallback UI if an error is present.
   * The fallback UI includes:
   *  - A heading describing the issue
   *  - The short stack or message from the error
   *  - Two action buttons: "Retry" and "Report"
   */
  render(): React.ReactNode {
    const { hasError, error, isRetrying } = this.state;

    // If there's no error, simply render the wrapped children
    if (!hasError) {
      return this.props.children;
    }

    // Otherwise, display an accessible fallback UI
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-8 bg-white
                   text-gray-800 dark:bg-gray-900 dark:text-gray-100 transition-colors
                   duration-200 ease-in-out"
        role="alert"
        aria-live="assertive"
        style={{ outline: "none" }}
      >
        {/* Visual Error Icon for immediate recognition, sized and colored consistently */}
        <ErrorIcon className="w-16 h-16 text-red-600 mb-6" aria-hidden="true" />

        {/* Error Title - Large, bold text for clarity. 
            Using accessible color #dc2626 or #b91c1c on dark backgrounds ensures contrast. */}
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
          Oops! Something went wrong.
        </h1>

        {/* Error Description - Provide the user with minimal info on the error, 
            ensuring confidentiality if error messages are sensitive. */}
        <p className="max-w-prose text-center mb-8" aria-label="Error details">
          {error?.message
            ? `An unexpected error occurred: ${error.message}`
            : "An unexpected error has occurred in the application."}
        </p>

        <div className="flex space-x-3">
          {/* Retry Button - Attempt to recover from the error */}
          <Button
            variant="danger"
            isLoading={isRetrying}
            ariaLabel="Retry loading the dashboard or recover from the error"
            onClick={this.handleRetry}
          >
            Retry
          </Button>

          {/* Report Button - Send error details to the developers */}
          <Button
            variant="outline"
            ariaLabel="Report this error to technical support"
            onClick={this.handleReport}
          >
            Report
          </Button>
        </div>
      </div>
    );
  }
}