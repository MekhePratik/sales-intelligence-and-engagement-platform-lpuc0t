/**
 * This module provides configuration and initialization for Supabase clients,
 * enabling both public (anonymous) and admin (service role) access levels.
 * It validates all required environment variables, ensuring they meet the
 * necessary format for secure Supabase connectivity.
 *
 * The exported default client, "supabase", is configured with an anonymous
 * key and is suitable for public operations. The named export, "adminSupabase",
 * is configured using the service key for privileged actions.
 *
 * @module config/supabase
 */

/* ----------------------------------------------------------------------------------
 * External Imports
 * ---------------------------------------------------------------------------------- */
/**
 * createClient is used to instantiate Supabase clients with configured
 * authentication, database, and storage functionalities.
 */
// @supabase/supabase-js version ^2.38.0
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/* ----------------------------------------------------------------------------------
 * Custom Error Class: ConfigurationError
 * ---------------------------------------------------------------------------------- */
/**
 * Custom error class representing failures in Supabase configuration validation,
 * capturing both the error message and the specific missing or invalid variable name.
 */
export class ConfigurationError extends Error {
  /**
   * Name of the environment variable that is missing or invalid.
   */
  public missingVar: string;

  /**
   * Constructs a new ConfigurationError instance containing contextual details
   * about the missing or invalid configuration variable.
   *
   * @param message - Descriptive error message.
   * @param missingVar - The name of the missing or invalid environment variable.
   */
  constructor(message: string, missingVar: string) {
    super(message);

    // Set a custom name for clarity in stack traces and logs
    this.name = 'ConfigurationError';

    // Store the problematic environment variable for reference
    this.missingVar = missingVar;

    // Capture a proper error stack trace (V8 environments)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/* ----------------------------------------------------------------------------------
 * Environment Variable Constants
 * ---------------------------------------------------------------------------------- */
/**
 * These constants reference environment variables critical to establishing
 * secure connections to Supabase. Each variable is validated for presence
 * and format in the validateConfig function.
 */
const SUPABASE_URL: string = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY: string = process.env.SUPABASE_ANON_KEY as string;
const SUPABASE_SERVICE_KEY: string = process.env.SUPABASE_SERVICE_KEY as string;

/* ----------------------------------------------------------------------------------
 * Configuration Validation Function
 * ---------------------------------------------------------------------------------- */
/**
 * Ensures that all required environment variables for Supabase integration
 * are properly set and valid. Throws ConfigurationError when invalid or missing.
 *
 * Steps for Validation:
 * 1. Check if SUPABASE_URL is defined.
 * 2. Verify that SUPABASE_URL is a valid URL by using the URL constructor.
 * 3. Check if SUPABASE_ANON_KEY is defined and matches an acceptable pattern.
 * 4. Check if SUPABASE_SERVICE_KEY is defined and also matches an acceptable pattern.
 * 5. Throw a descriptive ConfigurationError if any check fails.
 */
function validateConfig(): void {
  // Step 1: Validate SUPABASE_URL
  if (!SUPABASE_URL) {
    throw new ConfigurationError(
      'The environment variable SUPABASE_URL is missing or empty.',
      'SUPABASE_URL'
    );
  }
  try {
    // Step 2: Validate URL format
    // This will throw a TypeError if the string is not a valid URL
    new URL(SUPABASE_URL);
  } catch (err) {
    throw new ConfigurationError(
      'The environment variable SUPABASE_URL is not a valid URL.',
      'SUPABASE_URL'
    );
  }

  // Regex pattern for Supabase key checks
  // Adjust pattern as necessary for specific formats.
  // Here, a basic pattern is used to illustrate a key structure.
  const keyPattern = /^[A-Za-z0-9_\-.+/=]+$/;

  // Step 3: Validate SUPABASE_ANON_KEY
  if (!SUPABASE_ANON_KEY) {
    throw new ConfigurationError(
      'The environment variable SUPABASE_ANON_KEY is missing or empty.',
      'SUPABASE_ANON_KEY'
    );
  }
  if (!keyPattern.test(SUPABASE_ANON_KEY)) {
    throw new ConfigurationError(
      'The environment variable SUPABASE_ANON_KEY does not match the required format.',
      'SUPABASE_ANON_KEY'
    );
  }

  // Step 4: Validate SUPABASE_SERVICE_KEY
  if (!SUPABASE_SERVICE_KEY) {
    throw new ConfigurationError(
      'The environment variable SUPABASE_SERVICE_KEY is missing or empty.',
      'SUPABASE_SERVICE_KEY'
    );
  }
  if (!keyPattern.test(SUPABASE_SERVICE_KEY)) {
    throw new ConfigurationError(
      'The environment variable SUPABASE_SERVICE_KEY does not match the required format.',
      'SUPABASE_SERVICE_KEY'
    );
  }
}

/* ----------------------------------------------------------------------------------
 * Execute Configuration Validation
 * ---------------------------------------------------------------------------------- */
validateConfig();

/* ----------------------------------------------------------------------------------
 * Supabase Clients
 * ---------------------------------------------------------------------------------- */
/**
 * Default Supabase client initialized with the anonymous key. This client is
 * suitable for public or unprivileged operations (e.g., basic data fetching).
 *
 * Exposes:
 * 1. auth - for handling user authentication flows using the anonymous key.
 * 2. from() - for interacting with database tables and other resources.
 */
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Additional auth options for higher security in server-side environments
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Admin Supabase client initialized with the service role key, granting
 * privileged capabilities such as accessing RLS-protected data or performing
 * server-side operations that require elevated privileges.
 *
 * Note: Ensure this client is only used in trusted, server-side contexts
 * to avoid exposing the service key in the browser.
 */
export const adminSupabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      // Service role access should have limited session usage
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/* ----------------------------------------------------------------------------------
 * Default Export
 * ---------------------------------------------------------------------------------- */
/**
 * Exports the anonymous Supabase client by default.
 * Named adminSupabase export is also available for elevated operations.
 */
export default supabase;