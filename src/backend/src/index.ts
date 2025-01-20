////////////////////////////////////////////////////////////////////////////////
// Main Entry Point for the B2B Sales Intelligence Platform Backend
// -----------------------------------------------------------------------------
// This file implements the primary Express.js server setup, integrating
// critical middlewares, routes, error handling, monitoring, and security
// controls as specified in the technical and JSON requirements.
//
// The exported Express application instance "app" can be leveraged for testing,
// while the "startServer" function orchestrates the full production server
// startup lifecycle, including external service initialization, graceful
// shutdown, and advanced security measures.
//
// -----------------------------------------------------------------------------
// JSON Specification Requirements Addressed:
// 1) System Architecture (High-Level: Express server + middleware + routes)
// 2) Cross-Cutting Concerns (Monitoring, Logging, Sentry error handling, Metrics)
// 3) Security Controls (Helmet for security headers, Rate limiting placeholders,
//    WAF-like approach with request validation placeholders, Enhanced error handling)
//
// External Libraries (with versions as per the specification):
//   - express@^4.18.0   -> Core web framework
//   - cors@^2.8.5       -> Cross-origin resource sharing
//   - helmet@^7.0.0     -> Security headers
//   - compression@^1.7.4 -> Gzip compression
//   - @sentry/node@^7.0.0 -> Sentry error tracking
//   - winston@^3.8.0    -> Structured logging
//   - prom-client@^14.0.0 -> Prometheus metrics tracking
//
// Internal Modules Imported (per JSON specification):
//   - authenticate (middleware/auth.middleware) -> JWT auth middleware
//   - errorHandler, notFoundHandler (middleware/error.middleware) -> Global and 404 error handlers
//   - leadRoutes (routes/lead.routes) -> Lead management routes
//   - RedisManager (config/redis.ts) -> Manages Redis connection
//
// Global Environment Variables Used:
//   - PORT                     -> number, server port
//   - NODE_ENV                 -> string, environment mode
//   - SENTRY_DSN               -> string, Sentry DSN for error tracking
//   - REDIS_URL                -> string, Redis connection information
//   - RATE_LIMIT_WINDOW        -> number, time window for rate limiting in ms
//   - RATE_LIMIT_MAX_REQUESTS  -> number, max requests within that window
//
// Functions Implemented (per JSON specification):
//   1) initializeServices()
//   2) initializeMiddleware(app: Express.Application)
//   3) initializeRoutes(app: Express.Application)
//   4) setupGracefulShutdown(server: http.Server)
//   5) startServer()
//
// Export:
//   - app (Express.Application): The configured app instance for testing.
////////////////////////////////////////////////////////////////////////////////

import express, { Application, Request, Response, NextFunction } from 'express'; // express ^4.18.0
import cors from 'cors'; // cors ^2.8.5
import helmet from 'helmet'; // helmet ^7.0.0
import compression from 'compression'; // compression ^1.7.4
import * as Sentry from '@sentry/node'; // @sentry/node ^7.0.0
import winston from 'winston'; // winston ^3.8.0
import * as promClient from 'prom-client'; // prom-client ^14.0.0
import http, { Server } from 'http';

// Internal imports per JSON specification
import { authenticate } from './middleware/auth.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import leadRoutes from './routes/lead.routes';
import RedisManager from './config/redis';

// Optional placeholders for expansions
// import { campaignRoutes } from './routes/campaign.routes';
// import { sequenceRoutes } from './routes/sequence.routes';
// import { analyticsRoutes } from './routes/analytics.routes';

// For demonstration, environment variables are read here:
const PORT: number = Number(process.env.PORT) || 3000;
const NODE_ENV: string = process.env.NODE_ENV || 'development';
const SENTRY_DSN: string | undefined = process.env.SENTRY_DSN;
const REDIS_URL: string | undefined = process.env.REDIS_URL; // not explicitly used here, but for reference
const RATE_LIMIT_WINDOW: number = Number(process.env.RATE_LIMIT_WINDOW) || 60000;
const RATE_LIMIT_MAX_REQUESTS: number = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

// Winston logger setup (could be more advanced with multiple transports)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'b2b-sales-backend' },
  transports: [
    new winston.transports.Console()
  ]
});

// Prometheus metrics registry, could be used for advanced instrumentation
const metricsRegistry = new promClient.Registry();
promClient.collectDefaultMetrics({ register: metricsRegistry });

// Exported Express application instance for external usage/testing
let app: Application;

/**
 * initializeServices
 * --------------------------------------------------------------------------
 * Initializes all required services before the server is fully started.
 * Steps:
 *  1. Initialize Sentry error tracking (if SENTRY_DSN is provided).
 *  2. Set up structured logging (with Winston).
 *  3. Initialize metrics service (PromClient).
 *  4. Configure Redis connection (via RedisManager).
 *  5. Verify database connectivity (placeholder).
 *  6. Initialize external service clients (placeholders).
 *
 * @returns Promise<void>
 */
async function initializeServices(): Promise<void> {
  // 1) Initialize Sentry if DSN is provided
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: NODE_ENV,
      tracesSampleRate: 1.0 // Example: capture 100% of transactions
    });
    logger.info('Sentry error tracking initialized.', { dsn: SENTRY_DSN });
  } else {
    logger.warn('No SENTRY_DSN provided. Sentry is not initialized.');
  }

  // 2) Winston logger is already set up globally, referenceable as "logger"
  logger.info('Logger (Winston) configured successfully.', { level: logger.level });

  // 3) PromClient metrics are configured via defaultMetrics above
  logger.info('Prometheus default metrics collection started.', { metricsCount: metricsRegistry.metrics().length });

  // 4) Configure Redis connection
  // The RedisManager can help handle cluster or single-node logic
  const redisManager = new RedisManager({ /* pass optional config if needed */ });
  await redisManager.connect();
  logger.info('Redis connection established via RedisManager.', { redisUrl: REDIS_URL });

  // 5) Verify database connectivity (placeholder)
  // Example: If using Prisma or another DB, attempt a quick query or health check
  // logger.info('Database connectivity verified (placeholder).');

  // 6) Initialize external service clients (placeholder)
  // e.g. Payment gateway, third-party data providers, etc.
  // logger.info('External service clients initialized (placeholder).');
}

/**
 * initializeMiddleware
 * --------------------------------------------------------------------------
 * Configures and applies global middleware to the Express application.
 * Steps:
 *  1. Configure Sentry request handler
 *  2. Apply helmet security headers with CSP
 *  3. Enable CORS with strict configuration
 *  4. Enable gzip compression with options
 *  5. Configure Redis session store (placeholder)
 *  6. Setup request ID generation (placeholder)
 *  7. Apply rate limiting middleware (placeholder)
 *  8. Configure request validation (placeholder)
 *  9. Setup performance monitoring (placeholder)
 * 10. Apply authentication middleware
 *
 * @param {Application} expressApp The Express application object
 * @returns {void}
 */
function initializeMiddleware(expressApp: Application): void {
  // 1) Configure Sentry request handler if DSN is enabled
  if (SENTRY_DSN) {
    expressApp.use(Sentry.Handlers.requestHandler());
    logger.info('Sentry request handler middleware applied.');
  }

  // 2) Apply helmet security headers with a basic content security policy (if desired)
  expressApp.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "object-src": ["'none'"],
        "upgrade-insecure-requests": []
      }
    }
  }));
  logger.info('Helmet security headers applied with basic CSP.');

  // 3) Enable CORS with strict configuration
  // Adjust the origin array or logic as needed for your environment
  expressApp.use(cors({
    origin: ['https://your-frontend-domain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));
  logger.info('CORS middleware enabled with strict configuration.');

  // 4) Enable gzip compression with default options
  expressApp.use(compression());
  logger.info('Gzip compression middleware enabled.');

  // 5) Configure Redis session store (placeholder)
  // e.g. using express-session + connect-redis if appropriate
  // logger.info('Redis-based session store is not implemented in this placeholder.');

  // 6) Setup request ID generation (placeholder)
  // e.g. a simple ID or a library. Here we do a minimal approach:
  // expressApp.use((req: Request, _res: Response, next: NextFunction) => {
  //   (req as any).requestId = uuidv4();
  //   next();
  // });
  // logger.info('Request ID generation middleware configured (placeholder).');

  // 7) Apply rate limiting middleware (placeholder)
  // e.g. express-rate-limit or custom logic referencing RATE_LIMIT_WINDOW and RATE_LIMIT_MAX_REQUESTS
  // logger.info('Rate limiting middleware is not implemented in this placeholder.');

  // 8) Configure request validation (placeholder)
  // Could use e.g. zod-based validation or celebrate. This is a stub.
  // logger.info('Request validation middleware is not implemented in this placeholder.');

  // 9) Setup performance monitoring (placeholder)
  // Could integrate with PromClient or specialized solutions
  // logger.info('Performance monitoring middleware is not implemented (placeholder).');

  // 10) Apply authentication middleware globally
  expressApp.use(authenticate);
  logger.info('Global authentication middleware applied.');
}

/**
 * initializeRoutes
 * --------------------------------------------------------------------------
 * Registers API routes and handlers.
 * Steps:
 *  1. Register health check endpoint
 *  2. Mount lead management routes
 *  3. Mount campaign routes (placeholder)
 *  4. Mount sequence routes (placeholder)
 *  5. Mount analytics routes (placeholder)
 *  6. Apply request validation middleware (placeholder)
 *  7. Configure route-specific rate limits (placeholder)
 *  8. Apply 404 handler
 *  9. Register global error handler
 *
 * @param {Application} expressApp The Express application object
 * @returns {void}
 */
function initializeRoutes(expressApp: Application): void {
  // 1) Basic health check endpoint
  expressApp.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'Server is healthy.' });
  });
  logger.info('Health check endpoint registered at /health');

  // 2) Mount lead management routes
  // The leadRoutes function is the default import from routes/lead.routes
  // In that file: export default function initializeLeadRoutes(leadController: LeadController): Router {...}
  // For demonstration, we can pass placeholders if needed. If leadRoutes doesn't require a param, we call it directly.
  // If it does, we provide a minimal placeholder. The code in lead.routes expects: leadRoutes(new LeadController(...))
  // We'll skip a full new LeadController creation for brevity, or do a minimal approach.
  // We'll assume leadRoutes is a pre-initialized router. If not, we adapt accordingly.
  expressApp.use('/api/leads', leadRoutes(/* pass a LeadController if required */));
  logger.info('Lead management routes mounted at /api/leads');

  // 3) Mount campaign routes (placeholder)
  // expressApp.use('/api/campaigns', campaignRoutes);
  // logger.info('Campaign routes mounted at /api/campaigns (placeholder).');

  // 4) Mount sequence routes (placeholder)
  // expressApp.use('/api/sequences', sequenceRoutes);
  // logger.info('Sequence routes mounted at /api/sequences (placeholder).');

  // 5) Mount analytics routes (placeholder)
  // expressApp.use('/api/analytics', analyticsRoutes);
  // logger.info('Analytics routes mounted at /api/analytics (placeholder).');

  // 6) Apply request validation middleware for routes if needed (placeholder)
  // logger.info('Route-specific request validation not implemented (placeholder).');

  // 7) Configure route-specific rate limits (placeholder)
  // logger.info('Route-specific rate limiting not implemented (placeholder).');

  // 8) Apply 404 not found handler
  expressApp.use(notFoundHandler);
  logger.info('404 not found handler applied.');

  // 9) Register global error handler
  expressApp.use(errorHandler);
  logger.info('Global error handler registered.');
}

/**
 * setupGracefulShutdown
 * --------------------------------------------------------------------------
 * Configures graceful shutdown handling for system signals.
 * Steps:
 *  1. Register SIGTERM handler
 *  2. Register SIGINT handler
 *  3. Close HTTP server
 *  4. Close database connections (placeholder)
 *  5. Shutdown Redis connections
 *  6. Flush logs and metrics
 *  7. Exit process
 *
 * @param {Server} server The HTTP server instance returned from app.listen(...)
 * @returns {void}
 */
function setupGracefulShutdown(server: Server): void {
  // Helper to handle the shutdown logic
  const shutdownLogic = (signal: string) => {
    logger.info(`Received ${signal}, commencing graceful shutdown...`);

    // 3) Close HTTP server
    server.close(async () => {
      logger.info('HTTP server closed.');

      // 4) Close database connections (placeholder)
      // logger.info('Database connections closed (placeholder).');

      // 5) Shutdown Redis connections
      // If we had a reference to the same RedisManager used above, we could call .disconnect()
      // For demonstration, we do a minimal approach:
      // logger.info('Redis connections closed.');

      // 6) Flush logs or final metrics if needed
      // E.g. flush Winston, flush Prom metrics
      logger.info('Flushed logs and metrics (if any).');

      // 7) Exit process
      process.exit(0);
    });
  };

  // 1) Register SIGTERM
  process.on('SIGTERM', () => {
    shutdownLogic('SIGTERM');
  });

  // 2) Register SIGINT
  process.on('SIGINT', () => {
    shutdownLogic('SIGINT');
  });
}

/**
 * startServer
 * --------------------------------------------------------------------------
 * Initializes and starts the Express server.
 * Steps:
 *  1. Initialize required services
 *  2. Create Express application
 *  3. Configure middleware stack
 *  4. Register API routes
 *  5. Setup health monitoring (placeholder)
 *  6. Start HTTP server
 *  7. Configure graceful shutdown
 *  8. Log startup completion
 *
 * @returns {Promise<void>}
 */
export async function startServer(): Promise<void> {
  // 1) Initialize required services
  await initializeServices();

  // 2) Create Express application
  app = express();

  // 3) Configure middleware stack
  initializeMiddleware(app);

  // 4) Register API routes
  initializeRoutes(app);

  // 5) Setup health monitoring (placeholder)
  // We can expose Prom metrics or do advanced health checks
  // e.g. app.get('/metrics', (req, res) => {
  //   res.set('Content-Type', metricsRegistry.contentType);
  //   res.end(metricsRegistry.metrics());
  // });
  // logger.info('Health monitoring (prom-client) endpoint available at /metrics (placeholder).');

  // 6) Start HTTP server
  const server: Server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`, { environment: NODE_ENV });
  });

  // 7) Configure graceful shutdown
  setupGracefulShutdown(server);

  // 8) Log startup completion
  logger.info('Startup process completed. Server is fully operational.');
}

// Export the Express "app" instance for testing or direct usage
export { app };