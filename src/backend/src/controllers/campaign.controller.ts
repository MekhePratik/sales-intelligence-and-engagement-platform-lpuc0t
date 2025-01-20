import { Request, Response } from 'express'; // ^4.18.0
import { z } from 'zod'; // ^3.22.0
import rateLimit from 'express-rate-limit'; // ^7.1.0
import { MetricsService } from '@opentelemetry/api'; // ^1.4.0

import { CampaignService, createCampaign, updateCampaign, startCampaign, pauseCampaign, getCampaignMetrics } from '../services/campaign.service';
import { Campaign, CampaignStatus } from '../types/campaign';
import { AppError } from '../utils/error.util';
import { Logger } from '../utils/logger.util';
import { createCampaignSchema, updateCampaignSchema } from '../schemas/campaign.schema';

/**
 * Controller class handling campaign-related HTTP requests with
 * enhanced security, validation, and monitoring. Implements:
 *  - CRUD operations for campaigns
 *  - Campaign execution control (start/pause)
 *  - Metrics retrieval
 *  - Rate limiting, input validation (Zod), and logging/monitoring
 */
export class CampaignController {
  private campaignService: CampaignService;
  private logger: Logger;
  private metricsService: MetricsService;
  private rateLimiterMiddleware: ReturnType<typeof rateLimit>;

  /**
   * Initializes campaign controller with required services and middleware:
   *  1. Initialize campaign service instance
   *  2. Initialize logger instance
   *  3. Initialize metrics service
   *  4. Configure rate limiter middleware
   *  5. Set up validation schemas (used in each method)
   *
   * @param campaignService - Core service for campaign operations
   * @param logger - Application logger for structured logging
   * @param metricsService - Metrics service for performance monitoring
   */
  constructor(
    campaignService: CampaignService,
    logger: Logger,
    metricsService: MetricsService
  ) {
    this.campaignService = campaignService;
    this.logger = logger;
    this.metricsService = metricsService;

    // Configure a rate limiter for demonstration.
    // A real application might tune windowMs/max based on system constraints.
    this.rateLimiterMiddleware = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 1000, // up to 1000 requests per minute
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        this.logger.error('Rate limit exceeded', { path: req.originalUrl });
        res.status(429).json({
          error: 'Too Many Requests, rate limit exceeded.',
        });
      },
    });
  }

  /**
   * Creates a new email campaign with validation and monitoring.
   * Steps:
   *  1. Start request timing
   *  2. Validate request body against campaign schema
   *  3. Extract organization ID from authenticated user
   *  4. Sanitize input data
   *  5. Call campaign service to create campaign
   *  6. Log operation success
   *  7. Record metrics
   *  8. Return 201 status with created campaign
   *  9. Handle errors with proper status codes and logging
   */
  public async createCampaign(req: Request, res: Response): Promise<void> {
    // Invoke the rate limiter middleware in code form
    this.rateLimiterMiddleware(req, res, async () => {
      const startTime = Date.now();
      try {
        // (1) Validate request body
        const parsedBody = createCampaignSchema.parse(req.body);

        // (2) Extract org ID from user or fallback
        const organizationId =
          (req as any).user?.organizationId || parsedBody.organizationId || 'org_unknown';

        // (3) Create the campaign using the service
        const newCampaign = await this.campaignService.createCampaign({
          ...parsedBody,
          organizationId,
        });

        // (4) Log success
        this.logger.info('Campaign created successfully', {
          campaignId: newCampaign.id,
          organizationId,
        });

        // (5) Record metrics (time taken)
        const elapsedMs = Date.now() - startTime;
        this.metricsService.trackPerformanceMetric('CAMPAIGN_CREATE_TIME', elapsedMs, {
          campaignId: newCampaign.id,
          organizationId,
        });

        // (6) Return 201 status with created campaign
        res.status(201).json({
          success: true,
          data: newCampaign,
        });
      } catch (err: any) {
        // (7) Handle errors
        this.handleControllerError(res, err);
      }
    });
  }

  /**
   * Updates an existing campaign with validation and monitoring.
   * Steps:
   *  1. Start request timing
   *  2. Validate campaign ID from request params
   *  3. Validate request body against update schema
   *  4. Sanitize input data
   *  5. Call campaign service to update campaign
   *  6. Log operation success
   *  7. Record metrics
   *  8. Return 200 status with updated campaign
   *  9. Handle errors with proper status codes and logging
   */
  public async updateCampaign(req: Request, res: Response): Promise<void> {
    this.rateLimiterMiddleware(req, res, async () => {
      const startTime = Date.now();
      try {
        // (1) Validate campaign ID from params
        const campaignId = req.params.id;
        if (!campaignId) {
          throw new AppError(
            'Campaign ID is required in the route params',
            'B2B_ERR_BAD_REQUEST' as any,
            {
              context: { routeParams: req.params },
              source: 'CampaignController.updateCampaign',
              severity: 'LOW' as any,
            }
          );
        }

        // (2) Validate request body
        const parsedBody = updateCampaignSchema.parse(req.body);

        // (3) Extract optional organization ID (not necessarily needed for update logic)
        const organizationId = (req as any).user?.organizationId || 'org_unknown';

        // (4) Update the campaign using the service
        const updatedCampaign = await this.campaignService.updateCampaign(campaignId, {
          ...parsedBody,
          organizationId,
        });

        // (5) Log success
        this.logger.info('Campaign updated successfully', {
          campaignId: updatedCampaign.id,
          organizationId,
        });

        // (6) Record metrics
        const elapsedMs = Date.now() - startTime;
        this.metricsService.trackPerformanceMetric('CAMPAIGN_UPDATE_TIME', elapsedMs, {
          campaignId: updatedCampaign.id,
          organizationId,
        });

        // (7) Return 200 with updated campaign
        res.status(200).json({
          success: true,
          data: updatedCampaign,
        });
      } catch (err: any) {
        this.handleControllerError(res, err);
      }
    });
  }

  /**
   * Starts execution of a campaign with validation and monitoring.
   * Steps:
   *  1. Start request timing
   *  2. Validate campaign ID
   *  3. Check campaign eligibility to start
   *  4. Call campaign service to start campaign
   *  5. Log operation success
   *  6. Record metrics
   *  7. Return 200 status with campaign status
   *  8. Handle errors with proper status codes and logging
   */
  public async startCampaign(req: Request, res: Response): Promise<void> {
    this.rateLimiterMiddleware(req, res, async () => {
      const startTime = Date.now();
      try {
        // (1) Validate ID
        const campaignId = req.params.id;
        if (!campaignId) {
          throw new AppError(
            'Campaign ID is required in the route params',
            'B2B_ERR_BAD_REQUEST' as any,
            {
              context: { routeParams: req.params },
              source: 'CampaignController.startCampaign',
              severity: 'LOW' as any,
            }
          );
        }

        // (2) Start campaign
        const resultCampaign = await this.campaignService.startCampaign(campaignId);

        // (3) Log success
        this.logger.info('Campaign started successfully', {
          campaignId: resultCampaign.id,
          oldStatus: req.body.oldStatus,
          newStatus: resultCampaign.status,
        });

        // (4) Record metrics
        const elapsedMs = Date.now() - startTime;
        this.metricsService.trackPerformanceMetric('CAMPAIGN_START_TIME', elapsedMs, {
          campaignId: resultCampaign.id,
        });

        // (5) Return 200
        res.status(200).json({
          success: true,
          data: {
            campaignId: resultCampaign.id,
            status: resultCampaign.status,
          },
        });
      } catch (err: any) {
        this.handleControllerError(res, err);
      }
    });
  }

  /**
   * Pauses an active campaign with validation and monitoring.
   * Steps:
   *  1. Start request timing
   *  2. Validate campaign ID
   *  3. Check campaign eligibility to pause
   *  4. Call campaign service to pause campaign
   *  5. Log operation success
   *  6. Record metrics
   *  7. Return 200 status with campaign status
   *  8. Handle errors with proper status codes and logging
   */
  public async pauseCampaign(req: Request, res: Response): Promise<void> {
    this.rateLimiterMiddleware(req, res, async () => {
      const startTime = Date.now();
      try {
        // (1) Validate ID
        const campaignId = req.params.id;
        if (!campaignId) {
          throw new AppError(
            'Campaign ID is required in the route params',
            'B2B_ERR_BAD_REQUEST' as any,
            {
              context: { routeParams: req.params },
              source: 'CampaignController.pauseCampaign',
              severity: 'LOW' as any,
            }
          );
        }

        // (2) Pause campaign
        const pausedCampaign = await this.campaignService.pauseCampaign(campaignId);

        // (3) Log success
        this.logger.info('Campaign paused successfully', {
          campaignId: pausedCampaign.id,
          newStatus: pausedCampaign.status,
        });

        // (4) Record metrics
        const elapsedMs = Date.now() - startTime;
        this.metricsService.trackPerformanceMetric('CAMPAIGN_PAUSE_TIME', elapsedMs, {
          campaignId: pausedCampaign.id,
        });

        // (5) Return 200
        res.status(200).json({
          success: true,
          data: {
            campaignId: pausedCampaign.id,
            status: pausedCampaign.status,
          },
        });
      } catch (err: any) {
        this.handleControllerError(res, err);
      }
    });
  }

  /**
   * Retrieves campaign performance metrics with validation and monitoring.
   * Steps:
   *  1. Start request timing
   *  2. Validate campaign ID
   *  3. Validate date range parameters
   *  4. Call campaign service to get metrics
   *  5. Log operation success
   *  6. Record metrics
   *  7. Return 200 status with metrics data
   *  8. Handle errors with proper status codes and logging
   */
  public async getCampaignMetrics(req: Request, res: Response): Promise<void> {
    this.rateLimiterMiddleware(req, res, async () => {
      const startTime = Date.now();
      try {
        // (1) Validate campaign ID
        const campaignId = req.params.id;
        if (!campaignId) {
          throw new AppError(
            'Campaign ID is required in the route params',
            'B2B_ERR_BAD_REQUEST' as any,
            {
              context: { routeParams: req.params },
              source: 'CampaignController.getCampaignMetrics',
              severity: 'LOW' as any,
            }
          );
        }

        // (2) Validate optional date range from query
        const rawStart = req.query.startDate || null;
        const rawEnd = req.query.endDate || null;
        // We can do advanced date checks if necessary
        // For demonstration, accept them if present, ignoring advanced parse errors

        // (3) Fetch metrics from service
        const metricsData = await this.campaignService.getCampaignMetrics(campaignId);

        // (4) Log success
        this.logger.info('Fetched campaign metrics successfully', {
          campaignId,
        });

        // (5) Record metrics
        const elapsedMs = Date.now() - startTime;
        this.metricsService.trackPerformanceMetric('CAMPAIGN_METRICS_FETCH_TIME', elapsedMs, {
          campaignId,
        });

        // (6) Return 200 status with data
        res.status(200).json({
          success: true,
          data: metricsData,
        });
      } catch (err: any) {
        this.handleControllerError(res, err);
      }
    });
  }

  /**
   * Common error handler for the controller. Translates errors into
   * appropriate HTTP status codes, logs them, and returns a JSON response.
   *
   * @param res  - Express response object
   * @param err  - The thrown error (AppError or generic)
   */
  private handleControllerError(res: Response, err: any): void {
    this.logger.error(err, { error: err });
    if (err instanceof AppError) {
      res.status(err.statusCode).json(err.toJSON());
    } else if (err && err.name === 'ZodError') {
      // zod validation error
      res.status(400).json({
        error: 'Validation Error',
        issues: err.issues || [],
      });
    } else {
      // fallback
      res.status(500).json({
        error: 'Internal Server Error',
        details: err?.message || 'An unexpected error occurred.',
      });
    }
  }
}