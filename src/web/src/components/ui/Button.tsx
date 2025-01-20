/***********************************************************************************************
 * A comprehensive, accessible button component implementing the design system's button styles
 * with multiple variants, sizes, states, and enhanced accessibility features. Includes:
 *  - Loading states (showing spinner)
 *  - Focus management & keyboard interactions
 *  - RTL support for icon placement
 *  - Throttled click handling to prevent rapid clicks
 *  - WCAG 2.1 AA color contrast and screen reader compliance
 ***********************************************************************************************/

//
// External Imports with Library Versions
//
// react ^18.2.0
import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  ButtonHTMLAttributes,
  FC,
} from 'react';

//
// Internal Imports
//
import { cn } from '../../lib/utils'; // Utility for conditional class name construction

/***********************************************************************************************
 * getVariantClasses
 * ---------------------------------------------------------------------------------------------
 * Returns the appropriate Tailwind CSS classes based on button variant, size, and state.
 *
 * Parameters:
 *   - variant: string ('primary' | 'secondary' | 'outline' | 'ghost' | 'danger')
 *   - size: string ('sm' | 'md' | 'lg')
 *   - isLoading: boolean (controls loading visual state)
 *   - isDisabled: boolean (controls disabled visual state)
 *
 * Returns: string
 *   A combined string of Tailwind CSS classes for the button's styling.
 *
 * Implementation Steps:
 *  1. Establish base classes for consistent display, typography, transitions, and focus rings.
 *  2. Incorporate variant-specific background, text color, hover states, and focus ring colors.
 *  3. Layer on size-specific padding and font sizing.
 *  4. Apply loading state styling (e.g., partial opacity, no pointer events).
 *  5. Apply disabled state styling similarly, ensuring correct ARIA and visual cues.
 *  6. Use the cn utility to combine all classes uniquely.
 ***********************************************************************************************/
export function getVariantClasses(
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
  size: 'sm' | 'md' | 'lg',
  isLoading: boolean,
  isDisabled: boolean
): string {
  // Step 1: Define base classes for all buttons
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'transition-colors', // for hover, focus transitions
    'duration-150',      // aligns with design system's motion guidelines
    'ease-in-out',
    'select-none',       // prevent text selection on double click
  ];

  // Step 2: Variant-specific classes
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = cn(
        'bg-[#2563eb]',
        'text-white',
        'hover:bg-[#1e49b6]',
        'focus:ring-[#2563eb]'
      );
      break;
    case 'secondary':
      variantClasses = cn(
        'bg-[#64748b]',
        'text-white',
        'hover:bg-[#4b5563]',
        'focus:ring-[#64748b]'
      );
      break;
    case 'outline':
      variantClasses = cn(
        'border',
        'border-gray-300',
        'text-gray-800',
        'hover:bg-gray-100',
        'focus:ring-gray-300',
        'dark:text-gray-200',
        'dark:border-gray-600',
        'dark:hover:bg-gray-700'
      );
      break;
    case 'ghost':
      variantClasses = cn(
        'bg-transparent',
        'text-gray-800',
        'hover:bg-gray-200',
        'focus:ring-gray-200',
        'dark:text-gray-200',
        'dark:hover:bg-gray-700'
      );
      break;
    case 'danger':
      variantClasses = cn(
        'bg-red-600',
        'text-white',
        'hover:bg-red-700',
        'focus:ring-red-600'
      );
      break;
    default:
      variantClasses = cn(
        'bg-[#2563eb]',
        'text-white',
        'hover:bg-[#1e49b6]',
        'focus:ring-[#2563eb]'
      );
      break;
  }

  // Step 3: Size-specific classes
  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = cn(
        'px-2',
        'py-1',
        'text-sm'
      );
      break;
    case 'md':
      sizeClasses = cn(
        'px-4',
        'py-2',
        'text-sm'
      );
      break;
    case 'lg':
      sizeClasses = cn(
        'px-6',
        'py-3',
        'text-base'
      );
      break;
    default:
      sizeClasses = cn(
        'px-4',
        'py-2',
        'text-sm'
      );
      break;
  }

  // Step 4: Loading state classes (reduced opacity, pointer events disabled)
  const loadingClasses = isLoading ? 'opacity-70 pointer-events-none' : '';

  // Step 5: Disabled state classes (overlap with loading, but also uses aria-disabled)
  const disabledClasses = isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : '';

  // Step 6: Combine all classes with cn utility
  return cn(
    baseClasses.join(' '),
    variantClasses,
    sizeClasses,
    loadingClasses,
    disabledClasses
  );
}

/***********************************************************************************************
 * ButtonProps
 * ---------------------------------------------------------------------------------------------
 * Defines the props accepted by the Button component:
 *   - variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 *   - size: 'sm' | 'md' | 'lg'
 *   - isLoading: boolean
 *   - isDisabled: boolean
 *   - leftIcon: React.ReactNode (icon displayed left)
 *   - rightIcon: React.ReactNode (icon displayed right)
 *   - className: optional string for custom classes
 *   - children: React.ReactNode for button text/contents
 *   - ariaLabel: string for accessibility labeling
 *
 * We also extend ButtonHTMLAttributes<HTMLButtonElement> to include
 * standard button attributes like onClick, type, etc.
 ***********************************************************************************************/
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
}

/***********************************************************************************************
 * Default Settings and Constants
 ***********************************************************************************************/
const DEFAULT_VARIANT: ButtonProps['variant'] = 'primary';
const DEFAULT_SIZE: ButtonProps['size'] = 'md';
const TRANSITION_DURATION = '150ms'; // aligns with design system animation guidelines

/***********************************************************************************************
 * Button
 * ---------------------------------------------------------------------------------------------
 * Main button component supporting different variants, sizes, and states with full accessibility:
 *   - Renders button with combined classes from getVariantClasses
 *   - Sets up ARIA attributes (aria-label, aria-busy, etc.)
 *   - Handles loading state (spinner) and disables pointer events
 *   - Manages focus states, keyboard interactions, and click throttling
 *   - Implements basic RTL awareness for icon placement order
 *
 * Implementation Steps:
 *  1. Destructure all props, applying defaults for variant and size.
 *  2. Track whether the document direction is 'rtl' to handle icon flipping.
 *  3. Create a throttled onClick handler to prevent rapid-fire clicks.
 *  4. Construct final className using getVariantClasses + any custom className.
 *  5. Render spinner if isLoading is true, otherwise display children.
 *  6. Place leftIcon / rightIcon in correct positions, respecting RTL.
 *  7. Apply HTML button attributes, including ariaLabel, disabled, etc.
 ***********************************************************************************************/
const Button: FC<ButtonProps> = ({
  variant = DEFAULT_VARIANT,
  size = DEFAULT_SIZE,
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ariaLabel,
  onClick,
  ...rest
}) => {
  // Step 1: Destructure + apply defaults above

  // Step 2: Setup a state to detect RTL. We'll check the document's dir attribute once on mount.
  const [isRTL, setIsRTL] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsRTL(document.documentElement.dir === 'rtl');
    }
  }, []);

  // Step 3: Throttled click handler to prevent extremely rapid clicks
  const lastClickRef = useRef<number>(0);
  const THROTTLE_DELAY = 300; // in ms

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const now = Date.now();
      if (now - lastClickRef.current < THROTTLE_DELAY) {
        // Ignore this click due to throttling
        return;
      }
      lastClickRef.current = now;
      if (onClick) {
        onClick(e);
      }
    },
    [onClick]
  );

  // Step 4: Construct the final className (including variant & size classes)
  const combinedClasses = cn(
    getVariantClasses(variant, size, isLoading, isDisabled),
    className
  );

  // Step 5: Conditionally render spinner if loading
  // We'll add a visually hidden text "Loading..." for screen readers
  const spinnerElement = isLoading ? (
    <span
      className="inline-block h-4 w-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
      role="status"
      aria-label="Loading"
    ></span>
  ) : null;

  // Step 6: Render left & right icons with optional RTL flip
  // We'll conditionally swap positions if isRTL is true
  const iconLeft = !isRTL ? leftIcon : rightIcon;
  const iconRight = !isRTL ? rightIcon : leftIcon;

  return (
    <button
      type="button"
      {...rest}
      // ARIA and accessibility
      aria-label={ariaLabel}
      aria-busy={isLoading ? 'true' : 'false'}
      aria-disabled={isDisabled ? 'true' : 'false'}
      disabled={isDisabled}
      // Visual & event handling
      onClick={handleClick}
      className={combinedClasses}
      style={{
        transitionDuration: TRANSITION_DURATION,
      }}
    >
      {/* For screen readers, announce "Loading..." when isLoading is true */}
      {isLoading && (
        <span className="sr-only">Loading...</span>
      )}

      {/* If there's a spinner, place it left next to the text/icons */}
      {spinnerElement}

      {/* Icon on the left (or right in RTL) */}
      {iconLeft && (
        <span className="inline-flex items-center mr-2">
          {iconLeft}
        </span>
      )}

      {/* Button text children */}
      {children}

      {/* Icon on the right (or left in RTL) */}
      {iconRight && (
        <span className="inline-flex items-center ml-2">
          {iconRight}
        </span>
      )}
    </button>
  );
};

/***********************************************************************************************
 * Export
 * ---------------------------------------------------------------------------------------------
 * We export the Button component as default for usage throughout the codebase.
 ***********************************************************************************************/
export default Button;