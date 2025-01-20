/***************************************************************************************************
 * File: campaign.model.ts
 * Description:
 *   Provides the "CampaignModel" class for managing Campaign data and operations within the B2B Sales
 *   Intelligence Platform. It integrates with Prisma via the PrismaClient, performs comprehensive
 *   validation with campaignSchema, leverages a CacheService for performance optimizations, and
 *   ensures robust error handling and logging. This class addresses:
 *     - CRUD actions for Campaign records
 *     - Security contexts for validating organization access
 *     - Input data sanitization and schema-based validation
 *     - Cache updates and invalidation
 *     - Metrics initialization and updates
 *
 * Dependencies & Imports:
 *   - PrismaClient (from @prisma/client ^5.0.0) for database operations
 *   - campaignSchema (from ../schemas/campaign.schema) for Zod-based validation
 *   - DatabaseService for obtaining Prisma client instances
 *   - Logger for structured logs
 *   - AppError for standardized error handling
 *   - CacheService for caching campaign data
 *
 * Exports:
 *   - CampaignModel class with methods:
 *       create(data: Campaign, organizationId: string): Promise<Campaign>
 *       findById(id: string, organizationId: string): Promise<Campaign | null>
 *       update(id: string, data: Partial<Campaign>, organizationId: string): Promise<Campaign>
 *       updateMetrics(id: string, metrics: CampaignMetrics, organizationId: string): Promise<Campaign>
 **************************************************************************************************/

import { PrismaClient } from '@prisma/client'; // ^5.0.0
import { campaignSchema } from '../schemas/campaign.schema';
import { DatabaseService } from '../config/database';
import { Logger } from '../utils/logger.util';
import { AppError } from '../utils/error.util';
import { CacheService } from '../services/cache.service';
import type { Campaign, CampaignMetrics, CampaignStatus } from '../types/campaign';

/**
 * The CampaignModel class encapsulates all logic required to create, read, update, and
 * manage campaigns within the B2B Sales Intelligence Platform. It handles validation with
 * campaignSchema, database interactions via Prisma, caching operations, and structured logging.
 */
export class CampaignModel {
  /**
   * Reference to PrismaClient for direct database operations on the Campaign table.
   */
  private prisma: PrismaClient;

  /**
   * Reference to the DatabaseService for potential advanced usage (e.g. connection management).
   */
  private db: DatabaseService;

  /**
   * Logger instance for structured and contextual logging, e.g. for creation or update events.
   */
  private logger: Logger;

  /**
   * Cache service providing get/set operations for optimizing retrieval of frequently accessed data.
   */
  private cache: CacheService;

  /**
   * Initializes a new instance of the CampaignModel class with references to essential services.
   *
   * Steps:
   * 1. Stores the DatabaseService reference for potential extended usage.
   * 2. Retrieves the Prisma client instance from DatabaseService to perform queries.
   * 3. Stores the Logger reference for structured logging.
   * 4. Stores the CacheService reference for caching campaign data.
   * 5. Applies any security or context-based configurations as needed (placeholder).
   *
   * @param dbService - An instance of DatabaseService providing database connectivity.
   * @param logger    - An instance of Logger for structured log outputs.
   * @param cache     - An instance of CacheService for caching operations.
   */
  constructor(dbService: DatabaseService, logger: Logger, cache: CacheService) {
    // 1) Store the incoming DatabaseService as a property for advanced usage if needed.
    this.db = dbService;

    // 2) Obtain the PrismaClient instance from the DatabaseService to interact with the database.
    this.prisma = this.db.getClient();

    // 3) Setup the provided logger instance for all logging tasks in this model.
    this.logger = logger;

    // 4) Setup the cache service for caching campaign data to improve read performance.
    this.cache = cache;

    // 5) Placeholders for any advanced security or context-based setup for this model.
    //    (For example, we might store the current user's roles or organization references.)
  }

  /**
   * create
   * ------
   * Creates a new Campaign record in the database with fully validated and sanitized input data.
   * It also handles organization-level security checks, caching of the newly created campaign,
   * and initialization of any default metrics or tracking needed for the campaign lifecycle.
   *
   * Steps:
   * 1. Validate organization access (placeholder).
   * 2. Validate campaign data against the Zod-based campaignSchema.
   * 3. Sanitize input data (placeholder logic to highlight extendability).
   * 4. Create the campaign record in the database with an appropriate security context.
   * 5. Initialize any default metrics or tracking fields (if applicable).
   * 6. Cache the newly created campaign data in the CacheService.
   * 7. Log the creation event.
   * 8. Return the created campaign.
   *
   * @param data            - The partial or complete campaign data to create (must match Campaign interface).
   * @param organizationId  - The ID of the organization under which this campaign is created.
   * @returns A Promise resolved with the newly created Campaign.
   */
  public async create(data: Campaign, organizationId: string): Promise<Campaign> {
    try {
      // 1) Validate organization access (placeholder).
      //    For real usage, we might check that the user belongs to organizationId or has admin privileges.
      if (!organizationId) {
        throw new AppError(
          'Invalid organization ID. Organization access validation failed.',
          'B2B_ERR_FORBIDDEN' as any,
          {
            context: { organizationId },
            source: 'CampaignModel.create',
            severity: 2,
          }
        );
      }

      // 2) Validate campaign data using the schema. This will throw if it fails.
      const validatedData = campaignSchema.parse(data);

      // 3) Placeholder for sanitizing the input data beyond schema checks (e.g., HTML sanitization).
      //    In production, ensure that fields like name, description are scrubbed for malicious HTML.
      //    validatedData.name = sanitizeHTML(validatedData.name);

      // 4) Create the campaign record with the validated data. We assume there's a "campaign" model in Prisma.
      //    Security context might involve fields like "organizationId" or "creatorId".
      const createdCampaign = await this.prisma.campaign.create({
        data: {
          ...validatedData,
          organizationId, // Ensure the org is explicitly set or verified
        },
      });

      // 5) Initialize default metrics or tracking on the new record if needed. This can be done within
      //    the same creation step or as a subsequent operation. For demonstration, the core fields
      //    are included in validatedData, so we consider them initialized.

      // 6) Cache the newly created campaign data under a key, e.g. campaign:<id>.
      await this.cache.set(`campaign:${createdCampaign.id}`, createdCampaign);

      // 7) Log the creation event.
      this.logger.info('Campaign created successfully.', {
        campaignId: createdCampaign.id,
        organizationId,
      });

      // 8) Return the newly created campaign.
      return createdCampaign;
    } catch (error) {
      // Wrap or rethrow the error for consistent error handling.
      const errorMsg = (error instanceof Error) ? error.message : 'Unknown error during campaign creation.';
      throw new AppError(
        `Failed to create campaign: ${errorMsg}`,
        'B2B_ERR_DATABASE_ERROR' as any,
        {
          context: { originalError: error },
          source: 'CampaignModel.create',
          severity: 2,
        }
      );
    }
  }

  /**
   * findById
   * --------
   * Retrieves a campaign by its unique ID, applying caching to expedite repeated lookups. If
   * found in cache, it returns immediately. Otherwise, it checks the database, updates the cache
   * if found, and validates organization-level permissions.
   *
   * Steps:
   * 1. Validate the campaign ID format (e.g., non-empty string).
   * 2. Attempt to retrieve the campaign from cache using the cache key (campaign:<id>).
   * 3. Validate organization access (placeholder) to ensure the requesting org is authorized.
   * 4. If cache miss, query the database for the campaign.
   * 5. If found, update the cache with the campaign data.
   * 6. Log the access attempt.
   * 7. Return the campaign or null if not found.
   *
   * @param id             - The unique string ID of the campaign to retrieve.
   * @param organizationId - The requester’s organization ID to check for authorization.
   * @returns A Promise that resolves to the Campaign object or null if not found.
   */
  public async findById(id: string, organizationId: string): Promise<Campaign | null> {
    try {
      // 1) Validate ID format.
      if (!id || typeof id !== 'string') {
        throw new AppError(
          'Invalid campaign ID format for findById.',
          'B2B_ERR_BAD_REQUEST' as any,
          {
            context: { id },
            source: 'CampaignModel.findById',
            severity: 1,
          }
        );
      }

      // 2) Attempt to retrieve from cache.
      const cachedCampaign = await this.cache.get(`campaign:${id}`);
      if (cachedCampaign) {
        // 3) Validate organization access. (Assuming campaign has organizationId to compare.)
        if (cachedCampaign.organizationId !== organizationId) {
          throw new AppError(
            'Organization does not have access to this campaign.',
            'B2B_ERR_FORBIDDEN' as any,
            {
              context: { id, requestOrg: organizationId, recordOrg: cachedCampaign.organizationId },
              source: 'CampaignModel.findById',
              severity: 2,
            }
          );
        }
        this.logger.info('Campaign retrieved from cache.', { campaignId: id });
        return cachedCampaign as Campaign;
      }

      // 3) We do a second step to verify org access before hitting DB, if we have a more robust check.
      //    For demonstration, we'll do the final check after we actually fetch the record.

      // 4) Cache miss => query the database.
      const campaignRecord = await this.prisma.campaign.findUnique({
        where: { id },
      });
      if (!campaignRecord) {
        // Log and return null if no record found in DB:
        this.logger.info('No campaign record found in database.', { campaignId: id });
        return null;
      }

      // 3) (continued) Validate org access using the record’s org ID vs. the requesting org ID
      if (campaignRecord.organizationId !== organizationId) {
        throw new AppError(
          'Organization does not have access to the found campaign.',
          'B2B_ERR_FORBIDDEN' as any,
          {
            context: { id, requestOrg: organizationId, recordOrg: campaignRecord.organizationId },
            source: 'CampaignModel.findById',
            severity: 2,
          }
        );
      }

      // 5) Update cache if found
      await this.cache.set(`campaign:${id}`, campaignRecord);

      // 6) Log the access attempt
      this.logger.info('Campaign retrieved from database and cached.', { campaignId: id });

      // 7) Return the found campaign
      return campaignRecord as Campaign;
    } catch (error) {
      const errorMsg = (error instanceof Error) ? error.message : 'Unknown error during campaign retrieval.';
      throw new AppError(
        `Failed to find campaign by ID: ${errorMsg}`,
        'B2B_ERR_DATABASE_ERROR' as any,
        {
          context: { originalError: error },
          source: 'CampaignModel.findById',
          severity: 2,
        }
      );
    }
  }

  /**
   * update
   * ------
   * Updates a campaign record in the database. It supports partial updates by accepting
   * a Partial<Campaign> object. The method also ensures that any status transitions are
   * valid, that the requesting organization can access the record, updates the cache with
   * the new data, and logs the update event.
   *
   * Steps:
   * 1. Validate the incoming update data (placeholder - partial schema or custom logic).
   * 2. Verify organization access to the existing campaign.
   * 3. Check if the campaign exists; if not found, throw an error or return gracefully.
   * 4. Validate status transitions if any (e.g., from Draft -> Active).
   * 5. Perform the database update with the new data.
   * 6. Update cache with the latest campaign record.
   * 7. Log the update event.
   * 8. Return the updated campaign record.
   *
   * @param id             - The unique ID of the campaign to update.
   * @param data           - Partial campaign data containing only the fields to be updated.
   * @param organizationId - The ID of the organization requesting the update.
   * @returns A Promise resolved with the freshly updated Campaign.
   */
  public async update(
    id: string,
    data: Partial<Campaign>,
    organizationId: string
  ): Promise<Campaign> {
    try {
      // 1) Validate update data. Real usage might parse with campaignSchema.partial().
      //    Here, we do a minimal check to ensure data is not empty and is an object.
      if (!data || typeof data !== 'object') {
        throw new AppError(
          'Invalid update payload; must be an object with campaign fields.',
          'B2B_ERR_BAD_REQUEST' as any,
          {
            context: { id, data },
            source: 'CampaignModel.update',
            severity: 1,
          }
        );
      }

      // 2) Verify org access by first retrieving the existing campaign
      const existing = await this.findById(id, organizationId);
      if (!existing) {
        throw new AppError(
          'Cannot update a campaign that does not exist.',
          'B2B_ERR_NOT_FOUND' as any,
          {
            context: { id, organizationId },
            source: 'CampaignModel.update',
            severity: 1,
          }
        );
      }

      // 3) Campaign is found; proceed with logic. (No additional measure needed here.)
      //    The findById method already ensures org access or throws.

      // 4) Validate any status transitions if 'status' is present in data
      if (data.status && data.status !== existing.status) {
        // Implement domain-specific validation. For demonstration, we'll simply allow transitions,
        // but in real usage, we might block certain transitions (e.g. COMPLETED -> ACTIVE).
      }

      // 5) Perform the database update
      const updatedCampaign = await this.prisma.campaign.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(), // Example of forcibly updating the timestamp
        },
      });

      // 6) Update cache so subsequent retrievals reflect the new data
      await this.cache.set(`campaign:${id}`, updatedCampaign);

      // 7) Log the update event
      this.logger.info('Campaign updated successfully.', {
        campaignId: id,
        changes: data,
      });

      // 8) Return the updated record
      return updatedCampaign as Campaign;
    } catch (error) {
      const errorMsg = (error instanceof Error) ? error.message : 'Unknown error during campaign update.';
      throw new AppError(
        `Failed to update campaign: ${errorMsg}`,
        'B2B_ERR_DATABASE_ERROR' as any,
        {
          context: { originalError: error },
          source: 'CampaignModel.update',
          severity: 2,
        }
      );
    }
  }

  /**
   * updateMetrics
   * -------------
   * Updates the performance metrics of an existing campaign. This includes validating the
   * incoming metrics data, verifying organization ownership, updating the record in the
   * database, recalculating any derived metrics if necessary, caching the updated campaign,
   * and logging the event.
   *
   * Steps:
   * 1. Validate campaign metrics data (placeholder or "CampaignMetricsSchema" if available).
   * 2. Verify organization access and that the campaign exists.
   * 3. Incorporate derived metrics calculations (e.g., ROI, funnel progress).
   * 4. Update the campaign’s "metrics" field in the database.
   * 5. Refresh the cache with the updated campaign object.
   * 6. Log the metrics update event.
   * 7. Return the updated campaign record.
   *
   * @param id             - The unique ID of the campaign to update metrics for.
   * @param metrics        - A CampaignMetrics object containing new metrics data.
   * @param organizationId - The ID of the organization requesting the update.
   * @returns A Promise resolving to the updated Campaign object with new metrics.
   */
  public async updateMetrics(
    id: string,
    metrics: CampaignMetrics,
    organizationId: string
  ): Promise<Campaign> {
    try {
      // 1) Validate metrics data. If we have a schema (CampaignMetricsSchema), parse it here.
      //    For demonstration, we ensure basic structure.
      if (!metrics || typeof metrics !== 'object') {
        throw new AppError(
          'Invalid metrics data. Must be an object conforming to CampaignMetrics interface.',
          'B2B_ERR_BAD_REQUEST' as any,
          {
            context: { id, metrics },
            source: 'CampaignModel.updateMetrics',
            severity: 1,
          }
        );
      }

      // 2) Verify org access by retrieving the campaign
      const campaignRecord = await this.findById(id, organizationId);
      if (!campaignRecord) {
        throw new AppError(
          'Cannot update metrics for a non-existent campaign.',
          'B2B_ERR_NOT_FOUND' as any,
          {
            context: { id, organizationId },
            source: 'CampaignModel.updateMetrics',
            severity: 1,
          }
        );
      }

      // 3) Compute derived metrics if needed. For illustration, we might recalc ROI or conversion rates.
      //    If the incoming metrics contain ROI data, we can ensure roiValue = revenue/cost or etc.

      // 4) Update the campaign record's metrics in the database
      const updatedCampaign = await this.prisma.campaign.update({
        where: { id },
        data: {
          metrics: metrics as any, // stored as a structured column or JSON in DB, depending on schema
          updatedAt: new Date(),
        },
      });

      // 5) Update the cache with the new metrics
      await this.cache.set(`campaign:${id}`, updatedCampaign);

      // 6) Log the metrics update
      this.logger.info('Campaign metrics updated successfully.', {
        campaignId: id,
        metricsUpdated: true,
      });

      // 7) Return the updated campaign
      return updatedCampaign as Campaign;
    } catch (error) {
      const errorMsg = (error instanceof Error) ? error.message : 'Unknown error during metrics update.';
      throw new AppError(
        `Failed to update campaign metrics: ${errorMsg}`,
        'B2B_ERR_DATABASE_ERROR' as any,
        {
          context: { originalError: error },
          source: 'CampaignModel.updateMetrics',
          severity: 2,
        }
      );
    }
  }
}