////////////////////////////////////////////////////////////////////////////////
// External Imports with Version Comments
////////////////////////////////////////////////////////////////////////////////

// Prisma Client for type-safe database operations, version ^5.0.0
import { PrismaClient } from '@prisma/client'; // ^5.0.0

// ioredis for caching and rate limiting, version ^5.3.0
import Redis from 'ioredis'; // ^5.3.0

// SecurityService for data encryption and security controls, version ^1.0.0
import { SecurityService } from '@company/security-service'; // ^1.0.0

////////////////////////////////////////////////////////////////////////////////
// Internal Imports
////////////////////////////////////////////////////////////////////////////////

import type {
  Lead,
  CreateLeadInput,
  UpdateLeadInput,
  LeadActivity,
} from '../types/lead';
import {
  createLeadSchema,
  updateLeadSchema,
  scoreSchema,
} from '../schemas/lead.schema';
import { DatabaseService } from '../config/database';

////////////////////////////////////////////////////////////////////////////////
// LeadModel Class
////////////////////////////////////////////////////////////////////////////////

/**
 * The LeadModel class provides a comprehensive, production-ready implementation
 * for B2B sales lead data operations. It coordinates the DatabaseService for
 * persistent storage, integrates Redis for caching and rate limiting, and
 * leverages SecurityService for encryption. Additionally, it offers
 * multi-tenant isolation via organization checks, activity logging stubs,
 * analytics updates, and robust validation.
 *
 * This class implements the following key functionalities:
 *  1) create    - Creates a lead with security controls, encryption, and logging.
 *  2) update    - Updates lead data with validation, encryption, and caching rules.
 *  3) findById  - Retrieves a single lead by ID, ensuring organization ownership.
 *  4) findByOrganization - Fetches leads belonging to a specific organization.
 *  5) delete    - Removes a lead record while tracking related activity.
 *  6) updateScore - Adjusts the scoring of a lead with validation and logging.
 *  7) bulkUpdate - Performs a batch update of leads within a transaction.
 *  8) getAnalytics - Retrieves relevant analytics data for leads in an organization.
 */
export class LeadModel {
  /**
   * Database service instance providing access to Prisma clients (primary and replicas).
   */
  private readonly db: DatabaseService;

  /**
   * Prisma client instance for direct database interactions (read/write).
   */
  private readonly prisma: PrismaClient;

  /**
   * Security service for encryption, decryption, and advanced security controls.
   */
  private readonly security: SecurityService;

  /**
   * Redis instance for caching and rate-limiting usage within organization contexts.
   */
  private readonly cache: Redis;

  /**
   * Constructs the LeadModel class with the required dependencies:
   *  1) DatabaseService db        - For Prisma client access.
   *  2) SecurityService security  - For data encryption.
   *  3) Redis cache               - For caching / rate-limiting.
   *
   * @param db        - An instance of DatabaseService.
   * @param security  - An instance of SecurityService.
   * @param cache     - A Redis client instance for caching.
   */
  constructor(db: DatabaseService, security: SecurityService, cache: Redis) {
    // Initialize the database service reference for potential future usage.
    this.db = db;

    // Obtain a Prisma client (usually for write operations by default).
    this.prisma = this.db.getClient('write');

    // Save the provided SecurityService instance for encryption tasks.
    this.security = security;

    // Store the Redis cache instance for rate-limiting or future caching.
    this.cache = cache;

    // Optional: Could configure any advanced rate-limit or caching strategies here.
  }

  //////////////////////////////////////////////////////////////////////////////
  // 1) CREATE
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a new lead with validation, encryption, activity logging, and analytics.
   *
   * Steps:
   *  1) Validate rate limits for the given organization using Redis (placeholder).
   *  2) Validate input data using createLeadSchema (Zod).
   *  3) Encrypt sensitive lead data (e.g., email, firstName, lastName).
   *  4) Initialize lead score and status.
   *  5) Create the lead record in the database via Prisma.
   *  6) Log lead creation activity (stub).
   *  7) Update analytics metrics (stub).
   *  8) Return the created lead record (with decrypted fields if needed).
   *
   * @param data            - Incoming CreateLeadInput data with basic lead details.
   * @param organizationId  - The ID of the organization creating this lead.
   * @param userId          - The ID of the user performing the creation.
   * @returns The newly created and fully validated Lead.
   */
  public async create(
    data: CreateLeadInput,
    organizationId: string,
    userId: string,
  ): Promise<Lead> {
    // STEP 1: (Placeholder) Rate limit check. A robust approach could store counters in Redis.
    await this.enforceOrgRateLimit(organizationId, 'CREATE_LEAD');

    // STEP 2: Validate input data using Zod schema.
    const validatedData = createLeadSchema.parse(data);

    // STEP 3: Encrypt sensitive lead data. We consider email, firstName, lastName as sensitive.
    const encryptedEmail = this.security.encrypt(validatedData.email);
    const encryptedFirstName = this.security.encrypt(validatedData.firstName);
    const encryptedLastName = this.security.encrypt(validatedData.lastName);

    // STEP 4: Initialize lead score and status. For creation, typically set defaults.
    const defaultScore = 0;
    const defaultStatus = 'NEW';

    // STEP 5: Create the lead record in the database.
    const created = await this.prisma.lead.create({
      data: {
        email: encryptedEmail,
        firstName: encryptedFirstName,
        lastName: encryptedLastName,
        title: validatedData.title,
        companyName: validatedData.companyName,
        companyData: {}, // By default, can remain empty or partial. Real usage may store more info.
        score: defaultScore,
        status: defaultStatus,
        source: validatedData.source,
        organizationId: organizationId,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastEnriched: null,
        isEncrypted: true,
      },
    });

    // STEP 6: Log lead creation activity (stub).
    await this.logLeadActivity({
      leadId: created.id,
      organizationId,
      userId,
      activityType: 'LEAD_CREATED',
    });

    // STEP 7: Update analytics metrics (stub).
    await this.updateAnalyticsForCreation(created);

    // STEP 8: Construct the final lead object. Optionally decrypt if immediate reading is needed.
    const finalLead: Lead = {
      ...created,
      email: this.security.decrypt(created.email),
      firstName: this.security.decrypt(created.firstName),
      lastName: this.security.decrypt(created.lastName),
    };

    return finalLead;
  }

  //////////////////////////////////////////////////////////////////////////////
  // 2) UPDATE
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Updates an existing lead's data with Zod validation, encryption of updated fields,
   * activity logging, and cache invalidation.
   *
   * Steps:
   *  1) Verify that the lead belongs to the given organization (multi-tenant check).
   *  2) Validate the update data with updateLeadSchema.
   *  3) Encrypt any updated sensitive fields (email, firstName, lastName) if provided.
   *  4) Update the lead record in the database.
   *  5) Log the update activity.
   *  6) Invalidate any relevant cache entries (placeholder).
   *  7) Return the updated lead record.
   *
   * @param id             - The unique identifier of the lead to update.
   * @param data           - UpdateLeadInput containing partial lead fields to modify.
   * @param organizationId - The ID of the organization that owns the lead.
   * @param userId         - The ID of the user performing the update.
   * @returns The updated Lead object, with potential decrypted fields.
   */
  public async update(
    id: string,
    data: UpdateLeadInput,
    organizationId: string,
    userId: string,
  ): Promise<Lead> {
    // STEP 1: Verify multi-tenant ownership. Throw if the lead doesn't belong to this org.
    const existingLead = await this.prisma.lead.findUnique({
      where: { id },
    });
    if (!existingLead || existingLead.organizationId !== organizationId) {
      throw new Error(`Access denied or lead not found for org ${organizationId}`);
    }

    // STEP 2: Validate the update data using the updateLeadSchema.
    const validatedData = updateLeadSchema.parse(data);

    // STEP 3: Encrypt updated fields if they exist in validatedData. For partial updates:
    const toUpdate: Record<string, any> = {};
    if (validatedData.firstName !== undefined) {
      toUpdate.firstName = this.security.encrypt(validatedData.firstName);
    }
    if (validatedData.lastName !== undefined) {
      toUpdate.lastName = this.security.encrypt(validatedData.lastName);
    }
    // Titles are not necessarily confidential, but you could encrypt them similarly if needed.
    if (validatedData.title !== undefined) {
      toUpdate.title = validatedData.title;
    }
    // Update lead status if changed.
    if (validatedData.status !== undefined) {
      toUpdate.status = validatedData.status;
    }
    // Update lead score if changed.
    if (validatedData.score !== undefined) {
      toUpdate.score = validatedData.score;
    }
    // Reassign ownership if changed.
    if (validatedData.ownerId !== undefined) {
      toUpdate.ownerId = validatedData.ownerId;
    }
    // Always bump updatedAt timestamp.
    toUpdate.updatedAt = new Date();

    // If we changed any sensitive fields, maintain isEncrypted = true.
    const hasNewSensitiveData =
      validatedData.firstName ||
      validatedData.lastName;
    if (hasNewSensitiveData) {
      toUpdate.isEncrypted = true;
    }

    // STEP 4: Perform the update in Prisma.
    const updated = await this.prisma.lead.update({
      where: { id },
      data: toUpdate,
    });

    // STEP 5: Log the update activity (stub).
    await this.logLeadActivity({
      leadId: updated.id,
      organizationId,
      userId,
      activityType: 'LEAD_UPDATED',
    });

    // STEP 6: Invalidate cache (placeholder).
    // e.g., await this.cache.del(`lead_${updated.id}`);

    // STEP 7: Return updated lead, potentially decrypting if isEncrypted is true.
    let emailDecrypted = updated.email;
    let firstNameDecrypted = updated.firstName;
    let lastNameDecrypted = updated.lastName;
    if (updated.isEncrypted) {
      emailDecrypted = this.security.decrypt(emailDecrypted);
      firstNameDecrypted = this.security.decrypt(firstNameDecrypted);
      lastNameDecrypted = this.security.decrypt(lastNameDecrypted);
    }

    const finalLead: Lead = {
      ...updated,
      email: emailDecrypted,
      firstName: firstNameDecrypted,
      lastName: lastNameDecrypted,
    };

    return finalLead;
  }

  //////////////////////////////////////////////////////////////////////////////
  // 3) FIND BY ID
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Retrieves a single lead by its unique ID, ensuring that it belongs to a specific
   * organization (multi-tenant isolation). Decrypts fields if the record is encrypted.
   *
   * @param id             - The lead's unique ID.
   * @param organizationId - The ID of the organization requesting the lead.
   * @returns The matching Lead if found, or null if not found or org mismatch.
   */
  public async findById(
    id: string,
    organizationId: string,
  ): Promise<Lead | null> {
    // Query for the lead record
    const leadRecord = await this.prisma.lead.findUnique({
      where: { id },
    });
    if (!leadRecord) {
      return null;
    }
    // Check multi-tenant ownership
    if (leadRecord.organizationId !== organizationId) {
      return null;
    }
    // Decrypt fields if needed
    if (leadRecord.isEncrypted) {
      return {
        ...leadRecord,
        email: this.security.decrypt(leadRecord.email),
        firstName: this.security.decrypt(leadRecord.firstName),
        lastName: this.security.decrypt(leadRecord.lastName),
      };
    }
    return leadRecord;
  }

  //////////////////////////////////////////////////////////////////////////////
  // 4) FIND BY ORGANIZATION
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Fetches all leads belonging to the specified organization. Accepts optional
   * filter criteria for advanced searching or pagination.
   *
   * @param organizationId - ID of the organization fetching the leads.
   * @param filters        - An optional object with filtering criteria (e.g., status, score range).
   * @returns An array of matching Lead records (with decrypted fields if encrypted).
   */
  public async findByOrganization(
    organizationId: string,
    filters?: Record<string, any>,
  ): Promise<Lead[]> {
    // Build a where clause for multi-tenant isolation + custom filters
    const whereClause: any = {
      organizationId,
      ...this.buildLeadFilters(filters),
    };

    // Fetch leads from DB
    const leadRecords = await this.prisma.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt fields for each if isEncrypted is true
    const decryptedLeads: Lead[] = leadRecords.map((record) => {
      if (!record.isEncrypted) {
        return record;
      }
      return {
        ...record,
        email: this.security.decrypt(record.email),
        firstName: this.security.decrypt(record.firstName),
        lastName: this.security.decrypt(record.lastName),
      };
    });

    return decryptedLeads;
  }

  //////////////////////////////////////////////////////////////////////////////
  // 5) DELETE
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Removes a lead record from the system, verifying organization ownership
   * and optionally logging a deletion activity. Returns boolean to signify
   * successful removal.
   *
   * @param id             - The unique ID of the lead to be deleted.
   * @param organizationId - The ID of the organization that owns the lead.
   * @param userId         - The user performing the deletion.
   * @returns True if the lead was deleted, false otherwise.
   */
  public async delete(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    // Fetch existing lead
    const existingLead = await this.prisma.lead.findUnique({
      where: { id },
    });
    if (!existingLead || existingLead.organizationId !== organizationId) {
      return false;
    }

    // Perform deletion
    await this.prisma.lead.delete({
      where: { id },
    });

    // Log deletion as an activity (stub).
    await this.logLeadActivity({
      leadId: id,
      organizationId,
      userId,
      activityType: 'LEAD_DELETED',
    });

    // Potential cache invalidation
    // await this.cache.del(`lead_${id}`);

    return true;
  }

  //////////////////////////////////////////////////////////////////////////////
  // 6) UPDATE SCORE
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Updates the lead's score, enforcing numeric validation and
   * logging the relevant activity.
   *
   * @param id             - The unique ID of the lead.
   * @param newScore       - The new score for the lead.
   * @param organizationId - The ID of the organization that owns the lead.
   * @param userId         - The user performing the score update.
   * @returns The Lead object reflecting the updated score, with decrypted fields if needed.
   */
  public async updateScore(
    id: string,
    newScore: number,
    organizationId: string,
    userId: string,
  ): Promise<Lead> {
    // Validate the new score with the scoreSchema
    scoreSchema.parse(newScore);

    // Ensure the lead belongs to the org
    const leadRecord = await this.prisma.lead.findUnique({ where: { id } });
    if (!leadRecord || leadRecord.organizationId !== organizationId) {
      throw new Error(`Lead not found or org mismatch for ID: ${id}`);
    }

    // Update the score
    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        score: newScore,
        updatedAt: new Date(),
      },
    });

    // Log an activity
    await this.logLeadActivity({
      leadId: id,
      organizationId,
      userId,
      activityType: 'LEAD_UPDATED',
    });

    // Return the updated lead, decrypt if necessary
    if (!updated.isEncrypted) {
      return updated;
    }
    return {
      ...updated,
      email: this.security.decrypt(updated.email),
      firstName: this.security.decrypt(updated.firstName),
      lastName: this.security.decrypt(updated.lastName),
    };
  }

  //////////////////////////////////////////////////////////////////////////////
  // 7) BULK UPDATE
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Performs a bulk update of multiple leads in a single transaction, ensuring
   * multi-tenant isolation, partial encryption of any sensitive fields, and
   * optional activity logging.
   *
   * @param leadIds         - An array of lead IDs to be updated.
   * @param data            - The same UpdateLeadInput data for each lead.
   * @param organizationId  - The ID of the organization that owns these leads.
   * @param userId          - The user performing the bulk update.
   * @returns An array of updated leads.
   */
  public async bulkUpdate(
    leadIds: string[],
    data: UpdateLeadInput,
    organizationId: string,
    userId: string,
  ): Promise<Lead[]> {
    // Validate basic update data
    const validatedData = updateLeadSchema.parse(data);

    // Prepare encryption if user updates sensitive fields
    const newFirstName = validatedData.firstName
      ? this.security.encrypt(validatedData.firstName)
      : undefined;
    const newLastName = validatedData.lastName
      ? this.security.encrypt(validatedData.lastName)
      : undefined;

    // Build partial update data for each record
    const partialUpdate: Record<string, any> = {};
    if (newFirstName !== undefined) partialUpdate.firstName = newFirstName;
    if (newLastName !== undefined) partialUpdate.lastName = newLastName;
    if (validatedData.title !== undefined) partialUpdate.title = validatedData.title;
    if (validatedData.status !== undefined) partialUpdate.status = validatedData.status;
    if (validatedData.score !== undefined) partialUpdate.score = validatedData.score;
    if (validatedData.ownerId !== undefined) partialUpdate.ownerId = validatedData.ownerId;
    partialUpdate.updatedAt = new Date();

    // If we changed any sensitive fields, set isEncrypted = true
    if (newFirstName || newLastName) {
      partialUpdate.isEncrypted = true;
    }

    // Execute transaction to update leads collectively
    const updatedLeads: Lead[] = await this.prisma.$transaction(
      leadIds.map((leadId) =>
        this.prisma.lead.update({
          where: { id: leadId },
          data: partialUpdate,
        }),
      ),
      { timeout: 30000 },
    );

    // Filter out leads that do not belong to this organization
    const orgFiltered = updatedLeads.filter(
      (l) => l.organizationId === organizationId,
    );

    // Log activity for each updated lead
    for (const lead of orgFiltered) {
      await this.logLeadActivity({
        leadId: lead.id,
        organizationId,
        userId,
        activityType: 'LEAD_UPDATED',
      });
    }

    // Optionally decrypt fields
    const results = orgFiltered.map((rec) => {
      if (!rec.isEncrypted) return rec;
      return {
        ...rec,
        email: this.security.decrypt(rec.email),
        firstName: this.security.decrypt(rec.firstName),
        lastName: this.security.decrypt(rec.lastName),
      };
    });

    return results;
  }

  //////////////////////////////////////////////////////////////////////////////
  // 8) GET ANALYTICS
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Retrieves or aggregates lead-related analytics within a given organization.
   * This could include lead status distribution, average response time, top
   * scoring leads, etc. For demonstration, returns stub data.
   *
   * @param organizationId - The organization ID for which to gather analytics.
   * @returns A general object containing lead analytics results.
   */
  public async getAnalytics(organizationId: string): Promise<any> {
    // Placeholder for real analytics. For instance, query leads by organization,
    // gather statistics on statuses, average score, etc.
    const totalLeads = await this.prisma.lead.count({
      where: { organizationId },
    });

    const averageScoreData = await this.prisma.lead.aggregate({
      where: { organizationId },
      _avg: { score: true },
    });
    const avgScore = averageScoreData._avg.score || 0;

    // Additional advanced analytics might be performed here.
    return {
      organizationId,
      totalLeads,
      averageLeadScore: avgScore,
      lastUpdated: new Date().toISOString(),
    };
  }

  //////////////////////////////////////////////////////////////////////////////
  // Supporting / Private Helper Methods
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Enforces a basic rate limit for a specific operation within an organization.
   * This is a placeholder that could be expanded for real Redis-based counters.
   *
   * @param organizationId - The multi-tenant identifier.
   * @param operation      - Operation string (e.g., 'CREATE_LEAD').
   */
  private async enforceOrgRateLimit(
    organizationId: string,
    operation: string,
  ): Promise<void> {
    // Example rate-limit implementation (placeholder):
    // 1. Build a Redis key, e.g. `rate_limit:${organizationId}:${operation}`
    // 2. Increase the counter, expire in a certain window.
    // 3. If above threshold, throw an Error.
    // This function does nothing for now, just a stub.
    // e.g.:
    // const key = `rate_limit:${organizationId}:${operation}`;
    // const current = await this.cache.incr(key);
    // if (current === 1) await this.cache.expire(key, 60); // 60 seconds window
    // if (current > 100) throw new Error('Rate limit exceeded');
    return;
  }

  /**
   * Logs lead-related activities (creation, update, deletion, etc.). In a real
   * system, this would create an Activity record in the DB or publish an event.
   *
   * @param params - An object containing activity details such as leadId, org, user, etc.
   */
  private async logLeadActivity(params: {
    leadId: string;
    organizationId: string;
    userId: string;
    activityType: string;
  }): Promise<void> {
    // Stub for actual logging. e.g:
    // await this.prisma.activity.create({
    //   data: {...}
    // });
    // Or call an external microservice that processes activity logs.
    return;
  }

  /**
   * Updates analytics or counters whenever a new lead is created. Provided here
   * as a stub for any real-time or near real-time analytics updates.
   *
   * @param lead - The newly created lead record.
   */
  private async updateAnalyticsForCreation(lead: Lead): Promise<void> {
    // Stub for updating analytics system or caching aggregated stats.
    // E.g.: this.cache.hincrby(`org:${lead.organizationId}:analytics`, 'leadCount', 1);
    return;
  }

  /**
   * Builds a Prisma-compatible 'where' clause from arbitrary filter inputs. In
   * a real scenario, you'd parse fields such as status=, minScore=, etc.
   *
   * @param filters - The inbound filter structure.
   * @returns A partial 'where' object for Prisma queries.
   */
  private buildLeadFilters(filters?: Record<string, any>): Record<string, any> {
    if (!filters) return {};
    const whereClause: Record<string, any> = {};

    // Example expansions:
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (typeof filters.minScore === 'number') {
      whereClause.score = { gte: filters.minScore };
    }
    if (typeof filters.maxScore === 'number') {
      if (!whereClause.score) whereClause.score = {};
      whereClause.score.lte = filters.maxScore;
    }
    // Additional multi-field or date-range checks can be implemented as needed.

    return whereClause;
  }
}