/**
 * A reusable input component that implements the design system's input styles
 * with support for validation states, accessibility features, and various input types.
 * Part of the core UI component library.
 *
 * Addresses Requirements:
 * 1) Design System Implementation: Applies Tailwind CSS and Shadcn presets with
 *    custom overrides for consistent styling (Technical Specifications/3.1).
 * 2) Accessibility Requirements: Conforms to WCAG 2.1 AA. Provides ARIA labels,
 *    keyboard navigation, error state announcements, etc. (Technical Specifications/3.1).
 * 3) Input Validation: Displays visual error states, sets ARIA attributes for screen
 *    readers, and integrates with forms (Technical Specifications/7.3).
 */

//////////////////////////////////////////////
// External Imports
//////////////////////////////////////////////

// React ^18.2.0 (Core functionality + forwardRef for DOM integration)
import React, {
  forwardRef,
  InputHTMLAttributes,
  Ref,
} from 'react';

//////////////////////////////////////////////
// Internal Imports
//////////////////////////////////////////////

// cn (named import) from ../../lib/utils (Utility for conditional class names)
import { cn } from '../../lib/utils';

//////////////////////////////////////////////
// Global Constants from JSON Specification
//////////////////////////////////////////////

/**
 * Default input classes derived from the design system and
 * reinforced by the technical specifications:
 * - Sizing, layout, spacing
 * - Base borders and background
 * - Tailwind-based responsive adjustments
 * - State implementations (focus, disabled)
 */
const defaultInputClasses =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Error-specific input classes to visually highlight invalid or
 * erroneous fields for easy identification. Reflects:
 * - Red border
 * - Red focus ring
 * - Red placeholder text
 * as specified in the global JSON specification.
 */
const errorInputClasses =
  'border-red-500 focus-visible:ring-red-500 placeholder:text-red-400';

//////////////////////////////////////////////
// Interface
//////////////////////////////////////////////

/**
 * InputProps extends the native InputHTMLAttributes interface with
 * additional properties for error state handling and error messaging.
 *
 * @property error         - Boolean flag indicating if the field is in an error state.
 * @property errorMessage  - Error message string displayed when in error state.
 */
export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
}

//////////////////////////////////////////////
// Main Component
//////////////////////////////////////////////

/**
 * A fully accessible input component with validation states,
 * custom styling, and form integration. Uses React forwardRef
 * for robust form library support (e.g., React Hook Form).
 *
 * Implementation Steps (from the specification):
 * 1) Destructure props including className, type, error, errorMessage, and other HTML attributes.
 * 2) Combine default, error, and custom classes using cn utility.
 * 3) Apply error-specific styles and ARIA attributes when error prop is true.
 * 4) Forward ref to native input element for form integration.
 * 5) Set appropriate ARIA attributes for accessibility compliance.
 * 6) Return the styled input component with all necessary props and attributes.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      // Pull required properties from incoming props
      className,
      type = 'text',
      error = false,
      errorMessage,
      ...rest
    },
    ref: Ref<HTMLInputElement>
  ) => {
    // Step 2: Compose final set of CSS classes.
    // If "error" is true, append error-specific classes.
    const combinedClasses = cn(
      defaultInputClasses,
      error ? errorInputClasses : '',
      className
    );

    // Step 3: Set ARIA attributes for accessibility compliance.
    // aria-invalid indicates the element is in an error state for screen readers.
    const ariaInvalid = error ? 'true' : undefined;
    // aria-describedby links the input to a descriptive error element if present.
    const describedById = error && errorMessage ? 'input-error-text' : undefined;

    // Step 4 + 5: Return the input element wrapped with optional error message.
    return (
      <div className="flex flex-col">
        <input
          ref={ref}
          type={type}
          className={combinedClasses}
          aria-invalid={ariaInvalid}
          aria-describedby={describedById}
          {...rest}
        />
        {/* When error is triggered, show error text with appropriate ARIA labeling. */}
        {error && errorMessage && (
          <p
            id="input-error-text"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

// Provide a display name for the forwarded component, aiding debugging.
Input.displayName = 'Input';

//////////////////////////////////////////////
// Default Export
//////////////////////////////////////////////

/**
 * Exporting the Input as the default for ease of import into
 * other modules within the application.
 */
export default Input;