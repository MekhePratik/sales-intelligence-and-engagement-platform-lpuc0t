/**
 * Centralized form configuration constants, including field definitions,
 * validation rules, default values, security controls, and accessibility features.
 * These configurations are designed to be enterprise-grade, supporting
 * robust validation, enhanced security measures, and accessibility compliance.
 *
 * All configurations below leverage the Zod schema (zod@^3.22.4) for consistent
 * validation and incorporate optional attributes such as rate limiting, field-level
 * security measures (sanitization, hashing, etc.), ARIA labeling for assistive
 * technology, and more.
 */

// Internal and external imports with version-specific notes.
// zod@^3.22.4 is used for schema-based validation at runtime.
import { z } from 'zod'; // zod@^3.22.4
import { LeadStatus } from '../types/lead'; // Utilizing only LeadStatus.NEW, LeadStatus.QUALIFIED
import { CampaignType } from '../types/campaign'; // Utilizing only CampaignType.OUTREACH, CampaignType.NURTURE

////////////////////////////////////////////////////////////////////////////////
// AUTHENTICATION FORMS
////////////////////////////////////////////////////////////////////////////////

/**
 * AUTH_FORMS
 * A configuration object containing all authentication-related forms.
 * Includes advanced security, rate limiting, ARIA accessibility metadata,
 * and real-time validation instructions.
 */
export const AUTH_FORMS = {
  /**
   * LOGIN form configuration.
   * Enables users to log into the application.
   * Incorporates strong password validation and CSRF protection.
   */
  LOGIN: {
    fields: {
      email: {
        type: 'email',
        label: 'Email Address',
        placeholder: 'Enter your email',
        required: true,
        validation: 'z.string().email().max(255)',
        aria: {
          label: 'Email input field',
          required: true,
        },
        security: {
          sanitize: true,
          maxLength: 255,
        },
      },
      password: {
        type: 'password',
        label: 'Password',
        placeholder: 'Enter your password',
        required: true,
        /**
         * Minimum 12 characters, must contain uppercase letters,
         * lowercase letters, digits, and special characters.
         */
        validation:
          'z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$/)',
        aria: {
          label: 'Password input field',
          required: true,
        },
        security: {
          hash: true,
          preventPaste: true,
        },
      },
      csrfToken: {
        type: 'hidden',
        required: true,
        validation: 'z.string()',
        security: {
          required: true,
        },
      },
    },
    /**
     * Rate limiting: Max 5 attempts within 300000ms (5 minutes).
     * Additional attempts within the window are blocked to mitigate brute force.
     */
    rateLimit: {
      maxAttempts: 5,
      windowMs: 300000,
    },
  },

  /**
   * REGISTER form configuration.
   * Allows new users to create an account with verification
   * and strong password rules.
   */
  REGISTER: {
    fields: {
      email: {
        type: 'email',
        label: 'Email Address',
        placeholder: 'Enter your email',
        required: true,
        validation: 'z.string().email().max(255)',
        aria: {
          label: 'Registration email input',
          required: true,
        },
        security: {
          sanitize: true,
          maxLength: 255,
        },
      },
      password: {
        type: 'password',
        label: 'Password',
        placeholder: 'Create a password',
        required: true,
        /**
         * Maintaining the same minimum 12 character security standard
         * with at least one uppercase, one lowercase, one digit,
         * and one special character.
         */
        validation:
          'z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$/)',
        aria: {
          label: 'Registration password input',
          required: true,
        },
        security: {
          hash: true,
          preventPaste: true,
        },
      },
      confirmPassword: {
        type: 'password',
        label: 'Confirm Password',
        placeholder: 'Re-enter your password',
        required: true,
        validation:
          'z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$/)',
        aria: {
          label: 'Confirm password input',
          required: true,
        },
        security: {
          hash: true,
          preventPaste: true,
        },
      },
      csrfToken: {
        type: 'hidden',
        required: true,
        validation: 'z.string()',
        security: {
          required: true,
        },
      },
    },
  },

  /**
   * FORGOT_PASSWORD form configuration.
   * Enables users to request a password reset link sent to their email.
   */
  FORGOT_PASSWORD: {
    fields: {
      email: {
        type: 'email',
        label: 'Email Address',
        placeholder: 'Enter your email to reset password',
        required: true,
        validation: 'z.string().email().max(255)',
        aria: {
          label: 'Forgot password email input',
          required: true,
        },
        security: {
          sanitize: true,
          maxLength: 255,
        },
      },
      csrfToken: {
        type: 'hidden',
        required: true,
        validation: 'z.string()',
        security: {
          required: true,
        },
      },
    },
  },

  /**
   * RESET_PASSWORD form configuration.
   * Allows a user to set a new password after receiving a reset link.
   */
  RESET_PASSWORD: {
    fields: {
      password: {
        type: 'password',
        label: 'New Password',
        placeholder: 'Enter your new password',
        required: true,
        validation:
          'z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$/)',
        aria: {
          label: 'New password input',
          required: true,
        },
        security: {
          hash: true,
          preventPaste: true,
        },
      },
      confirmPassword: {
        type: 'password',
        label: 'Confirm New Password',
        placeholder: 'Re-enter your new password',
        required: true,
        validation:
          'z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$/)',
        aria: {
          label: 'Confirm new password input',
          required: true,
        },
        security: {
          hash: true,
          preventPaste: true,
        },
      },
      csrfToken: {
        type: 'hidden',
        required: true,
        validation: 'z.string()',
        security: {
          required: true,
        },
      },
    },
  },

  /**
   * MFA_SETUP form configuration.
   * Facilitates multi-factor authentication setup,
   * typically requiring an OTP or verification code
   * and a CSRF token for security.
   */
  MFA_SETUP: {
    fields: {
      otp: {
        type: 'text',
        label: 'One-Time Password',
        placeholder: 'Enter the 6-digit code',
        required: true,
        validation: "z.string().length(6).regex(/^\\d{6}$/)",
        aria: {
          label: 'One-Time Password input',
          required: true,
        },
        security: {
          sanitize: true,
          maxLength: 6,
        },
      },
      csrfToken: {
        type: 'hidden',
        required: true,
        validation: 'z.string()',
        security: {
          required: true,
        },
      },
    },
  },
} as const;

////////////////////////////////////////////////////////////////////////////////
// LEAD MANAGEMENT FORMS
////////////////////////////////////////////////////////////////////////////////

/**
 * LEAD_FORMS
 * A collection of form configurations relevant to lead management.
 * Includes creation, editing, importing, and bulk updating of leads.
 * Validations target data integrity (email format, name constraints)
 * and incorporate possible references to lead status enumerations.
 */
export const LEAD_FORMS = {
  /**
   * CREATE form configuration.
   * Builds a new lead record with essential fields such as email,
   * first name, and optional company information.
   * Additional validation ensures name and email correctness.
   */
  CREATE: {
    fields: {
      email: {
        type: 'email',
        label: 'Email Address',
        placeholder: 'Enter lead email',
        required: true,
        validation: 'z.string().email().max(255)',
        aria: {
          label: 'Lead email input',
          required: true,
        },
        security: {
          sanitize: true,
          maxLength: 255,
        },
      },
      firstName: {
        type: 'text',
        label: 'First Name',
        placeholder: 'Enter first name',
        required: true,
        /**
         * Only alphabetic characters plus spaces and hyphens/apostrophes.
         * Max length is 50 characters.
         */
        validation: "z.string().min(1).max(50).regex(/^[a-zA-Z\\s-']+$/)",
        aria: {
          label: 'First name input',
          required: true,
        },
        security: {
          sanitize: true,
          maxLength: 50,
        },
      },
      /**
       * Nested object for handling company data:
       * includes properties such as name and size
       * for organizational lead classification.
       */
      companyData: {
        type: 'object',
        fields: {
          name: {
            type: 'text',
            label: 'Company Name',
            required: true,
            validation: 'z.string().min(1).max(100)',
            security: {
              sanitize: true,
            },
          },
          size: {
            type: 'select',
            label: 'Company Size',
            options: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
            required: true,
          },
        },
      },
    },
    /**
     * Validation-level dependencies:
     * The field "companyData.size" is required only if
     * "companyData.name" is present. Condition: required.
     */
    validation: {
      dependencies: [
        {
          field: 'companyData.size',
          dependsOn: 'companyData.name',
          condition: 'required',
        },
      ],
    },
  },

  /**
   * EDIT form configuration.
   * Allows updates to selected lead properties. Typically includes
   * a hidden ID field for referencing the lead to be edited, plus
   * optional usage of the LeadStatus enum to let users change status.
   */
  EDIT: {
    fields: {
      id: {
        type: 'hidden',
        required: true,
        validation: 'z.string().uuid()',
        security: {
          required: true,
        },
      },
      email: {
        type: 'email',
        label: 'Email Address',
        placeholder: 'Update lead email',
        required: false,
        validation: 'z.string().email().max(255)',
        aria: {
          label: 'Lead email update field',
          required: false,
        },
        security: {
          sanitize: true,
          maxLength: 255,
        },
      },
      firstName: {
        type: 'text',
        label: 'First Name',
        placeholder: 'Update first name',
        required: false,
        validation: "z.string().min(1).max(50).regex(/^[a-zA-Z\\s-']+$/)",
        aria: {
          label: 'Lead first name update field',
          required: false,
        },
        security: {
          sanitize: true,
          maxLength: 50,
        },
      },
      status: {
        type: 'select',
        label: 'Lead Status',
        /**
         * Only displaying the subset [NEW, QUALIFIED] for demonstration;
         * in practice, the full suite from the LeadStatus enum could be used.
         */
        options: [LeadStatus.NEW, LeadStatus.QUALIFIED],
        required: false,
        validation: "z.enum(['NEW','QUALIFIED'])",
        aria: {
          label: 'Lead status selection',
          required: false,
        },
      },
    },
  },

  /**
   * IMPORT form configuration.
   * Designed to handle bulk lead imports from a file upload
   * (e.g., CSV). Contains security notes for scanning or sanitizing
   * imported data and supporting large file constraints.
   */
  IMPORT: {
    fields: {
      fileUpload: {
        type: 'file',
        label: 'Import File',
        required: true,
        /**
         * Accept CSV / text files, optional custom checks for size limit,
         * or scanning for malicious payloads.
         */
        validation: "z.string().regex(/\\.csv$/i)",
        aria: {
          label: 'File upload for lead import',
          required: true,
        },
        security: {
          sanitize: true,
          maxSizeMB: 10,
        },
      },
      csrfToken: {
        type: 'hidden',
        required: true,
        validation: 'z.string()',
        security: {
          required: true,
        },
      },
    },
    /**
     * Additional server-side checks can be enforced for file structure:
     * - Automatic mapping of columns to lead fields
     * - Skipping invalid rows
     */
  },

  /**
   * BULK_UPDATE form configuration.
   * Allows mass updates to specific lead properties such as
   * status, owner, or score in bulk. This form is beneficial
   * for large teams managing extensive lead lists.
   */
  BULK_UPDATE: {
    fields: {
      leadIds: {
        type: 'array',
        /**
         * Each element must be a valid UUID referencing
         * an existing Lead record in the database.
         */
        itemValidation: 'z.string().uuid()',
        required: true,
      },
      status: {
        type: 'select',
        label: 'New Status',
        options: [LeadStatus.NEW, LeadStatus.QUALIFIED],
        required: false,
        validation: "z.enum(['NEW','QUALIFIED'])",
      },
      score: {
        type: 'number',
        label: 'New Score',
        required: false,
        validation: 'z.number().min(0).max(100)',
      },
      csrfToken: {
        type: 'hidden',
        required: true,
        validation: 'z.string()',
        security: {
          required: true,
        },
      },
    },
    /**
     * Implementation might incorporate concurrency checks or
     * partial success results if some leads are updated successfully
     * while others fail validation or permissions.
     */
  },
} as const;

////////////////////////////////////////////////////////////////////////////////
// CAMPAIGN MANAGEMENT FORMS
////////////////////////////////////////////////////////////////////////////////

/**
 * CAMPAIGN_FORMS
 * A suite of form configurations for creating, editing,
 * A/B testing, and sequencing campaigns within the
 * sales engagement platform.
 */
export const CAMPAIGN_FORMS = {
  /**
   * CREATE form configuration.
   * Establishes core campaign attributes such as name, type,
   * and optional A/B test details. Ties in the CampaignType
   * enum to provide clear user options.
   */
  CREATE: {
    fields: {
      name: {
        type: 'text',
        label: 'Campaign Name',
        placeholder: 'Enter campaign name',
        required: true,
        validation: 'z.string().min(3).max(100)',
        aria: {
          label: 'Campaign name input',
          required: true,
        },
        security: {
          sanitize: true,
          maxLength: 100,
        },
      },
      type: {
        type: 'select',
        label: 'Campaign Type',
        /**
         * The "options" array references only the subset of
         * CampaignType relevant to this form: [OUTREACH, NURTURE].
         */
        options: [CampaignType.OUTREACH, CampaignType.NURTURE],
        required: true,
        validation: "z.enum(['OUTREACH','NURTURE'])",
        aria: {
          label: 'Campaign type selection',
          required: true,
        },
      },
      abTest: {
        type: 'object',
        fields: {
          enabled: {
            type: 'boolean',
            label: 'Enable A/B Testing',
            default: false,
          },
          variants: {
            type: 'array',
            /**
             * Maximum 3 variants. Each item in the array
             * must include a variant name and content.
             */
            maxItems: 3,
            itemTemplate: {
              name: {
                type: 'text',
                required: true,
                validation: 'z.string().min(1).max(50)',
              },
              content: {
                type: 'richText',
                required: true,
                validation: 'z.string().min(1).max(5000)',
              },
            },
          },
        },
      },
    },
  },

  /**
   * EDIT form configuration.
   * Permits updates to existing campaign parameters.
   * Often includes hidden campaign ID, plus optional
   * modifications for name, type, or A/B test preference.
   */
  EDIT: {
    fields: {
      id: {
        type: 'hidden',
        required: true,
        validation: 'z.string().uuid()',
        security: {
          required: true,
        },
      },
      name: {
        type: 'text',
        label: 'Campaign Name',
        placeholder: 'Update campaign name',
        required: false,
        validation: 'z.string().min(3).max(100)',
        aria: {
          label: 'Campaign name update',
        },
        security: {
          sanitize: true,
          maxLength: 100,
        },
      },
      type: {
        type: 'select',
        label: 'Campaign Type',
        options: [CampaignType.OUTREACH, CampaignType.NURTURE],
        required: false,
        validation: "z.enum(['OUTREACH','NURTURE'])",
        aria: {
          label: 'Campaign type update',
        },
      },
      abTest: {
        type: 'object',
        fields: {
          enabled: {
            type: 'boolean',
            label: 'Enable A/B Testing',
            default: false,
          },
          variants: {
            type: 'array',
            maxItems: 3,
            itemTemplate: {
              name: {
                type: 'text',
                required: true,
                validation: 'z.string().min(1).max(50)',
              },
              content: {
                type: 'richText',
                required: true,
                validation: 'z.string().min(1).max(5000)',
              },
            },
          },
        },
      },
    },
  },

  /**
   * AB_TEST form configuration.
   * Focuses specifically on managing A/B testing components
   * in a campaign. Suitable when a campaign is already
   * created but requires new variant details or toggling.
   */
  AB_TEST: {
    fields: {
      campaignId: {
        type: 'hidden',
        required: true,
        validation: 'z.string().uuid()',
        security: {
          required: true,
        },
      },
      enableABTest: {
        type: 'boolean',
        label: 'Enable A/B Testing',
        default: false,
      },
      variantA: {
        type: 'richText',
        label: 'Variant A Content',
        required: true,
        validation: 'z.string().min(1).max(5000)',
      },
      variantB: {
        type: 'richText',
        label: 'Variant B Content',
        required: false,
        validation: 'z.string().min(1).max(5000)',
      },
      csrfToken: {
        type: 'hidden',
        required: true,
        validation: 'z.string()',
        security: {
          required: true,
        },
      },
    },
  },

  /**
   * SEQUENCE form configuration.
   * Manages the multi-step email sequence in a campaign,
   * including the time delays and template references
   * for each step. Potentially integrated with the
   * abTesting approach to vary messaging.
   */
  SEQUENCE: {
    fields: {
      campaignId: {
        type: 'hidden',
        required: true,
        validation: 'z.string().uuid()',
        security: {
          required: true,
        },
      },
      steps: {
        type: 'array',
        /**
         * Each step is an object containing the order index,
         * time delay (in hours), and a template identifier.
         */
        itemTemplate: {
          stepOrder: {
            type: 'number',
            required: true,
            validation: 'z.number().min(0)',
          },
          delayHours: {
            type: 'number',
            required: true,
            validation: 'z.number().min(0).max(168)',
          },
          templateId: {
            type: 'text',
            required: true,
            validation: 'z.string().min(1).max(100)',
          },
          variant: {
            type: 'select',
            required: false,
            /**
             * Optionally specify 'A' or 'B' for which
             * variant to use in an A/B scenario.
             */
            options: ['A', 'B'],
            validation: "z.enum(['A','B'])",
          },
        },
      },
      /**
       * This token can be used server-side to validate
       * the sequence creation or updates, preventing
       * replay attacks.
       */
      csrfToken: {
        type: 'hidden',
        required: true,
        validation: 'z.string()',
        security: {
          required: true,
        },
      },
    },
  },
} as const;