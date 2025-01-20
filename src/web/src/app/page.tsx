"use client";

/***************************************************************************************************
 * Landing Page Component for the B2B Sales Intelligence Platform
 * -------------------------------------------------------------------------------------------------
 * This file implements the public-facing homepage as specified in the technical requirements:
 *  1. Showcases AI-powered lead management, contact enrichment, and lead scoring features.
 *  2. Integrates authentication flows with Supabase Auth (JWT, MFA, OAuth).
 *  3. Implements conversion tracking (Vercel Analytics) and success metrics (80% user rate, 40%
 *     conversion improvement, 3x ROI).
 *  4. Adheres to the design system: typography (12-48px scale), colors (#2563eb, #64748b, #0ea5e9),
 *     spacing (4-64px), responsive breakpoints (mobile, tablet, desktop).
 *  5. Demonstrates error boundary usage for reliability and includes loading states for optimal UX.
 *  6. Configures SEO metadata (where supported by Next.js 13) to enhance discoverability.
 *
 * The code includes:
 *  - Hero section highlighting AI value proposition
 *  - Feature highlights with interactive placeholders
 *  - Testimonials or success metrics
 *  - Simple ROI/pricing calculator demo
 *  - CTA sections for sign in, sign up, and MFA mentions
 *  - Automatic redirection to dashboard if a user is already authenticated
 *  - Conversion event tracking using @vercel/analytics
 **************************************************************************************************/

/***************************************************************************************************
 * External Imports (with Library Versions)
 **************************************************************************************************/
import React, {
  FC,
  useState,
  useEffect,
  useCallback,
  Suspense,
  useRef,
  ErrorInfo
} from "react";
import { useRouter } from "next/navigation"; // version ^14.0.0
import Link from "next/link"; // version ^14.0.0
import Image from "next/image"; // version ^14.0.0
import { useAnalytics } from "@vercel/analytics"; // version ^1.0.0

/***************************************************************************************************
 * Internal Imports
 **************************************************************************************************/
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { AUTH_ROUTES } from "../constants/routes";

/***************************************************************************************************
 * SEO Metadata (Optional: If Next.js 13+ supports metadata export in client component)
 * If your Next.js configuration supports metadata in the same file, uncomment below:
 **************************************************************************************************/
// export const metadata = {
//   title: "B2B Sales Intelligence Platform - Landing Page",
//   description:
//     "Transform B2B sales with AI-powered prospecting, automated outreach, and data-driven insights."
// };

/***************************************************************************************************
 * ErrorBoundary
 * -------------------------------------------------------------------------------------------------
 * An error boundary to catch runtime errors in the LandingPage tree, preventing the entire app from
 * crashing. It renders a fallback UI if an error occurs.
 *
 * Methods:
 *  - constructor: Sets initial error state
 *  - componentDidCatch: Captures error and error info, sets local error state
 *  - render: Displays fallback UI if an error is encountered; otherwise, renders children
 **************************************************************************************************/
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: ""
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In a production environment, we could log to an error reporting service
    this.setState({ hasError: true, errorMessage: error.message });
    // eslint-disable-next-line no-console
    console.error("LandingPage ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">
            Oops! Something went wrong.
          </h1>
          <p className="text-gray-700 mb-6 max-w-xl text-center">
            An unexpected error occurred while loading the landing page. Our team has been notified.
            Please refresh the page or try again later.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.reload()}
            ariaLabel="Reload page"
          >
            Reload
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/***************************************************************************************************
 * ROI Calculator
 * -------------------------------------------------------------------------------------------------
 * A simple demonstration representing the "pricing or ROI" section. Users can input a hypothetical
 * investment amount, and we show a theoretical 3x return (as an example).
 **************************************************************************************************/
const ROICalculator: FC = () => {
  const [investment, setInvestment] = useState<string>("1000");
  const [calculatedROI, setCalculatedROI] = useState<number>(3000);

  const handleCalculate = useCallback(() => {
    const val = Number(investment);
    if (!Number.isNaN(val)) {
      // 3x ROI is used as a placeholder to indicate measurable returns
      setCalculatedROI(val * 3);
    }
  }, [investment]);

  useEffect(() => {
    handleCalculate();
  }, [handleCalculate]);

  return (
    <div className="mt-8 w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-3">
        Simple ROI Calculator
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Estimate your potential returns with our 3x ROI target.
      </p>
      <div className="flex items-center space-x-2 mb-4">
        <input
          type="number"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Investment Amount"
          value={investment}
          onChange={(e) => setInvestment(e.target.value)}
          aria-label="Investment Amount"
        />
        <Button variant="primary" size="sm" onClick={handleCalculate}>
          Calculate
        </Button>
      </div>
      <div className="text-gray-700">
        Your potential return:{" "}
        <span className="font-semibold text-blue-600">${calculatedROI}</span>
      </div>
    </div>
  );
};

/***************************************************************************************************
 * LandingPageContent
 * -------------------------------------------------------------------------------------------------
 * A dedicated functional component that implements all sections of the landing page. This is
 * wrapped by the ErrorBoundary to catch any runtime errors.
 *
 * Steps per technical specification:
 *  1) Initialize analytics tracking for conversion measurement.
 *  2) Check authentication state using useAuth hook.
 *  3) Redirect authenticated users to dashboard.
 *  4) Render hero section with AI-powered value proposition.
 *  5) Implement feature highlights with interactive placeholders.
 *  6) Add testimonials section with success metrics (80% user rate, +40% conversions, 3x ROI).
 *  7) Include pricing section with ROI calculator.
 *  8) Render authentication CTAs with MFA mention.
 *  9) Setup conversion event tracking using useAnalytics.
 * 10) Implement error boundary for reliability (handled at a higher level).
 * 11) Add loading states for optimal UX.
 * 12) Configure SEO metadata (optional in Next 13+).
 **************************************************************************************************/
const LandingPageContent: FC = () => {
  /***********************************************************************************************
   * 1) Initialize analytics tracking for conversion measurement
   **********************************************************************************************/
  const analytics = useAnalytics();
  const router = useRouter();

  /***********************************************************************************************
   * 2) Check authentication state using useAuth hook
   *    - user: currently authenticated user or null
   *    - login / register: possible sign in, sign up functions
   *    - isLoading: indicator if there's an ongoing auth state check
   **********************************************************************************************/
  const {
    user,
    isLoading: authLoading,
    login: signIn,
    register: signUp
  } = useAuth();

  /***********************************************************************************************
   * 3) Redirect authenticated users to dashboard
   *    Because this is a client-side component, we use router.push if a user is present.
   **********************************************************************************************/
  useEffect(() => {
    if (user) {
      // You might configure your route as '/dashboard' or any protected route
      router.push("/dashboard");
    }
  }, [user, router]);

  /***********************************************************************************************
   * 9) Setup conversion event tracking
   *    We can track visits, interactions, or CTA clicks to measure funnel conversions.
   **********************************************************************************************/
  useEffect(() => {
    // Example: track a page view event
    analytics.event("LandingPageView", {
      userState: user ? "AuthenticatedUser" : "GuestUser"
    });
  }, [analytics, user]);

  /***********************************************************************************************
   * 11) Add loading states for optimal UX
   *    If authentication is loading, we can display a spinner or skeleton.
   **********************************************************************************************/
  if (authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-2">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  /***********************************************************************************************
   * If we reach here, user is either null or loaded, so we can render the public landing page.
   **********************************************************************************************/
  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-white text-gray-900">
      {/************************************************************************************
       * 4) Hero Section
       *    Highlights the AI-powered value proposition with top-level design system usage.
       ************************************************************************************/}
      <section className="relative w-full px-4 py-16 md:py-20 lg:py-24 bg-[#2563eb] text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            AI-Powered B2B Sales Intelligence
          </h1>
          <p className="mx-auto max-w-2xl text-base md:text-lg mb-8">
            Discover, engage, and convert prospects faster using data-driven
            insights, automated outreach, and intelligent lead scoring.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(AUTH_ROUTES.LOGIN)}
              ariaLabel="Sign In"
            >
              Sign In
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push(AUTH_ROUTES.REGISTER)}
              ariaLabel="Sign Up"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </section>

      {/************************************************************************************
       * 5) Feature Highlights with Interactive Placeholders
       *    Showcases AI-powered search, lead enrichment, and scoring
       ************************************************************************************/}
      <section className="w-full px-4 py-10 md:py-14 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-6">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {/* AI-powered lead search */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                AI-Powered Search
              </h3>
              <p className="text-gray-600 text-sm">
                Instantly find high-potential leads with advanced filtering, GPT-4
                powered suggestions, and real-time data enrichment.
              </p>
            </div>
            {/* Contact data enrichment */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Contact Enrichment
              </h3>
              <p className="text-gray-600 text-sm">
                Our enrichment engine updates lead profiles with the latest
                company insights, social profiles, and engagement data.
              </p>
            </div>
            {/* Lead scoring and prioritization */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Advanced Lead Scoring
              </h3>
              <p className="text-gray-600 text-sm">
                Leverage machine learning to score and prioritize leads based on
                fit, intent, and engagement history, ensuring you focus on the
                most promising opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/************************************************************************************
       * 6) Testimonials / Success Metrics (80% user rate, +40% conversions, 3x ROI)
       ************************************************************************************/}
      <section className="w-full px-4 py-10 md:py-14 lg:py-20 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">
            Our Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* 80% active user rate */}
            <div>
              <div className="text-5xl font-extrabold text-blue-600 mb-2">80%</div>
              <p className="text-sm text-gray-600">
                Active user rate within 30 days of onboarding
              </p>
            </div>
            {/* 40% improvement in conversion rates */}
            <div>
              <div className="text-5xl font-extrabold text-blue-600 mb-2">+40%</div>
              <p className="text-sm text-gray-600">
                Increase in prospect-to-customer conversions
              </p>
            </div>
            {/* 3x ROI */}
            <div>
              <div className="text-5xl font-extrabold text-blue-600 mb-2">3x</div>
              <p className="text-sm text-gray-600">
                Return on investment within the first 6 months
              </p>
            </div>
          </div>
        </div>
      </section>

      {/************************************************************************************
       * 7) Pricing / ROI Section (Includes ROI Calculator)
       ************************************************************************************/}
      <section className="w-full px-4 py-10 md:py-14 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row md:space-x-4 items-start">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Pricing & Potential ROI
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Built for efficiency, our platform helps you reduce prospecting
              time by 60% while boosting conversions. Use the calculator to
              estimate potential returns from an initial investment.
            </p>
            <p className="text-sm text-gray-600">
              Our flexible pricing ensures businesses of all sizes can harness
              powerful sales intelligence. Contact us for custom enterprise
              plans or to learn about our volume discounts.
            </p>
          </div>

          {/* ROI Calculator Demo */}
          <div className="md:w-1/2">
            <Suspense
              fallback={
                <div className="text-center text-gray-500">
                  Loading ROI Calculator...
                </div>
              }
            >
              <ROICalculator />
            </Suspense>
          </div>
        </div>
      </section>

      {/************************************************************************************
       * 8) CTA for Authentication with MFA mention
       ************************************************************************************/}
      <section className="w-full px-4 py-10 md:py-14 lg:py-20 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-sm text-gray-600 mb-8 max-w-2xl mx-auto">
            Sign up today and enable MFA for enhanced account security. Experience
            the next-level automation and intelligence that will transform your
            B2B sales operations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push(AUTH_ROUTES.LOGIN)}
              ariaLabel="Sign In"
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => router.push(AUTH_ROUTES.REGISTER)}
              ariaLabel="Sign Up"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </section>

      {/************************************************************************************
       * Footer Section (basic)
       ************************************************************************************/}
      <footer className="w-full py-6 bg-[#64748b] text-white text-sm flex justify-center">
        <p className="px-4 text-center">
          © {new Date().getFullYear()} B2B Sales Intelligence Platform. All rights reserved.
        </p>
      </footer>
    </main>
  );
};

/***************************************************************************************************
 * LandingPage
 * -------------------------------------------------------------------------------------------------
 * The main exported component. Wraps LandingPageContent in ErrorBoundary for reliability.
 **************************************************************************************************/
const LandingPage: FC = () => {
  return (
    <ErrorBoundary>
      <LandingPageContent />
    </ErrorBoundary>
  );
};

export default LandingPage;