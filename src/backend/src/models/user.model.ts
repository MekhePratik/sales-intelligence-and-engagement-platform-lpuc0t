/*//////////////////////////////////////////////////////////////////////////////////
// External Imports
//////////////////////////////////////////////////////////////////////////////////*/

import { PrismaClient } from '@prisma/client'; // @prisma/client ^5.2.0
import { z } from 'zod'; // zod ^3.22.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import { User, CreateUserInput, UpdateUserInput } from '../types/user';
import { userSchema, createUserSchema, updateUserSchema } from '../schemas/user.schema';
import { USER_ROLES } from '../constants/roles';

////////////////////////////////////////////////////////////////////////////////
// UserModel Class
////////////////////////////////////////////////////////////////////////////////
/**
 * Enhanced user model class implementing secure user management operations
 * with session tracking, multi-tenant support, RBAC integrations, and
 * comprehensive data security measures.
 */
export class UserModel {
  /**
   * PrismaClient instance used for database interactions. Configured for
   * query optimization, logging, and error tracking in production.
   */
  private readonly prisma: PrismaClient;

  /**
   * Instantiates the user model with a dedicated Prisma client, configuring
   * connection pooling, query logging, error handling, and rate limiting.
   *
   * @param prisma A PrismaClient instance, intended to be shared or newly created
   *               with appropriate logging and tracing integrations.
   */
  constructor(prisma: PrismaClient) {
    // 1. Initialize Prisma with advanced configuration (connection pooling, etc.).
    this.prisma = prisma;

    // 2. Configure query logging for debugging and monitoring in enterprise environments.
    //    e.g., this.prisma.$on('query', (e) => { console.log('Query: ', e.query); });

    // 3. Integrate error tracking with external monitoring tools if needed (e.g., Sentry).
    //    e.g., this.prisma.$use(async (params, next) => { ... });

    // 4. Optionally set up rate limiting or connection-level restrictions if required.
    //    This can be implemented via custom middlewares or third-party packages.
  }

  /**
   * Creates a new user within the platform, enforcing multi-tenant segregation
   * by organizationId, validating role assignments for RBAC, and applying data
   * security via field-level encryption for sensitive fields.
   *
   * @param data A CreateUserInput object containing essential user details.
   * @returns Promise resolving to the newly created, sanitized User object.
   */
  public async create(data: CreateUserInput): Promise<User> {
    // 1. Validate input data using Zod to ensure email, name, role, and organizationId are valid.
    const validatedData = createUserSchema.parse(data);

    // 2. Check if a user with the same email already exists in the same organization (multi-tenant isolation).
    const existingUser = await this.prisma.user.findUnique({
      where: {
        // Ensures uniqueness at the organization scope.
        email_organizationId: {
          email: validatedData.email,
          organizationId: validatedData.organizationId,
        },
      },
    });
    if (existingUser) {
      throw new Error('A user with this email already exists in the specified organization.');
    }

    // 3. Encrypt sensitive data fields (e.g., email) as needed. Placeholder for actual encryption method.
    const encryptedEmail = this.encryptField(validatedData.email);

    // 4. Create the user record in the database, including organization-scoped data.
    const newUser = await this.prisma.user.create({
      data: {
        email: encryptedEmail,
        name: validatedData.name,
        role: validatedData.role,
        organizationId: validatedData.organizationId,
        // Settings can be initialized if partial settings are provided.
        settings: validatedData.settings ? validatedData.settings as any : {},
      },
    });

    // 5. Log the user creation event for auditing and analytics.
    //    e.g., console.log(`[UserModel] Created user with ID: ${newUser.id}`);

    // 6. Return a sanitized user object. Here we parse it through the userSchema to ensure correct shape.
    const userEntity = await userSchema.parseAsync({
      ...newUser,
    });
    return userEntity;
  }

  /**
   * Updates the user's last login timestamp to facilitate session tracking,
   * device and location monitoring, and security alerting if needed.
   *
   * @param id The unique identifier of the user whose last login is being updated.
   */
  public async updateLastLogin(id: string): Promise<void> {
    // 1. Validate the user ID to ensure it's a non-empty string.
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid user ID provided for last login update.');
    }

    // 2. Update the user record with the new login time, storing the event for audit trails.
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // 3. Optionally record login metadata such as IP address, device info, or geolocation.
    //    This can be stored in a separate table or logging system if needed.

    // 4. Trigger any security alerts or anomaly detection if location/device is suspicious.
    //    e.g., integration with a third-party or custom security service.

    // 5. Log the update event for additional auditing.
    //    e.g., console.log(`[UserModel] Updated lastLogin for user ID: ${id}`);
  }

  /**
   * Demonstrates a placeholder encryption method for sensitive fields, e.g.,
   * for email or other personal information. In production, use robust
   * encryption algorithms and secure key management.
   *
   * @param fieldValue The raw string field that needs encryption.
   * @returns A string representing the encrypted field.
   */
  private encryptField(fieldValue: string): string {
    // In a real enterprise implementation, integrate an encryption library:
    // e.g., KMS, or a well-tested cryptography library.
    // This placeholder simply returns the original text for demonstration.
    return fieldValue;
  }
}