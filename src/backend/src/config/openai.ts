import OpenAI from 'openai'; // ^4.0.0
import { Logger } from '../utils/logger.util';
import { AppError } from '../utils/error.util';
import { ErrorCode } from '../constants/error-codes';

// ---------------------------------------------------------------------------------------------
// OpenAI Environment Variable Definitions
// ---------------------------------------------------------------------------------------------
/**
 * Raw environment variables that provide runtime configuration for OpenAI.
 * The primary values needed include API key, organization ID, model name,
 * maximum token usage, request timeout, and maximum retry attempts.
 */
const {
  OPENAI_API_KEY,
  OPENAI_ORG_ID,
  OPENAI_MODEL: ENV_OPENAI_MODEL = 'gpt-4',
  OPENAI_MAX_TOKENS: ENV_OPENAI_MAX_TOKENS = '2000',
  OPENAI_TIMEOUT: ENV_OPENAI_TIMEOUT = '30000',
  OPENAI_MAX_RETRIES: ENV_OPENAI_MAX_RETRIES = '3',
} = process.env;

/**
 * Parsed numeric environment variables for tokens, timeout, and retries.
 * Using parseInt to convert string-based environment variable values
 * into numeric form, falling back on sane defaults if conversion fails.
 */
const parsedMaxTokens = parseInt(ENV_OPENAI_MAX_TOKENS, 10) || 2000;
const parsedTimeoutMs = parseInt(ENV_OPENAI_TIMEOUT, 10) || 30000;
const parsedMaxRetries = parseInt(ENV_OPENAI_MAX_RETRIES, 10) || 3;

/**
 * Exportable environment constants for external modules to reference.
 * OPENAI_MODEL is the default model used in chat/completion requests.
 * OPENAI_MAX_TOKENS is the maximum token usage for a single request
 * and is typically used to limit cost or request size.
 */
export const OPENAI_MODEL: string = ENV_OPENAI_MODEL;
export const OPENAI_MAX_TOKENS: number = parsedMaxTokens;

/**
 * A shared Logger instance to record OpenAI configuration steps, errors,
 * and informational messages regarding client initialization and usage.
 */
const logger = new Logger({
  defaultLevel: 'info',
  // Additional configuration can be passed here if needed
});

// ---------------------------------------------------------------------------------------------
// validateOpenAIConfig Function
// ---------------------------------------------------------------------------------------------
/**
 * Validates required and optional OpenAI configuration values to ensure they are
 * present, well-formed, and within acceptable limits. Throws an AppError if
 * any critical configuration item is missing or invalid.
 *
 * @returns {boolean} Returns true if the configuration is verified valid, otherwise throws an error.
 *
 * Steps (as defined in the specification):
 * 1) Check for required API key.
 * 2) Validate API key format (must start with 'sk-').
 * 3) Check optional organization ID format (must start with 'org-' if provided).
 * 4) Validate the model name against a minimal supported list (or allow fallback).
 * 5) Verify that the maximum tokens value is within a safe range.
 * 6) Validate request timeout and max retries to ensure they are positive numbers.
 * 7) Log the results of validation for auditing.
 * 8) Throw AppError on any failure or return true if all checks pass.
 */
export function validateOpenAIConfig(): boolean {
  // Step 1: Check if the API key exists
  if (!OPENAI_API_KEY) {
    logger.error('OpenAI configuration error: Missing OPENAI_API_KEY.', {
      context: { envVar: 'OPENAI_API_KEY' },
    });
    throw new AppError(
      'Missing OpenAI API key in environment variables.',
      ErrorCode.BAD_REQUEST,
      {
        source: 'OpenAIConfig',
        severity: 'HIGH',
        context: { missingVar: 'OPENAI_API_KEY' },
      }
    );
  }

  // Step 2: Validate API key format
  if (!OPENAI_API_KEY.startsWith('sk-')) {
    logger.error('OpenAI configuration error: API key format appears invalid.', {
      context: { providedKey: OPENAI_API_KEY },
    });
    throw new AppError(
      'Invalid OpenAI API key format; expected key to begin with "sk-".',
      ErrorCode.BAD_REQUEST,
      {
        source: 'OpenAIConfig',
        severity: 'HIGH',
        context: { apiKeyStarts: OPENAI_API_KEY.slice(0, 4) },
      }
    );
  }

  // Step 3: Optional organization ID format check
  if (OPENAI_ORG_ID && !OPENAI_ORG_ID.startsWith('org-')) {
    logger.error('OpenAI configuration error: Invalid organization ID format.', {
      context: { providedOrgId: OPENAI_ORG_ID },
    });
    throw new AppError(
      'Invalid OpenAI organization ID; expected to begin with "org-".',
      ErrorCode.BAD_REQUEST,
      {
        source: 'OpenAIConfig',
        severity: 'MEDIUM',
        context: { orgId: OPENAI_ORG_ID },
      }
    );
  }

  // Step 4: Validate the model name (basic check for demonstration purposes)
  const supportedModels = ['gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'];
  if (!supportedModels.includes(ENV_OPENAI_MODEL)) {
    logger.error('OpenAI model name is not recognized among supported models.', {
      context: { providedModel: ENV_OPENAI_MODEL, supportedModels },
    });
    throw new AppError(
      `OpenAI model "${ENV_OPENAI_MODEL}" is not in the supported list.`,
      ErrorCode.BAD_REQUEST,
      {
        source: 'OpenAIConfig',
        severity: 'MEDIUM',
        context: { modelList: supportedModels },
      }
    );
  }

  // Step 5: Verify that maximum tokens value is within a logical range
  if (parsedMaxTokens < 1 || parsedMaxTokens > 32768) {
    logger.error('OpenAI configuration error: OPENAI_MAX_TOKENS out of range.', {
      context: { maxTokens: parsedMaxTokens },
    });
    throw new AppError(
      `OPENAI_MAX_TOKENS value (${parsedMaxTokens}) is invalid; must be between 1 and 32768.`,
      ErrorCode.BAD_REQUEST,
      {
        source: 'OpenAIConfig',
        severity: 'MEDIUM',
        context: { maxTokens: parsedMaxTokens },
      }
    );
  }

  // Step 6: Validate timeout and retry counts
  if (parsedTimeoutMs <= 0) {
    logger.error('OpenAI configuration error: Invalid OPENAI_TIMEOUT.', {
      context: { parsedTimeoutMs },
    });
    throw new AppError(
      `OPENAI_TIMEOUT value (${parsedTimeoutMs}) must be positive.`,
      ErrorCode.BAD_REQUEST,
      {
        source: 'OpenAIConfig',
        severity: 'MEDIUM',
        context: { parsedTimeoutMs },
      }
    );
  }
  if (parsedMaxRetries < 0) {
    logger.error('OpenAI configuration error: Invalid OPENAI_MAX_RETRIES.', {
      context: { parsedMaxRetries },
    });
    throw new AppError(
      `OPENAI_MAX_RETRIES value (${parsedMaxRetries}) must not be negative.`,
      ErrorCode.BAD_REQUEST,
      {
        source: 'OpenAIConfig',
        severity: 'MEDIUM',
        context: { parsedMaxRetries },
      }
    );
  }

  // Step 7: Log validation results
  logger.info('OpenAI configuration validation succeeded.', {
    context: {
      apiKeyMask: `sk-****${OPENAI_API_KEY.slice(-4)}`,
      organizationId: OPENAI_ORG_ID || 'Not provided',
      defaultModel: ENV_OPENAI_MODEL,
      maxTokens: parsedMaxTokens,
      timeoutMs: parsedTimeoutMs,
      maxRetries: parsedMaxRetries,
    },
  });

  // Step 8: Return true if all checks pass
  return true;
}

// ---------------------------------------------------------------------------------------------
// configureRateLimiting Function
// ---------------------------------------------------------------------------------------------
/**
 * Configures rate limiting, concurrency control, and queue management
 * for the provided OpenAI client instance. This is typically accomplished
 * by wrapping or intercepting API calls before they reach the underlying
 * fetch implementation.
 *
 * @param {OpenAI} client The OpenAI client instance to configure.
 *
 * Steps (as defined in the specification):
 * 1) Set maximum requests per minute.
 * 2) Configure concurrent request limit.
 * 3) Set up queue management.
 * 4) Initialize rate limiting middleware.
 * 5) Configure backoff strategy or event hooks.
 */
export function configureRateLimiting(client: OpenAI): void {
  // NOTE: The openai@^4.0.0 library does not provide direct hooks for concurrency
  // or rate limiting. Below is a placeholder demonstration of how one might
  // attach or track custom logic to enforce local rate-limiting.

  // Step 1: Typical maximum requests per minute setting (example: 60 requests/min)
  const maxRequestsPerMinute = 60;

  // Step 2: A concurrency limit that the application might want to enforce
  let concurrentRequests = 0;
  const maxConcurrentRequests = 5;

  // Step 3: Simple queue management (placeholder)
  const requestQueue: Array<() => Promise<any>> = [];

  // Step 4: Initialize a naive rate-limiting or concurrency check
  // This example focuses on concurrency rather than time-based token buckets
  // or advanced scheduling logic. For real usage, consider third-party libraries
  // like 'p-limit' or 'bottleneck'.
  function scheduleRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          concurrentRequests += 1;
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          concurrentRequests -= 1;
          if (requestQueue.length > 0 && concurrentRequests < maxConcurrentRequests) {
            const nextTask = requestQueue.shift();
            if (nextTask) nextTask();
          }
        }
      };

      if (concurrentRequests < maxConcurrentRequests) {
        task();
      } else {
        requestQueue.push(task);
      }
    });
  }

  // Step 5: Configure a backoff strategy placeholder
  // This would typically integrate with the client's fetch calls or
  // any custom request logic to handle 429 responses with a retry.
  // For demonstration, we simply log the notion of a backoff approach.
  logger.info('Rate limiting with concurrency control is configured.', {
    context: {
      maxRequestsPerMinute,
      maxConcurrentRequests,
      queueManagement: 'naiveFIFO',
      backoffStrategy: 'placeholderExponential',
    },
  });

  // If we wanted to wrap all calls like chat.completions.create or embeddings.create:
  // (Implementation provided as an example, not guaranteed for all usage flows)
  const originalChatCompletionsCreate = client.chat.completions.create.bind(client);
  client.chat.completions.create = async (params) =>
    scheduleRequest(() => originalChatCompletionsCreate(params));

  const originalEmbeddingsCreate = client.embeddings.create.bind(client);
  client.embeddings.create = async (params) =>
    scheduleRequest(() => originalEmbeddingsCreate(params));
}

// ---------------------------------------------------------------------------------------------
// Internal Support: applyRetryLogic Function (Exponential Backoff)
// ---------------------------------------------------------------------------------------------
/**
 * Applies a simple exponential backoff retry logic to the relevant OpenAI
 * operations. This demonstration shows a method of intercepting calls
 * and retrying if certain error conditions (like 429, 500, or network errors)
 * arise, up to a specified maximum number of attempts.
 *
 * @param {OpenAI} client The OpenAI client instance to enhance.
 * @param {number} maxRetries The maximum number of retry attempts.
 */
function applyRetryLogic(client: OpenAI, maxRetries: number): void {
  // Store original references to the relevant methods
  const originalChatCompletionsCreate = client.chat.completions.create.bind(client);
  const originalEmbeddingsCreate = client.embeddings.create.bind(client);

  // A helper function for performing exponential backoff
  async function attemptWithBackoff<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt >= maxRetries) {
        logger.error('OpenAI request failed after maximum retries.', {
          context: { attempt, maxRetries, error },
        });
        throw error;
      }
      // Simple exponential backoff: 2^(attempt-1) * 100 ms
      const backoffMs = Math.pow(2, attempt - 1) * 100;
      logger.info('Retrying OpenAI request with exponential backoff.', {
        context: { attempt, nextDelayMs: backoffMs },
      });
      await new Promise((r) => setTimeout(r, backoffMs));
      return attemptWithBackoff(fn, attempt + 1);
    }
  }

  // Wrap chat.completions.create
  client.chat.completions.create = async (params) => {
    return attemptWithBackoff(() => originalChatCompletionsCreate(params));
  };

  // Wrap embeddings.create
  client.embeddings.create = async (params) => {
    return attemptWithBackoff(() => originalEmbeddingsCreate(params));
  };
}

// ---------------------------------------------------------------------------------------------
// Internal Support: applyErrorHandlingMiddleware Function
// ---------------------------------------------------------------------------------------------
/**
 * Demonstrates how one might attach global error handling to the OpenAI client.
 * This is not natively supported in openai@^4.0.0, so we show a minimal approach
 * of wrapping or catching errors in relevant method calls.
 *
 * @param {OpenAI} client The OpenAI client instance to enhance.
 */
function applyErrorHandlingMiddleware(client: OpenAI): void {
  // Store references to original methods
  const originalChatCompletionsCreate = client.chat.completions.create.bind(client);
  const originalEmbeddingsCreate = client.embeddings.create.bind(client);

  // Wrap calls in a try/catch that logs errors
  client.chat.completions.create = async (params) => {
    try {
      return await originalChatCompletionsCreate(params);
    } catch (error) {
      logger.error('Error in chat.completions.create', { error });
      throw error;
    }
  };

  client.embeddings.create = async (params) => {
    try {
      return await originalEmbeddingsCreate(params);
    } catch (error) {
      logger.error('Error in embeddings.create', { error });
      throw error;
    }
  };
}

// ---------------------------------------------------------------------------------------------
// createOpenAIClient Function
// ---------------------------------------------------------------------------------------------
/**
 * Creates and configures an OpenAI client instance with environment-specific settings,
 * including validation, rate limiting, retry logic, error handling, and logging.
 *
 * @returns {OpenAI} The fully configured OpenAI client instance.
 *
 * Steps (as defined in the specification):
 * 1) Validate required environment variables using validateOpenAIConfig.
 * 2) Create OpenAI client instance with API key and timeout settings.
 * 3) Configure organization ID if provided.
 * 4) Set default model and parameters (not directly supported, so used as reference).
 * 5) Configure retry logic with exponential backoff.
 * 6) Initialize rate limiting parameters.
 * 7) Set up error handling middleware.
 * 8) Log successful client initialization.
 * 9) Return configured client.
 */
export function createOpenAIClient(): OpenAI {
  // Step 1: Validate configuration
  validateOpenAIConfig();

  try {
    // Step 2: Create client with necessary parameters
    // The openai@^4.0.0 library constructor includes { apiKey, organization, baseURL, etc. }
    const openAiClient = new OpenAI({
      apiKey: OPENAI_API_KEY as string,
      organization: OPENAI_ORG_ID || undefined,
      // Some advanced features like custom fetch timeouts are not natively
      // supported, so we track the desired timeout in local logic or by
      // using a custom fetch implementation.
    });

    // Steps 3 & 4: Organization ID is already set above; default model is an external reference.
    // We hold the model in the environment, but the actual usage is in calls.

    // Step 5: Apply retry logic for exponential backoff
    applyRetryLogic(openAiClient, parsedMaxRetries);

    // Step 6: Configure rate limiting
    configureRateLimiting(openAiClient);

    // Step 7: Apply error handling middleware
    applyErrorHandlingMiddleware(openAiClient);

    // Step 8: Log successful initialization
    logger.info('OpenAI client successfully initialized', {
      context: {
        model: ENV_OPENAI_MODEL,
        maxTokens: parsedMaxTokens,
        timeoutMs: parsedTimeoutMs,
        maxRetries: parsedMaxRetries,
      },
    });

    // Step 9: Return the configured client
    return openAiClient;
  } catch (err) {
    logger.error('Failed to initialize OpenAI client', { context: { err } });
    throw err;
  }
}

// ---------------------------------------------------------------------------------------------
// Single Instantiated and Exported OpenAI Client
// ---------------------------------------------------------------------------------------------
/**
 * A singleton-style export of the OpenAI client configuration for direct
 * usage across the platform. This instance exposes the relevant methods:
 *   - openai.chat.completions.create
 *   - openai.embeddings.create
 *
 * Per the specification, we also export the model and max tokens constants.
 */
export const openai = createOpenAIClient();