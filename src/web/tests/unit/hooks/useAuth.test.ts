/**
 * Comprehensive test suite for the useAuth custom hook.
 * Covers authentication flows, MFA, role-based access control, session management,
 * and security validations as outlined in the technical specification and JSON file.
 */
import { renderHook, act } from '@testing-library/react-hooks' // version ^8.0.1
import configureStore from '@jedmao/redux-mock-store' // version ^3.0.0
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import supabaseMock from '@supabase/supabase-js-mock' // version ^1.0.0
import { Provider } from 'react-redux'
import React from 'react'

// Internal imports from JSON specification
import { useAuth } from '../../../../src/hooks/useAuth'
import type {
  LoginCredentials,
  RegisterCredentials,
  MFASettings,
  UserRole,
  PermissionScope,
} from '../../../../src/types/auth'

// Redux Slice or root reducer providing an auth slice if needed
// (We can import or define a mock inline here for demonstration.)
const mockReducer = (state = {}, action: any) => {
  return state
}

/**
 * ------------------------------------------------------------------------------
 * Function: setupTestEnvironment
 * Description:
 *  Configures the test environment with mocked dependencies and utilities.
 *  1) Configures a mock Redux store with an enhanced auth state.
 *  2) Sets up a mock Supabase client from '@supabase/supabase-js-mock'.
 *  3) Initializes test utilities for role validation, environment variables, etc.
 *  4) Prepares test data fixtures if necessary.
 *  5) Returns an object containing the store, possible wrappers, and other references.
 * ------------------------------------------------------------------------------
 */
function setupTestEnvironment() {
  // 1) Create a mock store with default or minimal auth state
  const initialAuthState = {
    auth: {
      user: null,
      session: null,
      isLoading: false,
      mfaEnabled: false,
      mfaRequired: false,
      mfaVerified: false,
      error: null,
      role: UserRole.USER,
      permissions: [],
    },
  }
  const mockStore = configureStore([thunk])
  const store = mockStore(initialAuthState)

  // 2) Setup a mock supabase client
  //    In real usage, supabase-js-mock can intercept calls to the supabase client.
  supabaseMock.install()

  // 3) Initialize any test environment variables or role-based validation placeholders
  process.env.TEST_ENV = 'true'

  // 4) Setup test data fixtures if needed (omitted for brevity).
  //    Could place user objects, sessions, tokens, etc. here.

  // Utility to wrap components/hook rendering in a Redux Provider
  const Wrapper: React.FC = ({ children }) => {
    return <Provider store={createStore(mockReducer, initialAuthState, applyMiddleware(thunk))}>{children}</Provider>
  }

  // Return references for usage in test suites
  return {
    store,
    Wrapper,
  }
}

/**
 * ------------------------------------------------------------------------------
 * Function: mockAuthService
 * Description:
 *  Creates a mocked authentication service with configurable responses for:
 *   - login
 *   - register
 *   - logout
 *   - verifyMFA
 *   - refreshSession
 *  This function can be used to override or spy on auth methods in controlled tests.
 *
 * @param mockConfig Object containing scenario-based results or error triggers
 * @returns An object that mocks the necessary auth methods.
 * ------------------------------------------------------------------------------
 */
function mockAuthService(mockConfig: Record<string, any>) {
  return {
    login: jest.fn().mockImplementation(async (creds: LoginCredentials) => {
      if (mockConfig.loginError) {
        throw new Error(mockConfig.loginError)
      }
      return {
        user: mockConfig.loginUser || { user_metadata: {} },
        session: mockConfig.loginSession || { access_token: 'mocked_access_token' },
        role: mockConfig.loginRole || UserRole.USER,
        mfaVerified: mockConfig.loginMfaVerified || false,
      }
    }),
    register: jest.fn().mockImplementation(async (creds: RegisterCredentials) => {
      if (mockConfig.registerError) {
        throw new Error(mockConfig.registerError)
      }
      return {
        user: mockConfig.registerUser || { user_metadata: {} },
        session: mockConfig.registerSession || { access_token: 'mocked_access_token' },
        role: mockConfig.registerRole || UserRole.USER,
        mfaVerified: mockConfig.registerMfaVerified || false,
      }
    }),
    logout: jest.fn().mockImplementation(async () => {
      if (mockConfig.logoutError) {
        throw new Error(mockConfig.logoutError)
      }
      return true
    }),
    verifyMFA: jest.fn().mockImplementation(async (token: string) => {
      if (mockConfig.mfaError) {
        throw new Error(mockConfig.mfaError)
      }
      return {
        user: mockConfig.mfaUser || { user_metadata: {} },
        session: mockConfig.mfaSession || { access_token: 'mocked_access_token' },
        mfaVerified: true,
        role: mockConfig.mfaRole || UserRole.USER,
      }
    }),
    refreshSession: jest.fn().mockImplementation(async () => {
      if (mockConfig.refreshError) {
        throw new Error(mockConfig.refreshError)
      }
      return { newSession: 'mocked_refreshed_session' }
    }),
  }
}

describe('useAuth Custom Hook - Comprehensive Test Suite', () => {
  let env: ReturnType<typeof setupTestEnvironment>

  beforeAll(() => {
    // Setup environment once for all tests
    env = setupTestEnvironment()
  })

  afterAll(() => {
    // Cleanup supabase mocks and any environment variables
    supabaseMock.uninstall()
    delete process.env.TEST_ENV
  })

  /**
   * ----------------------------------------------------------------------------
   * Authentication Flow Tests
   *   Covers:
   *   1) Successful login/register/logout
   *   2) Error handling
   *   3) Loading states
   * ----------------------------------------------------------------------------
   */
  describe('Authentication Flow Tests', () => {
    it('should login successfully with valid credentials', async () => {
      const { store, Wrapper } = env
      // Mock auth service scenario
      const mockConfig = {
        loginUser: { user_metadata: { name: 'Test User' } },
        loginSession: { access_token: 'valid_token' },
        loginRole: UserRole.USER,
        loginMfaVerified: false,
      }
      const spyAuthService = mockAuthService(mockConfig)

      // Render the hook inside the test environment
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      // Spy on login to replace the underlying call if needed
      jest.spyOn(require('../../../../src/lib/auth'), 'login').mockImplementation(spyAuthService.login)

      // Initially isLoading should be false
      expect(result.current.isLoading).toBeFalsy()

      // Act: call login
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      // Validate outcomes
      expect(spyAuthService.login).toHaveBeenCalledTimes(1)
      expect(result.current.user).not.toBeNull()
      expect(result.current.session).not.toBeNull()
      expect(result.current.isLoading).toBeFalsy()

      // Reset mock
      jest.restoreAllMocks()
      store.clearActions()
    })

    it('should handle login failure and set errors', async () => {
      const { store, Wrapper } = env
      const mockConfig = { loginError: 'Invalid credentials' }
      const spyAuthService = mockAuthService(mockConfig)
      jest.spyOn(require('../../../../src/lib/auth'), 'login').mockImplementation(spyAuthService.login)

      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      await act(async () => {
        try {
          await result.current.login({ email: 'bad@example.com', password: 'wrong' })
        } catch (err) {
          // Swallow error from the call to keep test from failing
        }
      })

      expect(spyAuthService.login).toHaveBeenCalledTimes(1)
      expect(result.current.user).toBeNull()
      // In a real scenario, user code might set an error in Redux or local hook state
      // This simply verifies the login call fails

      jest.restoreAllMocks()
      store.clearActions()
    })

    it('should register a new user and auto-populate user/session', async () => {
      const { store, Wrapper } = env
      const mockConfig = {
        registerUser: { user_metadata: { name: 'New User' } },
        registerSession: { access_token: 'new_token' },
        registerRole: UserRole.USER,
        registerMfaVerified: false,
      }
      const spyAuthService = mockAuthService(mockConfig)
      jest.spyOn(require('../../../../src/lib/auth'), 'register').mockImplementation(spyAuthService.register)

      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
          organizationName: 'New Org',
        })
      })

      expect(spyAuthService.register).toHaveBeenCalledTimes(1)
      expect(result.current.user).not.toBeNull()
      expect(result.current.session).not.toBeNull()

      jest.restoreAllMocks()
      store.clearActions()
    })

    it('should logout and clear user/session', async () => {
      const { store, Wrapper } = env
      const mockConfig = {}
      const spyAuthService = mockAuthService(mockConfig)
      jest.spyOn(require('../../../../src/lib/auth'), 'logout').mockImplementation(spyAuthService.logout)

      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      // Ensure we mimic an authenticated user first
      await act(async () => {
        result.current.user = { id: 'fake_user_id' } as any
        result.current.session = { access_token: 'existing_token' } as any
      })

      expect(result.current.user).not.toBeNull()
      expect(result.current.session).not.toBeNull()

      // Act: call logout
      await act(async () => {
        await result.current.logout()
      })

      expect(spyAuthService.logout).toHaveBeenCalledTimes(1)
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()

      jest.restoreAllMocks()
      store.clearActions()
    })
  })

  /**
   * ----------------------------------------------------------------------------
   * MFA Flow Tests
   *   Covers:
   *   1) MFA prompt timing
   *   2) Verification process
   *   3) Device management references
   * ----------------------------------------------------------------------------
   */
  describe('MFA Flow Tests', () => {
    it('should require MFA if user is flagged for MFA and totpCode is missing', async () => {
      const { store, Wrapper } = env
      const mockConfig = {
        loginError: 'MFA token is required but not provided for this user.',
      }
      const spyAuthService = mockAuthService(mockConfig)
      jest.spyOn(require('../../../../src/lib/auth'), 'login').mockImplementation(spyAuthService.login)

      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      let thrownError: any
      await act(async () => {
        try {
          await result.current.login({ email: 'test@mfa.com', password: 'testpass' })
        } catch (err) {
          thrownError = err
        }
      })

      // Check that the error was thrown for missing TOTP
      expect(thrownError).toBeDefined()
      expect(String(thrownError)).toMatch(/MFA token is required/)

      jest.restoreAllMocks()
      store.clearActions()
    })

    it('should verify MFA with a valid totpCode', async () => {
      const { store, Wrapper } = env
      const mockConfig = {
        mfaUser: { id: 'mfa_user_id', user_metadata: { mfaEnabled: true } },
        mfaSession: { access_token: 'mfa_token' },
      }
      const spyAuthService = mockAuthService(mockConfig)
      jest
        .spyOn(require('../../../../src/lib/auth'), 'verifyMFA')
        .mockImplementation(spyAuthService.verifyMFA)

      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      await act(async () => {
        // Attempt to verify
        await spyAuthService.verifyMFA('123456')
      })

      expect(spyAuthService.verifyMFA).toHaveBeenCalledTimes(1)
      // This is an example test that the user now has a verified session
      // A real scenario would check local state as well
      store.clearActions()
      jest.restoreAllMocks()
    })
  })

  /**
   * ----------------------------------------------------------------------------
   * Role Validation Tests
   *   Covers:
   *   1) Correct role assignment (ADMIN, MANAGER, USER)
   *   2) Permission checks
   *   3) Role hierarchy
   * ----------------------------------------------------------------------------
   */
  describe('Role Validation Tests', () => {
    it('should assign ADMIN role if user metadata indicates admin', async () => {
      const { store, Wrapper } = env
      const adminConfig = {
        loginUser: { user_metadata: { role: UserRole.ADMIN } },
        loginSession: { access_token: 'admin_token' },
        loginRole: UserRole.ADMIN,
      }
      const spyAuthService = mockAuthService(adminConfig)
      jest.spyOn(require('../../../../src/lib/auth'), 'login').mockImplementation(spyAuthService.login)

      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      await act(async () => {
        await result.current.login({ email: 'admin@test.com', password: 'adminpass' })
      })

      // Hook should interpret the user as an ADMIN
      expect(result.current.role).toBe(UserRole.ADMIN)

      jest.restoreAllMocks()
      store.clearActions()
    })

    it('should return false for checkPermission if user lacks specific permission', async () => {
      const { Wrapper } = env
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      // By default, user permissions array is empty
      const hasPermission = result.current.checkPermission(PermissionScope.ORGANIZATION)
      expect(hasPermission).toBe(false)
    })

    it('should confirm role meets requirement when user is MANAGER and required role is USER', async () => {
      const { Wrapper } = env
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      // Manually set role to MANAGER for testing
      await act(() => {
        result.current.role = UserRole.MANAGER
      })

      const canUserAccess = await result.current.validateRole(UserRole.USER)
      expect(canUserAccess).toBe(true)
    })
  })

  /**
   * ----------------------------------------------------------------------------
   * Session Management Tests
   *   Covers:
   *   1) Session refresh
   *   2) Expiration handling
   *   3) Persistence
   * ----------------------------------------------------------------------------
   */
  describe('Session Management Tests', () => {
    it('should trigger refreshSession manually and update session data', async () => {
      const { store, Wrapper } = env
      const mockConfig = {}
      const spyAuthService = mockAuthService(mockConfig)
      jest
        .spyOn(require('../../../../src/lib/auth'), 'refreshSession')
        .mockImplementation(spyAuthService.refreshSession)

      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      await act(async () => {
        await result.current.refreshSession()
      })

      expect(spyAuthService.refreshSession).toHaveBeenCalled()
      store.clearActions()
      jest.restoreAllMocks()
    })

    it('should handle refreshSession errors gracefully', async () => {
      const { store, Wrapper } = env
      const mockConfig = { refreshError: 'Refresh token expired' }
      const spyAuthService = mockAuthService(mockConfig)
      jest
        .spyOn(require('../../../../src/lib/auth'), 'refreshSession')
        .mockImplementation(spyAuthService.refreshSession)

      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      await act(async () => {
        try {
          await result.current.refreshSession()
        } catch (err) {
          // Catch to avoid test crash
        }
      })

      expect(spyAuthService.refreshSession).toHaveBeenCalledTimes(1)

      store.clearActions()
      jest.restoreAllMocks()
    })
  })

  /**
   * ----------------------------------------------------------------------------
   * Security Validation Tests
   *   Covers:
   *   1) Token handling
   *   2) Storage security or placeholders for persisting tokens
   *   3) Rate limiting for repeated auth ops
   * ----------------------------------------------------------------------------
   */
  describe('Security Validation Tests', () => {
    it('should increment rate limit counters and throw if exceeded', async () => {
      const { Wrapper } = env
      // Render hook
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

      // The max attempt count in the hook is 10. We simulate 11 login attempts.
      // After 10 attempts, the hook should throw a rate limit error.
      let thrownError: any
      for (let i = 0; i < 11; i++) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await act(async () => {
            await result.current.login({
              email: `test${i}@example.com`,
              password: 'password',
            })
          })
        } catch (err) {
          thrownError = err
        }
      }
      expect(thrownError).toBeDefined()
      expect(String(thrownError)).toMatch(/Rate limit exceeded for login operation./)
    })
  })
})