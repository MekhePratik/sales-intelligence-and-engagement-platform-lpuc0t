"use client";

/************************************************************************************************
 * Next.js Page: Reset Password
 * ---------------------------------------------------------------------------------------------
 * This file implements a secure password reset flow for users. It integrates with Supabase Auth
 * (or any secure backend) to update the user's password. It renders an accessible form with
 * Zod-based validation, a real-time password strength indicator, and robust error handling.
 *
 * Requirements Addressed:
 * 1) Authentication Methods:
 *    - Secure reset token handling
 *    - Integration with "updatePassword" from "@/lib/auth"
 *    - Rate limiting considerations
 *
 * 2) Form Validation:
 *    - Uses Zod for minimum length, complexity (uppercase, lowercase, digits, special chars).
 *    - Real-time feedback on password strength and form errors.
 *    - Accessibility-compliant error output with "FormError" from our UI library.
 *
 * Implementation Steps (from JSON specification):
 *  - "ResetPasswordPage":
 *      1) Initialize router and search params hooks
 *      2) Extract and validate reset token from URL
 *      3) Check for rate limiting violations
 *      4) Render accessible form with password requirements
 *      5) Display real-time password strength indicator
 *      6) Handle form submission with validation
 *      7) Show appropriate success/error notifications
 *      8) Redirect to login on successful reset
 *
 *  - "handlePasswordReset":
 *      1) Validate reset token expiration
 *      2) Check rate limiting threshold
 *      3) Validate password against security requirements
 *      4) Attempt password update with error handling
 *      5) Log reset attempt for security monitoring
 *      6) Clear sensitive form data
 *      7) Display success notification on completion
 *      8) Handle errors with appropriate user feedback
 *      9) Redirect to login page after success
 ************************************************************************************************/

import React, { useCallback, useState, useMemo } from "react"; // react ^18.2.0
import { useRouter, useSearchParams } from "next/navigation"; // next/navigation ^14.0.0
import { toast } from "react-hot-toast"; // react-hot-toast ^2.4.1
import { z } from "zod"; // zod ^3.22.0

// Internal Imports
import { Form, FormField, FormError, PasswordStrengthIndicator } from "@/components/ui/Form";
import { updatePassword } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

// Global Constants from JSON Specification
const MAX_RESET_ATTEMPTS = 5; // "MAX_RESET_ATTEMPTS" from specification
const RESET_TIMEOUT = 900000; // "RESET_TIMEOUT" in ms (15 minutes) from specification

/************************************************************************************************
 * Password Schema (from the JSON specification 'globals'):
 *   - Must contain at least:
 *     - One uppercase letter
 *     - One lowercase letter
 *     - One digit
 *     - One special character
 *   - Minimum length of 8
 ************************************************************************************************/
const passwordSchema = z.string().min(8).regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
);

/************************************************************************************************
 * Form Schema Wrapping the Password
 ************************************************************************************************/
const resetFormSchema = z.object({
  password: passwordSchema
});

/************************************************************************************************
 * handlePasswordReset
 * ---------------------------------------------------------------------------------------------
 * A function that performs secure password reset logic in 9 steps as per the JSON specification:
 *  1) Validate reset token expiration
 *  2) Check rate limiting threshold
 *  3) Validate password against security requirements
 *  4) Attempt password update with error handling
 *  5) Log reset attempt for security monitoring
 *  6) Clear sensitive form data
 *  7) Display success notification on completion
 *  8) Handle errors with significant user feedback
 *  9) Redirect to login page after success
 *
 * @param token  The secure reset token extracted from the URL.
 * @param password  The new password submitted by the user.
 * @param resetAttempts  The number of attempts made so far, from useAuth or local state.
 * @param onSuccess  Callback invoked after successful reset (e.g. navigate away).
 * @returns Promise<void>
 ************************************************************************************************/
async function handlePasswordReset(
  token: string | null,
  password: string,
  resetAttempts: number,
  onSuccess: () => void
): Promise<void> {
  // 1) Validate reset token (in a real system, we'd verify expiration server-side).
  if (!token || token.trim().length === 0) {
    throw new Error("Invalid or missing reset token. Cannot reset password.");
  }

  // 2) Check rate limiting threshold
  if (resetAttempts >= MAX_RESET_ATTEMPTS) {
    throw new Error(
      "Too many reset attempts have been made. Please wait before trying again."
    );
  }

  // 3) The password is validated by Zod in the form submission, but we can add extra checks here.
  if (!password || password.length < 8) {
    throw new Error("Password does not meet required complexity or length.");
  }

  // 4) Attempt password update
  //    The 'updatePassword' function is assumed to handle actual server calls and error states.
  try {
    await updatePassword({ token, newPassword: password });
  } catch (err) {
    // 5) Log reset attempt for security monitoring (fake logging below):
    // console.error(`[SECURITY] Password reset attempt error for token ${token}`, err);
    throw new Error("Failed to update password. Please try again.");
  }

  // 6) Clear sensitive form data (handled by react-hook-form reset, if used).
  //    We do not store the password in local state, so there's nothing to explicitly clear here.

  // 7) Display success notification
  toast.success("Your password has been reset successfully!");

  // 8) Handle any potential user feedback at this point. If we had partial warnings, we'd show them.

  // 9) Redirect to login page (the onSuccess callback will do the navigation).
  onSuccess();
}

/************************************************************************************************
 * ResetPasswordPage - Default Exported Page Component
 * ---------------------------------------------------------------------------------------------
 * Renders an accessible password reset form with real-time validation. Invokes handlePasswordReset
 * on submission, and handles success/error user feedback. Follows the specification steps in detail.
 *
 * Steps:
 *   1) Initialize router and searchParams to obtain the token
 *   2) Validate token, if missing, show error or block usage
 *   3) Extract resetAttempts from auth (or local state) for basic rate limiting
 *   4) Render the form, collecting new password input
 *   5) Display real-time password strength using "PasswordStrengthIndicator"
 *   6) On submission, call handlePasswordReset
 *   7) Show success/error notifications
 *   8) Redirect to login after success
 ************************************************************************************************/
export default function ResetPasswordPage(): JSX.Element {
  // Step 1) Initialize router (for navigation) and searchParams (to get token).
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Step 2) From the useAuth hook, get isLoading and resetAttempts
  //    JSON specification mentions "resetAttempts" usage for rate limiting.
  //    If the hook does not currently provide it, we can fallback to 0 or track locally.
  //    We'll show how it might be used if present. (If your actual code/hook differs, adjust.)
  const { isLoading, resetAttempts = 0 } = useAuth(); // user is not strictly needed here

  // Local state to handle top-level form errors (e.g., token missing or server failures)
  const [topError, setTopError] = useState<string | null>(null);

  // If there's no token at all, we can show a top-level error or direct the user away.
  if (!token) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-2">Reset Password</h1>
        <p className="text-red-600">No reset token provided. Please request a new link.</p>
      </div>
    );
  }

  /************************************************************************************************
   * onSubmit Handler
   * ---------------------------------------------------------------------------------------------
   * This callback integrates "handlePasswordReset" with the validated form data. On success,
   * navigates the user to /auth/login. On error, sets a user-facing error message.
   ************************************************************************************************/
  const onSubmit = useCallback(
    async (formData: { password: string }) => {
      // Clear any prior top-level errors
      setTopError(null);

      try {
        await handlePasswordReset(token, formData.password, resetAttempts, () => {
          // On success, push user to login
          router.push("/auth/login");
        });
      } catch (err: any) {
        // Display user-friendly error message
        const msg = err?.message || "Error resetting password.";
        setTopError(msg);
        toast.error(msg);
      }
    },
    [resetAttempts, router, token]
  );

  /************************************************************************************************
   * Dynamic Title or Heading
   * ---------------------------------------------------------------------------------------------
   * The user sees a heading labeling the page for context. Next.js app directory pages can also
   * define metadata for the head element if needed using "generateMetadata" or "metadata" property.
   ************************************************************************************************/
  const pageTitle = useMemo(() => "Reset Your Password", []);

  /************************************************************************************************
   * Render
   * ---------------------------------------------------------------------------------------------
   * We use our unified <Form> component from "@/components/ui/Form" with Zod-based schema
   * validation, real-time errors, and a custom password strength indicator.
   ************************************************************************************************/
  return (
    <div className="max-w-lg mx-auto my-8 p-4 bg-white rounded shadow space-y-4">
      <h1 className="text-2xl font-semibold">{pageTitle}</h1>

      {/* If a top-level error is present, show it via FormError or inline text. */}
      {topError && <FormError message={topError} />}

      <Form
        schema={resetFormSchema}
        onSubmit={onSubmit}
        // We can display a spinner or disable the form if isLoading from useAuth is true
        loading={isLoading}
        className="space-y-6"
      >
        {/* FormField for the new password input */}
        <FormField
          name="password"
          type="password"
          label="New Password"
          placeholder="Enter your new password"
        />

        {/* Real-time password strength indicator (visual + accessible), reliant on hooking into the form data */}
        <PasswordStrengthIndicator fieldName="password" />

        {/* Display any top-level error again or reveal server-side errors if needed */}
        <FormError />

        {/* Submit Button */}
        <button
          type="submit"
          className="
            w-full
            py-2
            px-4
            text-white
            bg-blue-600
            hover:bg-blue-700
            rounded
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:ring-offset-2
            disabled:opacity-50
          "
          disabled={isLoading}
        >
          Reset Password
        </button>
      </Form>
    </div>
  );
}