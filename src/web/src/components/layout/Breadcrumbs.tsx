import * as React from "react";

/****************************************************************
 * External Imports
 ****************************************************************/
// next/link ^14.0.0
import Link from "next/link";
// next/navigation ^14.0.0
import { usePathname } from "next/navigation";
// lucide-react ^0.292.0
import { ChevronRight } from "lucide-react";

/****************************************************************
 * Internal Imports
 ****************************************************************/
import { cn } from "../../lib/utils";
import { DASHBOARD_ROUTES } from "../../constants/routes";

/****************************************************************
 * Type Declarations
 ****************************************************************/
interface BreadcrumbItem {
  /**
   * The text displayed to the user for this particular breadcrumb segment.
   */
  label: string;

  /**
   * The navigable link (href) associated with this breadcrumb segment.
   */
  href: string;

  /**
   * Flag indicating whether this breadcrumb segment is the current page.
   * Used for ARIA attributes to enhance accessibility.
   */
  current: boolean;
}

interface BreadcrumbsProps {
  /**
   * Optional CSS class name to customize styling.
   */
  className?: string;
}

/****************************************************************
 * generateBreadcrumbs
 * ----------------------------------------------------------------
 * Generates breadcrumb items from the provided pathname. Implements
 * enhanced handling for dynamic route segments (e.g., [id]) and
 * produces user-friendly labels with proper casing. Appends a
 * "Home" link at the start for context.
 *
 * Steps:
 *  1. Always add a "Home" breadcrumb linking to DASHBOARD_ROUTES.HOME.
 *  2. Split the pathname by '/' to extract route segments.
 *  3. Filter out empty segments and strip query parameters if any.
 *  4. Handle dynamic segments (those that start with '[' and end with ']')
 *     by removing brackets and adjusting the label to Title Case.
 *  5. Convert normal segments to Title Case for improved readability,
 *     replacing dashes with spaces if present.
 *  6. Construct cumulative href paths for each segment, so each
 *     breadcrumb is a valid link to that portion of the route.
 *  7. Mark the last generated segment as current to satisfy ARIA usage.
 *  8. Return an array of breadcrumb items.
 ****************************************************************/
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Step 1: Initialize the breadcrumb array with a home route item
  const baseBreadcrumbs: BreadcrumbItem[] = [
    {
      label: "Home",
      href: DASHBOARD_ROUTES.HOME,
      current: false,
    },
  ];

  // Step 2: Split pathname on '/' to get segments
  // Example: "/leads/[id]/edit" => ["", "leads", "[id]", "edit"]
  const rawSegments = pathname.split("/");

  // An accumulator for building up the 'href' path
  let cumulativePath = "";

  // We will store the final breadcrumb items here
  const derivedBreadcrumbs: BreadcrumbItem[] = [];

  // Step 3: Iterate over each segment, ignoring empty or query-part segments
  for (let i = 0; i < rawSegments.length; i += 1) {
    const segment = rawSegments[i].split("?")[0].trim();

    // Filter out any empty or undefined segment
    if (!segment) {
      continue;
    }

    // Build up the route piece to get a valid link for the breadcrumb
    cumulativePath += `/${segment}`;

    // Step 4: Check if segment is a dynamic route => e.g., "[id]"
    let isDynamic = false;
    if (segment.startsWith("[") && segment.endsWith("]")) {
      isDynamic = true;
    }

    // Step 5: Convert the segment to a human-readable label
    let label = segment;

    if (isDynamic) {
      // Remove surrounding brackets
      label = segment.replace("[", "").replace("]", "");
      // Convert to Title Case for user-friendly labeling
      label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    } else {
      // Replace any dashes with spaces, then title-case the result
      const spaced = label.replace(/-/g, " ");
      label =
        spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
    }

    // Step 6: Construct the breadcrumb item
    derivedBreadcrumbs.push({
      label,
      href: cumulativePath,
      current: false, // will adjust the last item after loop
    });
  }

  // Step 7: Mark the last derived breadcrumb segment as current if any exist
  if (derivedBreadcrumbs.length > 0) {
    derivedBreadcrumbs[derivedBreadcrumbs.length - 1].current = true;
  }

  // Combine the base breadcrumbs array with the derived array
  return [...baseBreadcrumbs, ...derivedBreadcrumbs];
}

/****************************************************************
 * Breadcrumbs (Accessible Navigation Component)
 * ----------------------------------------------------------------
 * A React component that renders a breadcrumb trail based on
 * the current route. Under the hood, it retrieves the pathname
 * from Next.js, processes it, and generates a series of linkable
 * segments where the final item is marked as current.
 *
 * Constructor-Like Steps (in a functional approach):
 *  1. Accept optional className prop.
 *  2. Retrieve current pathname using usePathname() from next/navigation.
 *  3. Build breadcrumb items using generateBreadcrumbs(pathname).
 *  4. Apply styling, accessibility roles, and ARIA labels.
 *
 * Render Steps:
 *  1. Wrap breadcrumb items with a <nav role="navigation" aria-label="Breadcrumb">.
 *  2. Present each segment as an accessible <Link> or text for the current item.
 *  3. Insert separator icons (ChevronRight) between segments.
 *  4. Provide hover/focus styles for improved user experience.
 *  5. Include keyboard navigation and screen reader support via appropriate tags.
 *  6. Return the final navigation element.
 ****************************************************************/
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className }) => {
  // Step 2: Get the current pathname from Next.js
  const pathname = usePathname();

  // Step 3: Generate breadcrumb segments from the current route
  const breadcrumbs = React.useMemo(() => {
    if (!pathname) return [];
    return generateBreadcrumbs(pathname);
  }, [pathname]);

  // Step 4: Combine any custom class name with default styling
  const containerClass = cn(
    "flex items-center text-sm text-muted-foreground space-x-1",
    className
  );

  // Return Steps: Render an accessible breadcrumb trail
  return (
    <nav
      className={containerClass}
      aria-label="Breadcrumb"
      role="navigation"
    >
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={item.href + item.label}>
            {/* Breadcrumb Item */}
            {!item.current && !isLast ? (
              <Link
                href={item.href}
                className={cn(
                  "hover:underline focus:underline focus:outline-none",
                  "transition-colors duration-150"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
              </Link>
            ) : (
              // For the current segment, render text instead of a link
              <span
                className={cn(
                  "font-medium",
                  item.current && "text-primary",
                  "focus:outline-none"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
            {/* Separator Icon Except for the Last Segment */}
            {!isLast && (
              <ChevronRight
                className="mx-1 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

/**
 * The default export representing the fully accessible breadcrumb
 * navigation component for displaying page hierarchy.
 */
export default Breadcrumbs;