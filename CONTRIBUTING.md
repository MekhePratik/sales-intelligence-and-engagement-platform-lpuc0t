<!--
  CONTRIBUTING GUIDELINES
  B2B Sales Intelligence & Engagement Platform

  This file provides comprehensive contribution guidelines for all developers
  working on the B2B Sales Intelligence and Engagement Platform. It references:
    - Development Environment requirements (Technical Specifications/4.5)
    - Code Quality Standards (Technical Specifications/A.1.2)
    - CI/CD Pipeline steps (Technical Specifications/4.5)
    - Security Requirements (Technical Specifications/7.0)
    - Pull Request Template sections (quality_checklist, testing_checklist) 
      from .github/pull_request_template.md
    - Security policies from SECURITY.md

  Adherence to these guidelines ensures that all contributors maintain
  high code quality, consistent structure, robust security, and complete
  test coverage across all features.
-->

# Overview

Welcome to the B2B Sales Intelligence and Engagement Platform! We value your contributions and strive to maintain the highest standards of code quality, performance, and security. This document outlines all the steps and requirements you must follow when contributing to this project.

---

## 1. Development Environment Setup

<!--
  This section addresses the "Development Environment" requirement from:
  Technical Specifications/4.5 Development & Deployment/Development Environment
-->

In order to establish a smooth development workflow, please ensure your local environment meets the following requirements:

1. **Node.js v18.17+ LTS**  
   - Verify your Node.js version by running `node -v`.
   - Use a Node version manager (e.g., nvm) to switch to v18.17+ if necessary.

2. **pnpm v8.x**  
   - Install pnpm globally with: `npm install -g pnpm@8.x`
   - Ensure your pnpm version is 8.x by running `pnpm -v`.

3. **Docker v24.x**  
   - Docker is mandatory for spinning up local PostgreSQL and Redis containers.
   - Configure Docker Desktop or Docker Engine in your environment.
   - Use the standard docker-compose.yml file (if provided) to launch containers:
     - PostgreSQL for primary relational data.
     - Redis for caching and rate limiting.

4. **VS Code Setup**  
   - We recommend Visual Studio Code with the following extensions:
     - ESLint
     - Prettier
     - GitLens
     - Docker
   - Enable auto-format on save to maintain consistent code style.

5. **Environment Variables Configuration**  
   - Copy the `.env.example` to `.env` and fill in all required variables (e.g., database credentials, Supabase URL, etc.).
   - Keep secrets out of source control. Never commit actual password or token values.

6. **Database and Cache Setup**  
   - Run containerized databases via `docker-compose up -d`.
   - Apply any required migrations or seeds using scripts defined in package.json (e.g., `pnpm db:migrate`).

7. **Local SSL Certificate (Optional)**  
   - If testing secure endpoints locally, configure self-signed certificates or use mkcert to generate local CA certs.
   - Update your `.env` or environment variables to point to the local certificate file paths.

8. **IDE Debugging Configuration**  
   - We provide sample `.vscode/launch.json` that sets up breakpoints for the Node/Next.js processes.
   - Configure your breakpoints, environment variables, and Docker to ensure smooth debugging.

---

## 2. Development Workflow

<!--
  Incorporates the "conventional-commits-spec" v1.0.0 guidelines for commit messages,
  as well as the steps for branching and environment usage.
-->

This repository follows a standardized workflow to enhance consistency and maintainability:

1. **Repository Fork & Clone**  
   - Fork the repository to your personal account.
   - Clone your fork locally: `git clone https://github.com/your-username/b2b-sales-intel.git`

2. **Branch Naming Convention**  
   - Use one of the following prefixes to quickly identify the branch type:
     - `feature/<description>` for new features.
     - `bugfix/<description>` for bug fixes.
     - `hotfix/<description>` for critical or emergency fixes.
     - `release/<description>` for release preparation or version increments.

3. **Conventional Commits**  
   - We adhere to the [conventional-commits-spec@1.0.0](https://www.conventionalcommits.org) for all commit messages.
   - Example format:  
     ```
     feat(auth): Add multi-factor authentication
     ```
     - Allowed types: feat, fix, docs, style, refactor, perf, test, chore, security
     - Scope (e.g., (auth)) indicates the section of the code being changed.
     - Short descriptive subject line under 50 characters.

4. **Local Development Server**  
   - Start the server in development mode (e.g., Next.js) with `pnpm dev`.
   - Hot reload is automatically enabled, reflecting code changes instantly.

5. **Database Migrations & Seeding**  
   - Ensure your local database is up-to-date by running `pnpm db:migrate`.
   - If seeds are needed, follow `pnpm db:seed` or relevant scripts.

6. **Feature Flags**  
   - Wrap experimental features in environment-driven or code-level flags (e.g., `FEATURE_<NAME>=true`).
   - This approach allows partial rollouts and controlled testing.

7. **Performance Profiling**  
   - Use integrated profiling tools (e.g., Performance tab in Chrome DevTools, or Node.js performance hooks).
   - Document or store measurement results for critical endpoints.

8. **Accessibility Testing**  
   - Include accessibility checks (axe-core, screen readers) for front-end features.
   - For new UI components, ensure WCAG 2.1 AA compliance by verifying color contrast, ARIA labels, and keyboard navigation.

---

## 3. Code Standards

<!--
  This section ties to the "Code Quality Standards" requirement from:
  Technical Specifications/A.1.2 Code Quality Standards
-->

To maintain a uniform and maintainable codebase, follow these standards:

1. **TypeScript Strict Mode**  
   - The `tsconfig.json` enforces `strict: true` and `noImplicitAny: true`.
   - Fix all type errors and warnings before committing.

2. **ESLint with Security Rules**  
   - Run `pnpm lint` to check code for stylistic and security-related issues.
   - Use recommended linting plugins for potential vulnerabilities (e.g., no eval).

3. **Prettier with 120 Character Line Limit**  
   - Use `.prettierrc` to auto-format. Max line length is 120.
   - Always format your code before pushing to reduce diffs.

4. **Jest Test Coverage**  
   - We enforce a minimum of 80% coverage for unit tests.  
   - Use `pnpm test:coverage` to gauge overall coverage across branches, functions, lines, and statements.

5. **Cypress E2E Tests**  
   - Implement end-to-end tests for critical user flows.
   - Ensure new UI or features have at least basic coverage.

6. **TSDoc & API Documentation**  
   - Use TSDoc comments on reusable or exported functions.
   - For REST/GraphQL endpoints, maintain an OpenAPI/Swagger specification.

7. **Performance Optimization**  
   - Identify hotspots (e.g., large data sets, nested loops).
   - Use caching strategies or indexes for database queries.

8. **Accessibility & Internationalization**  
   - Provide ARIA attributes for custom components.
   - Use i18n frameworks (like `next-intl`) for multi-language support.

---

## 4. Pull Request Process

<!--
  This section references "CI/CD pipeline" from Technical Specifications/4.5
  and also includes references to the PR template checklists from .github/pull_request_template.md
-->

When submitting a pull request, adhere to the following:

1. **PR Template Usage**  
   - We have a dedicated PR template in [./github/pull_request_template.md].  
   - Complete all sections thoroughly. This includes the [Testing Checklist] and [Quality Checklist] from the template to validate coverage, performance, lint compliance, and security aspects.

2. **Required Reviewers**  
   - At least two technical reviewers and one security reviewer must approve.
   - Automated checks enforce code owners for specialized areas.

3. **CI/CD Pipeline**  
   - Each PR triggers our GitHub Actions workflows:
     - Type check, Lint, Test, Build
     - Security scans (e.g., Snyk or `pnpm audit`)
     - Performance-audit step ensuring response times remain below thresholds
   - Merging is blocked until all checks pass.

4. **Security Scan Requirements**  
   - Automated scanning identifies vulnerabilities in dependencies.
   - Address all high or critical severity issues before final merge.

5. **Performance Impact Assessment**  
   - If your changes may affect performance, include logs or data from local stress tests.
   - Demonstrate that relevant endpoints stay within the documented SLA (<100ms p95).

6. **Documentation Review**  
   - Update README, API docs (Swagger/OpenAPI), or design specs if changes alter usage patterns.

7. **Breaking Changes**  
   - If your PR introduces a breaking change (API format, DB schema), clearly state it in the “Breaking Changes” section of the PR template.
   - Provide migration instructions or fallback solutions.

8. **Deployment Validation & Rollbacks**  
   - Upon merge, changes auto-deploy to the staging environment for smoke tests.
   - If metrics or logs show regression, revert promptly or apply a hotfix.

---

## 5. Testing Guidelines

<!--
  This section covers the "Testing Guidelines" from the spec, referencing 
  "testing_checklist" from .github/pull_request_template.md
-->

In addition to the required “Testing Checklist” within the PR template, observe the following:

1. **Jest Configuration**  
   - Write unit tests for all major logic, ensuring function-level coverage.
   - Maintain at least 80% coverage with `pnpm test:coverage`.

2. **Cypress E2E Test Scenarios**  
   - Exercise core user flows (authentication, lead management, campaign creation).
   - Test across multiple browsers if possible (Chrome, Firefox, Safari, Edge).

3. **Performance Testing Benchmarks**  
   - Implement stress or load tests (e.g., k6, Artillery.io) for endpoints critical to lead search or campaign triggers.
   - Provide summary reports as part of major PRs.

4. **Security Testing**  
   - Validate authentication flows (JWT tokens, roles) to prevent unauthorized access.
   - Include negative tests for rate limiting or input validations.

5. **Load Testing Procedures**  
   - For large-scale data imports, verify system stability (memory usage, CPU).
   - Document concurrency levels and any fallback (queue-based) logic.

6. **Integration Test Coverage**  
   - Ensure end-to-end data consistency between the web layer, the database, and external services like Resend or Stripe.

7. **API Contract Testing**  
   - For REST or GraphQL endpoints, confirm schema consistency using contract tests.
   - Maintain an updated OpenAPI/Swagger file for the platform gateway.

8. **Browser Compatibility & Mobile Responsiveness**  
   - Test layout breakpoints (320px, 768px, 1024px, 1440px) using device emulation.
   - Ensure mobile interactions remain smooth (touch, scroll).

9. **Accessibility Testing Procedures**  
   - Leverage test frameworks like jest-axe or react-axe.
   - Confirm WCAG 2.1 AA compliance to avoid regressions in new UI features.

---

## 6. Security Considerations

<!--
  This section addresses "Security Requirements" from Technical Specifications/7.
  References the "policy" section in SECURITY.md as well.
-->

Security is paramount in handling B2B data and personal contact information. Please follow these protocols:

1. **Security Policy Compliance Steps**  
   - Review SECURITY.md “policy” section for overarching guidelines (e.g., WAF configurations, DDoS mitigation).
   - All new or modified endpoints must integrate with existing rate-limit and hydration checks.

2. **Vulnerability Reporting Process**  
   - If you discover a vulnerability, follow the procedures outlined in SECURITY.md under “Vulnerability Disclosure Program.”
   - For critical findings, escalate immediately to the security team.

3. **Code Security Best Practices**  
   - Never commit secrets (API keys, tokens, DB credentials) to the repository.
   - Use Zod or equivalent schema validation to sanitize inputs.

4. **Data Protection Requirements**  
   - Adhere to GDPR and CCPA guidelines when handling personal data.
   - If data retention rules are relevant, ensure your changes do not exceed mandated retention periods.

5. **Authentication & Authorization Controls**  
   - Rely on standardized JWT validation flows for API endpoints.
   - For role-based checks, integrate into the Access Control List (ACL) logic provided in the codebase.

6. **GDPR & SOC 2 Compliance**  
   - Confirm correct usage of anonymized or aggregated data for analytics.
   - Log any admin-level data accesses or user privilege escalations as required by SOC 2.

7. **PCI DSS Guidelines (If Applicable)**  
   - For payments or partial card data handling, reference Stripe’s PCI mode integrations.
   - Ensure that no unencrypted card data is stored in the platform or logs.

8. **Security Testing Procedures**  
   - Include negative or fuzz testing to detect injection vulnerabilities (SQLi, XSS).
   - Check for open redirects, SSRF, or insecure direct object references wherever new routes are introduced.

---

## Final Notes

Thank you for contributing to the B2B Sales Intelligence & Engagement Platform. By following these guidelines—covering environment setup, branching strategies, code standards, testing, and security—you help maintain a robust, scalable, and secure product.

Please reach out to the maintainers or security team for any questions regarding these guidelines.

Happy Coding!