import React, {
  FC,
  useCallback,
  useEffect,
  useState,
  MouseEvent,
  ReactNode
} from 'react';
// next/router ^14.0.0
import { useRouter } from 'next/router';
// react ^18.2.0
import { UserCircleIcon } from '@heroicons/react/24/outline'; // ^2.0.0
import Dropdown from '../ui/Dropdown';
import { useAuth } from '../../hooks/useAuth';
import { DASHBOARD_ROUTES } from '../../constants/routes';

interface UserMenuProps {}

/************************************************************************************************
 * UserMenu
 * ---------------------------------------------------------------------------------------------
 * A user menu dropdown component displayed in the application's navigation bar that:
 *   - Shows current user info (name/email) with fallback
 *   - Provides user-related actions: settings navigation, logout
 *   - Implements accessibility features (roles/ARIA)
 *   - Manages state for loading/error
 *   - Integrates with Supabase authentication
 *   - Offers responsive design
 ************************************************************************************************/
const UserMenu: FC<UserMenuProps> = () => {
  /************************************************************************************************
   * Properties (from JSON spec)
   *  - user:  User | null
   *  - router: NextRouter
   *  - isLoading: boolean
   *  - error: string | null
   ************************************************************************************************/
  const router = useRouter();
  const { user, logout } = useAuth();

  // Track loading state for operations like logout
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Track any error message encountered during operations
  const [error, setError] = useState<string | null>(null);

  /************************************************************************************************
   * handleLogout
   * ---------------------------------------------------------------------------------------------
   * Handles user logout with proper error handling and session cleanup
   * Steps:
   *  1. Set loading state to true
   *  2. Clear sensitive data from local storage
   *  3. Call logout function from useAuth hook
   *  4. Handle potential logout errors with retry logic
   *  5. Clear authentication tokens and session data
   *  6. Reset loading state to false
   *  7. Redirect to login page on successful logout
   *  8. Display error message if logout fails
   ************************************************************************************************/
  const handleLogout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Step 2: Clear sensitive data from localStorage
    // (In a real scenario, selectively clear tokens or keys)
    localStorage.clear();

    // Step 4: Attempting logout with simple retry logic
    let attempts = 0;
    let success = false;

    while (attempts < 2 && !success) {
      try {
        await logout();
        success = true;
      } catch (err) {
        attempts++;
        if (attempts >= 2) {
          setError('Logout failed. Please try again later.');
        }
      }
    }

    // Step 5: Clear additional tokens/session data if needed
    // (No additional tokens to clear in this basic example)

    setIsLoading(false);

    // Step 7 & 8: If success, redirect to login; otherwise show error
    if (success) {
      router.push('/auth/login');
    }
  }, [logout, router]);

  /************************************************************************************************
   * handleSettingsClick
   * ---------------------------------------------------------------------------------------------
   * Navigates to user settings page with proper state management
   * Steps:
   *  1. Close dropdown menu (relies on user clicking outside or role="menuitem" event)
   *  2. Use router to navigate to settings page
   *  3. Handle navigation errors gracefully
   *  4. Manage focus after navigation (can be expanded if needed)
   ************************************************************************************************/
  const handleSettingsClick = useCallback((): void => {
    setError(null);
    try {
      router.push(DASHBOARD_ROUTES.SETTINGS);
    } catch (navError) {
      setError('Failed to navigate to settings. Please try again.');
    }
  }, [router]);

  /************************************************************************************************
   * Render
   * ---------------------------------------------------------------------------------------------
   * Renders the accessible UserMenu dropdown:
   *  - Dropdown trigger with user info or fallback
   *  - Displays user name and email
   *  - Provides menu items: Settings, Logout
   *  - Applies ARIA roles for menu, items, and focus states
   *  - Handles loading and error display
   ************************************************************************************************/
  return (
    <div className="relative inline-block">
      <Dropdown
        label={
          user
            ? user.user_metadata?.full_name || user.email || 'User Menu'
            : 'User Menu'
        }
        position="bottom"
        size="md"
        disabled={isLoading}
        loading={isLoading}
        className="user-menu-dropdown"
      >
        {/* Display user icon, name, and email with fallback */}
        <div className="px-4 py-2 text-sm text-gray-600" role="none">
          <div className="flex items-center space-x-2">
            <UserCircleIcon
              className="h-6 w-6 text-gray-400"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold text-gray-800">
                {user?.user_metadata?.full_name ?? 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email ?? 'No Email'}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 my-1" role="none" />

        {/* Menu items with keyboard navigation support */}
        <div
          role="menuitem"
          className="px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer"
          onClick={handleSettingsClick}
        >
          Settings
        </div>
        <div
          role="menuitem"
          className="px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer"
          onClick={handleLogout}
        >
          Logout
        </div>
      </Dropdown>

      {/* Error display */}
      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default UserMenu;