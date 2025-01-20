<!--
  =====================================================================================
  Comprehensive Documentation: B2B Sales Intelligence Platform - Backend Service
  -------------------------------------------------------------------------------------
  This README provides the following sections in extreme detail:
  1. Introduction
  2. Prerequisites
  3. Getting Started
  4. Development
  5. Architecture
  6. Deployment
  7. Troubleshooting
  8. References
  9. Metadata

  Requirements Addressed:
  - Development Environment Setup (Technical Specifications/8.1 Development Environment)
  - Containerization (Technical Specifications/8.3 Containerization/Docker Configuration)
  - System Architecture (Technical Specifications/2.1 High-Level Architecture)
  - Security Implementation (Technical Specifications/7.1 Authentication and Authorization)

  This documentation references:
    - package.json           => Project configuration and dependency management
    - docker-compose.yml     => Docker environment configuration
  =====================================================================================
-->

# Introduction
Welcome to the backend service for the B2B Sales Intelligence and Engagement Platform. This service handles lead management, AI-powered enrichment, email automation, and integration with CRM systems, email providers, and payment gateways. Below is a comprehensive outline of the project structure, from environment setup to deploying in production.

## Project Description
- This backend service is built with Node.js (≥18.17.0) and TypeScript, following an enterprise-grade monolithic approach with well-defined service boundaries.
- The primary goal is to provide an AI-powered lead intelligence solution with integrated email outreach, analytics, and deep CRM synchronization.
- It aligns with the broader system architecture, ensuring core functionality such as lead scoring, data enrichment via OpenAI, and secure data handling with robust authentication.

## Key Features
- AI-Powered Lead Search and Enrichment (OpenAI GPT-4 integration).
- Email Automation via Resend for bulk and sequence-based campaigns.
- Security hardened with Supabase Auth and role-based authorization.
- Scalable container-based environment with Docker & Docker Compose.
- Database operations on PostgreSQL (15+) with caching in Redis (7+).

## Technology Stack
- Runtime: Node.js 18.17+ (TypeScript 5.2+)
- Database: PostgreSQL 15 (Supabase hosted or self-managed)
- Cache: Redis 7 (for ephemeral data & performance boosts)
- Containerization: Docker 24+ & Docker Compose 2+
- Additional Services: MailHog (test email), Resend (production email)
- Authentication & Session Management: Supabase Auth
- API Architectural Style: REST + GraphQL hybrid, with advanced rate limiting
- Security: JWT-based token authentication, RBAC, ABAC, end-to-end TLS

## Architecture Overview
- The backend exposes REST API endpoints consumed by Next.js in the frontend.
- The system leverages an internal job queue (Bull) for asynchronous tasks such as large email sends, background lead scoring, and data synchronization with CRMs.
- Redis acts as a primary caching layer, improving response times and supporting rate-limiting functionalities.
- All environment configuration is loaded via environment variables (.env), ensuring secrets are never directly available in source code.

---

# Prerequisites
Below is a list of required software and tools you need before setting up or contributing to this backend service:

1. <strong>Node.js ≥ 18.17.0</strong>  
   - The service uses modern JavaScript/TypeScript features unavailable in earlier Node versions.

2. <strong>pnpm ≥ 8.0.0</strong>  
   - Chosen for its superior speed and dependency management handling.  

3. <strong>Docker ≥ 24.x</strong>  
   - Ensures consistent container builds and modern Docker features.

4. <strong>Docker Compose ≥ 2.x</strong>  
   - Orchestrates multi-container setups, as defined in our docker-compose.yml.

5. <strong>Git ≥ 2.x</strong>  
   - For version control and collaboration. Also required for some Node modules that fetch code from repositories.

These prerequisites align with the <em>Development Environment Setup</em> (Technical Specifications/8.1 Development Environment).

---

# Getting Started
This section provides a comprehensive setup guide, from environment variables to running the service locally.

## Environment Setup
1. <strong>Clone</strong> the repository:  
   <code>git clone https://github.com/your-org/b2b-sales-platform.git</code>
2. <strong>Navigate</strong> to the backend folder:  
   <code>cd b2b-sales-platform/src/backend</code>
3. <strong>Copy</strong> the sample environment file:  
   <code>cp .env.example .env</code>
4. <strong>Update</strong> all environment variables in <code>.env</code> to match local or production requirements.

## Installation Steps
1. <strong>Install dependencies</strong> via pnpm:  
   <code>pnpm install</code>
2. <strong>Build</strong> the project (generates TypeScript artifacts):  
   <code>pnpm build</code>
3. <strong>Check</strong> code quality & formatting (recommended):  
   <code>pnpm lint</code> and <code>pnpm format</code>

## Configuration
- Refer to <code>package.json</code> scripts for tasks such as <code>db:migrate</code>, <code>test</code>, and <code>security:audit</code>.
- Review <code>docker-compose.yml</code> for container-based services: PostgreSQL, Redis, API, and MailHog.

## Initial Setup Verification
After installation, run the following commands to verify everything:

```bash
docker-compose up -d     # Start all containers (db, cache, mailhog, api)
pnpm db:migrate          # Apply any database migrations using Prisma
pnpm dev                 # Start the development server on port 8000
```

Navigate to http://localhost:8000/health to confirm the service is up and responding with a 200 OK status.

---

# Development
This section documents the development workflow, containerization, database usage, and security guidelines.

## Local Development
1. <strong>Start containers</strong> using Docker Compose:
   <code>docker-compose up -d</code>
2. <strong>Develop</strong> in watch mode:
   <code>pnpm dev</code>
3. The API will be available at <code>http://localhost:8000</code>, with PostgreSQL at <code>localhost:5432</code> and Redis at <code>localhost:6379</code>.

### Containerization
- The <code>docker-compose.yml</code> file orchestrates services as per the <em>Containerization</em> guidelines (Technical Specifications/8.3 Containerization).
- Each container (API, PostgreSQL, Redis, MailHog) has a dedicated service definition.
- Production Docker builds can leverage the <code>Dockerfile</code> multi-stage approach for minimal and secure images.

## Testing Strategy
- <strong>Unit & Integration Tests</strong>: Use <code>pnpm test</code> to run Jest-based tests with coverage.
- <strong>E2E Tests</strong>: Additional end-to-end tests can be configured to run against local Docker environment.
- <strong>CI/CD Integration</strong>: Automated pipelines for linting, building, and testing are invoked on each pull request.

### Example Testing Commands
```bash
pnpm test
pnpm test:e2e
pnpm test:coverage
```

## Code Style Guide
- Follows <strong>ESLint</strong> rules plus <strong>Prettier</strong> for code formatting.
- TypeScript configuration is enforced with <strong>strict</strong> and <strong>noImplicitOverride</strong> checks in <code>tsconfig.json</code>.
- Maintain consistent naming conventions and directory structure:
  ```
  src/
    controllers/
    services/
    models/
    utils/
    ...
  ```

## Database Operations
- The primary data store is <strong>PostgreSQL 15</strong>.
- Migrations are managed via Prisma. Use:
  <code>pnpm db:migrate</code> to apply migrations.
- For advanced tasks like seeding or data transformations, create scripts under <code>scripts/</code> and run them with <code>pnpm</code>.

## API Development
- Endpoints follow REST conventions under <code>src/controllers</code> or <code>src/routes</code>.
- For dynamic data queries or advanced queries, consider GraphQL endpoints if required.
- Implement caching with Redis for frequently accessed data. Rate limiting is also enabled through <code>@upstash/ratelimit</code> and <code>express-rate-limit</code> in <code>package.json</code>.

## Security Guidelines
- <strong>Authentication & Authorization</strong>:
  - Supabase Auth for user identity management, plus JWT for service-to-service calls.
  - Role-Based Access Control (RBAC) to enforce different permission levels (Admin, Manager, User, API).
- <strong>Data Protection</strong>:
  - SSL/TLS enforced in production for all external traffic.
  - Field-level encryption for sensitive data, if required (pgcrypto or custom).
- <strong>Preventive Measures</strong>:
  - Validate all inputs with <code>zod</code> or Express-level validations.
  - Use <code>helmet</code> for setting security-related HTTP headers.
  - The <em>Security Implementation</em> references the <em>Technical Specifications/7.1 Authentication and Authorization</em> for deeper details.

---

# Architecture
This section outlines the backend’s high-level structure, data flow, integrations, and performance considerations.

## Component Overview
- <strong>API Layer (Express)</strong>: Handles HTTP requests for leads, campaigns, analytics, etc.
- <strong>Database Access (Prisma)</strong>: Interacts with PostgreSQL, using the <code>DATABASE_URL</code> from environment variables.
- <strong>Cache Layer (Redis)</strong>: Stores ephemeral data, rate-limiting tokens, and job queue states.
- <strong>Job Queue (Bull)</strong>: Manages background tasks, such as sending bulk emails or batch lead scoring.
- <strong>Mail Service (MailHog or Resend)</strong>: Local environment uses MailHog to capture emails; Production uses Resend.

## Data Flow Diagrams
A simplified flow might look like this:

```
[ Client ] ---> [ Express Controllers ] ---> [ Services / Business Logic ] 
                   |                                     |
                   v                                     v
                [ Prisma ]  --(SQL)--> [ PostgreSQL ]   [ Redis Cache ]
                   |
                   v
          [ Email Integration ] --(SMTP/API)--> [ MailHog / Resend ]
```

## Service Integration
- <strong>OpenAI</strong>: For AI-driven lead enrichment, used by a dedicated service module in <code>src/services/ai</code>.
- <strong>CRM Sync (Salesforce/HubSpot)</strong>: Possibly scheduled as background tasks for data sync, leveraging job queues.
- <strong>Stripe</strong>: For payment processing and subscription-based models. Webhook integration handles real-time billing events.

## Security Architecture
- <strong>Supabase Auth</strong> ensures secure signups, logins, and session tokens.
- <strong>Rate Limiting</strong> with <code>@upstash/ratelimit</code> prevents DDoS or abuse.
- <strong>Authorization</strong> logic in each route or business method to verify user privileges.
- <strong>Audit Trails</strong> in logs for data access and administrative actions.

## Performance Considerations
- <strong>Caching Strategies</strong>: Redis for ephemeral data, possible in-memory LRU for short-term rates.
- <strong>Connection Pooling</strong>: PostgreSQL pool size tuned to reduce overhead under high concurrency.
- <strong>Horizontal Scaling</strong>: Additional containers can be spun up behind a load balancer.

---

# Deployment
This section details environment configuration, build strategies, and recommended monitoring for production.

## Environment Configuration
- Environment-specific files (e.g., <code>.env.production</code>) store production credentials.
- Container orchestration relies on <code>docker-compose.yml</code>, which can be extended for staging or production.

## Build Process
1. <strong>Pull repository</strong> with the <code>main</code> or <code>release</code> branch.
2. <strong>Install dependencies</strong> using <code>pnpm install --frozen-lockfile</code>.
3. <strong>Build and test</strong>:
   ```bash
   pnpm build
   pnpm test
   ```
4. <strong>Docker build</strong>:
   <code>docker-compose build</code> or <code>docker build . -t backend-service</code> if using custom approaches.

## Deployment Steps
1. <strong>Start containers</strong>:
   <code>docker-compose up -d</code>
2. <strong>Apply DB migrations</strong>:
   <code>pnpm db:migrate</code>
3. <strong>Monitor logs</strong>:
   <code>docker-compose logs -f api</code>

## Rollback Procedures
- If a new release is faulty, revert to a stable image by pulling from the previous Docker tag or checking out the older Git commit:
  ```bash
  git checkout <previous_tag_or_commit>
  docker-compose build --no-cache
  docker-compose up -d
  ```

## Monitoring Setup
- <strong>Health Checks</strong>: Each container has a <code>HEALTHCHECK</code> directive in the <code>Dockerfile</code> or <code>docker-compose.yml</code>.
- <strong>Application Metrics</strong>: Integrate with Datadog or Prometheus for real-time system metrics.
- <strong>Error Tracking</strong>: Use Sentry or another centralized logging to track stack traces, user feedback, and uncaught exceptions.

---

# Troubleshooting
Below are common issues and potential resolutions:

1. **Database Connection**  
   - <strong>Issue:</strong> Unable to connect to PostgreSQL.  
   - <strong>Solution:</strong> Verify the <code>db</code> service in Docker is running and confirm matching credentials in <code>.env</code>. Check logs with <code>docker-compose logs db</code>.

2. **Redis Connection**  
   - <strong>Issue:</strong> Redis service offline or refusing connections.  
   - <strong>Solution:</strong> Check if the <code>cache</code> service is healthy. Confirm <code>REDIS_HOST</code> in <code>.env</code> points to <code>cache</code> if using Docker.

3. **Email Testing**  
   - <strong>Issue:</strong> Outbound emails failing locally.  
   - <strong>Solution:</strong> Confirm <code>mailhog</code> is running by visiting http://localhost:8025. Ensure SMTP ports align with <code>SMTP_HOST</code> and <code>SMTP_PORT</code> in <code>.env</code>.

---

# References
- [Architecture Documentation](../../docs/architecture.md)
- [API Documentation](../../docs/api-specs.md)
- [Security Guidelines](../../docs/security.md)

---

# Metadata
<details>
<summary>Click to expand metadata</summary>

- **Last Updated**: 2024-01-20  
- **Version**: 1.0.0  
- **Maintainers**:  
  - Backend Team  
- **Repository**:  
  - b2b-sales-platform

</details>

<!-- End of README -->