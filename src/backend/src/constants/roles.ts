/**
 * This file provides a comprehensive, enterprise-grade definition of Role-Based Access Control (RBAC)
 * for the B2B Sales Intelligence and Engagement Platform. The code herein satisfies both the
 * requirement for strictly typed role definitions and the exhaustive permission mappings per role.
 *
 * It includes:
 *  1. USER_ROLES enumeration for the core roles in the system.
 *  2. Strongly typed permission scope, resource, and permission action types.
 *  3. RolePermissions interface that enforces structure and immutability for each role’s permissions.
 *  4. ROLE_PERMISSIONS constant object that assigns specific permission sets and rate limits
 *     to each role, ensuring adherence to the authorization model in a globally, organizationally,
 *     personally, or rate-limited scoped context.
 */

/**
 * Enumerates all available user roles for the platform.
 * Each value in this enum corresponds to a core role recognized throughout the system.
 * 
 * - ADMIN   : Full system access, cross-organization capabilities.
 * - MANAGER : Organization-level management, leadership roles with extended privileges.
 * - USER    : Standard end-user role primarily focused on personal leads and campaigns.
 * - API     : Programmatic access role with strict rate limiting and partial read-only permissions.
 */
export enum USER_ROLES {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  API = 'api',
}

/**
 * Represents all possible permission scopes applicable to a role.
 * 
 * - global         : Role has unrestricted access across all organizations or data.
 * - organization   : Role can only operate within the bounds of a specific organization.
 * - personal       : Role is limited to personal resources such as personal leads and personal campaigns.
 * - rate-limited   : Role interacting purely through API-level access, restricted by usage limits.
 */
export type PermissionScope = 'global' | 'organization' | 'personal' | 'rate-limited';

/**
 * Represents all possible actions that can be applied to a resource.
 * 
 * - read      : Grants read access to a specific resource.
 * - write     : Grants creation or update abilities on a specific resource.
 * - delete    : Grants deletion rights on a specific resource.
 * - manage    : Grants managerial rights, typically used for user or settings management.
 * - export    : Grants permission to export data from a resource for analytics or compliance.
 * - configure : Grants permission to configure or control system-level settings or modules.
 */
export type Permission = 'read' | 'write' | 'delete' | 'manage' | 'export' | 'configure';

/**
 * Enumerates the resources that can be subject to permission checks throughout the system.
 * 
 * - all       : Applies a permission to all resources globally.
 * - leads     : Resource representing lead data.
 * - campaigns : Resource representing marketing or outreach campaigns.
 * - analytics : Resource related to viewing or exporting analytics data.
 * - users     : Resource for managing user accounts within an organization.
 * - settings  : Resource for general application or organization settings.
 * - team      : Resource for team or group-level membership/management actions.
 * - system    : Resource for broader system or infrastructure-level configuration.
 */
export type Resource =
  | 'all'
  | 'leads'
  | 'campaigns'
  | 'analytics'
  | 'users'
  | 'settings'
  | 'team'
  | 'system';

/**
 * Defines the structure for rate limiting. This ensures roles that operate within certain usage
 * thresholds (e.g., API role) cannot exceed a specified volume of requests within a defined interval.
 * 
 * @property requests Number of requests allowed in the given interval.
 * @property interval The time period in which the 'requests' limit applies. (e.g., 'hour' or 'minute')
 */
export interface RateLimit {
  requests: number;
  interval: 'minute' | 'hour';
}

/**
 * Defines the complete permission configuration for a particular user role.
 * 
 * @property scope     Specifies the overarching boundary in which the role can operate, ranging
 *                     from global, organization, personal, or rate-limited scopes.
 * @property access    A list of string-based resource:action combinations, indicating precisely
 *                     which operations are permitted.
 * @property rateLimit An object enforcing request limits over a specified time interval.
 */
export interface RolePermissions {
  scope: PermissionScope;
  access: string[];
  rateLimit: RateLimit;
}

/**
 * Provides a union type representing all valid textual user roles for reference in records, objects, or
 * other configurations expecting a string literal form of USER_ROLES enum members.
 */
export type UserRole = 'admin' | 'manager' | 'user' | 'api';

/**
 * ROLE_PERMISSIONS houses an exhaustive mapping of role names to their respective RolePermissions configuration.
 * It is declared as a read-only record to prevent runtime mutations, ensuring that role definitions remain
 * operationally consistent and secure.
 *
 * Each key in the map corresponds to a UserRole ('admin', 'manager', 'user', 'api') and returns a RolePermissions
 * object that includes:
 *  - scope     : The scope limit for that role.
 *  - access    : The precise resource:action pairs defining the authorized operations.
 *  - rateLimit : The permissible request rate for that role, to ensure system stability.
 */
export const ROLE_PERMISSIONS: Readonly<Record<UserRole, RolePermissions>> = Object.freeze({
  admin: {
    scope: 'global',
    access: [
      'all:read',
      'all:write',
      'all:delete',
      'users:manage',
      'settings:manage',
      'analytics:export',
      'system:configure',
    ],
    rateLimit: {
      requests: 10000,
      interval: 'hour',
    },
  },
  manager: {
    scope: 'organization',
    access: [
      'leads:read',
      'leads:write',
      'leads:delete',
      'campaigns:read',
      'campaigns:write',
      'campaigns:delete',
      'analytics:read',
      'analytics:export',
      'team:manage',
      'settings:read',
    ],
    rateLimit: {
      requests: 5000,
      interval: 'hour',
    },
  },
  user: {
    scope: 'personal',
    access: [
      'leads:read',
      'leads:write',
      'campaigns:read',
      'campaigns:write',
      'analytics:read',
      'settings:read',
    ],
    rateLimit: {
      requests: 1000,
      interval: 'hour',
    },
  },
  api: {
    scope: 'rate-limited',
    access: ['leads:read', 'campaigns:read', 'analytics:read'],
    rateLimit: {
      requests: 100,
      interval: 'minute',
    },
  },
});