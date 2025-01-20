import { Request, Response } from "express"; // ^4.18.0
import { RateLimiter } from "rate-limiter-flexible"; // ^2.4.1

////////////////////////////////////////////////////////////////////////////////
// Internal Imports - Project Classes/Utilities
////////////////////////////////////////////////////////////////////////////////
import { LeadService } from "../services/lead.service";
import { AppError } from "../utils/error.util";
import { Logger } from "../utils/logger.util";
import { CacheService } from "../services/cache.service";
import { leadSchemas } from "../schemas/lead.schema";

////////////////////////////////////////////////////////////////////////////////
// Destructure Schema Validations from leadSchemas
////////////////////////////////////////////////////////////////////////////////
const { createLeadSchema, updateLeadSchema } = leadSchemas;

////////////////////////////////////////////////////////////////////////////////
// LeadController Class
// -----------------------------------------------------------------------------
// Enterprise-grade controller handling lead management HTTP endpoints with
// comprehensive security, validation, and monitoring. Addresses the JSON
// specification steps and robustly manages request processing, data flows,
// and error handling for lead creation, updating, retrieval, enrichment,
// and score recalculation.
////////////////////////////////////////////////////////////////////////////////

export class LeadController {
  /**
   * Underlying service handling the core lead methods
   * (createLead, updateLead, getLead, recalculateLeadScore, enrichLeadData).
   */
  private leadService: LeadService;

  /**
   * Winston-based or custom logger instance for structured logging of
   * info, errors, and security-critical events.
   */
  private logger: Logger;

  /**
   * Cache service (Redis-based) for storing or invalidating lead data
   * entries. Used to reduce load on the data store and ensure fast queries.
   */
  private cacheService: CacheService;

  /**
   * Rate limiter instance (using rate-limiter-flexible). This helps
   * enforce per-organization or user-level quotas on lead operations.
   */
  private rateLimiter: RateLimiter;

  /**
   * Constructs the LeadController with required dependencies.
   *
   * Steps:
   *  1) Initialize lead service instance.
   *  2) Initialize logger instance.
   *  3) Initialize cache service instance.
   *  4) Initialize rate limiter instance.
   */
  constructor(
    leadService: LeadService,
    logger: Logger,
    cacheService: CacheService,
    rateLimiter: RateLimiter
  ) {
    // 1) Store the lead service reference for subsequent method calls
    this.leadService = leadService;

    // 2) Store the logger instance for debugging, info, error logs
    this.logger = logger;

    // 3) Store the cache service instance for read/write caching operations
    this.cacheService = cacheService;

    // 4) Store the rate limiter instance for controlling requests
    this.rateLimiter = rateLimiter;
  }

  /**
   * createLead
   * ----------
   * Creates a new lead with validation and AI enrichment. Returns an HTTP
   * response containing the created lead data.
   *
   * Steps:
   *  1) Check rate limit for organization.
   *  2) Validate request body against schema.
   *  3) Extract organization ID from auth context.
   *  4) Start transaction (placeholder).
   *  5) Create lead via service.
   *  6) Trigger async enrichment.
   *  7) Commit transaction (placeholder).
   *  8) Log audit event.
   *  9) Return sanitized response.
   */
  public async createLead(req: Request, res: Response): Promise<void> {
    try {
      // 1) Check rate limit, using org ID from request headers or context
      const orgId = req.headers["x-org-id"] || "unknown-org";
      await this.rateLimiter.consume(String(orgId));

      // 2) Validate request body using createLeadSchema from leadSchemas
      const parsedBody = createLeadSchema.parse(req.body);

      // 3) Extract org ID from auth context (placeholder). If your auth system
      // uses a JWT or session, retrieve accordingly. We'll rely on a header here.
      const organizationId = String(orgId);

      // For demonstration, extracting user ID from request (placeholder)
      const userId = req.headers["x-user-id"] || "unknown-user";

      // 4) Start transaction (placeholder)
      // Real usage might integrate with a DB transaction manager
      this.logger.debug("Starting transaction for lead creation...");

      // 5) Create lead via the LeadService
      const newLead = await this.leadService.createLead(
        parsedBody,
        organizationId,
        String(userId)
      );

      // 6) Trigger async enrichment. For real usage, you might run in background
      // or via an async job queue. Here, we demonstrate immediate call.
      // If truly asynchronous, we could do a setImmediate or queue-based approach.
      setImmediate(() => {
        this.leadService.enrichLeadData(newLead).catch((err) => {
          this.logger.error("Async enrichment failed", { error: err });
        });
      });

      // 7) Commit transaction (placeholder)
      this.logger.debug("Committing transaction for lead creation...");

      // 8) Log an audit event (placeholder)
      this.logger.info("Lead creation audit event logged", {
        leadId: newLead.id,
        orgId: organizationId,
      });

      // 9) Return sanitized response. In real usage, ensure no PII or internal fields are leaked.
      res.status(201).json({
        success: true,
        data: {
          id: newLead.id,
          email: newLead.email,
          firstName: newLead.firstName,
          lastName: newLead.lastName,
          status: newLead.status,
        },
      });
    } catch (error: any) {
      // If the rate limiter or lead creation fails, handle the error
      this.logger.error("Error in createLead endpoint", { error });
      // If it's an AppError, you could respond with a particular structure
      // else respond with a generic 500
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || "An error occurred while creating lead",
      });
    }
  }

  /**
   * updateLead
   * ----------
   * Updates an existing lead with validation, security, and caching logic.
   *
   * Steps:
   *  1) Check rate limit for organization.
   *  2) Validate request body against schema.
   *  3) Verify lead belongs to organization.
   *  4) Start transaction (placeholder).
   *  5) Update lead via service.
   *  6) Invalidate cache.
   *  7) Commit transaction (placeholder).
   *  8) Log audit event.
   *  9) Return sanitized response.
   */
  public async updateLead(req: Request, res: Response): Promise<void> {
    try {
      // 1) Check rate limit
      const orgId = req.headers["x-org-id"] || "unknown-org";
      await this.rateLimiter.consume(String(orgId));

      // 2) Validate incoming body with updateLeadSchema
      const parsedBody = updateLeadSchema.parse(req.body);

      // Extract lead ID from route params
      const { leadId } = req.params;
      if (!leadId) {
        throw new AppError("Missing leadId parameter", "B2B_ERR_BAD_REQUEST" as any, {
          context: { routeParam: "leadId" },
          source: "LeadController.updateLead",
          severity: "LOW" as any,
        });
      }

      // 3) Verify lead belongs to organization (placeholder).
      // Real usage might fetch the lead or rely on leadService checks.
      const organizationId = String(orgId);
      const userId = req.headers["x-user-id"] || "unknown-user";

      // 4) Start transaction
      this.logger.debug("Starting transaction for lead update...");

      // 5) Update lead in the service
      const updatedLead = await this.leadService.updateLead(
        String(leadId),
        parsedBody,
        organizationId,
        String(userId)
      );

      // 6) Invalidate cache entry for this lead
      // Follows specification but we rename to 'delete' in the method
      await this.cacheService.delete(`lead:${leadId}`);

      // 7) Commit transaction
      this.logger.debug("Committing transaction for lead update...");

      // 8) Log an audit event
      this.logger.info("Lead update audit event logged", {
        leadId: updatedLead.id,
        orgId: organizationId,
      });

      // 9) Return a sanitized response with updated lead data
      res.status(200).json({
        success: true,
        data: {
          id: updatedLead.id,
          email: updatedLead.email,
          firstName: updatedLead.firstName,
          lastName: updatedLead.lastName,
          status: updatedLead.status,
        },
      });
    } catch (error: any) {
      this.logger.error("Error in updateLead endpoint", { error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || "An error occurred while updating lead",
      });
    }
  }

  /**
   * getLead
   * -------
   * Retrieves a lead, leveraging caching and security checks.
   *
   * Steps:
   *  1) Check rate limit for organization.
   *  2) Check cache for lead data.
   *  3) Verify lead belongs to organization.
   *  4) Retrieve lead if cache miss.
   *  5) Update cache if needed.
   *  6) Log access event.
   *  7) Return sanitized response.
   */
  public async getLead(req: Request, res: Response): Promise<void> {
    try {
      // 1) Rate limit check
      const orgId = req.headers["x-org-id"] || "unknown-org";
      await this.rateLimiter.consume(String(orgId));

      // Extract the leadId from route parameters
      const { leadId } = req.params;
      if (!leadId) {
        throw new AppError("Missing leadId parameter", "B2B_ERR_BAD_REQUEST" as any, {
          context: { routeParam: "leadId" },
          source: "LeadController.getLead",
          severity: "LOW" as any,
        });
      }

      // Construct the cache key
      const cacheKey = `lead:${leadId}`;

      // 2) Check cache
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData) {
        // 3) Verify lead belongs to organization (placeholder)
        // This check would occur in a robust environment
        // 6) Log access
        this.logger.info("Lead retrieved from cache", {
          leadId,
          orgId: String(orgId),
        });

        // 7) Return sanitized lead
        return res.status(200).json({
          success: true,
          data: {
            id: cachedData.id,
            email: cachedData.email,
            firstName: cachedData.firstName,
            lastName: cachedData.lastName,
            status: cachedData.status,
          },
        });
      }

      // 4) Retrieve from lead service if cache miss
      const organizationId = String(orgId);
      // The leadService getLead signature: getLead(leadId: string, organizationId: string): Promise<Lead | null>
      const lead = await this.leadService.getLead(String(leadId), organizationId);
      if (!lead) {
        // If not found at all
        return res.status(404).json({
          success: false,
          message: "Lead not found or does not belong to your organization",
        });
      }

      // 5) Update cache with fresh data
      await this.cacheService.set(cacheKey, lead);

      // 6) Log access event
      this.logger.info("Lead retrieval from DB success, cache updated", {
        leadId,
        orgId: organizationId,
      });

      // 7) Return sanitized lead data
      res.status(200).json({
        success: true,
        data: {
          id: lead.id,
          email: lead.email,
          firstName: lead.firstName,
          lastName: lead.lastName,
          status: lead.status,
        },
      });
    } catch (error: any) {
      this.logger.error("Error in getLead endpoint", { error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || "An error occurred while retrieving lead",
      });
    }
  }

  /**
   * enrichLead
   * ----------
   * Triggers AI-based enrichment on a lead with security checks and caching logic.
   *
   * Steps:
   *  1) Check rate limit for organization.
   *  2) Verify lead belongs to organization.
   *  3) Trigger async enrichment.
   *  4) Invalidate cache.
   *  5) Log enrichment event.
   *  6) Return accepted status.
   */
  public async enrichLead(req: Request, res: Response): Promise<void> {
    try {
      // 1) Rate limit
      const orgId = req.headers["x-org-id"] || "unknown-org";
      await this.rateLimiter.consume(String(orgId));

      // Extract leadId from param
      const { leadId } = req.params;
      if (!leadId) {
        throw new AppError("Missing leadId parameter", "B2B_ERR_BAD_REQUEST" as any, {
          context: { routeParam: "leadId" },
          source: "LeadController.enrichLead",
          severity: "LOW" as any,
        });
      }

      // 2) For demonstration, we rely on the leadService itself to confirm ownership if it needs to
      const organizationId = String(orgId);
      const userId = req.headers["x-user-id"] || "unknown-user";

      // 3) Trigger async enrichment
      // We'll do this asynchronously so the request is not blocked
      setImmediate(async () => {
        try {
          await this.leadService.enrichLeadData(String(leadId), organizationId, String(userId));
          this.logger.info("Lead enrichment completed", { leadId, orgId: organizationId });
        } catch (err) {
          this.logger.error("Async lead enrichment error", { error: err });
        }
      });

      // 4) Invalidate the cache if lead is present there
      await this.cacheService.delete(`lead:${leadId}`);

      // 5) Log the enrichment event
      this.logger.info("Lead enrichment requested", { leadId, orgId: organizationId });

      // 6) Return accepted status quickly so the client is not waiting
      res.status(202).json({
        success: true,
        message: "Lead enrichment triggered successfully",
      });
    } catch (error: any) {
      this.logger.error("Error in enrichLead endpoint", { error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || "Failed to initiate lead enrichment",
      });
    }
  }

  /**
   * recalculateScore
   * ----------------
   * Recalculates a lead's AI-based score with security and caching steps.
   *
   * Steps:
   *  1) Check rate limit for organization.
   *  2) Verify lead belongs to organization.
   *  3) Trigger score recalculation.
   *  4) Invalidate cache.
   *  5) Log scoring event.
   *  6) Return new score.
   */
  public async recalculateScore(req: Request, res: Response): Promise<void> {
    try {
      // 1) Check rate limit
      const orgId = req.headers["x-org-id"] || "unknown-org";
      await this.rateLimiter.consume(String(orgId));

      // Extract leadId from parameters
      const { leadId } = req.params;
      if (!leadId) {
        throw new AppError("Missing leadId parameter", "B2B_ERR_BAD_REQUEST" as any, {
          context: { routeParam: "leadId" },
          source: "LeadController.recalculateScore",
          severity: "LOW" as any,
        });
      }

      // 2) If you need to verify the lead's ownership, the lead service can handle
      // that with getLead or an internal method. We'll proceed with the assumption
      // that lead belongs to the same org as orgId
      const organizationId = String(orgId);
      const userId = req.headers["x-user-id"] || "unknown-user";

      // 3) Trigger the AI-based score recalculation
      const updatedLead = await this.leadService.recalculateLeadScore(
        String(leadId),
        organizationId,
        String(userId)
      );

      // 4) Invalidate the relevant cache entry to ensure fresh data next fetch
      await this.cacheService.delete(`lead:${leadId}`);

      // 5) Log the event
      this.logger.info("Lead score recalculation event", {
        leadId,
        orgId: organizationId,
        newScore: updatedLead.score,
      });

      // 6) Return the new score to the client
      res.status(200).json({
        success: true,
        data: {
          leadId: updatedLead.id,
          newScore: updatedLead.score,
          status: updatedLead.status,
        },
      });
    } catch (error: any) {
      this.logger.error("Error in recalculateScore endpoint", { error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || "Failed to recalculate lead score",
      });
    }
  }
}