<!--
  README.md
  B2B Sales Intelligence & Engagement Platform
  ---------------------------------------------------------------------------------------------
  This README serves as the primary documentation for the B2B Sales Intelligence and Engagement
  Platform. It covers a comprehensive overview, features, setup instructions, development
  guidelines, and references to important sections like security, infrastructure, and contributing.
  
  JSON Specification References:
  - System Overview (Technical Specs/1.2): High-level description of capabilities & architecture
  - Development Environment (Technical Specs/4.5): Setup & deployment details
  - Success Criteria (Technical Specs/1.2): Key performance indicators & success metrics
  - Security Implementation (Technical Specs/7.0): Protocols, data protection, compliance
  - Infrastructure Architecture (Technical Specs/8.0): Deployment, cloud services, CI/CD pipeline

  Imports & Cross-References:
  - contribution_guidelines from CONTRIBUTING.md (sections: development_workflow, code_standards)
  - security_policy from SECURITY.md (sections: policy, reporting)
  - license from LICENSE
  - External: shields.io@latest for status badges

  Exports:
  - project_documentation (markdown)
    - overview     (named section)
    - features     (named section)
    - setup        (named section)
    - development  (named section)

  ---------------------------------------------------------------------------------------------
  Please read comments carefully for an enterprise-grade, production-ready documentation body.
-->

<!-- ======================================================================================= -->
<!-- Status Badges (build, tests, coverage) using shields.io@latest -->
<!-- Replace URL placeholders with actual CI links or coverage tools as appropriate.        -->
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#) <!-- shields.io@latest -->
[![Tests](https://img.shields.io/badge/tests-100%25-success.svg)](#) <!-- shields.io@latest -->
[![Coverage](https://img.shields.io/badge/coverage-95%25-yellow.svg)](#) <!-- shields.io@latest -->

# region project_documentation.overview
# Project Overview

<!--
  This section addresses the "System Overview" requirement (Technical Specifications/1.2 SYSTEM OVERVIEW).
  It also incorporates "Success Criteria" from the same location to detail performance KPIs.
-->

<!-- Project name and description -->
The B2B Sales Intelligence & Engagement Platform is a comprehensive SaaS application designed to streamline prospecting, lead management, and automated outreach. By leveraging AI-driven insights and robust campaign orchestration, sales teams can reduce manual effort and increase their overall conversion rates.

<!-- Key features and capabilities (briefly introduced here, expanded in the Features section) -->
• AI-Powered Lead Identification  
• Automated Email Sequences  
• Real-Time Analytics & Dashboard  
• CRM Integration & Data Sync  

<!-- Technology stack overview (mentioning core components from system overview) -->
Our technology stack includes:
• Next.js (v14+) and React (v18+) for the frontend UI  
• Supabase (PostgreSQL, Auth) for backend data storage & authentication  
• Redis for caching and rate limiting  
• Bull for asynchronous job queueing  
• Resend for email dispatch  
• OpenAI (GPT-4) for semantic lead enrichment  

<!-- Architecture diagrams: placeholders referencing the system context, containers, and components -->
Below are references to key architecture diagrams (see /docs/architecture or the system-level design):
1. System Context C4 Diagram (showing external systems like CRM, Email Providers, AI)  
2. Container Diagram (web application, auth service, database, cache, queue)  
3. Component Diagram (UI layer, API layer, business logic, data access, integrations)  

<!-- Performance metrics & KPIs (e.g., from Success Criteria) -->
SUCCESS CRITERIA (per Tech Specs):
• User Adoption: 80% active user rate within 30 days  
• Lead Quality: 40% improvement in conversion rates  
• Time Savings: 60% reduction in prospecting time  
• ROI: 3x return on investment within 6 months  

<!-- Compliance certifications or relevant standards -->
We aim to align with SOC 2, GDPR, and CCPA mandates, ensuring robust data protection and privacy compliance.

# endregion

<!-- ======================================================================================= -->

# region project_documentation.features
# Features

<!--
  This section addresses the "Features" defined in the JSON specification.
  It lists core functionalities, referencing details from the requirements.
-->

The B2B Sales Intelligence & Engagement Platform provides an extensive feature set:

1. <!-- AI-powered lead intelligence -->  
   • Use GPT-4 for intelligent lead suggestions, contact enrichment, and scoring.  
   • Dynamically filter leads by industry, region, or revenue metrics.

2. <!-- Email automation with Resend -->  
   • Configure multi-step email sequences, drip campaigns, and A/B testing.  
   • Resend integration for high-deliverability transactional or marketing emails.

3. <!-- Campaign management -->  
   • Build and manage multiple outreach campaigns from a single dashboard.  
   • Track open rates, clicks, replies, and conversions for each sequence.

4. <!-- Analytics and reporting -->  
   • Detailed performance insights: conversion analytics, pipeline velocity, ROI calculations.  
   • Real-time dashboards with data visualization (charts, tables) for streamlined decision-making.

5. <!-- Integration capabilities -->  
   • Native CRM synchronization (Salesforce, HubSpot).  
   • Configurable webhooks & REST APIs to plug in custom tools or data pipelines.

6. <!-- Security features -->  
   • Comprehensive RBAC roles (Admin, Manager, User, API).  
   • Rate limiting middleware, WAF integration (see Security section).  
   • SOC 2 alignment, GDPR & CCPA compliance guidelines.

7. <!-- Compliance implementations -->  
   • Data encryption at rest using AES-256-GCM, TLS 1.3 in transit.  
   • Logging, audit trails, and privacy controls for EU/California data regulations.

8. <!-- Performance optimizations -->  
   • Redis caching for lead searches and frequent queries.  
   • Horizontal scaling with serverless environment (Vercel Edge, Supabase).

9. <!-- Monitoring capabilities -->  
   • Integrated with Sentry and DataDog for error tracking & performance metrics.  
   • Automatic alerts for high response times, error spikes, or security events.

# endregion

<!-- ======================================================================================= -->

# region project_documentation.setup
# Setup

<!--
  This section corresponds to "Prerequisites" and "Getting Started" from the specification.
  It addresses the "Development Environment" requirement (Technical Specs/4.5) by detailing
  environment setup and requirements.
-->

## Prerequisites

<!-- Prerequisites such as Node.js, pnpm, Docker, Postgres, Redis, etc. -->
1. Node.js v18.17+ LTS  
   • Verify your Node.js version:  
     ```
     node -v
     ```
   • If incompatible, use a Node version manager (e.g., nvm) to install.

2. pnpm v8.x  
   • Faster installations and efficient disk usage.  
   • Install globally:  
     ```
     npm install -g pnpm@8
     ```

3. Docker v24.x  
   • Required for containerizing local PostgreSQL, Redis.  
   • Use docker-compose to bring up supporting services.

4. PostgreSQL v15+  
   • Production data backend; ensures advanced indexing & FTS.  
   • For local dev, use Docker-based Postgres or a local instance.

5. Redis v7+  
   • Caching and job queue support.  
   • Required for performance optimization and rate limiting.

6. Security requirements  
   • Node.js SSL certificates if local HTTPS is desired.  
   • Check .env for secure credential storage (never commit secrets).

7. Infrastructure requirements  
   • Enough memory and CPU to support background jobs, caching, and high concurrency.  
   • Cloud environment (e.g., Vercel + Supabase) recommended for production.

8. Compliance prerequisites  
   • If storing lead/contact data, ensure alignment with GDPR/CCPA.  
   • Configure environment variables for supabase auth logs.

## Getting Started

<!-- Cover installation steps, environment config, DB setup, local dev, tests, security, monitoring, CI/CD, compliance -->
1. Clone the repository:  
   ```
   git clone https://github.com/<your-org>/b2b-sales-intel.git
   cd b2b-sales-intel
   ```

2. Install dependencies:  
   ```
   pnpm install
   ```

3. Create and configure .env file:  
   ```
   cp .env.example .env
   # fill in SUPABASE_URL, SUPABASE_ANON_KEY, etc.
   ```

4. Launch database and cache (local dev) via Docker:  
   ```
   docker-compose up -d
   ```

5. Apply database migrations:  
   ```
   pnpm db:migrate
   ```

6. Start the dev server:  
   ```
   pnpm dev
   # This spins up Next.js and the backend services
   ```

7. Running tests:  
   ```
   pnpm test
   pnpm test:integration
   pnpm test:coverage
   ```

8. Security configuration:  
   • Reference the [SECURITY.md](SECURITY.md) file (see policy section) for recommended WAF rules, secret management, and environment-level scanning.  
   • For vulnerability reporting, see the 'reporting' section in [SECURITY.md](SECURITY.md).

9. Monitoring setup:  
   • Sentry, DataDog, or another APM tool can be configured in the environment variables.  
   • Check docs for hooking logs or telemetry events.

10. CI/CD configuration:  
   • The workflows for backend and web are provided in .github/workflows.  
   • Ensure your branching strategy aligns with environment gating.

11. Compliance verification:  
   • Inspect data flows and logs to confirm no personal data is stored unencrypted.  
   • Perform regular audits for GDPR and CCPA checklists.

# endregion

<!-- ======================================================================================= -->

# region project_documentation.development
# Development

<!--
  This section references "Project structure, Development workflow, Code standards, Testing guidelines, etc."
  Also references the "contribution_guidelines" from CONTRIBUTING.md (development_workflow & code_standards).
-->

Below is a concise overview of the development process:

1. Project structure  
   • /src/backend: Express-based API, Prisma ORM, Redis config, and Supabase integration.  
   • /src/web: Next.js + React application.  
   • /infrastructure: Security rules (WAF config), Docker Compose, environment templates.

2. Development workflow  
   • See [CONTRIBUTING.md](CONTRIBUTING.md) under the "1. Development Environment Setup" and "2. Development Workflow" sections for branching, commit style, feature flags, etc.  
   • Follow the conventional commits specification (feat, fix, chore, etc.) for clarity.

3. Code standards  
   • TypeScript strict mode enforced.  
   • ESLint + Prettier configuration ensures consistent styling.  
   • For in-depth practices, see "3. Code Standards" in [CONTRIBUTING.md](CONTRIBUTING.md).

4. Testing guidelines  
   • Jest + ts-jest for unit tests.  
   • Cypress or Playwright for end-to-end (web) testing.  
   • Minimum 80% coverage enforced in CI pipeline.

5. Documentation  
   • JSDoc/TSDoc for all public APIs.  
   • OpenAPI (Swagger) for REST endpoints.  
   • Keep code comments updated in critical modules.

6. Security practices  
   • Adhere to WAF blocking, rate limiting.  
   • No secrets in code commits.  
   • Security scanning with Snyk or npm audit.

7. Performance optimization  
   • Query indexing, caching strategies (Redis).  
   • Evaluate Next.js SSR overhead vs static pages.  
   • Use profiling tools to detect bottlenecks.

8. Monitoring integration  
   • Sentry for error capture, DataDog for metrics.  
   • Custom performance metric tags (api_response_time_ms, memory_usage_mb).

9. Compliance maintenance  
   • Regular audits for data privacy.  
   • Handle user data requests promptly.  
   • Logged changes in environment or WAF configurations.

# endregion

<!-- ======================================================================================= -->

# Deployment

<!--
  Addresses "Infrastructure Architecture" from Technical Specifications/8. 
  Also references CI/CD pipeline, environment setup, cloud deployment, scaling, etc.
-->

1. Deployment environments  
   • Typically dev, staging, production.  
   • Automatic preview deployments via Vercel for the web UI.

2. CI/CD pipeline  
   • GitHub Actions with backend-ci.yml (test, lint, build) & web-ci.yml (build, coverage).  
   • Merges to main trigger production deployment if checks pass.

3. Infrastructure setup  
   • Hosted on Vercel Edge for Next.js SSR.  
   • Supabase for PostgreSQL + Auth + Storage.  
   • Redis Labs or Upstash for caching.  
   • Container orchestration not strictly required due to serverless approach, but Docker can be used for on-prem.

4. Monitoring  
   • Winston logs, streamed to Papertrail or your logging aggregator.  
   • Metrics in DataDog: "logger.performance.<metric>" or "logger.security_events."

5. Security  
   • WAF rules (infrastructure/security/waf-rules.json).  
   • Rate-limits enforced by Redis config (infrastructure/security/rate-limits.json).  
   • Automated vulnerability scanning in CI.

6. Edge network configuration  
   • Vercel Edge Functions for global scale and minimal latency.  
   • Optional Cloudflare for DDoS protection.

7. Database scaling  
   • Supabase supports vertical scaling or read replicas.  
   • Use partitioning for large lead tables.

8. Cache distribution  
   • Redis cluster for high-availability.  
   • Rate-limit and session data sharded across nodes.

9. Disaster recovery  
   • Regular backups (daily, weekly WAL archiving).  
   • Tests for restore & failover.  
   • Plan for DNS or environment-level fallback.

<!-- ======================================================================================= -->

# Security

<!--
  Mirrors "Security Implementation" from Technical Specs/7. 
  Also references the "security_policy" from SECURITY.md (policy, reporting).
-->

Our Security Model prioritizes trust, compliance, and resilience:

1. Authentication methods  
   • JWT tokens (Supabase Auth).  
   • OAuth 2.0 for SSO (Google, LinkedIn).  
   • API keys for external integrations, rotated every 90 days.

2. Authorization model  
   • RBAC with Admin, Manager, User, API roles.  
   • Fine-grained ACL checks on leads, campaigns, analytics data.

3. Data encryption  
   • AES-256-GCM at rest.  
   • TLS 1.3 in transit.  
   • Field-level encryption for PII if needed.

4. Compliance requirements  
   • GDPR: Right to erasure, data minimization, anonymization.  
   • SOC 2: Access logs, role-based privileges.  
   • CCPA: Data subject requests, opt-outs for CA residents.

5. Security monitoring  
   • Real-time detection with wafConfig.monitoring (Datadog, Slack alerts).  
   • Sentry for exceptions.  
   • Detailed logs for suspicious events or anomaly detection.

6. Incident response  
   • Based on severity tiers: Low, Medium, High, Critical.  
   • Escalate security events via Slack/PagerDuty.  
   • Root-cause analysis & post-mortem reviews.

7. Disaster recovery  
   • Redundant backups for DB & logs.  
   • Automated failover for redis cluster.  
   • Templated environment to re-deploy quickly.

8. Data protection  
   • Strict retention policies (24 months for leads).  
   • Column-level encryption for sensitive fields.  
   • WAF + Rate limiting to mitigate abuse.

9. Access controls  
   • Per-endpoint rate limits; see `src/backend/src/middleware/rate-limit.middleware.ts`.  
   • Verified tokens for private APIs.  
   • For advanced policy details and vulnerability reporting, see [SECURITY.md](SECURITY.md).

<!-- ======================================================================================= -->

# API Documentation

<!--
  Summarizes REST endpoints, WebSocket events, authentication, error handling, integration, etc.
  from the specification's "API Design" sections.
-->

1. REST endpoints  
   • /api/leads [GET, POST]  
   • /api/campaigns [GET, POST]  
   • /api/sequences [GET, POST]  
   • /api/analytics [GET]  

2. WebSocket events  
   • lead.updated (server → client)  
   • campaign.status  
   • activity.new  

3. Rate limiting  
   • Configured in infrastructure/security/rate-limits.json  
   • "fixed_window" or "sliding_window" strategies.  
   • Returned HTTP 429 if exceeded, with Retry-After header.

4. Authentication  
   • JWT-based with Supabase.  
   • "Authorization: Bearer <token>" in request headers.  
   • Automatic Nuxt/Next SSR gating if used on the web side.

5. Error handling  
   • Standard codes (400, 401, 403, 404, 429, 500).  
   • JSON body with { code, message, status } structure.

6. Response formats  
   • JSON is default.  
   • For streaming or large data, see chunked endpoints.

7. Integration examples  
   • CRM sync via /api/integrations/crm.  
   • Webhooks for external apps to POST leads or GET analytics.

8. API versioning  
   • /v1/ prefix for stable routes.  
   • Future expansions will keep backward compatibility if possible.

9. Performance considerations  
   • Use pagination or cursors for large lead sets.  
   • Cache repeat queries.  
   • Bulk operations placed in asynchronous queue.

<!-- ======================================================================================= -->

# Contributing

<!--
  Connect this to "Contributing" from the specification, referencing the full doc in CONTRIBUTING.md.
-->

We appreciate all contributions from the community. Please review the following:

1. Contribution guidelines  
   • See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed steps to fork, branch, and create pull requests.  
   • Adhere to the guidelines to maintain consistent structure & style.

2. Development process  
   • Local dev environment described above.  
   • Strict type-checking, lint, and coverage verification.

3. Pull request workflow  
   • Use the PR template in .github/pull_request_template.md.  
   • Provide coverage results, performance logs if relevant.

4. Code review process  
   • At least 2 technical reviewers, 1 security reviewer.  
   • CI checks must pass before merging.

5. Security requirements  
   • No committing secrets, tokens, or API keys.  
   • Validate features do not bypass WAF or rate limiting.

6. Testing requirements  
   • 80% coverage minimum for merges.  
   • E2E tests for UI changes.

7. Documentation standards  
   • TSDoc for public functions.  
   • Update endpoints in OpenAPI or README sections where relevant.

8. Compliance checklist  
   • Check GDPR/CCPA implications for new data fields.  
   • Provide consent toggles if collecting new personal info.

<!-- ======================================================================================= -->

# License

<!--
  Explains that the software license is proprietary, also referencing the LICENSE file.
-->

This project is distributed under a Proprietary Software License. Key points:
1. Usage Terms: Non-exclusive, non-transferable, enterprise usage.  
2. Data Protection: Must adhere to data encryption and retention policies.  
3. Liability Disclaimers: Provided "AS IS"; disclaimers of warranties, limitations on liability.

See the full license text in [LICENSE](LICENSE).