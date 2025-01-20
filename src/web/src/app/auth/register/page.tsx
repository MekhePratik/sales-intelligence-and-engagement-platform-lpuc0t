"use client";

/*************************************************************************************************
 * Registration Page (Next.js 14, TypeScript)
 * -----------------------------------------------------------------------------------------------
 * Implements a secure user and organization signup flow using Supabase Auth. Features include:
 *   - Secure validation with Zod (password complexity, etc.)
 *   - Real-time feedback on form fields (via react-hook-form + zodResolver)
 *   - Accessibility support (ARIA attributes, error handling)
 *   - Comprehensive error and loading states (integrated with useAuth hook)
 *   - Organization setup using "organizationName" field
 *   - Proper security controls (rate-limiting handled by useAuth, secure redirect on success)
 *
 * JSON Specification References:
 *  - requirements_addressed: 
 *    1) Authentication Methods (7.1) - Using Supabase Auth for new user registration
 *    2) Form Validation (6.3) - Enhanced client-side validation with real-time feedback
 *    3) Design System (6.1) - Consistent styling with TailwindCSS & Shadcn components
 *    4) Organization Setup (1.3) - Organization creation is triggered during registration
 *
 * Exports:
 *  - RegisterPage (React.FC) -> default export
 *  - handleRegistration (Async helper function)
 *************************************************************************************************/

import React, { useCallback } from "react";
// next/navigation version ^14.0.0 for secure routing after registration
import { useRouter } from "next/navigation";
// Zod ^3.22.2 for schema-based validation
import { z } from "zod";
// react-hook-form resolvers for bridging Zod & react-hook-form
import { zodResolver } from "@hookform/resolvers/zod";
// Lightweight, accessible toast notifications (sonner ^1.0.0)
import { toast } from "sonner";

/*************************************************************************************************
 * Internal/UI Imports (mandated by JSON specification)
 *************************************************************************************************/
// useAuth hook providing { register, isLoading } among other auth utilities
import { useAuth } from "@/hooks/useAuth";
// Accessible form components with validation integrations
import {
  Form,
  FormField,
  FormError,
  FormLabel, // Named usage per specification
} from "@/components/ui/Form";
// Reusable Input component implementing the design system's input styles
import Input from "@/components/ui/Input";
// Reusable Button component with loading & accessibility features
import Button from "@/components/ui/Button";
// Interface for registration form data (email, password, name, organizationName)
import type { RegisterCredentials } from "@/types/auth";

/*************************************************************************************************
 * 1. Registration Schema
 * Defined per JSON "globals" specification, implementing strong security checks:
 *  - Email must be valid & present
 *  - Password must be at least 8 chars, with uppercase, lowercase, symbol, number
 *  - Name must be alphanumeric with spaces, between 2 and 50 chars
 *  - organizationName must be between 2 and 100 chars, allowing letters, numbers, spaces, hyphens
 *************************************************************************************************/
const registrationSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain uppercase, lowercase, number and special character"
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s]*$/, "Name can only contain letters, numbers and spaces"),
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters")
    .regex(
      /^[a-zA-Z0-9\s\-\.]*$/,
      "Organization name can only contain letters, numbers, spaces, hyphens and dots"
    ),
});

/*************************************************************************************************
 * 2. Secure Registration Handler
 * -----------------------------------------------------------------------------------------------
 * handleRegistration (as described in JSON specification)
 *  - Validates input data against security rules (handled by react-hook-form + zod)
 *  - Calls register function from useAuth
 *  - Demonstrates organizational setup steps (abstracted in server logic)
 *  - Triggers email verification or other post-registration flows if needed
 *  - Provides user feedback via toast messages
 *  - Secures redirection upon success
 *
 * @param {RegisterCredentials} formData - The validated form input from react-hook-form
 * @param {(creds: RegisterCredentials) => Promise<void>} registerFn - The "register" function from useAuth
 * @param {() => void} onSuccessRedirect - A function to execute on success (e.g., router.push)
 * @returns {Promise<void>} - Resolves upon handling success or throws on error
 *************************************************************************************************/
async function handleRegistration(
  formData: RegisterCredentials,
  registerFn: (creds: RegisterCredentials) => Promise<void>,
  onSuccessRedirect: () => void
): Promise<void> {
  try {
    // 1. Input is already validated by Zod via react-hook-form.
    // 2. Rate Limiting check is performed in the custom hook if configured.

    // 3. Attempt to register the user using the provided register function.
    await registerFn(formData);

    // 4. If successful, we can display a success toast to confirm
    toast.success("Registration successful! Redirecting...");

    // 5. Redirect to the dashboard after a short delay or immediately.
    onSuccessRedirect();
  } catch (err: unknown) {
    // 6. In case of an error, provide user-friendly feedback.
    const errorMessage =
      err instanceof Error && err.message ? err.message : "Registration failed. Please try again.";
    toast.error(errorMessage);
    // 7. The function throws or ends here. Up to the caller to handle additional UI state if needed.
    throw err;
  }
}

/*************************************************************************************************
 * 3. Main Registration Page (React.FC)
 * -----------------------------------------------------------------------------------------------
 * Presents a robust form with real-time validation, accessible fields, and integrated security.
 * Steps (from JSON specification):
 *  1) Initialize router for secure navigation.
 *  2) Destructure `register` as `registerUser` and `isLoading` from useAuth hook.
 *  3) Setup form validation with zodResolver using `registrationSchema`.
 *  4) Implement real-time validation feedback (react-hook-form onChange mode).
 *  5) Manage focus and accessibility announcements (built into Form + FormField).
 *  6) Handle success/error toasts with graceful user messaging.
 *  7) Redirect to dashboard on successful registration.
 *************************************************************************************************/
const RegisterPage: React.FC = () => {
  // Step 1: Initialize Next.js router for secure post-registration navigation
  const router = useRouter();

  // Step 2: Destructure the named usage from our useAuth hook
  const { register: registerUser, isLoading } = useAuth();

  // Step 3: onSubmit callback bound to the Form's submission
  const onSubmit = useCallback(
    async (data: RegisterCredentials) => {
      // Delegate the secure logic to handleRegistration
      await handleRegistration(data, registerUser, () => {
        router.push("/dashboard");
      });
    },
    [registerUser, router]
  );

  // Render the page with an accessible form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      {/* This outer container centers the form on the page for a clean UI */}
      <div className="w-full max-w-md rounded-md bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">Create Your Account</h1>
        {/*
          Step 4: We use the Form component with the zod-based resolver for real-time validation.
          Step 5: The Form + FormField handle accessibility (ARIA) and error messages automatically.
          Step 6: We pass onSubmit to handle final submission logic with handleRegistration.
        */}
        <Form<RegisterCredentials>
          schema={registrationSchema}
          onSubmit={onSubmit}
          className="space-y-4"
          loading={isLoading} // Disables form if the auth state is loading
        >
          {/* Potential top-level form errors can be displayed with <FormError> if needed. */}
          <FormError message={""} />

          {/********************************************************************************************
            Using FormField for each required field from the schema:
            1. Email
            2. Password
            3. Name
            4. Organization Name
          ********************************************************************************************/}
          <FormField<RegisterCredentials>
            name="email"
            label="Email Address"
            type="email"
            placeholder="john.doe@example.com"
          />

          <FormField<RegisterCredentials>
            name="password"
            label="Password"
            type="password"
            placeholder="********"
          />

          <FormField<RegisterCredentials>
            name="name"
            label="Full Name"
            type="text"
            placeholder="John Doe"
          />

          <FormField<RegisterCredentials>
            name="organizationName"
            label="Organization Name"
            type="text"
            placeholder="Acme Inc."
          />

          {/********************************************************************************************
            We can also demonstrate usage of FormLabel if needed for a custom layout.
            However, FormField internally renders a label if you pass "label" prop.
            This is just to show the named usage from specification:
          ********************************************************************************************/}
          <div className="mt-4">
            <FormLabel htmlFor="terms">
              {/* Additional labels or disclaimers could be placed here if required */}
            </FormLabel>
          </div>

          {/********************************************************************************************
            Submitting the form triggers the onSubmit callback, which calls handleRegistration
          ********************************************************************************************/}
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
            ariaLabel="Register Account"
          >
            Sign Up
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default RegisterPage;