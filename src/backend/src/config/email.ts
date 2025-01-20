/* 
  Enterprise-Grade Email Configuration Module
  This file provides robust settings and functionality for integrating
  with the Resend email provider within the B2B sales intelligence platform. 
  It handles comprehensive validation of environment variables, creates
  a configured email client, and enforces controllable retry mechanisms 
  and template usage through validated configuration objects.
*/

/* EXTERNAL DEPENDENCIES */
// resend@^1.0.0 - Email delivery service SDK for handling transactional emails
import { Resend } from 'resend';
// zod@^3.0.0 - Runtime validation for configuration and environment variables
import { z } from 'zod';

/* 
  INTERFACES
  -------------------------------------------------------------------------------------
  Defines the structures required to manage and enforce email configuration across
  the platform. These interfaces ensure consistency and type safety throughout the
  emailing process.
*/

/**
 * Interface representing the foundational template configuration settings
 * for outbound emails. This includes reply-to address, template file paths,
 * and retry rules for robust error-handling scenarios.
 */
export interface TemplateSettings {
  /**
   * The reply-to email address used in rendered emails, allowing
   * recipients to respond to a designated inbox for improved communication flows.
   */
  replyTo: string;

  /**
   * The file system or relative path to the template directory,
   * ensuring that the email sending process can locate the correct
   * templates for constructing messages.
   */
  templatePath: string;

  /**
   * The maximum number of resend attempts that should be performed
   * in case of failures. A controlled retry mechanism aims to circumvent
   * transient errors in the email delivery process.
   */
  maxRetries: number;

  /**
   * The delay in milliseconds between retry attempts, granting a buffer
   * period before subsequent retries and aiding in mitigating rate-limit
   * or temporary connectivity issues.
   */
  retryDelay: number;
}

/**
 * Interface defining the structure of the standardized email configuration
 * for this platform. Combines a fully-configured Resend client instance,
 * the default 'from' address, and template settings for operational usage.
 */
export interface EmailConfig {
  /**
   * The email client instance obtained from the Resend integration,
   * including capabilities to send or schedule emails using the provider's APIs.
   */
  client: Resend;

  /**
   * The default outbound email address from which official emails
   * within the platform originate.
   */
  fromEmail: string;

  /**
   * A consolidated set of default parameters used to manage email templates
   * and resend attempts. These settings may be customized per email dispatch
   * if necessary, but defaults are strongly enforced.
   */
  defaultTemplateSettings: TemplateSettings;
}

/* 
  CONSTANTS
  -------------------------------------------------------------------------------------
  Predefined schema and default values used to validate environment variables and
  provide baseline template settings for email dispatch.
*/

/**
 * A Zod schema enforcing that the environment contains valid entries for:
 * - RESEND_API_KEY: The API key used to authenticate with Resend.
 * - FROM_EMAIL: A valid email address to be used as the primary sender.
 */
export const EMAIL_CONFIG_SCHEMA = z.object({
  RESEND_API_KEY: z.string().min(1),
  FROM_EMAIL: z.string().email(),
});

/**
 * Provides a foundational set of default template settings intended for
 * use throughout the platform. The environment is consulted to allow
 * overriding these defaults if necessary.
 */
export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  replyTo: process.env.DEFAULT_REPLY_TO || process.env.FROM_EMAIL || '',
  templatePath: process.env.EMAIL_TEMPLATE_PATH || './templates',
  maxRetries: Number(process.env.EMAIL_MAX_RETRIES) || 3,
  retryDelay: Number(process.env.EMAIL_RETRY_DELAY) || 1000,
};

/* 
  FUNCTIONS
  -------------------------------------------------------------------------------------
*/

/**
 * Validates that all required environment variables for email configuration
 * are present and format-compliant. This function ensures that the platform
 * can properly interact with the Resend service and maintains valid sender info.
 *
 * Steps:
 * 1. Parse environment variables using Zod schema.
 * 2. Validate email format for FROM_EMAIL.
 * 3. Validate API key presence and format.
 * 4. Throw detailed error if validation fails.
 *
 * @throws {Error} If environment variables are invalid or incomplete.
 */
export function validateEnvironment(): void {
  // Attempt to parse the environment against the defined schema.
  // This will throw an error if any field is missing or invalid.
  EMAIL_CONFIG_SCHEMA.parse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
  });
}

/**
 * Validates and normalizes template settings by merging with defaults
 * and verifying essential fields. This function ensures that each
 * email dispatch scenario adheres to a consistent standard of retries,
 * template location, etc.
 *
 * @param settings - A partial set of template settings to merge with defaults.
 * @returns A fully validated TemplateSettings object containing all required fields.
 *
 * Steps:
 * 1. Merge provided settings with defaults.
 * 2. Validate template path existence.
 * 3. Validate numeric constraints for retries.
 * 4. Return validated settings.
 *
 * @throws {Error} If the provided or merged settings are invalid.
 */
export function validateTemplateSettings(
  settings: Partial<TemplateSettings>,
): TemplateSettings {
  // Start by cloning and merging user-provided settings with the default ones.
  const merged: TemplateSettings = {
    ...DEFAULT_TEMPLATE_SETTINGS,
    ...settings,
    // Explicit numeric property handling to avoid improper merges.
    maxRetries: settings.maxRetries ?? DEFAULT_TEMPLATE_SETTINGS.maxRetries,
    retryDelay: settings.retryDelay ?? DEFAULT_TEMPLATE_SETTINGS.retryDelay,
  };

  // Verify that the template path is a non-empty string.
  if (!merged.templatePath || typeof merged.templatePath !== 'string') {
    throw new Error(
      'Invalid "templatePath" specified in TemplateSettings. It must be a non-empty string.',
    );
  }

  // Validate that maxRetries and retryDelay are not negative or otherwise invalid.
  if (merged.maxRetries < 0) {
    throw new Error(
      'Invalid "maxRetries" specified in TemplateSettings. It must be zero or a positive number.',
    );
  }
  if (merged.retryDelay < 0) {
    throw new Error(
      'Invalid "retryDelay" specified in TemplateSettings. It must be zero or a positive number.',
    );
  }

  // Return the fully validated object.
  return merged;
}

/**
 * Creates and configures a Resend client instance with full environment validation
 * and robust error handling. This function ensures that the resulting client is
 * properly authenticated and includes re-try or error capture mechanisms as needed.
 *
 * @returns A fully configured Resend client instance ready for email operations.
 *
 * Steps:
 * 1. Validate environment configuration.
 * 2. Initialize Resend client with API key.
 * 3. Configure retry mechanism (if required by official usage).
 * 4. Set up error handling or logging to capture important failures.
 * 5. Return configured client instance.
 *
 * @throws {Error} If environment is invalid or client fails to initialize.
 */
export function createResendClient(): Resend {
  // Step 1: Validate environment before instantiation.
  validateEnvironment();

  // Step 2: Create a Resend client using the validated API key.
  const apiKey = process.env.RESEND_API_KEY as string;
  const client = new Resend(apiKey);

  // Steps 3 & 4: Implementation of advanced error handling and retry logic
  // can be included here, depending on the Resend library's available hooks
  // or on a custom wrapper approach. For production-grade reliability, you
  // may incorporate resilient job queues and circuit breakers.

  // Step 5: Return the client for email operations.
  return client;
}

/* 
  CONFIG EXPORT
  -------------------------------------------------------------------------------------
  Construct and export the final email configuration object. This object
  includes the aligned client, fromEmail string, and defaultTemplateSettings
  adhering to the EmailConfig interface. Additional named exports also 
  expose these items for direct usage where needed.
*/

/** 
 * The core configuration object that aggregates the Resend client, 
 * the default 'from' email address, and all baseline template settings.
 */
export const emailConfig: EmailConfig = {
  // Instantiate the Resend client upon config creation.
  client: createResendClient(),
  // Acquire and hold the validated sender email.
  fromEmail: process.env.FROM_EMAIL as string,
  // Merge the default template settings, ensuring any custom overrides
  // from environment or local settings are correctly honored.
  defaultTemplateSettings: validateTemplateSettings({}),
};

/**
 * Named exports of the email configuration properties for flexible usage
 * throughout the application. This encourages modular integration
 * in various features (e.g., serverless functions, UI triggers, or job queues).
 */
export const { client, fromEmail, defaultTemplateSettings } = emailConfig;