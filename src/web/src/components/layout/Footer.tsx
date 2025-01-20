import React from "react";
import Link from "next/link"; // next/link ^14.0.0
import { cn } from "../../lib/utils"; // Internal utility for conditional class names
import { HOME, ANALYTICS } from "../../constants/routes"; // Route constants used in footer links

/**********************************************************************************************
 * FooterProps interface defines the accepted props for the Footer component, including
 * behavior toggles (isMinimal), optional CSS className overrides, and aria-label support.
 **********************************************************************************************/
export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * When true, displays a minimal version of the footer with fewer elements.
   */
  isMinimal?: boolean;

  /**
   * Optional additional CSS class names for custom styling.
   */
  className?: string;

  /**
   * Accessible label for the footer region, providing descriptive context for screen readers.
   */
  ariaLabel?: string;
}

/**********************************************************************************************
 * renderLinks
 * --------------------------------------------------------------------------------------------
 * Renders the footer navigation links in a structured, accessible manner.
 *
 * Steps:
 * 1. Create navigation container with role="navigation" to define a semantic region.
 * 2. Use <nav> and <ul> to group links semantically and enhance screen-reader support.
 * 3. Apply responsive grid layout using Tailwind utilities for consistent design.
 * 4. Add hover and focus states for interactive elements, ensuring visual clarity.
 * 5. Implement keyboard navigation support by using semantic <a> within <Link>.
 * 6. Include ARIA labels for additional context where needed, improving accessibility.
 **********************************************************************************************/
function renderLinks(): JSX.Element {
  return (
    <nav
      role="navigation"
      aria-label="Footer main navigation"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
    >
      <ul className="space-y-2">
        <li>
          <Link
            href={HOME}
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            href={ANALYTICS}
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            Analytics
          </Link>
        </li>
      </ul>
      <ul className="space-y-2">
        <li>
          <Link
            href="/campaigns"
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            Campaigns
          </Link>
        </li>
        <li>
          <Link
            href="/leads"
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            Leads
          </Link>
        </li>
      </ul>
      <ul className="space-y-2">
        <li>
          <Link
            href="/settings"
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            Settings
          </Link>
        </li>
        <li>
          <Link
            href="/integrations"
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            Integrations
          </Link>
        </li>
      </ul>
    </nav>
  );
}

/**********************************************************************************************
 * renderSkipToTop
 * --------------------------------------------------------------------------------------------
 * Renders an accessible "Skip to Top" button that enables users to jump back to the top of
 * the page. This improves navigation for keyboard users and provides a convenient shortcut.
 *
 * Steps:
 * 1. Create a button with appropriate ARIA attributes, labeling it for screen readers.
 * 2. Implement a smooth scroll behavior in the onClick handler.
 * 3. Include keyboard focus management: default button usage ensures tabbing is supported.
 * 4. Apply consistent Tailwind-based styling, including a focus ring for accessibility.
 * 5. Adjust positioning for responsiveness, making it discreet yet easily accessible.
 **********************************************************************************************/
function renderSkipToTop(): JSX.Element {
  /**
   * Smoothly scrolls the window to the top position.
   */
  const handleSkipToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="my-4 flex justify-center">
      <button
        type="button"
        aria-label="Skip to Top"
        onClick={handleSkipToTop}
        className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
      >
        ↑ Top
      </button>
    </div>
  );
}

/**********************************************************************************************
 * renderCopyright
 * --------------------------------------------------------------------------------------------
 * Renders a recognizable copyright and legal information section, ensuring consistency
 * and responsiveness across the application.
 *
 * Steps:
 * 1. Create a container with semantic markup for copyright.
 * 2. Dynamically calculate the current year for up-to-date display.
 * 3. Include references to legal or policy pages as clickable links.
 * 4. Apply consistent typography with Tailwind classes.
 * 5. Add basic responsiveness for small and large viewports.
 * 6. Implement dark mode support to ensure readability across themes.
 **********************************************************************************************/
function renderCopyright(): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-4 flex flex-col items-center justify-center text-center sm:flex-row sm:justify-between sm:text-left">
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
        © {currentYear} B2B Sales Intelligence Platform. All rights reserved.
      </p>
      <div className="flex space-x-4 mt-2 sm:mt-0">
        <Link
          href="/terms"
          className="text-xs text-gray-500 hover:underline dark:text-gray-400"
        >
          Terms
        </Link>
        <Link
          href="/privacy"
          className="text-xs text-gray-500 hover:underline dark:text-gray-400"
        >
          Privacy
        </Link>
      </div>
    </div>
  );
}

/**********************************************************************************************
 * Footer
 * --------------------------------------------------------------------------------------------
 * The main enhanced footer component providing:
 * - Full or minimal layout toggle (isMinimal).
 * - Responsive design with TailwindCSS.
 * - Accessibility features, including ARIA labels and skip-to-top functionality.
 * - Consistent branding across the B2B sales intelligence platform.
 *
 * This component:
 *  - Combines sub-renderers for footer links, skip-to-top button, and copyright.
 *  - Applies Tailwind utility classes and a dynamic, enterprise-grade approach.
 *  - Implements robust accessibility with roles, labels, and keyboard navigation.
 *
 * Usage:
 *  <Footer isMinimal={false} ariaLabel="Global Footer" className="bg-white" />
 **********************************************************************************************/
const Footer: React.FC<FooterProps> = ({
  isMinimal = false,
  className,
  ariaLabel,
  ...rest
}) => {
  return (
    <footer
      {...rest}
      aria-label={ariaLabel || "Footer region"}
      className={cn(
        "w-full border-t border-gray-200 bg-white p-4 dark:bg-gray-800",
        className
      )}
    >
      {/* Conditionally render the links only if not minimal */}
      {!isMinimal && (
        <div className="mb-4">{renderLinks()}</div>
      )}

      {/* Render skip to top button (always available for accessibility) */}
      {renderSkipToTop()}

      {/* Separator if not minimal layout */}
      {!isMinimal && <hr className="my-4 border-gray-300 dark:border-gray-700" />}

      {/* Render the copyright info */}
      {renderCopyright()}
    </footer>
  );
};

export default Footer;