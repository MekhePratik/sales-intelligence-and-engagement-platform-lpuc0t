import { Request, Response } from 'express'; // express@^4.18.2
import rateLimit from 'express-rate-limit'; // express-rate-limit@^6.7.0
import { AuditLogger } from '@company/audit-logger'; // @company/audit-logger@^1.0.0

/**
 * Internal Imports
 */
import {
  OrganizationService,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganization,
  getOrganizationByDomain,
} from '../services/organization.service';
import { AppError } from '../utils/error.util';
import { MetricsCollector } from '../utils/metrics.util';

/**
 * OrganizationController
 * ----------------------------------------------------------------------------
 * Controller class handling HTTP requests for organization management with enhanced
 * security, data integrity, multi-tenant isolation, and performance monitoring.
 *
 * Requirements Addressed:
 *  1) Multi-tenant Support  -> Ensures organization-level data isolation
 *  2) Data Security         -> Implements security validations, error handling, and classification
 *  3) Performance Monitoring -> Tracks API response times and usage through metrics
 *
 * Decorators (conceptual as per specification):
 *  @controller('/api/v1/organizations')
 */
export class OrganizationController {
  /**
   * Properties:
   *  - organizationService: Core organization management service
   *  - metricsCollector: Utility class for performance monitoring
   *  - auditLogger: Logging utility for security audits (creation, updates, etc.)
   *
   * We also define a rateLimiter property to apply request rate limiting
   * on certain controller methods (per specification).
   */
  private rateLimiter;
  private organizationService: OrganizationService;
  private metricsCollector: MetricsCollector;
  private auditLogger: AuditLogger;

  /**
   * Constructor
   * ----------------------------------------------------------------------------
   * Initializes the organization controller with required dependencies.
   * Steps (as per JSON specification):
   *  1) Initialize organization service instance
   *  2) Initialize metrics collector
   *  3) Initialize audit logger
   *  4) Set up rate limiting configuration
   *  5) Bind class methods to maintain context
   */
  constructor(
    organizationService: OrganizationService,
    metricsCollector: MetricsCollector,
    auditLogger: AuditLogger,
  ) {
    // 1) Initialize organization service instance
    this.organizationService = organizationService;

    // 2) Initialize metrics collector
    this.metricsCollector = metricsCollector;

    // 3) Initialize audit logger
    this.auditLogger = auditLogger;

    // 4) Set up rate limiting configuration @rateLimit({ windowMs: 60000, max: 10 })
    //    This enforces a maximum of 10 requests per minute for certain operations.
    this.rateLimiter = rateLimit({
      windowMs: 60000, // 1 minute
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many organization requests from this IP, please try again later.',
      },
    });

    // 5) Bind class methods to maintain context
    this.createOrganization = this.createOrganization.bind(this);
    this.updateOrganization = this.updateOrganization.bind(this);
    this.deleteOrganization = this.deleteOrganization.bind(this);
    this.getOrganization = this.getOrganization.bind(this);
    this.getOrganizationByDomain = this.getOrganizationByDomain.bind(this);
  }

  /**
   * createOrganization
   * ----------------------------------------------------------------------------
   * Creates a new organization with security validation and monitoring.
   *
   * Steps (as per JSON specification):
   *  1) Start performance tracking
   *  2) Validate request body against schema
   *  3) Check for duplicate organization
   *  4) Sanitize input data
   *  5) Call organization service to create organization
   *  6) Log audit event for organization creation
   *  7) Record performance metrics
   *  8) Return 201 status with created organization
   *
   * Decorators (conceptual as per specification):
   *  @asyncHandler
   *  @validate(createOrganizationSchema)
   *  @rateLimit({ windowMs: 60000, max: 10 })
   *
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> (Sends HTTP response with created organization)
   */
  public async createOrganization(req: Request, res: Response): Promise<void> {
    // 1) Start performance tracking - e.g., track an API response start event
    this.metricsCollector.trackApiResponse('createOrganization:start', { path: req.path });

    try {
      // 2) Validate request body - (conceptually referencing a schema)
      //    For demonstration, we assume minimal shape: { name, domain, settings }
      const { name, domain, settings } = req.body || {};

      if (!name || !domain) {
        // If request is invalid, throw an AppError or respond with 400
        throw new AppError(
          'Missing required fields: name or domain',
          'B2B_ERR_BAD_REQUEST',
          {
            context: { requestBody: req.body },
            source: 'OrganizationController.createOrganization',
            severity: 2, // MEDIUM
          },
        );
      }

      // 3) Check for duplicate organization
      //    We can do a quick check for existing org by domain to avoid conflicts
      const foundOrg = await this.organizationService.getOrganizationByDomain(domain, {
        userId: 'system', // example security context
        requestIp: req.ip,
      });
      if (foundOrg) {
        // If found, conflict
        throw new AppError(
          `Organization with domain ${domain} already exists`,
          'B2B_ERR_CONFLICT',
          {
            context: { domain },
            source: 'OrganizationController.createOrganization',
            severity: 2, // MEDIUM
          },
        );
      }

      // 4) Sanitize input data (example: trimming name/domain)
      const sanitizedName = name.trim();
      const sanitizedDomain = domain.trim();

      // 5) Call organization service to create organization
      const newOrg = await this.organizationService.createOrganization(
        {
          name: sanitizedName,
          domain: sanitizedDomain,
          settings: settings || {},
        },
        {
          userId: 'system', // could be from auth
          requestIp: req.ip,
        },
      );

      // 6) Log audit event for organization creation
      //    The specification references an AuditLogger from @company/audit-logger
      this.auditLogger.log({
        action: 'organization_created',
        timestamp: new Date().toISOString(),
        userId: 'system', // example; real usage may come from auth
        details: `New organization created with ID: ${newOrg.id}, domain: ${newOrg.domain}`,
      });

      // 7) Record performance metrics
      //    We can record a custom metric to indicate successful creation
      this.metricsCollector.recordMetric('organization.create.success', 1, {
        orgId: newOrg.id,
        domain: newOrg.domain,
      });

      // 8) Return 201 created with the new organization
      res.status(201).json({ organization: newOrg });
    } catch (error) {
      // If it's an AppError, use its toJSON() to avoid exposing stack/sensitive info
      if (error instanceof AppError) {
        // Possibly log or track metric
        this.metricsCollector.recordMetric('organization.create.failure', 1, {
          errorCode: error.code,
          path: req.path,
        });
        return res.status(error.statusCode).json(error.toJSON());
      }

      // Fallback for unknown errors
      this.metricsCollector.recordMetric('organization.create.failure', 1, {
        errorMessage: (error as Error)?.message || 'unknown',
        path: req.path,
      });
      return res.status(500).json({ error: 'Internal Server Error', details: error });
    } finally {
      // End performance tracking
      this.metricsCollector.trackApiResponse('createOrganization:end', { path: req.path });
    }
  }

  /**
   * updateOrganization
   * ----------------------------------------------------------------------------
   * Updates an existing organization. Supports partial updates for name or settings.
   *
   * Typical steps:
   *  1) Start performance tracking
   *  2) Parse and validate route parameters (e.g., organization ID) and request body
   *  3) Call organization service to update organization
   *  4) Log security or audit event
   *  5) Record performance metrics
   *  6) Return updated organization or error
   */
  public async updateOrganization(req: Request, res: Response): Promise<void> {
    // 1) Start performance tracking
    this.metricsCollector.trackApiResponse('updateOrganization:start', { path: req.path });

    try {
      // 2) Parse and validate
      const { id } = req.params;
      const { name, settings } = req.body || {};

      if (!id) {
        throw new AppError(
          'Missing organization ID in request params',
          'B2B_ERR_BAD_REQUEST',
          {
            context: { params: req.params },
            source: 'OrganizationController.updateOrganization',
            severity: 2,
          },
        );
      }

      // 3) Call organization service to update organization
      const updated = await this.organizationService.updateOrganization(
        id,
        {
          ...(name !== undefined ? { name } : {}),
          ...(settings !== undefined ? { settings } : {}),
        },
        {
          userId: 'system',
          requestIp: req.ip,
        },
      );

      // 4) Log audit event
      this.auditLogger.log({
        action: 'organization_updated',
        timestamp: new Date().toISOString(),
        userId: 'system',
        details: `Organization updated with ID: ${updated.id}, name: ${updated.name}`,
      });

      // 5) Record performance metrics
      this.metricsCollector.recordMetric('organization.update.success', 1, {
        orgId: updated.id,
      });

      // 6) Return updated organization
      res.status(200).json({ organization: updated });
    } catch (error) {
      if (error instanceof AppError) {
        this.metricsCollector.recordMetric('organization.update.failure', 1, {
          errorCode: error.code,
          path: req.path,
        });
        return res.status(error.statusCode).json(error.toJSON());
      }
      this.metricsCollector.recordMetric('organization.update.failure', 1, {
        errorMessage: (error as Error)?.message || 'unknown',
        path: req.path,
      });
      return res.status(500).json({ error: 'Internal Server Error', details: error });
    } finally {
      this.metricsCollector.trackApiResponse('updateOrganization:end', { path: req.path });
    }
  }

  /**
   * deleteOrganization
   * ----------------------------------------------------------------------------
   * Deletes (soft deletion) an organization by ID. Multipurpose for multi-tenant data
   * removal or isolation updates.
   *
   * Steps:
   *  1) Start performance tracking
   *  2) Validate organization ID
   *  3) Call service to perform soft delete
   *  4) Log security event
   *  5) Record performance metrics
   *  6) Return success or error
   */
  public async deleteOrganization(req: Request, res: Response): Promise<void> {
    // 1) Start performance tracking
    this.metricsCollector.trackApiResponse('deleteOrganization:start', { path: req.path });

    try {
      // 2) Validate org ID
      const { id } = req.params;
      if (!id) {
        throw new AppError(
          'Missing organization ID in request params',
          'B2B_ERR_BAD_REQUEST',
          {
            context: { params: req.params },
            source: 'OrganizationController.deleteOrganization',
            severity: 2,
          },
        );
      }

      // 3) Service call
      await this.organizationService.deleteOrganization(
        id,
        {
          userId: 'system',
          requestIp: req.ip,
        },
      );

      // 4) Log security event
      this.auditLogger.log({
        action: 'organization_deleted',
        timestamp: new Date().toISOString(),
        userId: 'system',
        details: `Organization deleted with ID: ${id}`,
      });

      // 5) Record performance metrics
      this.metricsCollector.recordMetric('organization.delete.success', 1, {
        orgId: id,
      });

      // 6) Return success
      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        this.metricsCollector.recordMetric('organization.delete.failure', 1, {
          errorCode: error.code,
          path: req.path,
        });
        return res.status(error.statusCode).json(error.toJSON());
      }
      this.metricsCollector.recordMetric('organization.delete.failure', 1, {
        errorMessage: (error as Error)?.message || 'unknown',
        path: req.path,
      });
      return res.status(500).json({ error: 'Internal Server Error', details: error });
    } finally {
      this.metricsCollector.trackApiResponse('deleteOrganization:end', { path: req.path });
    }
  }

  /**
   * getOrganization
   * ----------------------------------------------------------------------------
   * Retrieves an organization by ID for multi-tenant data isolation. Returns 404 if not found.
   *
   * Steps:
   *  1) Start performance tracking
   *  2) Validate org ID
   *  3) Call service to retrieve
   *  4) Return data or 404 if not found
   *  5) Record performance metrics
   */
  public async getOrganization(req: Request, res: Response): Promise<void> {
    this.metricsCollector.trackApiResponse('getOrganization:start', { path: req.path });

    try {
      // 2) Validate ID
      const { id } = req.params;
      if (!id) {
        throw new AppError(
          'Missing organization ID in request params',
          'B2B_ERR_BAD_REQUEST',
          {
            context: { params: req.params },
            source: 'OrganizationController.getOrganization',
            severity: 2,
          },
        );
      }

      // 3) Call service
      const org = await this.organizationService.getOrganization(
        id,
        {
          userId: 'system',
          requestIp: req.ip,
        },
      );
      if (!org) {
        // typical 404
        return res.status(404).json({ error: `Organization with ID ${id} not found.` });
      }

      // 5) Record success metric
      this.metricsCollector.recordMetric('organization.get.success', 1, {
        orgId: org.id,
      });

      // 4) Return data
      res.status(200).json({ organization: org });
    } catch (error) {
      if (error instanceof AppError) {
        this.metricsCollector.recordMetric('organization.get.failure', 1, {
          errorCode: error.code,
          path: req.path,
        });
        return res.status(error.statusCode).json(error.toJSON());
      }
      this.metricsCollector.recordMetric('organization.get.failure', 1, {
        errorMessage: (error as Error)?.message || 'unknown',
        path: req.path,
      });
      return res.status(500).json({ error: 'Internal Server Error', details: error });
    } finally {
      this.metricsCollector.trackApiResponse('getOrganization:end', { path: req.path });
    }
  }

  /**
   * getOrganizationByDomain
   * ----------------------------------------------------------------------------
   * Retrieves an organization by domain name with multi-tenant checks. Useful for
   * domain-based routing or environment identification.
   *
   * Steps:
   *  1) Start performance tracking
   *  2) Validate domain param
   *  3) Service call to find by domain
   *  4) Record performance metrics
   *  5) Return 404 or organization
   */
  public async getOrganizationByDomain(req: Request, res: Response): Promise<void> {
    this.metricsCollector.trackApiResponse('getOrganizationByDomain:start', { path: req.path });

    try {
      // 2) Validate domain
      const { domain } = req.query;
      if (!domain || typeof domain !== 'string') {
        throw new AppError(
          'Missing or invalid domain query parameter',
          'B2B_ERR_BAD_REQUEST',
          {
            context: { query: req.query },
            source: 'OrganizationController.getOrganizationByDomain',
            severity: 2,
          },
        );
      }

      // 3) Service call
      const org = await this.organizationService.getOrganizationByDomain(
        domain,
        {
          userId: 'system',
          requestIp: req.ip,
        },
      );

      if (!org) {
        return res.status(404).json({ error: `No organization found for domain: ${domain}` });
      }

      // 4) Record success metric
      this.metricsCollector.recordMetric('organization.getByDomain.success', 1, {
        domain,
        orgId: org.id,
      });

      // 5) Return org or 404
      res.status(200).json({ organization: org });
    } catch (error) {
      if (error instanceof AppError) {
        this.metricsCollector.recordMetric('organization.getByDomain.failure', 1, {
          errorCode: error.code,
          path: req.path,
        });
        return res.status(error.statusCode).json(error.toJSON());
      }
      this.metricsCollector.recordMetric('organization.getByDomain.failure', 1, {
        errorMessage: (error as Error)?.message || 'unknown',
        path: req.path,
      });
      return res.status(500).json({ error: 'Internal Server Error', details: error });
    } finally {
      this.metricsCollector.trackApiResponse('getOrganizationByDomain:end', { path: req.path });
    }
  }
}

// The JSON specification requires we expose the OrganizationController class
// with methods: createOrganization, updateOrganization, deleteOrganization,
// getOrganization, getOrganizationByDomain. These are included above in detail.