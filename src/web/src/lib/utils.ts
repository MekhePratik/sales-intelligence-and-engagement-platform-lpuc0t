/***********************************************************************************************
 * Core utility functions providing common functionality across the web application, including:
 *  1. Date Formatting (formatDate)
 *  2. Conditional Class Name Construction (cn)
 *  3. Currency Formatting (formatCurrency)
 *  4. Lead Score Formatting (formatLeadScore) with color coding and optional Lead usage
 *  5. Email Validation (isValidEmail)
 *
 * This file addresses:
 *  - Data Management Strategy (caching patterns for repeated transformations)
 *  - Error Handling (structured error creation with comprehensive type safety)
 *  - Lead Management (lead scoring with color coding and validation)
 *
 * The implementations below provide robust, production-ready code with enterprise-level detail.
 ***********************************************************************************************/

/************************************************************************************************
 * External Imports
 ***********************************************************************************************/
// dayjs ^1.11.10
import dayjs from 'dayjs';
// clsx ^2.0.0
import clsx from 'clsx';

/************************************************************************************************
 * Internal Imports
 ***********************************************************************************************/
// Structured API error handling
import { ApiError } from '../types/api';
// Lead data definitions (e.g., score, companyData)
import { Lead } from '../types/lead';

/************************************************************************************************
 * Internal Types & Interfaces
 ***********************************************************************************************/

/**
 * Minimal interface extending a typical color-coded score formatting result.
 * Represents a properly formatted score value, its associated textual color class,
 * and a descriptive label for accessibility or UI usage.
 */
interface ScoreFormat {
  /**
   * The actual score value, typically rendered as a string (e.g., '85', '42').
   */
  value: string;
  /**
   * The CSS color class or token representing the appropriate color meaning for the score.
   */
  color: string;
  /**
   * A short, human-readable label indicating the score category (e.g., 'High', 'Medium').
   */
  label: string;
}

/************************************************************************************************
 * Shared Caches & Constants
 ***********************************************************************************************/

/**
 * An in-memory cache for date formatting results, applying
 * basic data management strategy to avoid redundant transformations.
 * The cache key is constructed from the input date and format string.
 */
const dateFormatCache: Map<string, string> = new Map();

/**
 * A small set of allowed date formats, ensuring consistency
 * and validation per project guidelines.
 */
const ALLOWED_DATE_FORMATS: string[] = [
  'YYYY-MM-DD',
  'YYYY-MM-DD HH:mm:ss',
  'MM/DD/YYYY',
  'YYYY/MM/DD',
  'DD MMM YYYY',
  'DD MMM YYYY HH:mm',
];

/**
 * An in-memory cache for lead score formatting. Memoizing these
 * transformations can optimize rendering in large data tables.
 * The cache key is constructed from the integer score plus an
 * optional data-enrichment flag.
 */
const scoreFormatCache: Map<string, ScoreFormat> = new Map();

/**
 * A mapping of common domain misspellings to suggestions, aiding in
 * user-friendly detection of email errors.
 */
const COMMON_MISSPELLINGS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
};

/************************************************************************************************
 * Structured Error Factory
 ***********************************************************************************************/

/**
 * Creates a structured ApiError object with minimal fields populated,
 * showcasing how to integrate error handling with strong type safety.
 *
 * @param {string} code - Semantic error code (e.g., 'BAD_REQUEST', 'VALIDATION_ERROR').
 * @param {string} message - Descriptive error message for logs or user feedback.
 * @returns {ApiError} - A fully typed API error object with default fields.
 */
function createApiError(code: string, message: string): ApiError {
  return {
    code: code as any,
    message,
    details: {},
    stack: '',
    timestamp: new Date().toISOString(),
    requestId: 'n/a',
  };
}

/************************************************************************************************
 * 1. Date Formatting Function
 ***********************************************************************************************/

/**
 * Formats a date string or Date object into a standardized format with validation,
 * error handling, and an in-memory caching mechanism. Ensures consistent data
 * transformation while preventing repeated conversions.
 *
 * Steps:
 *  1. Validate input date for null or undefined.
 *  2. Parse input date using dayjs with try/catch for possible errors.
 *  3. Validate format string against a set of allowed formats.
 *  4. Apply the specified format or a fallback if invalid.
 *  5. Return formatted date string or an error message if parsing fails.
 *
 * @param {Date | string} date - The date value to be formatted.
 * @param {string} format - The desired date format pattern.
 * @returns {string} - Formatted date string or an error message for invalid dates.
 */
export function formatDate(date: Date | string, format: string): string {
  try {
    // Step 1: Check if the date parameter is null or undefined
    if (date === null || date === undefined) {
      const apiError = createApiError('BAD_REQUEST', 'No date provided.');
      return `Error: ${apiError.code} - ${apiError.message}`;
    }

    // Construct cache key for memoization
    const cacheKey = `${date.toString()}|${format}`;
    if (dateFormatCache.has(cacheKey)) {
      return dateFormatCache.get(cacheKey) as string;
    }

    // Step 2: Parse and validate the date using dayjs
    const parsed = dayjs(date);
    if (!parsed.isValid()) {
      const apiError = createApiError('BAD_REQUEST', 'Invalid date input.');
      return `Error: ${apiError.code} - ${apiError.message}`;
    }

    // Step 3: Validate the format string against ALLOWED_DATE_FORMATS
    let validatedFormat = ALLOWED_DATE_FORMATS.includes(format) ? format : 'YYYY-MM-DD';

    // Step 4: Perform the date formatting
    const formattedResult = parsed.format(validatedFormat);

    // Store in cache for subsequent usage
    dateFormatCache.set(cacheKey, formattedResult);

    // Step 5: Return final formatted string
    return formattedResult;
  } catch (err) {
    // On unexpected failure, create a structured error message
    const apiError = createApiError('INTERNAL_ERROR', 'Date formatting failure.');
    return `Error: ${apiError.code} - ${apiError.message}`;
  }
}

/************************************************************************************************
 * 2. Conditional Class Names Function
 ***********************************************************************************************/

/**
 * Type-safe utility function for conditionally joining class names with
 * removal of duplicates and undefined values. This leverages clsx for
 * robust handling, then further cleans up duplicates for consistency.
 *
 * Steps:
 *  1. Filter out undefined and null values using clsx.
 *  2. Split the result into individual class tokens.
 *  3. Remove duplicate class names while preserving order.
 *  4. Join valid class names with a space delimiter.
 *  5. Return the trimmed combined string.
 *
 * @param {...(string | undefined)[]} args - Class name segments, potentially undefined.
 * @returns {string} - A combined string of unique class names, trimmed and deduplicated.
 */
export function cn(...args: (string | undefined)[]): string {
  // Step 1: Use clsx to handle conditional className logic
  const intermediate = clsx(...args);

  // Step 2: Split the combined string into tokens
  const tokens = intermediate.split(' ');

  // Step 3: Remove duplicates by tracking encountered classes
  const uniqueTokens: string[] = [];
  for (const token of tokens) {
    const trimmed = token.trim();
    if (trimmed && !uniqueTokens.includes(trimmed)) {
      uniqueTokens.push(trimmed);
    }
  }

  // Step 4: Join the unique tokens back into a single string
  const finalClassNames = uniqueTokens.join(' ');

  // Step 5: Return the trimmed result
  return finalClassNames.trim();
}

/************************************************************************************************
 * 3. Currency Formatting Function
 ***********************************************************************************************/

/**
 * Formats a numerical value as a currency string with localization support,
 * performing fallback handling if the input is invalid or if the provided
 * currency code is absent from recognized ISO 4217 standards.
 *
 * Steps:
 *  1. Validate that amount is a finite number.
 *  2. Check currency code against a minimal fallback scheme.
 *  3. Create an Intl-based number formatter with locale and currency options.
 *  4. Format the amount to a currency string with proper decimals.
 *  5. Return the resulting string or a fallback error message on failure.
 *
 * @param {number} amount - The numeric amount to be formatted.
 * @param {string} currency - ISO 4217 currency code (e.g., 'USD', 'EUR').
 * @param {string} locale - BCP 47 locale string (e.g., 'en-US', 'fr-FR').
 * @returns {string} - The localized currency string or an error message if invalid.
 */
export function formatCurrency(amount: number, currency: string, locale: string): string {
  // Step 1: Check if amount is finite
  if (!Number.isFinite(amount)) {
    const apiError = createApiError('BAD_REQUEST', 'Invalid currency amount.');
    return `Error: ${apiError.code} - ${apiError.message}`;
  }

  // Step 2: Basic fallback logic for currency and locale
  const safeCurrency = typeof currency === 'string' && currency.length >= 3 ? currency : 'USD';
  const safeLocale = typeof locale === 'string' && locale.length >= 2 ? locale : 'en-US';

  try {
    // Step 3: Construct an Intl.NumberFormat for localized currency formatting
    const formatter = new Intl.NumberFormat(safeLocale, {
      style: 'currency',
      currency: safeCurrency,
      currencyDisplay: 'symbol',
    });

    // Step 4: Perform the formatting
    return formatter.format(amount);
  } catch (err) {
    // Step 5: Fallback in case of unexpected error
    const apiError = createApiError('INTERNAL_ERROR', 'Failed to format currency.');
    return `Error: ${apiError.code} - ${apiError.message}`;
  }
}

/************************************************************************************************
 * 4. Lead Score Formatting Function
 ***********************************************************************************************/

/**
 * Provides color-coded, human-readable formatting for a lead score ranging from 0 to 100.
 * Adheres to accessibility guidelines by applying color contrast for each range.
 * Optional usage with a Lead object for enriched data.
 *
 * Steps:
 *  1. Validate the score to be within the 0-100 range.
 *  2. Round the value to the nearest integer.
 *  3. Determine color class based on range (e.g., red for low, yellow for medium, green for high).
 *  4. Generate a descriptive label (e.g., 'High', 'Medium', 'Low').
 *  5. Memoize the result in an in-memory cache for performance.
 *  6. Return an object with { value, color, label } for UI display and ARIA compatibility.
 *
 * Overload:
 *  - formatLeadScore(score: number)
 *  - formatLeadScore(lead: Lead)
 *
 * @param {number | Lead} input - Either a raw numeric score or a Lead object containing the score.
 * @returns {{ value: string; color: string; label: string }} - A color-coded, labeled score object.
 */
export function formatLeadScore(input: number | Lead): ScoreFormat {
  // Resolve the numeric score
  let rawScore: number;
  let hasCompanyData = false;

  if (typeof input === 'number') {
    rawScore = input;
  } else {
    rawScore = input.score;
    hasCompanyData = !!input.companyData;
  }

  // Construct a caching key that accounts for the numeric score plus whether data enrichment is present
  const cacheKey = `${rawScore}|${hasCompanyData ? 'enriched' : 'plain'}`;

  // Return the memoized value if available
  if (scoreFormatCache.has(cacheKey)) {
    return scoreFormatCache.get(cacheKey) as ScoreFormat;
  }

  // Step 1: Sanitize the incoming score
  if (rawScore < 0 || rawScore > 100) {
    const invalidResult: ScoreFormat = {
      value: '0',
      color: 'text-gray-500',
      label: 'Invalid Score',
    };
    scoreFormatCache.set(cacheKey, invalidResult);
    return invalidResult;
  }

  // Step 2: Round the score
  const roundedScore = Math.round(rawScore);

  // Step 3: Determine color class based on range
  let colorClass = 'text-green-600';
  let label = 'High';

  if (roundedScore < 40) {
    colorClass = 'text-red-600';
    label = 'Low';
  } else if (roundedScore < 70) {
    colorClass = 'text-yellow-500';
    label = 'Medium';
  }

  // If the lead is enriched with additional data, optionally refine styling or label
  if (hasCompanyData && label !== 'High') {
    label = `${label} (Enriched)`;
  }

  // Step 4: Construct final result
  const formatted: ScoreFormat = {
    value: roundedScore.toString(),
    color: colorClass,
    label,
  };

  // Step 5: Store in cache
  scoreFormatCache.set(cacheKey, formatted);

  // Step 6: Return the color-coded, labeled object
  return formatted;
}

/************************************************************************************************
 * 5. Email Validation Function
 ***********************************************************************************************/

/**
 * Validates an email string against common RFC 5322 patterns with additional checks
 * for domain structure, common misspellings, and normalization. Returns a boolean
 * alongside any error messages or suggestions.
 *
 * Steps:
 *  1. Trim and normalize the input email string.
 *  2. Perform a regex match against a comprehensive pattern.
 *  3. Validate domain structure by checking for at least one '.' after '@'.
 *  4. Check for common domain-related typos or known misspellings.
 *  5. Return an object with { isValid, errors }, containing any relevant error messages.
 *
 * @param {string} email - The raw email address to validate.
 * @returns {{ isValid: boolean, errors: string[] }} - The validation result and error messages.
 */
export function isValidEmail(email: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Step 1: Trim and normalize the email string
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    errors.push('Email is empty or null.');
    return { isValid: false, errors };
  }

  // Step 2: Regex check for basic RFC 5322 compliance
  // This pattern is an approximation for demonstration and may be further refined.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    errors.push('Email does not match RFC 5322 pattern.');
  }

  // Step 3: Validate domain structure
  const domainPart = normalizedEmail.split('@')[1] || '';
  if (!domainPart.includes('.')) {
    errors.push('Domain structure is invalid (missing a dot).');
  }

  // Step 4: Check for common domain-related typos
  const domainParts = domainPart.split('.');
  if (domainParts.length >= 2) {
    const possibleMisspelled = domainParts.slice(-2).join('.');
    if (COMMON_MISSPELLINGS[possibleMisspelled]) {
      errors.push(
        `Possible domain misspelling. Did you mean '${COMMON_MISSPELLINGS[possibleMisspelled]}'?`
      );
    }
  }

  // Step 5: Return final result
  const isValid = errors.length === 0;
  return { isValid, errors };
}