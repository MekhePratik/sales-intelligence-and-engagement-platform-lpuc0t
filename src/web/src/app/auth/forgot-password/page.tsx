import React, { useState } from 'react' // react ^18.2.0
import { useRouter } from 'next/navigation' // next/navigation ^14.0.0
import { z } from 'zod' // zod ^3.22.0

/****************************************************************************
 * Internal Imports - Required by JSON Specification
 ****************************************************************************/
import { useAuth } from '../../../hooks/useAuth'
import { Form, FormField, FormError } from '../../../components/ui/Form'
import { useToast } from '../../../hooks/useToast'
import { Button } from '../../../components/ui/Button'

/***************************************************************************
 * Global Constants
 * -------------------------------------------------------------------------
 * - forgotPasswordSchema: Defines Zod-based validation for email field.
 * - RATE_LIMIT_DURATION:  Rate limit cooldown duration in seconds.
 * - MAX_ATTEMPTS:         Maximum allowed attempts within the rate limit window.
 ***************************************************************************/
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const RATE_LIMIT_DURATION = 300
const MAX_ATTEMPTS = 5

/****************************************************************************
 * handleForgotPassword
 * -------------------------------------------------------------------------
 * Handles the forgot password form submission with rate limiting checks,
 * error handling, and secure password reset calls to Supabase Auth.
 *
 * Steps (per specification):
 *  1) Check rate limiting status
 *  2) Set loading state
 *  3) Validate email format
 *  4) Call resetPassword function
 *  5) Handle success with toast
 *  6) Handle errors with specific messages
 *  7) Update loading state
 *  8) Redirect to login on success
 *  9) Log security-relevant events
 ****************************************************************************/
async function handleForgotPassword(
  formData: { email: string },
  isRateLimited: (operation: string) => boolean,
  resetPassword: (email: string) => Promise<void>,
  setLoading: (val: boolean) => void,
  showToast: (args: { variant: 'success' | 'error' | 'warning' | 'info'; title: string; description?: string }) => void,
  routerPush: (url: string) => void
): Promise<void> {
  try {
    // 1) Check rate limiting status for 'forgotPassword' operation
    if (isRateLimited && isRateLimited('forgotPassword')) {
      showToast({
        variant: 'error',
        title: 'Too Many Requests',
        description: `Please wait ${RATE_LIMIT_DURATION} seconds before trying again.`,
      })
      return
    }

    // 2) Set loading state
    setLoading(true)

    // 3) Validate email format (already enforced by Zod, but we can add extra checks if needed)

    // 4) Call the resetPassword function from our auth hook
    await resetPassword(formData.email)

    // 5) Handle success with toast
    showToast({
      variant: 'success',
      title: 'Password Reset Email Sent',
      description: 'Check your inbox for instructions to reset your password.',
    })

    // 6) No specific error from resetPassword, so skip error messaging here

    // 7) Update loading state to false
    setLoading(false)

    // 8) Redirect to login on success
    routerPush('/auth/login')

    // 9) Log security-relevant event (minimal console log example)
    console.log('[SECURITY] Password reset link generated for:', formData.email)
  } catch (error: any) {
    // 6) Enhanced error messaging
    setLoading(false)
    showToast({
      variant: 'error',
      title: 'Error Sending Reset Email',
      description: error?.message || 'An unexpected error occurred.',
    })
    console.error('[SECURITY] Failed to send password reset email:', error)
  }
}

/****************************************************************************
 * ForgotPasswordPage
 * -------------------------------------------------------------------------
 * Main page component for forgot password functionality with enhanced
 * security and accessibility. Renders an accessible form, checks rate
 * limiting, and calls handleForgotPassword on submit.
 *
 * Steps (per specification):
 *  1) Initialize router for navigation
 *  2) Initialize toast notifications
 *  3) Initialize loading and error states
 *  4) Initialize form validation schema
 *  5) Set up rate limiting check
 *  6) Handle form submission
 *  7) Render accessible form with validation
 *  8) Provide loading/error states feedback
 *  9) Include clear instructions for screen readers
 ***************************************************************************/
const ForgotPasswordPage: React.FC = () => {
  // 1) Initialize router for navigation
  const router = useRouter()

  // 2) Initialize toast notifications
  const { showToast } = useToast()

  // 3) Initialize loading state
  const [loading, setLoading] = useState<boolean>(false)

  // 4) We have our forgotPasswordSchema, no separate error state needed, Form handles that

  // 5) Destructure the isRateLimited and resetPassword from useAuth
  const { isRateLimited, resetPassword } = useAuth() as {
    isRateLimited: (operation: string) => boolean
    resetPassword: (email: string) => Promise<void>
  }

  // 6) Local form submission callback
  async function onSubmit(formData: { email: string }) {
    await handleForgotPassword(
      formData,
      isRateLimited,
      resetPassword,
      setLoading,
      showToast,
      (url: string) => router.push(url)
    )
  }

  // 7) Render accessible form with real-time validation
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-semibold mb-4">Forgot Your Password?</h1>
      <p className="text-center mb-6 max-w-md text-gray-700" aria-live="polite">
        Enter your email address below to request a password reset. We will send you
        instructions on how to securely reset your password via email.
      </p>
      <Form
        schema={forgotPasswordSchema}
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white p-6 shadow-md rounded-md"
        loading={loading}
      >
        <FormField
          name="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          disabled={loading}
        />
        <FormError message="" />
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            isLoading={loading}
            isDisabled={loading}
            variant="primary"
            className="w-full sm:w-auto"
            ariaLabel="Submit email to reset your password"
          >
            Request Reset Link
          </Button>
        </div>
      </Form>
      {/* 9) Screen reader specific instructions could be added as well, if needed here */}
    </div>
  )
}

/****************************************************************************
 * Default Export
 * --------------------------------------------------------------------------
 * We export ForgotPasswordPage as default to satisfy Next.js page conventions.
 ****************************************************************************/
export default ForgotPasswordPage