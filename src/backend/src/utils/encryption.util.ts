/* ---------------------------------------------------------------------------------------------
 * encryption.util.ts
 *
 * This file provides robust utilities for:
 * 1. AES-256-GCM encryption/decryption of sensitive (PII) data
 * 2. PBKDF2-based password hashing and verification
 *
 * Implements field-level encryption for PII, secure IV generation, authentication tag verification,
 * consistent error handling with AppError, and comprehensive audit logging using the Logger class.
 *
 * External Dependencies:
 *  - crypto (Node.js native module) // version: native
 *
 * Internal Dependencies:
 *  - AppError (./error.util)        // referencing AppError.toJSON()
 *  - Logger  (./logger.util)        // referencing Logger.error(), Logger.warn(), Logger.info()
 *
 * Technical Specifications Addressed:
 *  1. Data Security → AES-256-GCM field-level encryption, secure IV, auth tag verification
 *  2. Security Controls → PBKDF2 password hashing + timing-safe password verification
 *  3. Error Handling → Utilize AppError for standardized error messages and codes
 *  4. Audit Logging → Log all security-relevant events and steps using Logger
 *
 * Global Constants Used:
 *  - ENCRYPTION_KEY       (process.env.ENCRYPTION_KEY)
 *  - ENCRYPTION_ALGORITHM ('aes-256-gcm')
 *  - IV_LENGTH            (16)
 *  - AUTH_TAG_LENGTH      (16)
 *  - PBKDF2_ITERATIONS    (100000)
 *  - PBKDF2_KEYLEN        (64)
 *  - PBKDF2_DIGEST        ('sha512')
 * --------------------------------------------------------------------------------------------- */

import * as crypto from 'crypto'; // Node.js native module
import { AppError } from './error.util';
import { Logger } from './logger.util';
import { ErrorCode, ErrorSeverity } from '../constants/error-codes';

// ---------------------------------------------------------------------------------------------
// Instantiate a logger for audit, security, and system event logging
// ---------------------------------------------------------------------------------------------
const logger = new Logger({
  defaultLevel: 'info',
  fileLogPath: 'logs/encryption.log',
  securityAlerts: true,
});

// ---------------------------------------------------------------------------------------------
// Global encryption constants as per specification
// ---------------------------------------------------------------------------------------------
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

// ---------------------------------------------------------------------------------------------
// Helper to retrieve and validate the encryption key from environment variables
// ---------------------------------------------------------------------------------------------
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  // If missing, log error and throw AppError
  if (!key) {
    logger.error('Encryption key is missing from environment variables.', {
      event: 'getEncryptionKey',
      severity: 'HIGH',
    });
    throw new AppError(
      'ENCRYPTION_KEY is not defined',
      ErrorCode.INTERNAL_SERVER_ERROR,
      {
        context: { reason: 'Missing ENV variable' },
        source: 'encryption.util',
        severity: ErrorSeverity.HIGH,
      },
    );
  }

  // Convert key to buffer (UTF-8). AES-256 requires 32 bytes
  const keyBuffer = Buffer.from(key, 'utf-8');
  if (keyBuffer.length !== 32) {
    logger.error('Encryption key must be 32 bytes for AES-256-GCM.', {
      event: 'getEncryptionKey',
      providedKeyLength: keyBuffer.length,
      severity: 'HIGH',
    });
    throw new AppError(
      'Invalid ENCRYPTION_KEY length',
      ErrorCode.INTERNAL_SERVER_ERROR,
      {
        context: { reason: 'Key length mismatch' },
        source: 'encryption.util',
        severity: ErrorSeverity.HIGH,
      },
    );
  }

  return keyBuffer;
}

// ---------------------------------------------------------------------------------------------
// generateIV (Private Function)
// Generates a cryptographically secure initialization vector of IV_LENGTH, verifying entropy.
// Logs the generation event for audit trails. Not exposed externally.
// ---------------------------------------------------------------------------------------------
function generateIV(): Buffer {
  try {
    // Attempt to generate cryptographically secure IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Safety check for IV length
    if (iv.length !== IV_LENGTH) {
      logger.error('Generated IV does not match required length.', {
        event: 'generateIV',
        ivLength: iv.length,
      });
      throw new AppError(
        'IV generation failed',
        ErrorCode.INTERNAL_SERVER_ERROR,
        {
          context: { reason: 'Incorrect IV length' },
          source: 'encryption.util',
          severity: ErrorSeverity.HIGH,
        },
      );
    }

    // Log successful IV generation
    logger.info('Initialization Vector generated successfully.', {
      event: 'generateIV',
      length: IV_LENGTH,
    });

    return iv;
  } catch (error) {
    logger.error('Failed to generate IV.', {
      event: 'generateIV',
      error: error instanceof Error ? error.message : 'Unknown Error',
    });
    throw new AppError(
      'Failed to generate IV',
      ErrorCode.INTERNAL_SERVER_ERROR,
      {
        context: { errorDetails: String(error) },
        source: 'encryption.util',
        severity: ErrorSeverity.HIGH,
      },
    );
  }
}

// ---------------------------------------------------------------------------------------------
// encrypt
// Encrypts sensitive data using AES-256-GCM with a securely generated IV and auth tag.
// Implementation Steps:
//  1) Validate input
//  2) Retrieve/validate encryption key
//  3) Generate IV
//  4) Create cipher & encrypt data
//  5) Retrieve auth tag
//  6) Log encryption event with non-sensitive metadata
//  7) Clear sensitive data references
//  8) Return encrypted structure containing:
//       { cipherText: base64Encoded, iv: base64Encoded, authTag: base64Encoded }
// ---------------------------------------------------------------------------------------------
export function encrypt(data: string): {
  cipherText: string;
  iv: string;
  authTag: string;
} {
  if (!data) {
    logger.warn('No data provided for encryption.', { event: 'encrypt' });
    throw new AppError('No data to encrypt', ErrorCode.BAD_REQUEST, {
      context: { reason: 'Data is empty or undefined' },
      source: 'encryption.util',
      severity: ErrorSeverity.MEDIUM,
    });
  }

  try {
    // Retrieve encryption key
    const key = getEncryptionKey();

    // Generate IV for this encryption session
    const iv = generateIV();

    // Create cipher instance with authTagLength set
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    // Convert plain text data to UTF-8 buffer, update cipher, finalize
    let encryptedBuffer = cipher.update(data, 'utf8');
    const finalBuffer = cipher.final();
    encryptedBuffer = Buffer.concat([encryptedBuffer, finalBuffer]);

    // Retrieve authentication tag to ensure data integrity
    const authTag = cipher.getAuthTag();

    // Base64-encode outputs for storage
    const cipherText = encryptedBuffer.toString('base64');
    const ivEncoded = iv.toString('base64');
    const authTagEncoded = authTag.toString('base64');

    // Log encryption result (excluding sensitive data)
    logger.info('Data encrypted successfully.', {
      event: 'encrypt',
      outputByteLength: encryptedBuffer.length,
      ivLength: iv.length,
      authTagLength: authTag.length,
    });

    // Best effort to clear sensitive references
    // (In Node.js, this is only partial, as garbage collection is not immediate)
    encryptedBuffer.fill(0);
    data = '';

    // Return encryption payload
    return {
      cipherText: cipherText,
      iv: ivEncoded,
      authTag: authTagEncoded,
    };
  } catch (error) {
    logger.error('Encryption failed.', {
      event: 'encrypt',
      error: error instanceof Error ? error.message : 'Unknown Error',
    });
    throw new AppError('Encryption failed', ErrorCode.INTERNAL_SERVER_ERROR, {
      context: { errorDetails: String(error) },
      source: 'encryption.util',
      severity: ErrorSeverity.HIGH,
    });
  }
}

// ---------------------------------------------------------------------------------------------
// decrypt
// Decrypts data using AES-256-GCM with auth tag verification and returns the original plaintext.
// Implementation Steps:
//  1) Validate input structure
//  2) Retrieve encryption key
//  3) Convert base64-encoded fields to buffers
//  4) Create decipher instance & set auth tag
//  5) Decrypt data & finalize
//  6) Log decryption event with non-sensitive metadata
//  7) Best-effort memory clearing
//  8) Return original plaintext
// ---------------------------------------------------------------------------------------------
export function decrypt(encryptedData: {
  cipherText: string;
  iv: string;
  authTag: string;
}): string {
  if (
    !encryptedData ||
    typeof encryptedData.cipherText !== 'string' ||
    typeof encryptedData.iv !== 'string' ||
    typeof encryptedData.authTag !== 'string'
  ) {
    logger.warn('Encrypted data object is invalid.', { event: 'decrypt' });
    throw new AppError('Invalid encrypted data object', ErrorCode.BAD_REQUEST, {
      context: { reason: 'Object structure mismatch' },
      source: 'encryption.util',
      severity: ErrorSeverity.MEDIUM,
    });
  }

  try {
    // Retrieve key from environment
    const key = getEncryptionKey();

    // Decode all base64 fields
    const ivBuffer = Buffer.from(encryptedData.iv, 'base64');
    const authTagBuffer = Buffer.from(encryptedData.authTag, 'base64');
    const ciphertextBuffer = Buffer.from(encryptedData.cipherText, 'base64');

    // Create decipher with the same algorithm
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, ivBuffer, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    // Apply authentication tag
    decipher.setAuthTag(authTagBuffer);

    // Decrypt data
    let decryptedBuffer = decipher.update(ciphertextBuffer);
    const finalBuffer = decipher.final();
    decryptedBuffer = Buffer.concat([decryptedBuffer, finalBuffer]);

    // Convert to original UTF-8 text
    const decryptedData = decryptedBuffer.toString('utf8');

    // Log successful decryption (excluding sensitive data)
    logger.info('Data decrypted successfully.', {
      event: 'decrypt',
      decryptedByteLength: decryptedBuffer.length,
      ivLength: ivBuffer.length,
      authTagLength: authTagBuffer.length,
    });

    // Clear references
    decryptedBuffer.fill(0);

    return decryptedData;
  } catch (error) {
    logger.error('Decryption failed.', {
      event: 'decrypt',
      error: error instanceof Error ? error.message : 'Unknown Error',
    });
    throw new AppError('Decryption failed', ErrorCode.INTERNAL_SERVER_ERROR, {
      context: { errorDetails: String(error) },
      source: 'encryption.util',
      severity: ErrorSeverity.HIGH,
    });
  }
}

// ---------------------------------------------------------------------------------------------
// hashPassword
// Creates a secure, salted password hash with PBKDF2. Iterations, key length, and digest are
// set to high security standards. Returns a single string containing all necessary parameters.
//
// Implementation Steps:
//  1) Validate password
//  2) Generate cryptographically secure salt
//  3) Use PBKDF2 with iteration count, key length, and digest
//  4) Construct final hash string with format:  pbkdf2$<digest>$<iterations>$<salt>$<derivedKey>
//  5) Log the hashing event
//  6) Return combined hash string
// ---------------------------------------------------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim().length === 0) {
    logger.warn('Attempted to hash an empty password.', { event: 'hashPassword' });
    throw new AppError('Cannot hash empty password', ErrorCode.BAD_REQUEST, {
      context: { reason: 'Empty string' },
      source: 'encryption.util',
      severity: ErrorSeverity.MEDIUM,
    });
  }

  try {
    // Generate salt
    const salt = crypto.randomBytes(16);

    // Create derived key with PBKDF2
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        PBKDF2_ITERATIONS,
        PBKDF2_KEYLEN,
        PBKDF2_DIGEST,
        (err, key) => {
          if (err) {
            return reject(err);
          }
          resolve(key);
        },
      );
    });

    // Format final hash string
    const saltBase64 = salt.toString('base64');
    const derivedKeyBase64 = derivedKey.toString('base64');
    const finalHash = `pbkdf2$${PBKDF2_DIGEST}$${PBKDF2_ITERATIONS}$${saltBase64}$${derivedKeyBase64}`;

    // Log the operation (non-sensitive)
    logger.info('Password hashed successfully.', {
      event: 'hashPassword',
      saltLength: salt.length,
      iterationCount: PBKDF2_ITERATIONS,
    });

    // Best effort to clear original password in memory
    password = '';

    return finalHash;
  } catch (error) {
    logger.error('Password hashing failed.', {
      event: 'hashPassword',
      error: error instanceof Error ? error.message : 'Unknown Error',
    });
    throw new AppError('Password hashing error', ErrorCode.INTERNAL_SERVER_ERROR, {
      context: { errorDetails: String(error) },
      source: 'encryption.util',
      severity: ErrorSeverity.HIGH,
    });
  }
}

// ---------------------------------------------------------------------------------------------
// verifyPassword
// Verifies a plaintext password against a previously hashed string using PBKDF2. Ensures
// timing-safe comparison to mitigate side-channel attacks.
//
// Implementation Steps:
//  1) Validate inputs
//  2) Parse stored hash for format, digest, iteration count, salt
//  3) Recompute derived key using PBKDF2
//  4) Compare computed key with stored key using timingSafeEqual
//  5) Log verification attempt (non-sensitive details)
//  6) Return true/false
// ---------------------------------------------------------------------------------------------
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (!password || !storedHash) {
    logger.warn('Invalid parameters for password verification.', {
      event: 'verifyPassword',
    });
    throw new AppError('Invalid verification parameters', ErrorCode.BAD_REQUEST, {
      context: { reason: 'Missing password or hash' },
      source: 'encryption.util',
      severity: ErrorSeverity.MEDIUM,
    });
  }

  try {
    // Expected format: pbkdf2$<digest>$<iterations>$<salt>$<derivedKey>
    const parts = storedHash.split('$');
    if (parts.length !== 5 || parts[0] !== 'pbkdf2') {
      logger.warn('Stored hash is in an invalid format.', { event: 'verifyPassword' });
      throw new AppError('Malformed stored hash', ErrorCode.BAD_REQUEST, {
        context: { reason: 'Incorrect hash format' },
        source: 'encryption.util',
        severity: ErrorSeverity.MEDIUM,
      });
    }

    const digest = parts[1];
    const iterations = parseInt(parts[2], 10);
    const saltBase64 = parts[3];
    const derivedKeyBase64 = parts[4];

    const salt = Buffer.from(saltBase64, 'base64');
    const originalKey = Buffer.from(derivedKeyBase64, 'base64');

    // Derive a key from the input password with same parameters
    const computedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, PBKDF2_KEYLEN, digest, (err, key) => {
        if (err) {
          return reject(err);
        }
        resolve(key);
      });
    });

    // Timing-safe comparison
    if (
      computedKey.length !== originalKey.length ||
      !crypto.timingSafeEqual(computedKey, originalKey)
    ) {
      // Log a failed verification attempt
      logger.warn('Password verification failed.', {
        event: 'verifyPassword',
        success: false,
      });
      return false;
    }

    // If we get here, the password matches
    logger.info('Password verification succeeded.', {
      event: 'verifyPassword',
      success: true,
    });

    // Clear references
    password = '';

    return true;
  } catch (error) {
    logger.error('Password verification error.', {
      event: 'verifyPassword',
      error: error instanceof Error ? error.message : 'Unknown Error',
    });
    throw new AppError('Password verification error', ErrorCode.INTERNAL_SERVER_ERROR, {
      context: { errorDetails: String(error) },
      source: 'encryption.util',
      severity: ErrorSeverity.HIGH,
    });
  }
}