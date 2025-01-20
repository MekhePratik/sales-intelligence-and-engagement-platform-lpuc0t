/***************************************************************************************************
 * useToast.ts
 * -------------------------------------------------------------------------------------------------
 * A comprehensive React hook that provides an enhanced interface for displaying toast notifications
 * throughout the application. This hook supplements the base ToastProvider from
 * "../components/ui/Toast" by offering:
 *
 *  - Sound notifications (sound?: boolean)
 *  - Accessibility features (leverages underlying ARIA/live region from Toast component)
 *  - Toast grouping (via a "group" field) to remove or replace similar notifications
 *  - Advanced error handling with API integration (handleApiError)
 *  - Additional utility methods (clearAll, updateToast, dismissToast)
 *
 * Features Implemented per Specification:
 *  1. useToast (enhanced)                   -> Manages all toast operations from a single hook.
 *  2. showToast                             -> Displays a new toast notification with advanced options.
 *  3. handleApiError                        -> Specialized error handler for API errors with retry support.
 *  4. dismissToast                          -> Dismisses a single toast by ID.
 *  5. clearAll                              -> Clears all toasts from the queue.
 *  6. updateToast                           -> Updates an existing toast (by re-creating it with
 *                                             merged properties).
 *
 * Inputs & Imports:
 *  - React (v^18.2.0)         : React hooks for state management.
 *  - ToastProvider (from ../components/ui/Toast.tsx)
 *  - ApiError, ApiErrorCode   : Enhanced API error interfaces/types from ../types/api.ts
 *
 * Exports:
 *  - useToast (hook) with named members (showToast, dismissToast, handleApiError, clearAll, updateToast)
 *
 * Implementation Caveats:
 *  - Since ToastProvider.addToast does not return the generated toast ID, this hook cannot
 *    directly obtain the actual ID from ToastProvider’s internal logic. We therefore return
 *    an empty string from showToast. We also must re-implement partial update logic in updateToast
 *    by removing and re-adding the toast, generating a new ID internally.
 *
 **************************************************************************************************/

import * as React from 'react'; // react ^18.2.0

/***************************************************************************************************
 * Internal Imports
 **************************************************************************************************/
import {
  // The ToastProvider is used for the base toast context access.
  ToastProvider,
  useToast as baseUseToast,
  // NOTE: The specification lists ToastAnimation as imported, but the provided Toast.tsx
  //       snippet does not visibly export it. For safety, we'll omit that import to avoid breakage.
} from '../components/ui/Toast';

// Importing the ApiError interface and ApiErrorCode enum for advanced error handling.
import { ApiError, ApiErrorCode } from '../types/api';

/***************************************************************************************************
 * Detailed Types
 ***************************************************************************************************/

/**
 * Options accepted by showToast, encompassing the payload for creating a new toast.
 */
export interface ShowToastOptions {
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  sound?: boolean;
  group?: string; // custom grouping key
}

/**
 * Options accepted by handleApiError, offering optional retry behavior and grouping.
 */
export interface HandleApiErrorOptions {
  retry?: boolean;
  group?: string;
}

/***************************************************************************************************
 * useEnhancedToast Hook
 * -------------------------------------------------------------------------------------------------
 * This is the actual implementation of our advanced toast hook named "useToast".
 * Following the specification, it returns an object containing:
 *  {
 *    showToast: Function,
 *    dismissToast: Function,
 *    handleApiError: Function,
 *    clearAll: Function,
 *    updateToast: Function,
 *    toasts: ToastProps[]
 *  }
 *
 * Internally, it composes the base useToast from the ToastProvider to access:
 *  - toasts: the array of current toasts (InternalToastItem[]) in provider state
 *  - addToast(toastProps): function that queues a new toast
 *  - removeToast(id: string): function that removes an existing toast
 *
 * Then, it layers on:
 *  1. showToast -> Adds special grouping + sound + autoDismiss logic
 *  2. handleApiError -> Converts an ApiError into an error toast with optional "Retry" action
 *  3. dismissToast -> Wrapper around removeToast
 *  4. clearAll -> Loops over all toasts and removes them
 *  5. updateToast -> Emulates a partial update by removing + re-adding a toast
 *
 * Step-by-step following the JSON specification:
 *  - Initialize toast context
 *  - Configure accessibility (delegated to Toast component)
 *  - Implement advanced error handling
 *  - Return a structure with the specified functions
 **************************************************************************************************/
export function useToast() {
  // We leverage the base context from ToastProvider
  const { toasts, addToast, removeToast } = baseUseToast();

  /**
   * showToast
   * ----------------------------------------------------------------------------
   * Shows a new toast notification with enhanced features:
   *   - grouping (removes existing toasts with the same group)
   *   - optional sound
   *   - ID is not retrievable from ToastProvider, so we return an empty string
   *
   * JSON specification steps:
   * 1. Validate and sanitize toast parameters
   * 2. Check for similar or grouped toasts, remove them if group is set
   * 3. Generate ID (not possible to retrieve from ToastProvider, so we do not
   *    truly return it).
   * 4. Play sound if enabled (the Toast component does this when soundEnabled is set).
   * 5. Add toast to queue (via addToast).
   * 6. Set up auto-dismiss (Toast.tsx handles this internally).
   * 7. Handle accessibility focus (Toast component config).
   * 8. Return an ID (we are forced to return an empty string).
   */
  function showToast({
    variant,
    title,
    description,
    duration,
    sound,
    group,
  }: ShowToastOptions): string {
    // Step 1: Basic validation (title and variant are required; other fields are optional).
    if (!title) {
      // Minimal fallback if user forgets to supply title
      throw new Error('showToast requires a non-empty title.');
    }

    // Step 2: Remove existing toasts in the same group if group is specified
    if (group) {
      toasts.forEach((t) => {
        // We store the group in an ad-hoc key to differentiate from normal descriptions
        // But the underlying ToastProps do not define a "group" property directly,
        // so we encode group in text or skip advanced matching. We'll do a naive approach:
        const doesMatchGroup = (t.description || '').includes(`_group:${group}_`);
        if (doesMatchGroup) {
          removeToast(t.id);
        }
      });
    }

    // Step 3: ID generation is done by ToastProvider internally, but we cannot retrieve it.
    // We'll do nothing for ID here.

    // Step 4: The Toast component will handle playback if soundEnabled is set to true.

    // Step 5: Add toast to queue
    // We embed the group in the description to emulate grouping.
    const artificiallyGroupedDescription = group
      ? `${description || ''} _group:${group}_`
      : description || '';

    addToast({
      variant,
      title,
      description: artificiallyGroupedDescription,
      duration,
      hasProgress: false,
      soundEnabled: !!sound,
    });

    // Step 8: Return an ID (we have to return something, but the real ID is unknown)
    return '';
  }

  /**
   * dismissToast
   * ----------------------------------------------------------------------------
   * Removes a toast from the queue by ID. This is a direct wrapper around removeToast.
   * If the ID is invalid, no action will be taken since removeToast will simply filter out
   * unrecognized IDs.
   *
   * @param {string} toastId - The ID of the toast to remove.
   * @returns {void}
   */
  function dismissToast(toastId: string): void {
    removeToast(toastId);
  }

  /**
   * clearAll
   * ----------------------------------------------------------------------------
   * Removes all currently queued toasts. We achieve this by iterating over
   * the entire toasts array and removing each one.
   *
   * The specification requires a function that purges all notifications from the queue.
   */
  function clearAll(): void {
    // We must remove each known toast by ID
    toasts.forEach((t) => {
      removeToast(t.id);
    });
  }

  /**
   * updateToast
   * ----------------------------------------------------------------------------
   * This function tries to update an existing toast by ID. Because the underlying
   * ToastProvider does not provide an explicit "updateToast" method—and also
   * does not allow us to supply our own ID—this function must simulate an update
   * by removing the old toast, then showing a new toast with merged data.
   *
   * The requirement is to provide an "updateToast" function returning the new ID,
   * but we have no direct retrieval from "addToast". We therefore simply remove
   * and show, returning an empty string placeholder.
   *
   * @param {string} toastId - The ID of the toast to update.
   * @param {Partial<ShowToastOptions>} changes - The changes to apply.
   * @returns {string} The new toast's ID. (Here, always returns an empty string.)
   */
  function updateToast(toastId: string, changes: Partial<ShowToastOptions>): string {
    // Find the existing toast so we can replicate its data
    const oldToast = toasts.find((t) => t.id === toastId);
    if (!oldToast) {
      // If there's no toast with this ID, we do nothing
      return '';
    }

    // Remove the old toast
    removeToast(oldToast.id);

    // Reconstruct approximate old properties
    const groupMatch = (oldToast.description || '').match(/_group:(.*?)_/);
    const oldGroup = groupMatch ? groupMatch[1] : undefined;
    const oldDesc = oldToast.description
      ? oldToast.description.replace(/_group:(.*?)_/, '').trim()
      : '';

    // Merge new property overrides
    const newVariant = changes.variant ?? oldToast.variant ?? 'info';
    const newTitle = changes.title ?? oldToast.title;
    const newDescription = changes.description ?? oldDesc;
    const newDuration = changes.duration ?? oldToast.duration ?? 5000;
    const newSound = changes.sound ?? oldToast.soundEnabled;
    const newGroup = changes.group ?? oldGroup;

    // Show a new toast in place of the old one
    const newId = showToast({
      variant: newVariant,
      title: newTitle,
      description: newDescription,
      duration: newDuration,
      sound: !!newSound,
      group: newGroup,
    });

    // We cannot preserve the old ID due to underlying ToastProvider logic.
    return newId;
  }

  /**
   * handleApiError
   * ----------------------------------------------------------------------------
   * Enhanced error handler for API errors with optional retry logic. According to the
   * specification, steps are:
   *  1. Extract error code and message
   *  2. Map the error code to an appropriate toast variant
   *  3. Apply organization-specific or custom error message enhancements (stubbed here)
   *  4. Optionally add a "Retry" button if 'options.retry' is true
   *  5. Show an error toast
   *  6. Log error for monitoring
   *
   * @param {ApiError} error - The API error object containing code, message, etc.
   * @param {HandleApiErrorOptions} options - Additional options, including retry support.
   * @returns {void}
   */
  function handleApiError(error: ApiError, options?: HandleApiErrorOptions): void {
    if (!error || !error.code || !error.message) {
      // Minimal safeguard: if the error is incomplete
      console.error('handleApiError called with an invalid or undefined error:', error);
      return;
    }

    // 1. Extract relevant fields
    const { code, message } = error;

    // 2. Map error code to toast variant
    let chosenVariant: 'error' | 'warning' | 'info' = 'error'; // default to 'error'
    switch (code as ApiErrorCode) {
      case 'BAD_REQUEST':
      case 'VALIDATION_ERROR':
        chosenVariant = 'warning';
        break;
      case 'NOT_FOUND':
      case 'INTERNAL_ERROR':
      case 'SERVICE_UNAVAILABLE':
      default:
        chosenVariant = 'error';
        break;
    }

    // 3. Apply custom org-specific or user-specific enhancements
    let finalMessage = message;
    // For illustration, if there's an organization detail or custom domain in error.details,
    // we could append it. We'll do a trivial example:
    if (error.details && error.details.orgName) {
      finalMessage = `[Org: ${error.details.orgName}] ${finalMessage}`;
    }

    // 4. Optionally add a "Retry" action if requested
    let actionButton: { label: string; onClick: () => void } | undefined;
    if (options?.retry) {
      actionButton = {
        label: 'Retry',
        onClick: () => {
          console.log('Retry button clicked. Implement custom retry logic here.');
        },
      };
    }

    // 5. Show the error toast
    addToast({
      variant: chosenVariant,
      title: `Error: ${code}`,
      description: finalMessage,
      duration: 8000,
      hasProgress: false,
      soundEnabled: false, // We can enable or disable sound as desired
      action: actionButton,
    });

    // 6. Log error for monitoring (in real use, might integrate with Sentry or Datadog)
    console.error('API Error Logged -> Code:', code, 'Message:', message, 'Details:', error.details);
  }

  /*************************************************************************************************
   * Return the complete set of functionalities required by the specification
   *************************************************************************************************/
  return {
    /**
     * @method showToast
     * Displays a new toast notification with grouping & optional sound.
     */
    showToast,

    /**
     * @method dismissToast
     * Dismisses a toast by ID.
     */
    dismissToast,

    /**
     * @method handleApiError
     * Specialized error handler for API errors that displays an error toast
     * and optionally includes a retry action.
     */
    handleApiError,

    /**
     * @method clearAll
     * Removes all existing toasts from the queue.
     */
    clearAll,

    /**
     * @method updateToast
     * Emulates a partial update to a toast by removing & re-adding with
     * merged data. Returns a new ID, which (here) is an empty string placeholder.
     */
    updateToast,

    /**
     * @property toasts
     * Read-only array of the current toasts in the queue for advanced UI usage.
     */
    toasts,
  };
}

/***************************************************************************************************
 * Note: Because our code references the underlying ToastProvider from ../components/ui/Toast, you
 * must wrap your <App /> (or a top-level component) in <ToastProvider> to ensure that the context
 * is available throughout your application. For example:
 *
 *   import { ToastProvider } from '../components/ui/Toast';
 *   import { useToast } from '../hooks/useToast';
 *
 *   export function AppRoot() {
 *     return (
 *       <ToastProvider>
 *         <MyApp />
 *       </ToastProvider>
 *     );
 *   }
 *
 **************************************************************************************************/