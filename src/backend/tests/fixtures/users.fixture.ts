////////////////////////////////////////////////////////////////////////////////
// External Imports
////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker'; // @faker-js/faker ^8.0.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import { User, UserSettings } from '../../src/types/user';
import { USER_ROLES } from '../../src/constants/roles';

////////////////////////////////////////////////////////////////////////////////
// Default User Settings Constant
////////////////////////////////////////////////////////////////////////////////

/**
 * DEFAULT_USER_SETTINGS
 * ----------------------------------------------------------------------------
 * A fully-defined default user settings object. Used by fixtures to initialize
 * users with consistent baseline preferences. These settings include:
 *  - theme:         Default user theme preference
 *  - timezone:      Default user timezone
 *  - notifications: Email/in-app notification toggles and digest frequency
 *  - preferences:   Additional user-level preferences such as language and format
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'light',
  timezone: 'UTC',
  notifications: {
    emailNotifications: true,
    inAppNotifications: true,
    digestFrequency: ['daily'],
  },
  preferences: {
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  },
};

////////////////////////////////////////////////////////////////////////////////
// createTestUser
////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a single test user with realistic data to support unit,
 * integration, and E2E tests. This fixture helps ensure coverage of:
 *  - Role-Based Access Control Testing
 *  - Multi-tenant scenarios by populating organizationId
 *
 * @param overrides - A Partial<User> object allowing customization
 *                    of the generated user fields such as role,
 *                    email, organizationId, etc.
 * @returns A fully-populated User object with consistent defaults
 *          for role, organization, and settings when not overridden.
 */
export function createTestUser(overrides: Partial<User> = {}): User {
  // Generate default values using faker for realism whenever
  // no overrides are provided by the caller.
  const defaultUser: User = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: USER_ROLES.USER,
    organizationId: faker.string.uuid(),
    settings: DEFAULT_USER_SETTINGS,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
  };

  // Merge any overrides onto the default user object
  const mergedUser: User = {
    ...defaultUser,
    ...overrides,
  };

  // Return the final user object, ensuring any partial overrides
  // replace the default fields as necessary.
  return mergedUser;
}

////////////////////////////////////////////////////////////////////////////////
// createTestUsers
////////////////////////////////////////////////////////////////////////////////

/**
 * Generates an array of test users distributed across various roles
 * to comprehensively test role-based logic:
 *  - ADMIN:   10% of total
 *  - MANAGER: 20% of total
 *  - USER:    60% of total
 *  - API:     10% of total
 *
 * @param count - The total number of users to generate. Must be > 0.
 * @param organizationId - The ID under which all these users will be
 *                         classified. Helps validate multi-tenant isolation.
 * @returns An array of User objects matching the specified size and distribution.
 */
export function createTestUsers(count: number, organizationId: string): User[] {
  // Validate basic input conditions before generation
  if (count <= 0) {
    throw new Error('User count must be greater than zero.');
  }
  if (!organizationId) {
    throw new Error('A valid organizationId must be provided for multi-tenant testing.');
  }

  // Approximate distribution of roles
  const adminCount = Math.floor(count * 0.1);
  const managerCount = Math.floor(count * 0.2);
  const userCount = Math.floor(count * 0.6);
  const assignedUsers = adminCount + managerCount + userCount;
  // Ensure total matches 'count' by assigning any remainder to 'API' users
  const apiCount = count - assignedUsers;

  const users: User[] = [];

  // Generate admin users
  for (let i = 0; i < adminCount; i++) {
    users.push(
      createTestUser({
        role: USER_ROLES.ADMIN,
        organizationId,
      }),
    );
  }

  // Generate manager users
  for (let i = 0; i < managerCount; i++) {
    users.push(
      createTestUser({
        role: USER_ROLES.MANAGER,
        organizationId,
      }),
    );
  }

  // Generate regular users
  for (let i = 0; i < userCount; i++) {
    users.push(
      createTestUser({
        role: USER_ROLES.USER,
        organizationId,
      }),
    );
  }

  // Generate API users
  for (let i = 0; i < apiCount; i++) {
    users.push(
      createTestUser({
        role: USER_ROLES.API,
        organizationId,
      }),
    );
  }

  return users;
}

////////////////////////////////////////////////////////////////////////////////
// Pre-defined Test Users
////////////////////////////////////////////////////////////////////////////////

/**
 * A predefined set of test users to facilitate commonly needed roles
 * in unit, integration, and E2E testing. This object covers:
 *  - admin   : Role with global privileges
 *  - manager : Role with organization-level privileges
 *  - user    : Standard role for personal-level actions
 *  - apiUser : Role for rate-limited programmatic access
 */
export const testUsers = {
  admin: createTestUser({ role: USER_ROLES.ADMIN }),
  manager: createTestUser({ role: USER_ROLES.MANAGER }),
  user: createTestUser({ role: USER_ROLES.USER }),
  apiUser: createTestUser({ role: USER_ROLES.API }),
};