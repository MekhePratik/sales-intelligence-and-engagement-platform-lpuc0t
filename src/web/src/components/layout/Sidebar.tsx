import React, {
  useState,
  useEffect,
  useCallback,
  FC,
  KeyboardEvent,
  MouseEvent,
  AriaAttributes
} from 'react' // react ^18.2.0
import Link from 'next/link' // next/link ^14.0.0
import { usePathname } from 'next/navigation' // next/navigation ^14.0.0

// Internal Imports (IE1):
import { cn } from '../../lib/utils'
import Button from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { DASHBOARD_ROUTES } from '../../constants/routes'

//-------------------------------------------------------------------------------------------------
// 1. Type Definitions and Interfaces
//    We define a dedicated props interface for the Sidebar component, including:
//    - isCollapsed: Whether the sidebar is currently collapsed
//    - onToggle: A callback when toggling the collapse state
//    - isMobile: Indicates if the sidebar is rendered in a mobile context
//-------------------------------------------------------------------------------------------------
interface SidebarProps {
  /**
   * Controls whether the sidebar is in a collapsed state.
   * Used to conditionally render narrower navigation or icons only.
   */
  isCollapsed: boolean

  /**
   * Callback function triggered when the sidebar collapse state is toggled.
   */
  onToggle: () => void

  /**
   * Indicates if we are running in a mobile layout context.
   * Used to manage responsive design breakpoints and distinct styling or behavior.
   */
  isMobile: boolean
}

/**
 * NavigationItem defines each entry in the sidebar navigation,
 * including the icon, label, route, roles, and an optional tooltip.
 */
interface NavigationItem {
  label: string
  route: string
  icon: JSX.Element
  roles: string[]
  tooltip?: string
}

//-------------------------------------------------------------------------------------------------
// 2. Enhanced Route Matching Function (isActiveRoute)
//    Matches current pathname with a target route, handling:
//    - Exact route match
//    - Nested route detection (e.g., /leads/123 matches /leads)
//    - Potential normalization of trailing slashes
//    - Optionally ignoring query parameters
//-------------------------------------------------------------------------------------------------
/**
 * Determines if a given route is active based on the current pathname.
 * 1. Normalize both pathname and route by removing trailing slashes (except root).
 * 2. Check for exact matches.
 * 3. Check nested scenarios (pathname starts with route + '/').
 * 4. Return boolean result.
 *
 * @param pathname - Current location pathname from Next.js routing.
 * @param route    - The route to evaluate for active status.
 * @returns true if the route is active; otherwise false.
 */
function isActiveRoute(pathname: string, route: string): boolean {
  // Step 1: Normalize trailing slashes (except for root "/")
  const normalize = (val: string) => {
    if (!val) return ''
    if (val.length > 1 && val.endsWith('/')) {
      return val.slice(0, -1)
    }
    return val
  }

  const normalizedPathname = normalize(pathname)
  const normalizedRoute = normalize(route)

  // If route is root "/" and normalized route is empty, set it back to "/"
  const finalRoute = normalizedRoute === '' ? '/' : normalizedRoute
  const finalPath = normalizedPathname === '' ? '/' : normalizedPathname

  // Step 2: Exact match
  if (finalPath === finalRoute) {
    return true
  }

  // Step 3: Nested route detection
  // e.g., if finalPath starts with finalRoute + "/"
  if (finalPath.startsWith(`${finalRoute}/`)) {
    return true
  }

  // Step 4: Return false if neither exact match nor nested route
  return false
}

//-------------------------------------------------------------------------------------------------
// 3. Sidebar Component
//    A responsive sidebar that provides primary navigation for the
//    B2B sales intelligence platform. Includes:
//    - Collapsibility with onToggle
//    - Role-based item visibility via useAuth (RBAC checks)
//    - Active route highlighting
//    - Accessibility features (ARIA attributes, keyboard navigation)
//    - Organized, production-ready styling and structure
//-------------------------------------------------------------------------------------------------

/**
 * Sidebar
 * Principal layout component for the B2B Sales Intelligence platform's main navigation.
 * Implements collapsible navigation, role-based filtering, and active state tracking.
 *
 * Props:
 *  - isCollapsed: boolean - controls the toggled state of the sidebar
 *  - onToggle: () => void - callback for toggling sidebar collapse
 *  - isMobile: boolean - indicates if the sidebar is rendered for mobile views
 *
 * Internal Behavior:
 *  - Maintains a curated navigation list with roles ensuring items are shown for authorized users
 *  - Uses next/navigation usePathname to highlight the active route
 *  - Provides optional tooltips when collapsed, employing ARIA attributes for accessibility
 *  - Mobilizes a button or icon for toggling if in mobile mode
 */
export const Sidebar: FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  isMobile
}) => {
  //----------------------------------------------------------------------------
  // 3.1 Auth and Role-Based Access
  //    We retrieve the current user from useAuth along with a checkPermission
  //    function for advanced filtering. For demonstration here, we'll also
  //    rely on roles in user metadata if available. If user is null, no items
  //    are shown (unless a public route is optionally included).
  //----------------------------------------------------------------------------
  const { user, checkPermission } = useAuth()

  //----------------------------------------------------------------------------
  // 3.2 Active Pathname
  //    We get the current pathname from next/navigation. This allows us
  //    to determine which route is active and style it accordingly.
  //----------------------------------------------------------------------------
  const pathname = usePathname()

  //----------------------------------------------------------------------------
  // 3.3 Transition and Breakpoints
  //    We define the transition duration for collapse/expand animations
  //    and a set of breakpoints for reference if we need to handle advanced
  //    responsiveness. The specification demands we store these in the
  //    component, mimicking the 'constructor' logic of configuring them.
  //----------------------------------------------------------------------------
  const transitionDuration = 300 // ms
  const breakpoints: Record<string, number> = {
    mobile: 640,
    tablet: 768,
    desktop: 1024
    // could extend to 'widescreen' or '4k' as needed
  }

  //----------------------------------------------------------------------------
  // 3.4 Define Navigation Items
  //    The JSON specification references the usage of 'DASHBOARD_ROUTES' keys:
  //    HOME, LEADS, CAMPAIGNS, SEQUENCES, ANALYTICS, SETTINGS.
  //    We combine them with roles. Here, we define icons as inline SVG placeholders.
  //    Real icons in production might be from a design system or library.
  //----------------------------------------------------------------------------
  const navigationItems: NavigationItem[] = [
    {
      label: 'Home',
      route: DASHBOARD_ROUTES.HOME,
      icon: (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 9.24L12 2l9 7.24V20a2 2 0 01-2 2h-5v-7H10v7H5a2 2 0 01-2-2V9.24z" />
        </svg>
      ),
      roles: ['USER', 'MANAGER', 'ADMIN'],
      tooltip: 'Go to Dashboard'
    },
    {
      label: 'Leads',
      route: DASHBOARD_ROUTES.LEADS,
      icon: (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M15 14c1.66 0 2.99-1.34 2.99-3S16.66 8 15 8 12 9.34 12 11s1.34 3 3 3zM5 8v10h14V8H5zm10 6H9v-2h6v2z" />
        </svg>
      ),
      roles: ['MANAGER', 'ADMIN'],
      tooltip: 'Manage Leads'
    },
    {
      label: 'Campaigns',
      route: DASHBOARD_ROUTES.CAMPAIGNS,
      icon: (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M21 3H3v18h18V3zm-2 16H5V5h14v14zM7 7h10v2H7z" />
        </svg>
      ),
      roles: ['MANAGER', 'ADMIN'],
      tooltip: 'Marketing Campaigns'
    },
    {
      label: 'Sequences',
      route: DASHBOARD_ROUTES.SEQUENCES,
      icon: (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4 10h4v2H4v-2zm0 4h6v2H4v-2zm0-8h8v2H4V6zm10 0h6v2h-6V6zm6 4h-4v2h4v-2zm-2 4h2v2h-2v-2z" />
        </svg>
      ),
      roles: ['MANAGER', 'ADMIN'],
      tooltip: 'Automated Sequences'
    },
    {
      label: 'Analytics',
      route: DASHBOARD_ROUTES.ANALYTICS,
      icon: (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 18h2v-8H3v8zM8 18h2V5H8v13zm5 0h2v-5h-2v5zm5 0h2V8h-2v10z" />
        </svg>
      ),
      roles: ['MANAGER', 'ADMIN'],
      tooltip: 'Analytics Dashboard'
    },
    {
      label: 'Settings',
      route: DASHBOARD_ROUTES.SETTINGS,
      icon: (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19.43 12.98l1.02-.85a2 2 0 000-2.26l-1.02-.84c.02-.21.03-.42.03-.63s-.01-.42-.03-.63l1.02-.84a2 2 0 000-2.26l-1.02-.85a8.97 8.97 0 00-1.45-1.59l.29-1.16a2 2 0 00-1.97-2.45h-1.7a2 2 0 00-1.97 1.55l-.29 1.16a8.83 8.83 0 00-1.84 0l-.29-1.16A2 2 0 008.7 2h-1.7a2 2 0 00-1.97 2.45l.29 1.16c-.53.46-1.02.98-1.45 1.59l-1.02.85a2 2 0 000 2.26l1.02.84c-.02.21-.03.42-.03.63s.01.42.03.63l-1.02.84a2 2 0 000 2.26l1.02.85c.43.61.92 1.13 1.45 1.59l-.29 1.16A2 2 0 007 22h1.7a2 2 0 001.97-1.55l.29-1.16c.6-.06 1.21-.06 1.84 0l.29 1.16A2 2 0 0014.3 22h1.7a2 2 0 001.97-2.45l-.29-1.16c.53-.46 1.02-.98 1.45-1.59zM12 15.6A3.6 3.6 0 018.4 12 3.6 3.6 0 0112 8.4 3.6 3.6 0 0115.6 12 3.6 3.6 0 0112 15.6z" />
        </svg>
      ),
      roles: ['USER', 'MANAGER', 'ADMIN'],
      tooltip: 'User Settings'
    }
  ]

  //----------------------------------------------------------------------------
  // 3.5 Render Navigation Items
  //    This function handles role-based filtering, ARIA attributes,
  //    tab navigation, collapse/expand styling, and active state.
  //----------------------------------------------------------------------------
  const renderNavigationItems = useCallback((): JSX.Element[] => {
    // If user is null, the platform might hide everything or handle public routes differently.
    // Here, we simply skip if user is absent. Adjust as needed for public route policy.
    if (!user) {
      return []
    }

    // We can store user role from user metadata or rely on checkPermission calls.
    const userRole = (user.user_metadata?.role as string) || 'USER'

    return navigationItems
      .filter((item) => {
        // Filter by item.roles: user must have one of these roles
        if (!item.roles.includes(userRole)) {
          return false
        }
        // Example of an additional check using checkPermission if desired:
        // if some items require special permission, we do:
        // if (!checkPermission('SOME_PERMISSION_KEY')) return false
        // For now, we skip advanced permission checks unless needed.
        return true
      })
      .map((item, idx) => {
        const active = isActiveRoute(pathname, item.route)
        // Collapsed tooltip can be displayed with an aria-label
        const itemLabel = item.tooltip || item.label

        // ARIA sets aria-current="page" if active
        const ariaCurrent: AriaAttributes['aria-current'] = active
          ? 'page'
          : undefined

        // Manage classes for collapsed vs. expanded states
        // We also highlight active items with distinct styles
        const linkClasses = cn(
          'group flex items-center rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
          active
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
          isCollapsed ? 'justify-center' : 'justify-start'
        )

        return (
          <li key={`sidebar-item-${idx}`} className="mb-1">
            <Link
              href={item.route}
              aria-current={ariaCurrent}
              aria-label={isCollapsed ? itemLabel : undefined}
              className={linkClasses}
              // Keyboard Accessibility: Ensure tab focus
              tabIndex={0}
            >
              {/* Icon */}
              <span className="inline-flex items-center">
                {item.icon}
              </span>
              {/* Label: conditionally hide if collapsed */}
              {!isCollapsed && (
                <span className="ml-2">{item.label}</span>
              )}
            </Link>
          </li>
        )
      })
  }, [user, pathname, isCollapsed, checkPermission, navigationItems])

  //----------------------------------------------------------------------------
  // 3.6 Render Toggle
  //    A button or control to invoke onToggle. If mobile, might differ in style.
  //----------------------------------------------------------------------------
  const renderToggleControl = (): JSX.Element => {
    // Example accessible label. We'll also place an icon inside the button.
    const ariaLabel = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'

    return (
      <div className="p-2 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault()
            onToggle()
          }}
          ariaLabel={ariaLabel}
        >
          {/* Simple toggling icon, could be replaced with a real icon set */}
          {isCollapsed ? (
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M12.293 9.293a1 1 0 010 1.414L9.414 13.586a1 1 0 01-1.414-1.414L10.172 10 8 7.828a1 1 0 011.414-1.414l2.879 2.879z" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M7.707 14.707a1 1 0 01-1.414 0L3.586 12l2.707-2.707a1 1 0 111.414 1.414L6.414 11h7.172l-1.293-1.293a1 1 0 111.414-1.414L16.414 11l-2.707 2.707a1 1 0 01-1.414 0L12 12.414V16a1 1 0 11-2 0v-3.586l-2.293 2.293z" />
            </svg>
          )}
        </Button>
      </div>
    )
  }

  //----------------------------------------------------------------------------
  // 3.7 Lifecycle / Effects
  //    If desired, we can set up a side effect to handle screen resizing or
  //    additional event listeners for isMobile. The specification alludes to
  //    "event listeners for mobile" in the constructor. Here, we demonstrate
  //    a basic effect that logs or handles changes to isMobile or breakpoints.
  //----------------------------------------------------------------------------
  useEffect(() => {
    // In production, we might handle more complex logic here,
    // such as adding 'resize' listeners or controlling an overlay in mobile mode.
    // This is left as an example placeholder.
  }, [isMobile, breakpoints])

  //----------------------------------------------------------------------------
  // 3.8 Render
  //    We build the final sidebar layout, including:
  //    - A top area that may hold brand/logo or toggle button
  //    - Nav items list
  //    - Accessibility/ARIA attributes
  //----------------------------------------------------------------------------
  return (
    <nav
      // Use absolute or fixed positioning in mobile contexts if desired
      className={cn(
        'h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out',
        {
          'w-16': isCollapsed,
          'w-64': !isCollapsed,
          'fixed z-50': isMobile
        }
      )}
      style={{ transitionDuration: `${transitionDuration}ms` }}
      aria-label="Sidebar Main Navigation"
    >
      {/* Example top section with a brand or toggle. */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        {/* If not collapsed, show a brand placeholder (could be a logo). */}
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <span className="text-xl font-semibold text-blue-700 dark:text-blue-300">
              B2B Sales
            </span>
          </div>
        )}
        {/* Always show toggle button (mobile or desktop). */}
        {renderToggleControl()}
      </div>

      {/* Scrollable navigation area. */}
      <ul className="mt-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {renderNavigationItems()}
      </ul>

      {/* Example bottom area - could display a user profile or logout button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        {/* Reserved for future enhancements (profile, version info, etc.) */}
      </div>
    </nav>
  )
}

//-------------------------------------------------------------------------------------------------
// 4. Export
//    As per the JSON specification, we export the Sidebar with all members exposed.
//    This is the main default or named export from this file.
//
//    The specification states: "export const Sidebar" with type React.FC<SidebarProps>,
//    so we comply with that. No supplemental text is included.
//
//-------------------------------------------------------------------------------------------------
export default Sidebar