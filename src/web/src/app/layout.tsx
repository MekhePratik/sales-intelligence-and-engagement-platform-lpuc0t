/****************************************************************************
 * Root Layout (src/web/src/app/layout.tsx)
 * --------------------------------------------------------------------------
 * According to the assigned JSON specification, this file implements the
 * Next.js (App Router) root layout for the B2B Sales Intelligence Platform.
 * It:
 *   - Integrates Sentry for error tracking and performance monitoring.
 *   - Configures the Inter font from @next/font/google for consistent typography.
 *   - Creates and wraps a React Query client (with retry/stale time settings).
 *   - Wraps the application in next-auth SessionProvider for authentication.
 *   - Provides a global error boundary using Sentry's ErrorBoundary.
 *   - Applies global styles, responsive design system classes, and any
 *     additional security headers (CSP).
 *   - Renders the main Shell component that lays out the responsive navigation
 *     and content.
 *   - Implements a named export "metadata" for Next.js to handle SEO and PWA
 *     configurations, and also a "generateMetadata" function per specification.
 ****************************************************************************/

import React, { ReactNode, useState } from 'react';

// Sentry initialization for error tracking and performance monitoring
// Package Version: ^7.0.0
import { init } from '@sentry/nextjs';
// Sentry Error Boundary (react integration) - Package Version: ^7.0.0
import { ErrorBoundary } from '@sentry/react';

// Inter font from @next/font/google - Package Version: ^14.0.0
import { Inter } from '@next/font/google';

// React Query client provider for data fetching - Package Version: ^5.0.0
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

// next-auth SessionProvider for user authentication - Package Version: ^4.24.0
import { SessionProvider } from 'next-auth/react';

// Segment Analytics for tracking/monitoring - Package Version: ^1.0.0
import { Analytics } from '@segment/analytics-next';

// Internal imports specified by JSON
// Shell: default import from '../components/layout/Shell'
import Shell from '../components/layout/Shell';
// cn: named import from '../lib/utils'
import { cn } from '../lib/utils';

/****************************************************************************
 * 1) Initialize Sentry for error tracking
 *    According to JSON steps, we configure Sentry here at import-time
 *    so it captures issues early in the lifecycle.
 ****************************************************************************/
init({
  // DSN environment variable or fallback
  dsn: process.env.SENTRY_DSN || '',
  // Adjust sample rate or other Sentry config as desired
  tracesSampleRate: 1.0,
});

/****************************************************************************
 * 2) Configure Inter font with Latin subset and optional ligatures
 *    The JSON specification says to integrate the design system
 *    typography. We specify variable to consume in className.
 ****************************************************************************/
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  // Could add 'display: swap' or other advanced font config
});

/****************************************************************************
 * 3) Initialize React Query client with retry/stale time configurations
 *    Our code sets a simple default with re-tries and staleTime. This is
 *    used by the <QueryClientProvider> to wrap the app.
 ****************************************************************************/
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 2,
    },
  },
});

/****************************************************************************
 * 4) Setup authentication session provider
 *    We use SessionProvider from next-auth at the root. This ensures
 *    user session data is accessible throughout the application.
 *
 * 5) Implement error boundary wrapper
 *    The specification requires a Sentry-based Error Boundary for global
 *    error handling. We'll display a minimal fallback UI if an error occurs.
 *
 * 6) Configure analytics provider
 *    We integrate the <Analytics> component from @segment/analytics-next
 *    for performance monitoring and event tracking, fulfilling the
 *    "Performance Monitoring" requirement.
 *
 * 7) Render Shell component with child pages
 *    The Shell provides the enterprise-grade layout structure: navigation,
 *    main content area, etc.
 *
 * 8) Apply global styles and font classes
 *    The entire <html> or <body> is assigned Inter font classes, plus any
 *    global background, color, or theme toggles.
 ****************************************************************************/

/****************************************************************************
 * generateMetadata Function
 * --------------------------------------------------------------------------
 * Next.js provides a pattern for generating metadata if we want dynamic
 * or advanced usage. The JSON specification requires a function named
 * "generateMetadata" returning a Next.js-compatible metadata object:
 ****************************************************************************/
export async function generateMetadata() {
  // Steps from JSON:
  // 1) Define base metadata (title, description)
  // 2) Configure viewport
  // 3) Set icons, manifest
  // 4) Configure theme color, PWA settings
  // 5) Could set security headers (CSP) - next13 has limited direct "metadata" support for CSP
  return {
    title: 'B2B Sales Intelligence Platform',
    description: 'AI-powered lead intelligence and automated outreach platform',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '32x32' },
        { url: '/icon.png', sizes: '192x192' },
      ],
      apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
    themeColor: '#2563eb',
    robots: 'index, follow',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://b2b-sales-platform.com',
      siteName: 'B2B Sales Intelligence Platform',
    },
  };
}

/****************************************************************************
 * metadata Named Export
 * --------------------------------------------------------------------------
 * The JSON spec also demands a named export "metadata" with a type of "Metadata"
 * containing the same SEO/PWA config as above. We'll simply re-use the function result,
 * although in a real Next.js project you typically define one or the other.
 ****************************************************************************/
export const metadata = await generateMetadata();

/****************************************************************************
 * RootLayout Component
 * --------------------------------------------------------------------------
 * This is the default export fulfilling the "RootLayout" function designated
 * by the JSON specification. It:
 *   - Applies a global <html> and <body> with the Inter font and optional TPS.
 *   - Wraps the app in QueryClientProvider, SessionProvider, and Sentry ErrorBoundary.
 *   - Provides an <Analytics> context for usage metrics.
 *   - Renders the Shell which includes the global navigation, main content, etc.
 ****************************************************************************/
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  /**************************************************************************
   * Security Controls - Implement minimal CSP meta tag in <head>.
   * In Next.js (App Router), we can place <meta httpEquiv="Content-Security-Policy" />
   * here directly. This is a simplified example, real CSP often involves more
   * advanced or dynamic configuring.
   *************************************************************************/
  const cspContent =
    "default-src 'self'; img-src 'self' https: data:; connect-src 'self' https:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self';";

  return (
    <html
      lang="en"
      className={cn(
        inter.variable,
        // example global theme classes or backgrounds
        'bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50'
      )}
    >
      <head>
        <meta httpEquiv="Content-Security-Policy" content={cspContent} />
      </head>
      {/* Using Sentry ErrorBoundary for global error handling */}
      <ErrorBoundary fallback={<div>An unexpected error occurred.</div>}>
        <body className="min-h-screen antialiased">
          <SessionProvider>
            <QueryClientProvider client={queryClient}>
              {/* Analytics from @segment/analytics-next for performance monitoring */}
              <Analytics>
                <Shell>
                  {children}
                </Shell>
              </Analytics>
            </QueryClientProvider>
          </SessionProvider>
        </body>
      </ErrorBoundary>
    </html>
  );
}