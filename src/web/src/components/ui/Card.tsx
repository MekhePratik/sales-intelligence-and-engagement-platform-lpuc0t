/*************************************************************************************************
 * Card.tsx
 * 
 * A reusable Card component implementing a design-system-compliant structure with various 
 * variants, padding configurations, and accessibility features. This Card adheres to:
 *  - WCAG 2.1 AA color contrast guidelines
 *  - Semantic HTML structure and ARIA role assignments
 *  - Keyboard navigation for interactive variants
 * 
 * External Dependencies:
 *   react ^18.2.0
 * Internal Dependencies:
 *   cn(...) from ../../lib/utils
 *************************************************************************************************/

import * as React from 'react'; // react ^18.2.0
import { HTMLAttributes } from 'react'; // react ^18.2.0
import { cn } from '../../lib/utils'; // Internal: utility for conditional class names

/*************************************************************************************************
 * Enumerations
 *************************************************************************************************/

/**
 * CardVariant represents the visual and interactive style of the card.
 *   - default: Standard card styling with a minimal shadow.
 *   - hover: Card that transitions to a slightly larger shadow on hover.
 *   - interactive: Card that is focusable (keyboard), clickable, and includes focus states.
 *   - bordered: Card featuring a border instead of a shadow.
 */
export type CardVariant = 'default' | 'hover' | 'interactive' | 'bordered';

/**
 * CardPadding enumerates the available padding options for the card.
 *   - none: No padding.
 *   - sm: Small padding, typically 1rem in Tailwind.
 *   - md: Medium padding, typically 1.5rem in Tailwind.
 *   - lg: Large padding, typically 2rem in Tailwind.
 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/*************************************************************************************************
 * Interface: CardProps
 * 
 * Contains:
 *   - variant: (optional) CardVariant controlling styling.
 *   - padding: (optional) CardPadding controlling spacing.
 *   - className: (optional) Additional class names for custom styling.
 *   - children: ReactNode for rendering nested components.
 *   - HTMLDivAttributes: Inherited HTML div attributes ensuring type safety and WAI-ARIA usage.
 *************************************************************************************************/
export interface CardProps
  extends HTMLAttributes<HTMLDivElement> {
  /**
   * Determines the visual style of the card (default, hover, interactive, bordered).
   * Defaults to 'default' if unspecified.
   */
  variant?: CardVariant;

  /**
   * Determines the padding size of the card (none, sm, md, lg).
   * Defaults to 'md' if unspecified.
   */
  padding?: CardPadding;

  /**
   * Optional additional class names that merge with the card's own styles.
   */
  className?: string;

  /**
   * The primary content to be rendered within the card.
   */
  children?: React.ReactNode;
}

/*************************************************************************************************
 * getVariantClasses
 * 
 * Returns Tailwind CSS classes for the given variant. These styles include shadow levels, 
 * hover states, focus rings, and borders depending on the variant. 
 * 
 * Steps:
 *   1. Switch on the 'variant' argument to determine styling.
 *   2. For 'default', apply a small shadow.
 *   3. For 'hover', apply hover transition for a medium shadow.
 *   4. For 'interactive', add cursor pointer, focus ring, and hover shadow.
 *   5. For 'bordered', apply a border with no shadow.
 *   6. Return the resulting classes as a spaced string.
 *************************************************************************************************/
function getVariantClasses(variant: CardVariant): string {
  switch (variant) {
    case 'hover':
      return cn(
        'bg-white',
        'shadow-sm',
        'transition-shadow',
        'hover:shadow-md',
        'text-slate-900'
      );
    case 'interactive':
      return cn(
        'bg-white',
        'shadow-sm',
        'cursor-pointer',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'focus:ring-blue-500',
        'hover:shadow-md',
        'transition-shadow',
        'text-slate-900'
      );
    case 'bordered':
      return cn(
        'border',
        'border-gray-200',
        'text-slate-900'
      );
    case 'default':
    default:
      return cn(
        'bg-white',
        'shadow-sm',
        'text-slate-900'
      );
  }
}

/*************************************************************************************************
 * getPaddingClasses
 * 
 * Returns Tailwind CSS classes for padding based on the provided CardPadding value 
 * following the design system's spacing scale. 
 * 
 * Steps:
 *   1. Switch on 'padding' argument to select the correct Tailwind class.
 *   2. Map each padding size to a relevant utility class.
 *   3. Return the chosen class name. Default to medium if unspecified.
 *************************************************************************************************/
function getPaddingClasses(padding: CardPadding): string {
  switch (padding) {
    case 'none':
      return 'p-0';
    case 'sm':
      return 'p-4';
    case 'md':
      return 'p-6';
    case 'lg':
      return 'p-8';
    default:
      return 'p-6';
  }
}

/*************************************************************************************************
 * Card
 * 
 * A reusable container component that applies a consistent design system style to wrap content.
 * Complies with WCAG 2.1 AA guidelines by:
 *   - Providing appropriate color contrast
 *   - Allowing keyboard navigation when variant is 'interactive'
 *   - Ensuring role and tabIndex usage for accessibility
 * 
 * Implementation Steps:
 *   1. Destructure all relevant props from the CardProps interface.
 *   2. Apply default values for variant and padding (fallback to 'default' and 'md').
 *   3. Determine the variant classes using getVariantClasses.
 *   4. Determine the padding classes using getPaddingClasses.
 *   5. Merge classes with the user-supplied className through the cn utility.
 *   6. For interactive variant, set role='button' and tabIndex=0 to enable keyboard engagement.
 *   7. Render a semantic <div> with combined props, children, and the computed classes.
 *************************************************************************************************/
export const Card: React.FC<CardProps> = (props) => {
  // 1. Destructure props
  const {
    variant = 'default',
    padding = 'md',
    className,
    children,
    ...rest
  } = props;

  // 2. Acquire classes based on variant and padding
  const variantClasses = getVariantClasses(variant);
  const paddingClasses = getPaddingClasses(padding);

  // 3. Merge classes together for final output
  //    The base classes incorporate color and typography from the design system.
  const cardClasses = cn(
    'rounded-md',
    'overflow-hidden',
    'w-full',
    variantClasses,
    paddingClasses,
    className
  );

  // 4. Accessibility attributes for 'interactive' variant
  //    We add role="button" and tabIndex={0} for keyboard usage. 
  //    Otherwise, keep it as a standard region container.
  const interactiveProps =
    variant === 'interactive'
      ? {
          role: 'button',
          tabIndex: 0,
        }
      : {
          role: 'region',
        };

  // 5. Render the card with the final attributes and content
  return (
    <div className={cardClasses} {...interactiveProps} {...rest}>
      {children}
    </div>
  );
};

export default Card;