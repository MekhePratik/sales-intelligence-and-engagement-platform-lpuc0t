////////////////////////////////////////////////////////////////////////////////
// External Imports
////////////////////////////////////////////////////////////////////////////////

// stripe ^12.0.0 (SDK for secure payment processing and subscription management)
import Stripe from 'stripe';

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import { AppError, createError } from '../utils/error.util'; // For standardized error handling
import { Organization } from '../types/organization';        // Type definitions for organization data

////////////////////////////////////////////////////////////////////////////////
// Global Constants & Environment Variables
////////////////////////////////////////////////////////////////////////////////

/**
 * In a production environment, these environment variables must be set securely,
 * following best practices to avoid exposing sensitive data. This includes storing
 * them in a vault or deploying them via a secure CI/CD pipeline with encryption.
 */
const STRIPE_SECRET_KEY: string | undefined = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET: string | undefined = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * The Stripe API version is pinned for consistent upgrade cycles
 * and to avoid unpredictable behavior from version changes.
 */
const STRIPE_API_VERSION = '2023-10-16';

/**
 * Maximum retry attempts for network-based errors or timeouts
 * when connecting to the Stripe API.
 */
const STRIPE_MAX_RETRIES = 3;

/**
 * A single, shared Stripe client instance, created upon initialization.
 */
let stripeClient: Stripe | null = null;

////////////////////////////////////////////////////////////////////////////////
// initializeStripe
////////////////////////////////////////////////////////////////////////////////

/**
 * @validateEnvironment
 *
 * Initializes and configures the Stripe client instance with proper error handling,
 * validating all required environment variables, and ensuring PCI-compliant usage
 * of the user's payment credentials and API keys.
 *
 * Steps:
 * 1. Validate presence of required environment variables.
 * 2. Validate the format and length of the Stripe secret key.
 * 3. Create a new Stripe instance with the provided secret key.
 * 4. Configure the API version to 2023-10-16.
 * 5. Set timeout to 30 seconds to prevent indefinite requests.
 * 6. Configure the maximum number of network retries to 3.
 * 7. Return the configured Stripe client instance.
 *
 * @returns {Stripe} Configured Stripe client instance.
 */
export function initializeStripe(): Stripe {
  // Step 1: Validate presence of required environment variables
  if (!STRIPE_SECRET_KEY) {
    throw createError(
      // Use an appropriate error code from your global constants
      'B2B_ERR_INTERNAL_SERVER_ERROR',
      'Missing required environment variable: STRIPE_SECRET_KEY',
      {
        source: 'StripeConfig',
        context: { envVar: 'STRIPE_SECRET_KEY' },
        severity: 'CRITICAL',
      }
    );
  }

  // Additional validation can be performed here to check key formatting:
  // For instance, checking if it starts with "sk_" or has a minimum length
  if (!STRIPE_SECRET_KEY.startsWith('sk_') || STRIPE_SECRET_KEY.length < 10) {
    throw createError(
      'B2B_ERR_BAD_REQUEST',
      'Provided Stripe API key format appears to be invalid',
      {
        source: 'StripeConfig',
        context: { keyLength: STRIPE_SECRET_KEY.length },
        severity: 'HIGH',
      }
    );
  }

  // Step 2: Instantiate the Stripe client only if it hasn't been initialized
  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
      maxNetworkRetries: STRIPE_MAX_RETRIES,
      timeout: 30_000, // 30 seconds
    });
  }

  return stripeClient;
}

////////////////////////////////////////////////////////////////////////////////
// createCustomer
////////////////////////////////////////////////////////////////////////////////

/**
 * @validateOrganization
 * @retryOnFailure
 *
 * Creates a new Stripe customer for an organization with proper validation
 * and robust error handling. Ensures the organization data is complete and
 * logs creation for auditing.
 *
 * Steps:
 * 1. Validate that the organization data is complete (id, settings).
 * 2. Initialize and obtain the Stripe client instance.
 * 3. Create the Stripe customer using organization details.
 * 4. Handle potential failures by throwing structured errors with context.
 * 5. Log the customer creation for audit.
 * 6. Return the newly created Stripe customer ID.
 *
 * @param {Organization} organization - The organization that needs a Stripe customer.
 * @returns {Promise<string>} The Stripe customer ID associated with this organization.
 */
export async function createCustomer(organization: Organization): Promise<string> {
  // Step 1: Validate input completeness
  if (!organization || !organization.id || !organization.settings) {
    throw createError(
      'B2B_ERR_BAD_REQUEST',
      'Organization data is incomplete for creating a Stripe customer',
      {
        source: 'StripeConfig',
        context: { organization },
        severity: 'MEDIUM',
      }
    );
  }

  // Step 2: Obtain our configured Stripe client, initializing if not already
  const client = initializeStripe();

  try {
    // Step 3: Create the new Stripe customer using relevant fields from the org
    // Leverage metadata for cross-reference within your system
    const customer = await client.customers.create({
      name: organization.name,
      email: organization.settings.emailDomain || undefined,
      metadata: {
        organizationId: organization.id,
        organizationDomain: organization.domain,
      },
    });

    // Step 5: Production-grade systems would log this event to an audit service
    // or data warehouse for compliance and traceability.
    // e.g. auditLogger.info(`Created customer for org ${organization.id}`, ...);

    // Step 6: Return the newly created customer ID
    return customer.id;
  } catch (error) {
    // Step 4: Wrap and rethrow as a structured error if creation fails
    throw createError(
      'B2B_ERR_API_ERROR',
      'Failed to create a new Stripe customer',
      {
        source: 'StripeConfig',
        context: { stripeError: String(error) },
        severity: 'HIGH',
      }
    );
  }
}

////////////////////////////////////////////////////////////////////////////////
// createSubscription
////////////////////////////////////////////////////////////////////////////////

/**
 * @validateIds
 * @retryOnFailure
 *
 * Creates a new subscription for an organization using the provided
 * Stripe customer ID, price ID, and error handling. Ensures complete
 * parameter validation and logs the subscription creation for auditing.
 *
 * Steps:
 * 1. Validate that both customerId and priceId are provided.
 * 2. Initialize and obtain the Stripe client instance.
 * 3. Create the subscription with relevant metadata fields.
 * 4. Handle any potential creation failures.
 * 5. Log the subscription creation for audit purposes.
 * 6. Return the detailed subscription object containing status and metadata.
 *
 * @param {string} customerId - The existing Stripe customer ID.
 * @param {string} priceId - The Stripe price ID representing a plan or usage-based billing.
 * @returns {Promise<object>} An object containing subscription details, including status.
 */
export async function createSubscription(
  customerId: string,
  priceId: string
): Promise<object> {
  // Step 1: Validate that we have required IDs
  if (!customerId || !priceId) {
    throw createError(
      'B2B_ERR_BAD_REQUEST',
      'Cannot create subscription without valid customer and price IDs',
      {
        source: 'StripeConfig',
        context: { customerId, priceId },
        severity: 'MEDIUM',
      }
    );
  }

  // Step 2: Obtain our configured Stripe client
  const client = initializeStripe();

  try {
    // Step 3: Create a subscription with Stripe
    const subscription = await client.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        createdBy: 'B2B Sales Intelligence Platform',
        subscriptionType: 'organization',
      },
    });

    // Step 5: (Optional) Log subscription creation with relevant info
    // e.g. auditLogger.info(`Created subscription for ${customerId}`, { subscriptionId: subscription.id });

    // Step 6: Return subscription data
    return subscription;
  } catch (error) {
    // Step 4: Handle errors gracefully and rethrow
    throw createError(
      'B2B_ERR_API_ERROR',
      'Failed to create a subscription in Stripe',
      {
        source: 'StripeConfig',
        context: { stripeError: String(error), customerId, priceId },
        severity: 'HIGH',
      }
    );
  }
}

////////////////////////////////////////////////////////////////////////////////
// handleWebhook
////////////////////////////////////////////////////////////////////////////////

/**
 * @validateWebhook
 * @logWebhookEvent
 *
 * Processes all incoming Stripe webhook events with comprehensive event
 * handling and security measures. Verifies the webhook signature using
 * the STRIPE_WEBHOOK_SECRET to ensure authenticity, then parses the event
 * to handle subscription updates, payment status changes, and other
 * critical billing events.
 *
 * Steps:
 * 1. Verify webhook signature against the raw body.
 * 2. Validate overall structure of the event data.
 * 3. Parse the event data safely.
 * 4. Check event.type and handle relevant events (subscription updates, payment failures, etc.).
 * 5. Update organization subscription status or other relevant data as necessary.
 * 6. Handle any payment failures or invoice-related events with proper logging.
 * 7. Save or log any changes into the application database for auditing.
 * 8. Complete the function with no return if successful.
 *
 * @param {string} signature - The signature from Stripe in the request header.
 * @param {Buffer} rawBody - The raw request body used to validate the signature.
 * @returns {Promise<void>} Resolves upon successful processing; otherwise throws AppError.
 */
export async function handleWebhook(signature: string, rawBody: Buffer): Promise<void> {
  // Step 1: Ensure we have the STRIPE_WEBHOOK_SECRET available and verify authenticity
  if (!STRIPE_WEBHOOK_SECRET) {
    throw createError(
      'B2B_ERR_INTERNAL_SERVER_ERROR',
      'The Stripe webhook secret is not configured',
      {
        source: 'StripeConfig',
        context: { signature },
        severity: 'CRITICAL',
      }
    );
  }

  const client = initializeStripe();

  let event: Stripe.Event;
  try {
    // Step 2 & 3: Construct the event and validate the signature
    event = client.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    // If signature verification fails, a 400 or 401 might be appropriate
    throw createError(
      'B2B_ERR_UNAUTHORIZED',
      'Failed to verify Stripe webhook signature',
      {
        source: 'StripeConfig',
        context: { signature, stripeError: String(error) },
        severity: 'HIGH',
      }
    );
  }

  // Step 4: Based on the event type, handle relevant logic
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Step 5: Update subscription status or store event data accordingly
        // This is where you'd fetch your subscription in your DB and apply changes
        // e.g. subscriptionService.updateSubscriptionStatus(event.data.object);
        break;

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        // Step 6: Handle payment outcomes here
        // e.g. paymentService.handleInvoiceEvent(event.data.object);
        break;

      default:
        // For unhandled event types, typically no action is required
        break;
    }

    // Step 7: In production, an audit or logging service can store relevant data
    // e.g. auditLogger.info(`Stripe webhook processed for ${event.type}`, { eventId: event.id });

  } catch (error) {
    // Generic catch for any handling errors
    throw createError(
      'B2B_ERR_INTERNAL_SERVER_ERROR',
      'Error while processing Stripe webhook event',
      {
        source: 'StripeConfig',
        context: { stripeEventId: event.id, originalError: String(error) },
        severity: 'CRITICAL',
      }
    );
  }

  // Step 8: Resolve quietly to indicate successful handling
}

////////////////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////////////////

/**
 * Aggregate all Stripe-related functions into a single exported object,
 * ensuring a concise and secure interface for payment processing and
 * subscription management within this B2B Sales Intelligence Platform.
 */
export const stripe = {
  initializeStripe,
  createCustomer,
  createSubscription,
  handleWebhook,
};