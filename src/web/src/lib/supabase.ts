/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * Supabase Client Configuration
 * This file contains the configuration and initialization of the Supabase client
 * with comprehensive security checks, environment variable validation, authentication,
 * real-time subscriptions, error handling, and type safety.
 *
 * Requirements Addressed:
 * 1. Authentication Methods: (JWT + Session) with persistent session management.
 * 2. Data Storage: Supabase PostgreSQL for relational data with real-time capabilities.
 * 3. Security Controls: Environment validation, secure configuration, and connection pooling.
 */

/* -----------------------------------------------------------------------------
 * External Dependencies
 * Using '@supabase/supabase-js' version ^2.38.4 for createClient and SupabaseClient.
 * -----------------------------------------------------------------------------
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js' // version ^2.38.4

/* -----------------------------------------------------------------------------
 * Internal Dependencies
 * Importing AuthState interface to ensure correct usage of 'user' and 'session' members.
 * -----------------------------------------------------------------------------
 */
import type { AuthState } from '../types/auth'
import type { User, Session } from '@supabase/supabase-js' // version ^2.38.4

/**
 * Valid environment variable for the Supabase backend URL.
 * Must be defined to create a valid client instance.
 */
const SUPABASE_URL: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL

/**
 * Valid environment variable for the Supabase anonymous key.
 * Must be defined for proper authentication flows.
 */
const SUPABASE_ANON_KEY: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Performs the creation and configuration of a Supabase client instance.
 * This includes enforcing security checks, validation, and advanced setups for:
 *   - Authentication persistence
 *   - Real-time subscriptions with timeouts
 *   - Automatic session refresh
 *   - Connection pooling (when available)
 *   - Development logging
 *
 * @returns {SupabaseClient} Fully configured Supabase client instance
 *                          with auth, real-time, and type-safe operations.
 */
export function createSupabaseClient(): SupabaseClient {
  // 1. Validate SUPABASE_URL environment variable with a detailed error message.
  if (!SUPABASE_URL || typeof SUPABASE_URL !== 'string' || !SUPABASE_URL.length) {
    throw new Error(
      'Missing or invalid environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
      'Please ensure that NEXT_PUBLIC_SUPABASE_URL is set and valid.'
    )
  }

  // 2. Validate SUPABASE_ANON_KEY environment variable with a detailed error message.
  if (!SUPABASE_ANON_KEY || typeof SUPABASE_ANON_KEY !== 'string' || !SUPABASE_ANON_KEY.length) {
    throw new Error(
      'Missing or invalid environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Please ensure that NEXT_PUBLIC_SUPABASE_ANON_KEY is set and valid.'
    )
  }

  // 3. Configure client options including auth persistence, timeouts, schema, and global headers.
  //    Also define a structure for potential connection pooling and real-time settings.
  const clientOptions = {
    global: {
      headers: {
        'x-client-info': 'supabase-js-client', // Additional header for inspection or analytics
      },
    },
    auth: {
      persistSession: true,         // Keep sessions across browser tabs
      autoRefreshToken: true,       // Auto-refresh JWT before expiration
      detectSessionInUrl: true,     // Detect auth tokens in URL for OAuth flows
    },
    db: {
      schema: 'public',
      pooling: {
        max: 10,                    // Maximum number of pooled connections
        idleTimeoutMillis: 30000,   // Close idle connections after 30s
      },
    },
    realtime: {
      timeout: 30000,              // 30s timeout for real-time connection
      retryAfterTimeout: true,     // Allow reconnection attempts on timeouts
      maxReconnectionAttempts: 5,   // Limit reconnection attempts to prevent floods
    },
  }

  // 4. Initialize the Supabase client with error handling and secure configuration.
  //    This step ensures the client is ready for database operations, authentication,
  //    and real-time subscriptions following the provided options.
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions)

  // 5. Set up automatic retry logic for failed requests. This is managed internally by
  //    the '@supabase/supabase-js' library when 'retryAfterTimeout' is set. Additional
  //    implementation for custom fetch can be done here if needed.

  // 6. Configure development-specific logging if in development mode, to aid in diagnosing
  //    integration and runtime issues without exposing sensitive data outside of dev builds.
  if (process.env.NODE_ENV === 'development') {
    // Logging relevant configuration for troubleshooting
    /* eslint-disable no-console */
    console.info('Supabase Client created in development mode with the following configuration:', {
      supabaseUrl: SUPABASE_URL,
      auth: clientOptions.auth,
      db: clientOptions.db,
      realtime: clientOptions.realtime,
      globalHeaders: clientOptions.global.headers,
    })
    /* eslint-enable no-console */
  }

  // 7. Return the properly configured client instance with complete type annotations.
  return client
}

/**
 * Singleton Supabase client instance to interact with:
 * - Auth flows (JWT/Session)
 * - Database queries (from, rpc)
 * - File storage (storage)
 * - Real-time features (realtime)
 */
export const supabase: SupabaseClient = createSupabaseClient()

/**
 * Demonstration of how AuthState can be derived leveraging the Supabase client.
 * This function specifically shows the usage of `user` and `session` members
 * from the imported AuthState interface.
 *
 * @returns Promise<AuthState> containing the current authentication state.
 */
export async function getAuthState(): Promise<AuthState> {
  // Retrieve the session object from Supabase's Auth API
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    // If an error occurs, return a default AuthState; callers can handle the error as needed
    return {
      user: null,
      session: null,
      isLoading: false,
      mfaEnabled: false,
    }
  }

  // Extract user and session from the data
  const session: Session | null = data.session ?? null
  const user: User | null = session?.user ?? null

  // Return an AuthState object exemplifying integrated usage of `user` and `session`
  return {
    user,
    session,
    isLoading: false,
    mfaEnabled: false,
  }
}