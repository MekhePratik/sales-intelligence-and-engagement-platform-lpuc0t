/* -------------------------------------------------------------------------------------------------
 * File: validation.util.ts
 * Description: Core validation utility that provides reusable validation functions and helpers
 * for data validation across the B2B sales intelligence platform with enhanced security features
 * and comprehensive error handling.
 * 
 * This file implements four primary validation functions as specified:
 * 1. validateEmail       -> Securely validates email format and domain checks
 * 2. validatePhoneNumber -> Validates and sanitizes phone numbers with country-based logic
 * 3. validateUrl         -> Validates URL format, ensuring HTTPS and other security constraints
 * 4. validateSchema      -> Generic schema validation based on zod with robust error handling
 * 
 * ------------------------------------------------------------------------------------------------- */

// --------------------------------- External Imports ---------------------------------
// zod version ^3.0.0
import { z } from 'zod';
// validator version ^13.0.0
import isEmail from 'validator/lib/isEmail';

// --------------------------------- Internal Imports ---------------------------------
import { AppError } from './error.util';
import { ErrorCode } from '../constants/error-codes';

// --------------------------------- Types & Interfaces --------------------------------
/**
 * Utility type for potential domain check expansions (DNS lookups, disposable checks, etc.).
 * This is a placeholder for actual domain security scanning logic.
 */
interface DomainCheckResult {
  isMxFound: boolean;
  isDisposable: boolean;
}

/* -------------------------------------------------------------------------------------------------
 * Name: validateEmail
 * Description: Validates email format and domain structure with enhanced security checks.
 * 
 * Steps:
 *  1. Sanitize input email string.
 *  2. Check if email is defined and non-empty.
 *  3. Validate email format using isEmail with strict mode.
 *  4. Verify domain structure and MX records (placeholder check).
 *  5. Check against common disposable email patterns.
 *  6. Return validation result (boolean) with security context.
 * 
 * Returns: boolean -> True if the email is valid and meets security requirements.
 * ------------------------------------------------------------------------------------------------- */
export function validateEmail(email: string): boolean {
  // STEP 1: Sanitize input by trimming whitespace and converting to lowercase.
  // In production, consider more advanced sanitization if needed.
  const sanitizedEmail = (email || '').trim().toLowerCase();

  // STEP 2: Check if email is provided and not empty after sanitization.
  if (!sanitizedEmail) {
    return false;
  }

  // STEP 3: Validate format using the 'isEmail' library with strict validations.
  // 'isEmail' can accept an options object; for demonstration, we'll ensure a TLD is required.
  const isFormatValid = isEmail(sanitizedEmail, { require_tld: true });
  if (!isFormatValid) {
    return false;
  }

  // Extract domain part from the sanitized email for domain checks.
  const domainParts = sanitizedEmail.split('@');
  if (domainParts.length !== 2) {
    return false;
  }
  const domainPart = domainParts[1];

  // STEP 4: Verify domain structure and MX records (placeholder logic).
  // In a real system, implement DNS checks or external service calls.
  const placeholderDomainCheck: DomainCheckResult = {
    isMxFound: true,       // Replace with actual DNS-based check if implementing
    isDisposable: false,   // True if domain is known to be disposable
  };

  if (!placeholderDomainCheck.isMxFound) {
    return false;
  }

  // STEP 5: Check common disposable email patterns (placeholder).
  // Adjust pattern list as needed; here we do a basic partial match check.
  const disposablePatterns = ['tempmail', 'yopmail', 'mailinator', 'trashmail', 'guerrillamail'];
  const isDisposable = disposablePatterns.some((pattern) =>
    domainPart.includes(pattern),
  );
  if (isDisposable) {
    return false;
  }

  // If we reach here, all checks have passed.
  // STEP 6: Return final validation result (true if valid).
  return true;
}

/* -------------------------------------------------------------------------------------------------
 * Name: validatePhoneNumber
 * Description: Validates phone number format with international support and security checks.
 * 
 * Steps:
 *  1. Sanitize input phone number.
 *  2. Validate country code format.
 *  3. Remove non-numeric characters.
 *  4. Check length based on country code.
 *  5. Validate number pattern for given country.
 *  6. Verify against known spam patterns.
 *  7. Return validation result (boolean).
 * 
 * Returns: boolean -> True if phone number is valid and secure.
 * ------------------------------------------------------------------------------------------------- */
export function validatePhoneNumber(phoneNumber: string, countryCode: string): boolean {
  // STEP 1: Sanitize phone number by trimming whitespace.
  let sanitizedNumber = (phoneNumber || '').trim();

  // STEP 2: Validate country code format (very basic check for demonstration).
  // In production, consider using a library like 'libphonenumber-js' for robust validations.
  const cc = (countryCode || '').trim().toUpperCase();
  if (!cc || cc.length < 1 || cc.length > 3) {
    // We expect a typical country code of up to 3 characters (e.g. 'US', 'UK', 'IN' or 'CHN').
    return false;
  }

  // STEP 3: Remove non-numeric characters except for a leading '+' sign if present.
  // This helps unify the structure for further checks.
  sanitizedNumber = sanitizedNumber.replace(/[^\d+]/g, '');
  // If there is a '+' in the middle of the string, remove it to avoid confusion.
  if (sanitizedNumber.indexOf('+') > 0) {
    sanitizedNumber = sanitizedNumber.replace(/\+/g, '');
  }

  // STEP 4: Check length based on the country code.
  // Placeholder logic: Usually phone numbers range from 6 to 14 digits.
  const digitCount = sanitizedNumber.replace(/\+/g, '').length;
  if (digitCount < 6 || digitCount > 14) {
    return false;
  }

  // STEP 5: Validate number pattern for the country.
  // Real-world scenario: Use robust pattern checks or specialized libraries.
  // Here we simply check if the number starts with known valid prefixes, etc. (placeholder).
  // For demonstration, consider any leading '+' or specific digits. We'll skip advanced logic.

  // STEP 6: Verify against known spam patterns.
  // Example: if the number starts with '999999' or '000000', it's recognized as spam in our system.
  const spamPatterns = ['999999', '000000'];
  const isSpamNumber = spamPatterns.some((pattern) => sanitizedNumber.includes(pattern));
  if (isSpamNumber) {
    return false;
  }

  // If we pass all checks, return true.
  return true;
}

/* -------------------------------------------------------------------------------------------------
 * Name: validateUrl
 * Description: Validates URL format, protocol, and security requirements (e.g., requires HTTPS).
 * 
 * Steps:
 *  1. Sanitize input URL (trim whitespace).
 *  2. Check URL structure and format.
 *  3. Validate protocol (require HTTPS).
 *  4. Check domain validity.
 *  5. Verify against malicious URL patterns (placeholder).
 *  6. Return validation result (boolean).
 * 
 * Returns: boolean -> True if URL is valid and secure.
 * ------------------------------------------------------------------------------------------------- */
export function validateUrl(url: string): boolean {
  // STEP 1: Sanitize input URL.
  const sanitizedUrl = (url || '').trim();

  // STEP 2: Check minimal structure using try/catch around standard URL constructor.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sanitizedUrl);
  } catch (err) {
    return false;
  }

  // STEP 3: Validate protocol (must be HTTPS).
  if (parsedUrl.protocol !== 'https:') {
    return false;
  }

  // STEP 4: Check domain validity: domain should not be empty or localhost for user-facing usage.
  if (!parsedUrl.hostname || parsedUrl.hostname === 'localhost') {
    return false;
  }

  // STEP 5: Verify against malicious URL patterns (placeholder).
  // E.g., Checking for "javascript:" in the href, or known phishing domains.
  const suspiciousFragments = ['javascript:', 'data:text/html'];
  for (const fragment of suspiciousFragments) {
    if (sanitizedUrl.toLowerCase().includes(fragment)) {
      return false;
    }
  }

  // If all checks passed, the URL is valid.
  return true;
}

/* -------------------------------------------------------------------------------------------------
 * Name: validateSchema
 * Description: Generic schema validation with enhanced security and type safety via zod.
 * 
 * Steps:
 *  1. Sanitize input data (basic approach or advanced logic).
 *  2. Apply rate limiting check (placeholder).
 *  3. Parse input data using the provided zod schema.
 *  4. Handle validation errors with AppError, code=ErrorCode.VALIDATION_ERROR.
 *  5. Log validation attempt for auditing or debugging.
 *  6. Return validated and sanitized data.
 * 
 * Returns: Promise<T> -> The validated and typed data with security guarantees.
 * ------------------------------------------------------------------------------------------------- */
export async function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Promise<T> {
  // STEP 1: Basic data sanitation can be performed if needed. For demonstration:
  // We'll assume the input is an object or primitive that zod can parse; real usage
  // might strip known dangerous fields or sanitize strings.
  const sanitizedData = data;

  // STEP 2: Placeholder rate limiting check. A real system might interact with
  // Redis or other caching layers to track request counts per user/IP.
  // Example:
  // if (hasExceededRateLimit(context)) { throw new AppError("Rate Limit Exceeded", ErrorCode.RATE_LIMIT_EXCEEDED, ...) }

  // STEP 3: Parse input data using the zod schema.
  const parseResult = schema.safeParse(sanitizedData);

  // STEP 4: If parsing fails, throw an AppError with a standardized validation code.
  if (!parseResult.success) {
    throw new AppError(
      'Validation Error',
      ErrorCode.VALIDATION_ERROR,
      {
        context: {
          issues: parseResult.error.issues,
        },
        source: 'ValidationUtil',
        severity: 2, // Convert from ErrorSeverity enum if needed: e.g. ErrorSeverity.MEDIUM
      },
    );
  }

  // STEP 5: Log the validation attempt. In real usage, consider a logger tool like winston.
  // console.log('[Validation Attempt]', { result: 'success', data: parseResult.data });

  // STEP 6: Return validated and sanitized data.
  return parseResult.data;
}