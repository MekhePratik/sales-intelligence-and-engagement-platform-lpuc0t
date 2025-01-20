<!--
  Comprehensive GitHub Pull Request Template
  B2B Sales Intelligence & Engagement Platform
  ----------------------------------------------------------------------------
  This template enforces standardized pull request submissions to align with:
    - Development Workflow requirements (Technical Specs §4.5)
    - CI/CD Pipeline integration (Technical Specs §8.5)
    - Code Quality mandates (Technical Specs §A.1.2)
    - Automated validations based on .github/workflows/backend-ci.yml & web-ci.yml
    - Branch protection rules (1 required review, dismiss stale reviews, up-to-date merges)
    - Automatic assignment of reviewers (2 total from teams: frontend, backend, security)

  Please fill out all sections thoroughly. Adherence to the specified format
  and minimum lengths is mandatory. PRs failing these checks (title format, 
  description length, or coverage thresholds) may be rejected by automation.
  ----------------------------------------------------------------------------
  Validation Rules:
   1. PR title must match regex:
      ^(feat|fix|docs|style|refactor|perf|test|chore|security)(\(.+\))?: .{1,50}$
      Example: feat(auth): Add multi-factor authentication

   2. Description must be >= 50 characters.
   3. Test coverage thresholds:
       - Unit tests: >= 80%
       - Integration tests: All critical paths
       - E2E tests: Core workflows
       - Performance tests: response time < 100ms
   4. Required GitHub Actions checks:
       - type-check
       - lint
       - test
       - build
       - security-scan
       - performance-audit
  ----------------------------------------------------------------------------
-->

## PR Title Format
<!--
  Required:
    - Must be of the form [type]: Brief description
    - Allowed [type] values:
      feat, fix, docs, style, refactor, perf, test, chore, security
    - Example: "feat(ui): Improve lead management"
    - Regex validation: ^(feat|fix|docs|style|refactor|perf|test|chore|security)(\(.+\))?: .{1,50}$
-->

1. **Title**: (replace this text, ensuring you match the required format)

---

## Description
<!--
  Provide a detailed explanation of all relevant changes.
  Must contain 4 subsections:
    1) Summary of Changes (>=50 chars)
    2) Motivation and Context (>=30 chars)
    3) Dependencies (optional)
    4) Breaking Changes (default = "None" if no breaking changes)
-->

### Summary of Changes
<!--
  Required:
    - Minimum length of 50 characters
    - Detailed list of new features, bug fixes, or improvements
-->

### Motivation and Context
<!--
  Required:
    - Minimum length of 30 characters
    - Why these changes are necessary or beneficial
-->

### Dependencies
<!--
  Optional:
    - List new packages or dependencies introduced
    - Reference relevant docs or external repos
-->

### Breaking Changes
<!--
  Required:
    - If none, default: "None"
    - Outline any backward-incompatible changes
-->
None

---

## Testing Checklist
<!--
  Required:
    - Demonstrate thorough testing adherence with coverage >= 80% for unit tests
    - Integration tests must cover critical paths
    - E2E tests must verify core workflows
    - Performance tests must measure <100ms response time
    - Cross-browser testing in Chrome, Firefox, Safari, and Edge
-->

- [ ] **Unit Tests**  
  - [ ] Coverage >= 80% confirmed
  - [ ] All critical functions validated
- [ ] **Integration Tests**  
  - [ ] End-to-end data flow validated
  - [ ] Covers all critical paths
- [ ] **E2E Tests**  
  - [ ] Core user workflows verified
  - [ ] Interacts with real or mocked services
- [ ] **Performance Tests**  
  - [ ] Response times < 100ms
  - [ ] Load or stress tests completed
- [ ] **Cross-browser Testing**  
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

---

## Quality Checklist
<!--
  Required:
    - Validate alignment with code quality standards 
    - TypeScript strict mode enforced
    - ESLint rules cleared (no warnings/errors)
    - Bundle size under 200KB (initial)
    - Accessibility: WCAG 2.1 AA compliance
    - Code documentation with TSDoc for public APIs
-->

- [ ] **TypeScript Compliance** (strict mode enabled)
- [ ] **ESLint Rules** (no warnings/errors)
- [ ] **Bundle Size** (< 200KB initial load)
- [ ] **Accessibility** (WCAG 2.1 AA)
- [ ] **Code Documentation** (TSDoc for public APIs)

---

## Security Checklist
<!--
  Required:
    - Refer to security best practices
    - Authentication: JWT or equivalent verified
    - Authorization: RBAC/ABAC enforced
    - Data Encryption: Sensitive fields secured
    - Input Validation: Zod or similar
    - API Security: Rate limiting, WAF, etc.
-->

- [ ] **Authentication** (JWT implementation verified)
- [ ] **Authorization** (RBAC rules enforced)
- [ ] **Data Encryption** (Sensitive data encrypted)
- [ ] **Input Validation** (Zod schemas implemented)
- [ ] **API Security** (Rate limiting configured)

---

## Performance Checklist
<!--
  Required:
    - Database queries must average < 50ms
    - API responses p95 < 100ms
    - Frontend metrics align with Core Web Vitals
    - Caching solution for improved performance
-->

- [ ] **Database Queries** (Execution time < 50ms)
- [ ] **API Response** (p95 < 100ms)
- [ ] **Frontend Metrics** (Core Web Vitals pass)
- [ ] **Caching Strategy** (Redis or similar in place)

---

<!--
  Additional Integration Notes:
  ----------------------------------------------------------------------------
  1. Associated GitHub Actions workflows:
     - .github/workflows/backend-ci.yml (backend_ci) required_checks:
       [type-check, lint, test, build, security-scan, performance-audit]
     - .github/workflows/web-ci.yml (web_ci) required_checks:
       [type-check, lint, test, build, security-scan, performance-audit]
     Merging is blocked unless all these checks pass.

  2. Branch Protection:
     - At least 1 reviewer required
     - Dismiss stale reviews enabled
     - Must be up-to-date with base branch
     - Required status checks enforced

  3. Auto-assignment:
     - 2 reviewers auto-assigned from teams [frontend, backend, security]
     - Skips teams if changes do not apply to their domain per skip_team_on_files logic
  ----------------------------------------------------------------------------
-->