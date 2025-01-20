"use client";
/*************************************************************************************************
 * Login Page (Enhanced)
 * -----------------------------------------------------------------------------------------------
 * This file implements a secure login page component for the B2B Sales Intelligence Platform.
 * It integrates with our authentication hook (useAuth), applies enhanced Zod-based validation,
 * handles local rate limiting, detailed error reporting, and accessibility features.
 *
 * Requirements Addressed (summarized from JSON spec):
 *  1) Authentication Methods: via Supabase Auth + useAuth hook.
 *  2) Form Validation: Real-time feedback using Zod schemas with extended error handling.
 *  3) Accessibility: Adherence to WCAG 2.1 AA, including ARIA labels and keyboard navigation.
 *  4) Comprehensive Error Handling: Detailed reporting for both client-side and server-side issues.
 *  5) Responsive Design: Renders gracefully across breakpoints.
 *  6) Rate Limiting: Restricts excessive login attempts in short intervals per user email.
 ************************************************************************************************/

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation"; // ^14.0.0
import { z } from "zod"; // ^3.22.0
import { cn } from "class-variance-authority"; // ^0.7.0

/*************************************************************************************************
 * Internal Imports
 ************************************************************************************************/
import { useAuth } from "../../../hooks/useAuth"; // Enhanced auth hook with error & loading states
import { Form, FormField, FormError } from "../../../components/ui/Form"; // Accessible form components
import { Button } from "../../../components/ui/Button"; // Accessible button with loading states
import { loginSchema } from "../../../lib/validation"; // Enhanced Zod schema for login form validation

/*************************************************************************************************
 * Global Constants (from JSON specification)
 ************************************************************************************************/
export const formClasses: string =
  "max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-white";

/**
 * RATE_LIMIT_ATTEMPTS:
 * The maximum login attempts permitted within a set window before blocking the user locally.
 */
const RATE_LIMIT_ATTEMPTS = 5;

/**
 * RATE_LIMIT_WINDOW:
 * Time window in milliseconds for counting login attempts (e.g., 300,000 ms = 5 minutes).
 * If user exceeds RATE_LIMIT_ATTEMPTS during this window, we temporarily block them.
 */
const RATE_LIMIT_WINDOW = 300000;

/*************************************************************************************************
 * In-Memory Rate Limiting Store
 * -----------------------------------------------------------------------------------------------
 * Key: user email (lowercased)
 * Value: { count: number, firstAttemptTime: number }
 *
 * This is a local demonstration approach. In a production environment with multiple server
 * instances, a shared store like Redis is more suitable.
 ************************************************************************************************/
const loginAttemptStore = new Map<
  string,
  { count: number; firstAttemptTime: number }
>();

/*************************************************************************************************
 * handleLogin
 * -----------------------------------------------------------------------------------------------
 * This function performs an enhanced login process with additional security steps, including:
 *  1) Validate form data with the Zod schema.
 *  2) Apply local rate limiting to block excessive attempts.
 *  3) Sanitize input data (lowercase email, trimmed password).
 *  4) Attempt login using useAuth().login.
 *  5) Handle authentication errors with detailed messages.
 *  6) Manage loading states if needed (although we also have isLoading from the hook).
 *  7) Manage session data (handled by the hook).
 *  8) Redirect to the dashboard on success.
 *
 * @param credentials { email: string; password: string }
 * @param loginFn references the 'login' function from useAuth
 * @param router references the Next.js router for redirect
 ************************************************************************************************/
async function handleLogin(
  credentials: { email: string; password: string },
  loginFn: (c: { email: string; password: string }) => Promise<void>,
  router: ReturnType<typeof useRouter>
): Promise<void> {
  // 1) Validate form data (the <Form> also enforces the schema, but we show an explicit example):
  const parseResult = loginSchema.safeParse(credentials);
  if (!parseResult.success) {
    // If we fail here, we throw an error; the form also shows these errors.
    throw new Error("Validation failed. Check your email and password.");
  }

  // 2) Local Rate Limiting check:
  const now = Date.now();
  const emailKey = credentials.email.trim().toLowerCase();

  const entry = loginAttemptStore.get(emailKey) ?? {
    count: 0,
    firstAttemptTime: now,
  };

  // If current window time has expired, reset attempts
  if (now - entry.firstAttemptTime > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.firstAttemptTime = now;
  }

  if (entry.count >= RATE_LIMIT_ATTEMPTS) {
    // Maximum attempts reached, block for demonstration
    throw new Error("Too many login attempts. Try again later.");
  }

  // Increment attempts
  entry.count += 1;
  loginAttemptStore.set(emailKey, entry);

  // 3) Sanitize data (already done partially for emailKey). We'll also trim password.
  const sanitizedCredentials = {
    email: emailKey,
    password: credentials.password.trim(),
  };

  // 4) Attempt the login
  try {
    await loginFn(sanitizedCredentials);
  } catch (authError: any) {
    // 5) Detailed error handling
    throw new Error(authError?.message ?? "Authentication error occurred.");
  }

  // If we reach here, login succeeded -> reset attempts
  loginAttemptStore.delete(emailKey);

  // 8) Redirect to the dashboard
  router.push("/dashboard");
}

/*************************************************************************************************
 * LoginPage (Enhanced)
 * -----------------------------------------------------------------------------------------------
 * React FC implementing the advanced login view with:
 *  - Next.js router integration
 *  - useAuth hook for supabase-based authentication
 *  - <Form> from our UI library for real-time validation & accessibility
 *  - handleLogin function for additional security checks & flow
 *
 * Steps (from JSON specification):
 *  1) Initialize router & auth hook
 *  2) Setup form with real-time validation
 *  3) Implement rate limiting for login attempts (via handleLogin)
 *  4) Configure ARIA & accessibility attributes (handled in <Form>, <FormField>, <FormError>)
 *  5) Render a responsive login form with loading states
 *  6) Handle authentication errors in a user-friendly manner
 *  7) Manage focus states / keyboard navigation (react-hook-form + <Form> logic)
 *  8) Redirect to dashboard on success
 ************************************************************************************************/
const LoginPage: React.FC = () => {
  // 1) Initialize Next.js router & useAuth hook
  const router = useRouter();
  const { login, isLoading, error } = useAuth();

  // 2) Setup form with real-time validation:
  //    The <Form> component will accept the "schema" prop (loginSchema) and an onSubmit callback.
  //    This ensures immediate feedback on any mistakes in email/password format.

  // Enhanced local error state to show any handleLogin or rate-limiting error
  const [localError, setLocalError] = useState<string | null>(null);

  // Callback passed to <Form> "onSubmit"
  const onSubmitForm = useCallback(
    async (data: { email: string; password: string }) => {
      // Clear local error each submit
      setLocalError(null);

      try {
        await handleLogin(data, login, router);
      } catch (err: any) {
        // Capture handleLogin error (could be rate-limiting, validation, or auth error)
        setLocalError(err?.message ?? "An unknown error occurred.");
      }
    },
    [login, router]
  );

  // 5) Render responsive form with loading states:
  // We'll also show global auth errors or local errors in <FormError> if present.
  return (
    <div className={formClasses}>
      {/* Accessible heading for screen readers & clarity */}
      <h1 className="text-2xl font-bold mb-4">Sign in to Your Account</h1>

      {/* 6) Combined error messaging from the useAuth hook & local error handling */}
      {(error?.message || localError) && (
        <FormError
          message={localError ? localError : error?.message}
          dataTestId="login-error"
        />
      )}

      {/* 2) Setup the <Form> with real-time validation and aria compliance */}
      <Form
        schema={loginSchema}
        onSubmit={onSubmitForm}
        className="space-y-6"
        // If desired, we can pass in an additional "loading" prop. 
        loading={isLoading}
      >
        {/* 7) Manage focus states automatically via react-hook-form + <FormField> */}
        <FormField
          name="email"
          type="email"
          label="Email Address"
          placeholder="Enter your email"
        />
        <FormField
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
        />

        <div className="pt-4">
          {/* 5) Button with isLoading state from the hook for a unified loading experience */}
          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
            className="w-full"
            ariaLabel="Sign in to your account"
          >
            Sign In
          </Button>
        </div>
      </Form>

      {/* 8) On success, REDIRECT is triggered inside handleLogin -> router.push("/dashboard") */}
    </div>
  );
};

/*************************************************************************************************
 * Export (Default)
 * -----------------------------------------------------------------------------------------------
 * This component is the default export from this file, fulfilling the JSON specification's
 * requirement to expose "LoginPage" as the main entry point. The function "handleLogin" remains
 * an internal utility function for the login flow.
 ************************************************************************************************/
export default LoginPage;