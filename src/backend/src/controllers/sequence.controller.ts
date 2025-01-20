import { Request, Response, NextFunction } from 'express'; // express@^4.18.0
import { SequenceService } from '../services/sequence.service';
import { Sequence } from '../types/sequence';
import { AppError } from '../utils/error.util';
import { Logger } from '../utils/logger.util';
import { sequenceSchema } from '../schemas/sequence.schema';

/**
 * SequenceController
 * ------------------
 * Controller class responsible for handling HTTP requests related to
 * email sequences in the B2B sales intelligence platform. Leverages the
 * SequenceService for core logic such as creation, updating, and state
 * transitions (start/pause). Provides detailed logs and robust error
 * handling while ensuring validation and security checks.
 */
export class SequenceController {
  /**
   * A reference to the core sequence service that manages
   * sequence CRUD, advanced logic, and integrations.
   */
  private sequenceService: SequenceService;

  /**
   * A logger instance used for structured, enterprise-grade logging
   * of all main events and errors occurring in this controller.
   */
  private logger: Logger;

  /**
   * Constructs the SequenceController with required dependencies.
   * @param sequenceService An instance of SequenceService for sequence operations.
   * @param logger A Logger instance for monitoring and error/debug messages.
   */
  constructor(sequenceService: SequenceService, logger: Logger) {
    // Initialize property references
    this.sequenceService = sequenceService;
    this.logger = logger;

    // Bind public methods to maintain correct 'this' context if needed
    this.createSequence = this.createSequence.bind(this);
    this.updateSequence = this.updateSequence.bind(this);
    this.startSequence = this.startSequence.bind(this);
    this.pauseSequence = this.pauseSequence.bind(this);
  }

  /**
   * createSequence
   * --------------
   * HTTP POST controller method to create a new email sequence.
   * Follows the steps:
   *  1) Validate request body against sequenceSchema.
   *  2) Check user authorization for sequence creation (placeholder).
   *  3) Sanitize input data.
   *  4) Call sequence service to create sequence.
   *  5) Log successful creation.
   *  6) Return HTTP 201 with the created sequence data.
   *  7) Handle errors properly via catch -> next().
   *
   * @param req Express Request (must contain sequence data in req.body).
   * @param res Express Response.
   * @param next Express NextFunction for error propagation.
   */
  public async createSequence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1) Validate request body using zod schema
      const parsedSequence = sequenceSchema.parse(req.body);

      // 2) Authorization check (placeholder example)
      //    In a real system, check user roles, permissions, etc.
      if (!req.user) {
        throw new AppError(
          'Unauthorized to create sequence',
          'B2B_ERR_UNAUTHORIZED' as any,
          {
            context: { user: 'missing' },
            source: 'SequenceController.createSequence',
            severity: 'MEDIUM' as any
          }
        );
      }

      // 3) Sanitize input data (basic demonstration)
      const sanitizedData = { ...parsedSequence };

      // 4) Call service to create sequence
      //    Typically, we'd retrieve org from user context or route param.
      const organizationId = (req as any).user?.organizationId ?? 'dummy-org-id';
      const createdSequence: Sequence = await this.sequenceService.createSequence(sanitizedData, organizationId);

      // 5) Log success
      this.logger.info('Sequence created successfully', {
        sequenceId: createdSequence.id,
        userId: (req as any).user?.id ?? 'unknown'
      });

      // 6) Return 201 with the created sequence
      res.status(201).json({ data: createdSequence });
    } catch (error: any) {
      // 7) Handle errors
      this.logger.error(error, { location: 'SequenceController.createSequence' });
      return next(error);
    }
  }

  /**
   * updateSequence
   * --------------
   * HTTP PATCH/PUT controller method to update an existing email sequence.
   * Follows the steps:
   *  1) Validate request parameters (e.g., sequenceId) and request body.
   *  2) Check user authorization for sequence update (placeholder).
   *  3) Verify ownership or relevant security checks (placeholder).
   *  4) Sanitize input data.
   *  5) Call sequence service to update sequence.
   *  6) Log successful update.
   *  7) Return HTTP 200 with updated data.
   *  8) Handle errors properly via catch -> next().
   *
   * @param req Express Request (sequence ID param, partial update data in body).
   * @param res Express Response.
   * @param next Express NextFunction for error handling.
   */
  public async updateSequence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1) Validate request param "id" presence
      const { id } = req.params;
      if (!id) {
        throw new AppError(
          'Missing sequence ID in path parameters',
          'B2B_ERR_BAD_REQUEST' as any,
          {
            context: { paramId: id },
            source: 'SequenceController.updateSequence',
            severity: 'MEDIUM' as any
          }
        );
      }

      // Here we could also partially validate req.body with a partial schema if needed.

      // 2) Authorization check (placeholder)
      if (!req.user) {
        throw new AppError(
          'Unauthorized to update sequence',
          'B2B_ERR_UNAUTHORIZED' as any,
          {
            context: { user: 'missing' },
            source: 'SequenceController.updateSequence',
            severity: 'MEDIUM' as any
          }
        );
      }

      // 3) Verify ownership (placeholder example)
      //    In real usage, we might check if the userId matches the sequence owner.
      //    We'll skip the actual check here.

      // 4) Sanitize input data
      const updateData = { ...req.body };

      // 5) Call sequence service to perform the update
      const updatedSeq = await this.sequenceService.updateSequence(id, updateData);

      // 6) Log successful update
      this.logger.info('Sequence updated successfully', {
        sequenceId: updatedSeq.id,
        userId: (req as any).user?.id ?? 'unknown'
      });

      // 7) Return 200 with updated sequence data
      res.status(200).json({ data: updatedSeq });
    } catch (error: any) {
      // 8) Handle errors
      this.logger.error(error, { location: 'SequenceController.updateSequence' });
      return next(error);
    }
  }

  /**
   * startSequence
   * -------------
   * HTTP POST or PATCH controller method to transition an existing sequence
   * into an active or started state. This operation might schedule emails
   * or set internal flags.
   *
   * Steps (conceptual):
   *  1) Validate request param "id" (sequenceId).
   *  2) Check user authorization.
   *  3) Call sequenceService.startSequence(...).
   *  4) Log and return success response.
   *  5) Catch and handle errors -> next().
   *
   * @param req Express Request, expecting sequence ID in path params.
   * @param res Express Response.
   * @param next Express NextFunction for error flow.
   */
  public async startSequence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError(
          'Missing sequence ID in path parameters',
          'B2B_ERR_BAD_REQUEST' as any,
          {
            context: { paramId: id },
            source: 'SequenceController.startSequence',
            severity: 'MEDIUM' as any
          }
        );
      }

      // Authorization check (placeholder)
      if (!req.user) {
        throw new AppError(
          'Unauthorized to start sequence',
          'B2B_ERR_UNAUTHORIZED' as any,
          {
            context: { user: 'missing' },
            source: 'SequenceController.startSequence',
            severity: 'MEDIUM' as any
          }
        );
      }

      // Call service method
      const result = await this.sequenceService.startSequence(id);

      // Log event
      this.logger.info('Sequence started successfully', {
        sequenceId: id,
        userId: (req as any).user?.id ?? 'unknown'
      });

      // Return success message
      res.status(200).json({ data: result });
    } catch (error: any) {
      this.logger.error(error, { location: 'SequenceController.startSequence' });
      return next(error);
    }
  }

  /**
   * pauseSequence
   * -------------
   * HTTP POST or PATCH controller method to pause an active sequence,
   * possibly halting further emails or steps.
   *
   * Steps (conceptual):
   *  1) Validate request param "id" (sequenceId).
   *  2) Check user authorization.
   *  3) Call sequenceService.pauseSequence(...).
   *  4) Log and return success response.
   *  5) Catch and handle errors -> next().
   *
   * @param req Express Request, expecting sequence ID in path params.
   * @param res Express Response.
   * @param next Express NextFunction for error flow.
   */
  public async pauseSequence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError(
          'Missing sequence ID in path parameters',
          'B2B_ERR_BAD_REQUEST' as any,
          {
            context: { paramId: id },
            source: 'SequenceController.pauseSequence',
            severity: 'MEDIUM' as any
          }
        );
      }

      // Authorization check (placeholder)
      if (!req.user) {
        throw new AppError(
          'Unauthorized to pause sequence',
          'B2B_ERR_UNAUTHORIZED' as any,
          {
            context: { user: 'missing' },
            source: 'SequenceController.pauseSequence',
            severity: 'MEDIUM' as any
          }
        );
      }

      // Call service method
      const result = await this.sequenceService.pauseSequence(id);

      // Log event
      this.logger.info('Sequence paused successfully', {
        sequenceId: id,
        userId: (req as any).user?.id ?? 'unknown'
      });

      // Return success message
      res.status(200).json({ data: result });
    } catch (error: any) {
      this.logger.error(error, { location: 'SequenceController.pauseSequence' });
      return next(error);
    }
  }
}

/**
 * Named exports of controller methods for direct usage or referencing
 * outside typical routing. This approach can assist in testing or
 * more advanced composition patterns.
 */
export const createSequence = SequenceController.prototype.createSequence;
export const updateSequence = SequenceController.prototype.updateSequence;
export const startSequence = SequenceController.prototype.startSequence;
export const pauseSequence = SequenceController.prototype.pauseSequence;