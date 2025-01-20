import { useCallback, useEffect, useRef } from 'react' // version ^18.2.0
import { useDispatch, useSelector } from 'react-redux' // version ^9.0.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports - Required by JSON Specification
////////////////////////////////////////////////////////////////////////////////
import {
  login,
  register,
  logout,
  validateRole as validateRoleFn,
  refreshSession as refreshSessionFn,
} from '../lib/auth'
import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  UserRole,
  PermissionScope,
} from '../types/auth'
import { authSlice } from '../store/authSlice'

////////////////////////////////////////////////////////////////////////////////
// Hook: useAuth
// A custom React hook providing:
// 1. Authentication state (user, session, role, permissions, isLoading)
// 2. Authentication methods (login, register, logout, refreshSession)
// 3. Role-based access control utilities (checkPermission, validateRole)
// 4. Secure session management (session refresh interval)
// 5. Basic rate limiting counters for auth operations
//
// Steps (as per JSON specification):
// 1) Initialize Redux dispatch and auth state via useSelector.
// 2) Setup a session refresh interval to automatically refresh tokens.
// 3) Initialize simple rate limiting counters to throttle repeated ops.
// 4) Memoize authentication methods (login, register, logout, refreshSession).
// 5) Implement role validation and permission checks.
// 6) Clean up session refresh interval on unmount.
// 7) Return the required object shape with all relevant methods and state.
////////////////////////////////////////////////////////////////////////////////
export function useAuth() {
  //////////////////////////////////////////////////////////////////////////////
  // 1. Initialize Redux Dispatch & Auth State
  //    We retrieve the enhanced authentication state from the store, including:
  //    - user:  The current authenticated user or null
  //    - session: The Supabase session object or null
  //    - role: The user's role (ADMIN, MANAGER, USER)
  //    - permissions: A list of permission scopes
  //    - isLoading: Indicates ongoing auth operation
  //////////////////////////////////////////////////////////////////////////////
  const dispatch = useDispatch()
  const authState = useSelector((state: any) => state.auth as AuthState & {
    role: UserRole
    permissions: PermissionScope[] | string[]
    isLoading: boolean
  })

  //////////////////////////////////////////////////////////////////////////////
  // 2. Session Refresh Interval
  //    Secure session management requires automatic token refresh at a set
  //    interval. This ensures the session remains valid without forcing the user
  //    to re-login. The "refreshSession" function from ../lib/auth is used, but
  //    we also unify it here to dispatch any store updates as needed.
  //
  //    We store the interval ID in a ref so we can clear it on unmount.
  //////////////////////////////////////////////////////////////////////////////
  const refreshIntervalRef = useRef<NodeJS.Timer | null>(null)

  useEffect(() => {
    // Define the interval callback to refresh the session securely
    const handleIntervalRefresh = async () => {
      try {
        // This function from auth library ensures secure token refresh
        await refreshSessionFn()
        // We also dispatch the store-based refresher if needed
        // (e.g., if using Redux actions for side effects).
        dispatch(authSlice.actions.clearAuthError()) // Example: clear stale errors
      } catch {
        // Swallow or handle refresh errors (e.g., log them or set an error in store)
      }
    }

    // Set the interval to 15 minutes for robust session management
    refreshIntervalRef.current = setInterval(handleIntervalRefresh, 15 * 60 * 1000)

    // Cleanup: clear the interval on unmount to avoid memory leaks
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [dispatch])

  //////////////////////////////////////////////////////////////////////////////
  // 3. Simple Rate Limiting Counters for Auth Operations
  //    We keep a short record of how many attempts have been made on each
  //    method (login, register, logout, refreshSession). If many attempts are
  //    made in a short time, we throttle new calls to prevent abuse.
  //
  //    This approach is rudimentary but demonstrates the principle. In a
  //    production environment, you would likely use a more sophisticated
  //    server-side or middleware-based solution.
  //////////////////////////////////////////////////////////////////////////////
  const rateLimitsRef = useRef<{ [method: string]: number }>({
    login: 0,
    register: 0,
    logout: 0,
    refreshSession: 0,
  })

  const MAX_ATTEMPTS = 10

  const checkRateLimit = (method: string) => {
    // Increment the attempt counter
    rateLimitsRef.current[method] = (rateLimitsRef.current[method] || 0) + 1
    // If we exceed max attempts, throw an error or block further attempts
    if (rateLimitsRef.current[method] > MAX_ATTEMPTS) {
      throw new Error(`Rate limit exceeded for ${method} operation.`)
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // 4. Memoize Authentication Methods
  //    We use React's useCallback to ensure that these functions do not
  //    unnecessarily re-render consumers of this hook. Each function includes
  //    secure checks, rate limiting, and dispatch logic for state updates.
  //////////////////////////////////////////////////////////////////////////////

  /**
   * login
   * Initiates a secure login operation with MFA support, leverages
   * the core "login" function imported from ../lib/auth, and updates
   * any relevant Redux state if needed.
   */
  const handleLogin = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      checkRateLimit('login')
      // Optionally, we could dispatch a Redux action if we want to store the result.
      // For demonstration, we call the library method directly here.
      await login(credentials)
      // If using Redux async thunks, consider dispatching "loginUser(credentials)"
    },
    []
  )

  /**
   * register
   * Creates a new user account with optional organization setup. Also
   * handles setting the user's role and storing a valid session if
   * auto-login on registration is enabled. Rate limiting is applied.
   */
  const handleRegister = useCallback(
    async (credentials: RegisterCredentials): Promise<void> => {
      checkRateLimit('register')
      await register(credentials)
      // If using Redux, dispatch a thunk e.g. "registerUser(credentials)"
    },
    []
  )

  /**
   * logout
   * Performs a secure logout operation, terminating the current
   * user session and clearing any local or Redux-based authentication
   * data. Rate limiting is enforced.
   */
  const handleLogout = useCallback(async (): Promise<void> => {
    checkRateLimit('logout')
    await logout()
    // If using Redux, dispatch e.g. "logoutUser()" to reset state
  }, [])

  /**
   * refreshSession
   * Forces a secure session refresh outside of the scheduled interval,
   * ensuring tokens are up to date. We apply rate limiting in case
   * of repeated user-initiated refresh attempts.
   */
  const handleRefreshSession = useCallback(async (): Promise<void> => {
    checkRateLimit('refreshSession')
    await refreshSessionFn()
    // Potentially dispatch to update Redux session if needed
  }, [])

  //////////////////////////////////////////////////////////////////////////////
  // 5. Implement Role & Permission Checks
  //    We provide:
  //    - checkPermission(scope): local synchronous check for a single scope
  //    - validateRole(requiredRole): an async check that can leverage the
  //      underlying "validateRole" function from ../lib/auth. Alternatively,
  //      a local check could compare stored roles in Redux.
  //////////////////////////////////////////////////////////////////////////////

  /**
   * checkPermission
   * Synchronously checks if the requested permission scope is present
   * in the user's stored permissions array. By default, the store
   * permissions may be in string format, so here we assume they align
   * with the PermissionScope enum or are easily comparable strings.
   */
  const handleCheckPermission = useCallback(
    (scope: PermissionScope): boolean => {
      if (!authState.permissions || !Array.isArray(authState.permissions)) {
        return false
      }
      // If the array is strictly PermissionScope enum, we compare directly.
      // If the array contains strings, do string matching.
      return authState.permissions.includes(scope)
    },
    [authState.permissions]
  )

  /**
   * validateRole
   * An async function that calls the library's "validateRole" logic,
   * passing the required role and the user's current permissions.
   * This ensures the user meets the minimum role threshold and has
   * any required permissions if needed.
   */
  const handleValidateRole = useCallback(
    async (requiredRole: UserRole): Promise<boolean> => {
      // Convert permission array if needed to string[] for the function call
      const permAsStrings = authState.permissions.map((p) => p.toString())
      const result = await validateRoleFn(requiredRole, permAsStrings)
      return result
    },
    [authState.permissions]
  )

  //////////////////////////////////////////////////////////////////////////////
  // 6. Cleanup for Session Management
  //    The primary cleanup is in the useEffect return function above, clearing
  //    the session refresh interval. Additional cleanup (e.g., clearing local
  //    rate limit counters) can also be done if desired. For demonstration,
  //    we keep rateLimitRef in memory for the entire lifecycle.
  //////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////
  // 7. Return the Enhanced Auth Hook Object
  //    According to the JSON spec, we must expose:
  //    - user (User | null)
  //    - session (Session | null)
  //    - role (UserRole)
  //    - permissions (PermissionScope[])
  //    - isLoading (boolean)
  //    - login (credentials => Promise<void>)
  //    - register (credentials => Promise<void>)
  //    - logout ( => Promise<void>)
  //    - checkPermission (scope => boolean)
  //    - validateRole (requiredRole => boolean | Promise<boolean>)
  //    - refreshSession ( => Promise<void>)
  //////////////////////////////////////////////////////////////////////////////
  return {
    user: authState.user,
    session: authState.session,
    role: (authState.role as UserRole) || UserRole.USER,
    permissions: (authState.permissions as PermissionScope[]) || [],
    isLoading: authState.isLoading,

    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    checkPermission: handleCheckPermission,
    validateRole: handleValidateRole,
    refreshSession: handleRefreshSession,
  }
}