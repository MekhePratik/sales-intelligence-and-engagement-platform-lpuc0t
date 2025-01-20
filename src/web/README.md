# Project Overview

- **B2B Sales Intelligence Platform Frontend**  
  This repository houses the front-facing application of the AI-powered B2B lead intelligence and engagement platform.  
- **AI-Powered Lead Intelligence and Engagement**  
  The system leverages GPT-4 for profile enrichment and intelligent lead scoring, enabling higher-quality prospecting.  
- **Built with Next.js 14, React 18, TailwindCSS, and Shadcn**  
  This permits a modern, scalable, and highly responsive UI/UX that aligns with enterprise-grade standards.  
- **System Architecture and Component Diagrams**  
  The frontend interfaces with a series of API endpoints, job queues, and real-time streams, as documented in the system context and container diagrams.  
- **Key Features and Capabilities**  
  - Dashboard for lead management  
  - Automated email sequences  
  - Real-time analytics  
  - AI-driven lead scoring  
- **Integration Points with Backend Services**  
  - Supabase PostgreSQL for data storage and authentication  
  - Resend for email automation  
  - OpenAI for lead enrichment  
  - Stripe for payment processing  

---

# Prerequisites

Below are the minimal requirements for local development and production builds:

1. **Node.js >= 18.17.0 LTS**  
   Ensures compatibility with Next.js 14 and the TypeScript 5+ toolchain.

2. **pnpm >= 8.x**  
   Used for workspace management and faster, disk-efficient installations.

3. **Docker >= 24.x**  
   Provides containerized services (PostgreSQL, Redis, Mailhog) for development.

4. **VS Code with Recommended Extensions**  
   - ESLint  
   - Prettier  
   - Tailwind CSS IntelliSense  
   - GitLens  

5. **Git >= 2.x**  
   Version control for collaborative development.

6. **Supabase CLI**  
   Facilitates local environment management and project scaffolding for authentication and database resources.

---

# Getting Started

1. **Repository Cloning Steps**  
   - Clone via SSH or HTTPS:  
     ```
     git clone git@github.com:YourOrg/b2b-sales-intelligence-platform.git
     cd b2b-sales-intelligence-platform
     ```
   - Navigate to the "web" subfolder for frontend code.

2. **Environment Variables Configuration**  
   - Duplicate and rename the `.env.example` to `.env.local`.  
   - Populate keys such as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.  
   - Additional environment variables include `NEXT_PUBLIC_OPENAI_KEY`, `NEXT_PUBLIC_RESEND_KEY`, and `NEXT_PUBLIC_STRIPE_KEY` as needed.

3. **Dependencies Installation Guide**  
   - Inside `src/web`, run:
     ```
     pnpm install
     ```
   - This installs all dependencies (see `package.json` for full details).

4. **Docker Container Setup**  
   - Ensure Docker is running.
   - Optionally, use `docker-compose` (if provided) to start local PostgreSQL, Redis, and Mailhog.

5. **Local Development Server**  
   - Start Next.js in development mode:
     ```
     pnpm dev
     ```
   - Access the application at http://localhost:3000 (default port).

6. **Database Initialization**  
   - If required, run migrations with the Supabase CLI or your defined Prisma scripts.
   - Confirm you have the correct schema for user and lead data.

---

# Development

## Project Structure Overview

- `pages/` or `app/`: Contains Next.js routes and entry points.  
- `components/`: Shared React components (UI elements, forms, etc.).  
- `modules/`: Feature-specific logic such as leads, campaigns, or analytics.  
- `lib/`: Utility functions, configuration, and helpers.  
- `hooks/`: Custom React Hooks.  
- `styles/`: Global CSS and Tailwind configurations.  
- `public/`: Static assets.  

## Component Architecture Patterns

- Utilizes **React 18** features like concurrent rendering.  
- Employs **Shadcn** UI components for consistent design patterns.  
- Adopts **React Query** for asynchronous data fetching and caching.  

## State Management with React Query

- Caches frequently accessed lead data, improving performance.
- Automatic background refetching for up-to-date campaign data.

## API Integration Guidelines

- RESTful and GraphQL endpoints consumed via fetch or dedicated clients.
- All requests validated through Zod schemas for client-side sanity checks.

## Type Safety with TypeScript

- Strict mode enforced in `tsconfig.json` and `next.config.ts`.
- Interfaces and type definitions maintained for leads, users, campaigns.

## Styling with TailwindCSS

- Utilize utility classes to minimize CSS overhead.
- Leverage responsive design breakpoints, custom color palette, spacing scales, and dark mode toggles.

## Accessibility Requirements

- Screen reader compatibility with ARIA attributes.
- Keyboard navigation and focus trapping in modals.
- High color contrast (WCAG 2.1 AA compliance).

## Internationalization Setup

- (Optional) If supporting multiple locales, Next.js route-based i18n or `next-intl` can be configured.

---

# Available Scripts

The following scripts are defined in `package.json` (version "1.0.0"):

1. **dev**  
   - Starts Next.js in development mode with hot reload.  
   ```
   pnpm dev
   ```

2. **build**  
   - Builds the application for production, optimizing for performance.  
   ```
   pnpm build
   ```

3. **start**  
   - Runs the optimized production build.  
   ```
   pnpm start
   ```

4. **lint**  
   - Performs ESLint checks to maintain code quality and consistent formatting.  
   ```
   pnpm lint
   ```

5. **test**  
   - Executes Jest test suites (both unit and integration).  
   ```
   pnpm test
   ```

6. **test:watch**  
   - Re-runs tests upon file changes for rapid development.  

7. **test:coverage**  
   - Generates coverage reports for code quality metrics.  

8. **e2e**  
   - Runs Playwright end-to-end tests.  

9. **type-check**  
   - Validates the codebase using the TypeScript compiler (`tsc --noEmit`).  

---

# Environment Variables

Below are the primary environment variables used in this project, as configured in `next.config.ts` and consumed in the application:

1. **NEXT_PUBLIC_API_URL**  
   - Optional base URL for custom API endpoints if the project extends beyond Supabase.

2. **NEXT_PUBLIC_SUPABASE_URL**  
   - Supabase project URL for database and authentication.

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**  
   - Public anon key for interacting with Supabase from the client.

4. **NEXT_PUBLIC_OPENAI_KEY**  
   - Utilized for GPT-4 lead enrichment and scoring.

5. **NEXT_PUBLIC_RESEND_KEY**  
   - Token for connecting the frontend to Resend’s email delivery service.

6. **NEXT_PUBLIC_STRIPE_KEY**  
   - Public key for payment operations (if relevant to your subscription flow).

---

# Deployment

## Vercel Deployment Configuration

- **Production Deployments**  
  Pushing or merging to the `main` branch triggers a production build on Vercel.  
- **Preview Deployments**  
  Pull Requests automatically spawn a preview deployment for testing and QA.  

## Environment Setup per Stage

- Separate projects and environment variables in Vercel for Development, Staging, and Production.
- Database credentials, external API keys, and service tokens stored securely in Vercel secrets.

## Build Optimization Strategies

- Code splitting and tree shaking configured in `next.config.ts`.
- Minimization of bundle size via SWC compilation and removing console logs.

## Performance Monitoring Setup

- Integrate **Vercel Analytics** to track Core Web Vitals.
- Use custom logging for serverless function performance.

## Error Tracking with Sentry

- `@sentry/nextjs` captures errors at build and runtime.
- Configure DSN in the environment variables.

## Analytics Implementation

- Optionally integrate Segment, Mixpanel, or Google Analytics, ensuring compliance with privacy laws.

## Database Migration Process

- Use Prisma migrations or Supabase migration scripts for schema changes.
- Always run migrations before the final production deployment step.

## CI/CD Implementation

- **Automated Testing**  
  GitHub Actions or a similar pipeline runs Jest and E2E tests on every push.
- **Preview Deployments**  
  Allows stakeholders to review features before merging to `main`.
- **Production Safeguards**  
  Minimally require successful test runs, code reviews, and lint checks.

---

# Testing

## Unit Testing with Jest and React Testing Library

- Focus on testing UI components, critical hooks, and utility functions.
- Ensure coverage includes business logic for lead scoring, email triggers, etc.

## Integration Testing Strategies

- Validate data flow between components and external APIs (e.g., Supabase).

## E2E Testing with Playwright

- Test user flows such as login, lead creation, campaign launch.
- Automates browser scenarios to reflect real user journeys.

## Performance Testing with Lighthouse

- Run Lighthouse locally or in CI to measure TTFB, LCP, and other web vitals.

## Accessibility Testing with axe-core

- Automated checks for WCAG compliance.  
- Document any known accessibility exceptions.

## Test Coverage Requirements

- Aim for **80%+** coverage across statements, branches, and lines.

## Continuous Testing in CI

- PR merges trigger comprehensive test suites, preventing regressions.

---

# Security

## Authentication Implementation

- **Supabase Auth** for user sign-up, login, and session management (JWT-based).
- Additional providers (Google, LinkedIn) used if configured with OAuth2.

## Authorization Flows

- Role-Based Access Control (RBAC): Admin, Manager, and User roles.
- Fine-grained policy at the route and API level.

## API Security Best Practices

- Validate requests with Zod or custom server-side checks.
- Rate-limit high-traffic endpoints (use Upstash/Redis or Cloudflare-based solutions).

## CSRF Protection

- Next.js protects forms by aligning session tokens; additional Double-Submit Cookie patterns can be added if needed.

## XSS Prevention

- Employ React’s built-in escaping features.
- Configure CSP headers extensively (see `next.config.ts`).

## Content Security Policy

- Strict CSP definitions in `headers()` function:  
  - `default-src 'self'`  
  - `script-src 'self' 'unsafe-inline' ...`  
  - `frame-ancestors 'none'`

## Security Headers Configuration

- HSTS, X-Frame-Options, X-Content-Type-Options, and Permissions-Policy set automatically.

---

# Performance

## Core Web Vitals Targets

- LCP < 2.5s, FID < 100ms, CLS < 0.1.
- Regularly monitored via Vercel Analytics and user feedback.

## Bundle Size Optimization

- Dynamic imports for large dependencies, splitting code into smaller chunks.

## Image Optimization

- Next.js Image component for responsive sizing and caching.
- Use AVIF/WEBP formats and limit large file sizes.

## Caching Strategies

- Leverage server-side caching with Redis for frequently accessed data.
- Implement HTTP caching (ETags, cache-control) for static assets.

## Code Splitting Guidelines

- Extract rarely used modules into lazy-loaded chunks.
- Keep critical path small for faster initial page loads.

## Performance Monitoring Tools

- Vercel Observability integration and DataDog for advanced metrics.
- Automatic tracing with OpenTelemetry if configured.

## Optimization Techniques

- Keep an eye on hydration issues in React 18’s concurrent mode.
- Minimize re-renders with memoization, stable references, and advanced patterns.

---

# Contributing

## Git Workflow and Branching Strategy

1. **main**: Production-ready code.  
2. **dev** or **staging**: Integration testing environment.  
3. **feature/** or **fix/**: Short-lived branches for feature work or bug fixes.

## Code Style Guidelines

- Enforced by ESLint and Prettier with `.eslintrc.js` and `.prettierrc`.
- Follow recommended React and TypeScript best practices.

## PR Process and Templates

- Submit a draft PR early for feedback.
- Include relevant user stories, acceptance criteria, and tests.

## Review Requirements

- At least one code review from a senior or lead developer.
- All tests must pass before merging.

## Documentation Standards

- Update relevant README sections and add JSDoc/TSDoc comments to public functions.
- Provide UI screenshots or screen recordings if changes are user-facing.

## Testing Requirements

- Create or update unit/integration/e2e tests for features or fixes.
- Validate that coverage remains above the threshold.

## Release Process

- Automated semantic versioning tags on merges to `main`.
- Changelog generation for newly added or fixed functionality.

---

# Troubleshooting

1. **Common Development Issues**  
   - Node or pnpm version mismatch.  
   - Missing `.env.local` variables.  
   - Docker containers not running.

2. **Build Problems and Solutions**  
   - Inconsistent TypeScript definitions: run `pnpm type-check`.  
   - ES modules import errors: confirm correct package versions.

3. **Performance Debugging**  
   - Use browser dev tools for CPU, memory, and network bottlenecks.  
   - Evaluate React profiler for unnecessary re-renders.

4. **Testing Issues**  
   - Check that Jest environment is `jsdom`.  
   - Ensure E2E test runner is pointing to the correct local URL.

5. **Environment Setup Problems**  
   - Validate Docker logs if local DB or Redis is unreachable.  
   - Confirm the correct environment variables are loaded.

6. **Deployment Troubleshooting**  
   - Examine Vercel build logs for SSR or bundling errors.  
   - Sentry notifications if there are runtime exceptions.

7. **Known Limitations**  
   - GPU-accelerated tasks (e.g., advanced ML processes) might require external services.  
   - Very large contact lists may need paging or streaming-based data fetching.

---

<!--  
  Last Updated: Generated from technical specifications  
  Versioning: Follows semantic versioning  
  Review Cycle: Monthly or with significant changes  
  Responsible Team: Frontend Engineering  
-->