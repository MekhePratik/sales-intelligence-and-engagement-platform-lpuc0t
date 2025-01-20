/***************************************************************************************************
 * This file: "layout.tsx"
 * -------------------------------------------------------------------------------------------------
 * Implements the protected DashboardLayout component within the Next.js "app/dashboard" route,
 * providing an authenticated shell structure for all dashboard pages. The code accomplishes:
 *
 *  1. Authentication Flow - Checks if user is authenticated using useAuth() from our custom hook:
 *     - If user is null, redirect to '/login'
 *     - If an error occurs, display an error fallback
 *     - Show a loading state while authentication is in progress
 *
 *  2. Core Layout Structure - Wraps the entire content in the Shell component, which includes
 *     the responsive layout, navigation, sidebar, top bar, etc. This aligns with the "Core Layout
 *     Structure" guidelines from the technical specs (Section 3.1).
 *
 *  3. Responsive Behavior - The Shell component is responsible for fully responsive handling
 *     across mobile, tablet, and desktop breakpoints.
 *
 *  4. Error Boundaries & Progressive Loading States - We use:
 *     - <ErrorBoundary> from "react-error-boundary" to catch runtime errors
 *     - <Suspense> from React to demonstrate progressive loading placeholders for child content
 *
 *  5. Analytics Tracking - Includes "@vercel/analytics" to track user navigation events and
 *     page loads once the user is authenticated.
 *
 * Exports:
 *  - DashboardLayout component as the default export
 **************************************************************************************************/

/***************************************************************************************************
 * External Imports (IE2)
 * -------------------------------------------------------------------------------------------------
 * - redirect from "next/navigation" ^14.0.0 for authentication redirection
 * - Suspense from "react" ^18.2.0 for progressive loading boundaries
 * - ErrorBoundary from "react-error-boundary" ^4.0.0 for runtime error handling
 * - Analytics from "@vercel/analytics" ^1.0.0 for page tracking
 **************************************************************************************************/
import { redirect } from 'next/navigation' // next/navigation ^14.0.0
import { Suspense, ReactNode } from 'react' // react ^18.2.0
import { ErrorBoundary } from 'react-error-boundary' // react-error-boundary ^4.0.0
import { Analytics } from '@vercel/analytics' // ^1.0.0

/***************************************************************************************************
 * Internal Imports (IE1)
 * -------------------------------------------------------------------------------------------------
 * - Shell: The main application shell that includes the header, sidebar, etc.
 * - useAuth: Custom hook providing auth state (user, isLoading, error)
 **************************************************************************************************/
import Shell from '../../components/layout/Shell'
import { useAuth } from '../../hooks/useAuth'

/***************************************************************************************************
 * Interface for the Layout Props
 **************************************************************************************************/
interface DashboardLayoutProps {
  children: ReactNode
}

/***************************************************************************************************
 * Fallback Error Component for ErrorBoundary
 * -------------------------------------------------------------------------------------------------
 * Displays a simple message when a runtime error is caught within the error boundary.
 **************************************************************************************************/
function AuthErrorFallback() {
  return (
    <div className="p-4 text-red-600">
      <p>Something went wrong while rendering the dashboard. Please try again later.</p>
    </div>
  )
}

/***************************************************************************************************
 * DashboardLayout
 * -------------------------------------------------------------------------------------------------
 * The main layout component that enforces authentication, error handling, loading states,
 * and analytics for all pages under "/dashboard". Exports by default according to the
 * JSON specification "exports" array.
 *
 * Steps:
 *  1. Retrieve auth state from useAuth (user, isLoading, error)
 *  2. If an error exists, display an error fallback message
 *  3. If still loading, display a loading state or spinner
 *  4. If user is not present, redirect to '/login'
 *  5. Wrap children in an ErrorBoundary for runtime error isolation
 *  6. Render the Shell component that provides the core layout structure
 *  7. Wrap the children in a <Suspense> to handle progressive loading of child routes
 *  8. Render Analytics to track user page views after authentication
 **************************************************************************************************/
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // 1. Retrieve authentication state and potential error
  const { user, isLoading, error } = useAuth()

  // 2. If there's an auth error, show an error fallback (here, inline)
  if (error) {
    return (
      <div className="text-red-600 p-4">
        <p>Authentication Error: {error.message}</p>
      </div>
    )
  }

  // 3. If still determining auth state, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-gray-500">Authenticating...</p>
      </div>
    )
  }

  // 4. If no user is present, redirect to login
  if (!user) {
    redirect('/login')
  }

  // 5 & 6 & 7. Wrap in ErrorBoundary and Shell, plus <Suspense> for child route loading
  return (
    <ErrorBoundary FallbackComponent={AuthErrorFallback}>
      <Shell className="min-h-screen">
        <Suspense fallback={<div className="p-4">Loading page content...</div>}>
          {children}
        </Suspense>
      </Shell>

      {/* 8. Render analytics for page event tracking */}
      <Analytics />
    </ErrorBoundary>
  )
}