/***************************************************************************************************
 * A reusable dialog component implementing the design system's modal dialog patterns with robust
 * accessibility support using Radix UI primitives and smooth animations via Framer Motion.
 *
 * This file interfaces with:
 *  1. React (v^18.2.0) for core UI and component creation
 *  2. @radix-ui/react-dialog (v^1.0.4) for accessible dialog primitives
 *  3. framer-motion (v^10.16.4) for animation capabilities
 *  4. cn (from ../../lib/utils) for conditional class name merging
 *
 * Purpose:
 *  - Fulfills the design system requirements for modal dialogs, including multiple size variants,
 *    appropriate typography, spacing, and color application.
 *  - Provides extensive accessibility features (keyboard navigation, focus trapping, ARIA labels).
 *  - Implements WCAG 2.1 AA compliant patterns for color contrast and interactive states.
 *
 * Exported Components:
 *  - Dialog: Main dialog component with open/close state management, size handling, animations, and
 *            accessibility features.
 *  - DialogTitle: Accessible title subcomponent with proper heading semantics and ARIA attributes.
 *  - DialogDescription: Accessible description subcomponent with relevant ARIA attributes and text
 *                       styling per the design system.
 **************************************************************************************************/

/***************************************************************************************************
 * External Imports
 **************************************************************************************************/
// react ^18.2.0
import * as React from 'react';
// @radix-ui/react-dialog ^1.0.4
import * as RadixDialog from '@radix-ui/react-dialog';
// framer-motion ^10.16.4
import { motion, AnimatePresence } from 'framer-motion';

/***************************************************************************************************
 * Internal Imports
 **************************************************************************************************/
import { cn } from '../../lib/utils';

/***************************************************************************************************
 * getDialogSize Function
 * -----------------------------------------------------------------------------------------------
 * Returns a string of Tailwind CSS classes that define width, height, and other constraints based
 * on the specified dialog size. Supports multiple responsive variants to accommodate various screen
 * sizes and ensures maximum height constraints for accessibility.
 *
 * Steps:
 *  1. Match the provided "size" argument against known size keys (sm, md, lg, xl, full).
 *  2. Return corresponding Tailwind CSS classes suitable for responsive breakpoints, including max
 *     width, max height, and potential margins.
 *  3. If no matching size is found, default to medium ("md").
 **************************************************************************************************/
function getDialogSize(size?: string): string {
  switch (size) {
    case 'sm':
      return cn(
        // Provide responsive width constraints
        'w-full max-w-sm',
        // Keep dialog within the viewport vertically
        'max-h-[90vh]',
        // Responsive breakpoints for potential expansions
        'sm:max-w-sm md:max-w-sm'
      );
    case 'lg':
      return cn('w-full max-w-lg', 'max-h-[90vh]', 'sm:max-w-lg md:max-w-lg');
    case 'xl':
      return cn('w-full max-w-xl', 'max-h-[90vh]', 'sm:max-w-xl md:max-w-xl');
    case 'full':
      return cn(
        // Occupies the full screen for large modals or immersive content
        'w-full h-full',
        // Remove default margins and padding to allow full coverage
        'm-0 p-0',
        // Provide a fallback max-h approach for smaller breakpoints if needed
        'max-h-screen'
      );
    // Default to "md" if size not specified or not recognized
    case 'md':
    default:
      return cn('w-full max-w-md', 'max-h-[90vh]', 'sm:max-w-md md:max-w-md');
  }
}

/***************************************************************************************************
 * DialogProps Interface
 * -----------------------------------------------------------------------------------------------
 * Defines the shape of the props accepted by the Dialog component.
 *
 * open         - Indicates whether the dialog is currently open (controlled state).
 * onOpenChange - Callback function triggered when the dialog should toggle state.
 * size         - String specifying the dialog size variant. Defaults to 'md'.
 * className    - Additional CSS classes that can be appended to style the dialog container.
 * children     - ReactNode representing the content rendered within the dialog.
 **************************************************************************************************/
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: string;
  className?: string;
  children: React.ReactNode;
}

/***************************************************************************************************
 * Dialog Component
 * -----------------------------------------------------------------------------------------------
 * Main reusable dialog component. Utilizes Radix UI primitives for a fully accessible modal
 * experience and Framer Motion for overlay/content animations.
 *
 * Steps in the "render" process:
 *  1. Set up Radix Dialog root with the "open" controlled state and "onOpenChange" callback.
 *  2. Render an animated overlay using Framer Motion for smooth fade transitions.
 *  3. Handle click outside dismissal and escape key press via Radix's built-in features (focus trap,
 *     escape key handling, etc.).
 *  4. Implement the focus trap automatically provided by RadixDialog.Content.
 *  5. Apply the responsive size classes by merging the result of getDialogSize() with any custom
 *     className provided by the user.
 *  6. Render the children with ARIA attributes and ensure the container is labeled as a modal.
 **************************************************************************************************/
export function Dialog({
  open,
  onOpenChange,
  size = 'md',
  className,
  children,
}: DialogProps): JSX.Element {
  // Compute the required size classes based on the "size" prop
  const sizeClasses = getDialogSize(size);

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        {/* Use AnimatePresence for the overlay fade animation */}
        <AnimatePresence>
          {open && (
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                // Basic overlay styling to dim the background
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                // The overlay remains behind the content
                aria-hidden="true"
              />
            </RadixDialog.Overlay>
          )}
        </AnimatePresence>

        {/* Use AnimatePresence for the dialog content scaling/fade animation */}
        <AnimatePresence>
          {open && (
            <RadixDialog.Content asChild forceMount>
              <motion.div
                className={cn(
                  // Positioning the dialog content in the viewport center
                  'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                  // Dialog container background, rounding, shadow, and other UI details
                  'rounded-lg bg-white p-4 shadow-lg focus:outline-none',
                  // Inherit the computed size classes
                  sizeClasses,
                  // Enable user-provided classes if any
                  className
                )}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                // ARIA for a modal dialog
                aria-modal="true"
                // By default, Radix handles keyboard/focus events for us
              >
                {children}
              </motion.div>
            </RadixDialog.Content>
          )}
        </AnimatePresence>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/***************************************************************************************************
 * DialogTitleProps Interface
 * -----------------------------------------------------------------------------------------------
 * Defines the shape of the props accepted by the DialogTitle subcomponent.
 *
 * className - Any additional classes to customize the title styling.
 * children  - The title content, typically a string or React node.
 **************************************************************************************************/
export interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

/***************************************************************************************************
 * DialogTitle Component
 * -----------------------------------------------------------------------------------------------
 * Renders the dialog title with proper heading semantics and ARIA attributes. Leverages Radix
 * dialog primitives but allows custom styling while adhering to the design system typography for
 * headings.
 *
 * Steps in the "render" process:
 *  1. Apply design system typography styles for headings.
 *  2. Use <RadixDialog.Title> for proper ARIA labeling of modal titles.
 *  3. Merge user-supplied className if provided.
 *  4. Render the title content wrapped in accessible heading structures.
 **************************************************************************************************/
export function DialogTitle({ className, children }: DialogTitleProps): JSX.Element {
  return (
    <RadixDialog.Title
      // Combine design-system heading classes with user-supplied classes
      className={cn(
        'mb-2 text-xl font-semibold leading-tight text-slate-900',
        className
      )}
    >
      {children}
    </RadixDialog.Title>
  );
}

/***************************************************************************************************
 * DialogDescriptionProps Interface
 * -----------------------------------------------------------------------------------------------
 * Defines the shape of the props accepted by the DialogDescription subcomponent.
 *
 * className - Any additional classes to style the description text.
 * children  - The descriptive content for the dialog, typically a string or React node.
 **************************************************************************************************/
export interface DialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

/***************************************************************************************************
 * DialogDescription Component
 * -----------------------------------------------------------------------------------------------
 * Renders additional descriptive text for the dialog content, aiding in providing helpful details
 * or instructions to the user. Uses RadixDialog.Description for built-in ARIA labeling.
 *
 * Steps in the "render" process:
 *  1. Apply the design system text styles that ensure readable, accessible contrast.
 *  2. Use <RadixDialog.Description> so screen readers properly identify supplemental dialog info.
 *  3. Merge user-provided className with standard styling.
 *  4. Render the description or content within the designated area.
 **************************************************************************************************/
export function DialogDescription({
  className,
  children,
}: DialogDescriptionProps): JSX.Element {
  return (
    <RadixDialog.Description
      className={cn(
        'mb-4 text-sm text-slate-700',
        className
      )}
    >
      {children}
    </RadixDialog.Description>
  );
}

/***************************************************************************************************
 * Exported Named Members
 * -----------------------------------------------------------------------------------------------
 * We export the Dialog component (with its size functionality and open state management),
 * as well as the DialogTitle and DialogDescription subcomponents for structuring content
 * within the dialog.
 **************************************************************************************************/