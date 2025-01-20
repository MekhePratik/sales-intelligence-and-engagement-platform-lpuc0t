import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  KeyboardEvent,
  MouseEvent,
} from 'react';

// ---------------------------------------------------------------------------------------------
// External Imports with Versions
// ---------------------------------------------------------------------------------------------
// next/navigation ^14.0.0
import { useRouter } from 'next/navigation';
// next-intl ^3.0.0
import { useTranslation } from 'next-intl';
// @sentry/nextjs ^7.0.0
import { captureException, captureMessage } from '@sentry/nextjs';

// ---------------------------------------------------------------------------------------------
// Internal Imports (IE1 compliance)
// ---------------------------------------------------------------------------------------------
// Main layout wrapper with consistent navigation and error boundaries
import Shell from '../components/layout/Shell';
// Button component for accessible navigation actions
import Button from '../components/ui/Button';

// ---------------------------------------------------------------------------------------------
// handleGoBack
// ---------------------------------------------------------------------------------------------
// Description:
//  Handles navigation to previous page with error handling
// Steps per specification:
//  1) Try to navigate to previous page
//  2) Handle navigation errors
//  3) Fallback to home if history is empty
//  4) Track navigation attempt
// ---------------------------------------------------------------------------------------------
export async function handleGoBack(router: ReturnType<typeof useRouter>): Promise<void> {
  try {
    // Step 1: Attempt to navigate back
    router.back();
    // Step 4: Track navigation attempt (using a simple Sentry message)
    captureMessage('User attempted to navigate back from 404 page.');
  } catch (error) {
    // Step 2: Handle errors gracefully
    captureException(error);
    // Step 3: Fallback to home if no history
    router.push('/');
  }
}

// ---------------------------------------------------------------------------------------------
// handleGoHome
// ---------------------------------------------------------------------------------------------
// Description:
//  Navigates to home/dashboard page with error handling
// Steps per specification:
//  1) Validate user session (placeholder; we rely on top-level checks or existence of session)
//  2) Navigate to dashboard
//  3) Handle navigation errors
//  4) Track successful navigation
// ---------------------------------------------------------------------------------------------
export async function handleGoHome(router: ReturnType<typeof useRouter>): Promise<void> {
  try {
    // Step 2: Navigate to your main dashboard
    router.push('/dashboard');
    // Step 4: Track successful navigation
    captureMessage('User navigated to home/dashboard from 404 page.');
  } catch (error) {
    // Step 3: Handle navigation errors
    captureException(error);
  }
}

/**
 * @errorBoundary
 * 
 * NotFound - Main component for rendering the 404 Not Found page with accessibility and i18n support.
 * 
 * Steps per JSON specification:
 *  1) Initialize router for navigation
 *  2) Initialize translations for i18n support
 *  3) Track 404 error occurrence
 *  4) Set page title and meta description (in effect, for demonstration)
 *  5) Render Shell component wrapper
 *  6) Display localized 404 error message and illustration
 *  7) Implement keyboard shortcuts for navigation
 *  8) Render accessible navigation buttons
 *  9) Handle focus management
 * 10) Provide screen reader announcements
 */
const NotFound: React.FC = () => {
  // Step 1: Initialize router
  const router = useRouter();

  // Step 2: i18n support with next-intl
  const { t } = useTranslation();

  // Step 3: Track 404 error occurrence
  useEffect(() => {
    captureMessage('404 Not Found page rendered.');
  }, []);

  // Step 4: Set page title & meta (in a custom scenario, Next.js might override this)
  useEffect(() => {
    document.title = t('notFound.title', 'Page Not Found');
  }, [t]);

  // Step 7: Implement keyboard shortcuts for navigation (e.g., press "b" to go back, "h" to go home)
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key.toLowerCase() === 'b') {
        // "b" -> go back
        event.preventDefault();
        handleGoBack(router).catch((err) => captureException(err));
      }
      if (event.key.toLowerCase() === 'h') {
        // "h" -> go home
        event.preventDefault();
        handleGoHome(router).catch((err) => captureException(err));
      }
    },
    [router]
  );

  // Step 9: Example focus management - auto-focus a heading
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, []);

  // -------------------------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------------------------
  // Step 5: Render Shell layout
  // Step 6: Display localized 404 error message
  // Step 8: Provide accessible actions (Back / Home)
  // Step 10: Provide screen reader announcements with role="alert"
  return (
    <Shell className="min-h-screen" /* Step 5 - main layout wrapper */>
      <div
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        role="alert"
        aria-live="assertive"
      >
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-bold text-red-600 focus:outline-none mb-4"
          aria-label={t('notFound.pageHeading', '404 - Page Not Found')}
        >
          {t('notFound.pageHeading', '404 - Page Not Found')}
        </h1>

        <p className="text-lg text-gray-700 dark:text-gray-200 max-w-lg mb-8">
          {t(
            'notFound.description',
            'The page you are looking for does not exist or has been moved.'
          )}
        </p>

        {/* Optional illustration or icon can be placed here */}
        <div className="mb-8">
          {/* Placeholder for an illustration, e.g. <img src="/404.svg" alt="404 illustration" /> */}
        </div>

        <div className="space-x-2">
          {/* Button to go back */}
          <Button
            variant="secondary"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              handleGoBack(router).catch((err) => captureException(err));
            }}
            ariaLabel={t('notFound.goBackAriaLabel', 'Go back to previous page')}
          >
            {t('notFound.goBackLabel', 'Go Back')}
          </Button>

          {/* Button to go home */}
          <Button
            variant="primary"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              handleGoHome(router).catch((err) => captureException(err));
            }}
            ariaLabel={t('notFound.goHomeAriaLabel', 'Go to home page')}
          >
            {t('notFound.goHomeLabel', 'Go Home')}
          </Button>
        </div>
      </div>
    </Shell>
  );
};

export default NotFound;