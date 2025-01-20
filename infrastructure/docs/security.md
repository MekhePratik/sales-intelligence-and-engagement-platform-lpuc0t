<!--
  NOTE: This file contains comprehensive security documentation 
  detailing the security architecture, controls, and best practices 
  for the B2B Sales Intelligence Platform.

  We import the following internal objects for reference:
    - wafConfig (object) from infrastructure/security/waf-rules.json
      * Specifically using wafConfig.rules (WAFRules)
    - rateLimitConfig (object) from infrastructure/security/rate-limits.json
      * Specifically using rateLimitConfig.endpoints
    - ipAllowlistConfig (object) from infrastructure/security/ip-allowlist.json
      * Specifically using ipAllowlistConfig.networks

  We also note an external library:
    - "markdown-it"@^13.0.0 for advanced markdown processing
-->

# Security Documentation

This document provides an in-depth overview of the B2B Sales Intelligence Platform’s security architecture, controls, monitoring, and compliance. It addresses all aspects of multi-layered security, including the WAF configuration, rate limiting, IP allowlisting, authentication/authorization, data protection, regulatory requirements, and continuous security monitoring. It also covers advanced threat modeling, DDoS protection mechanisms, and incident response procedures.

## Table of Contents
1. [Security Overview](#security-overview)  
2. [Authentication and Authorization](#authentication-and-authorization)  
3. [Network Security](#network-security)  
4. [Data Security](#data-security)  
5. [API Security](#api-security)  
6. [Compliance](#compliance)  
7. [Security Monitoring](#security-monitoring)  
8. [Utility Functions](#utility-functions)  
9. [Exports](#exports)  

---

## 1. Security Overview

This section provides a broad outline of how security is integrated into the B2B Sales Intelligence Platform:

- The platform employs a multi-layered security model with granular controls at the network, application, and data levels.  
- Web Application Firewall (WAF) rules (drawn from wafConfig.rules) protect endpoints from known attack vectors like SQL injection, XSS, CSRF, and command injection.  
- Rate limiting (rateLimitConfig.endpoints) ensures fair usage of system resources and helps mitigate DDoS and brute-force attempts.  
- IP allowlisting (ipAllowlistConfig.networks) strictly enforces trusted networks and restricted subnets for sensitive internal operations.  
- Data is protected via encryption in transit (TLS 1.3) and at rest (AES-256).  
- Authentication is enforced with JWT-based flows and optional MFA, ensuring strong identity management.  
- Compliance is handled systematically to satisfy GDPR, SOC 2, CCPA, and PCI DSS.  
- Monitoring and alerting are integrated to rapidly detect intrusions, suspicious behavior, and performance anomalies.  

---

## 2. Authentication and Authorization

Proper authentication and authorization are pivotal to a secure environment. The platform applies these strategies:

1. JWT Tokens:  
   • Used for session management.  
   • Signed using strong algorithms (HS256 or RS256), validated by WAF rules if specified in wafConfig.rules.api_security.jwt_verification.  
   • Enforced with adjustable token expiration and rotation.  

2. OAuth2 Integration:  
   • Supports external identity providers for SSO.  
   • Minimizes password management burdens for end users.  

3. RBAC (Role-Based Access Control):  
   • Assigns permissions to roles like Admin, Manager, and User.  
   • Mapped to the underlying system checks within the application to restrict data operations.  

4. ABAC (Attribute-Based Access Control):  
   • Allows more granular checks, examining user attributes, resource attributes, and context-specific policies.  
   • Useful for advanced policy enforcement (e.g., geo-restrictions or time-based controls).  

5. MFA (Multi-Factor Authentication):  
   • Enforced for critical operations or remote users if indicated in ipAllowlistConfig.networks (e.g., VPN networks with "require_mfa").  
   • Reduces the risk of compromising user accounts.  

6. Session Security:  
   • The WAF’s csrf protection (wafConfig.rules.attack_protection.csrf) works in tandem with JWT to mitigate cross-site request forgery.  
   • Additional headers (Strict-Transport-Security, X-XSS-Protection, X-Frame-Options) are enabled as per wafConfig.rules.request_rules.security_headers.  

---

## 3. Network Security

### 3.1 WAF Configuration
The Web Application Firewall (WAF) is central to the platform’s network security. Key components include:

• wafConfig.rules.general.enabled: Toggles overall WAF capability (should remain true in production).  
• wafConfig.rules.ip_rules: Manages IP-based allow/block lists, IP reputation scoring, and country blocking.  
• wafConfig.rules.request_rules: Controls request validation such as maximum URI length, disallowed file extensions, and required headers.  
• wafConfig.rules.attack_protection:  
  - sql_injection: Blocks or sanitizes malicious queries.  
  - xss: Detects cross-site scripting attempts.  
  - csrf: Provides token-based defenses.  
  - path_traversal and command_injection: Blocks suspicious path manipulation and OS-level injection.  

### 3.2 Rate Limiting and DDoS Protection
Rate limiting is vital for mitigating brute forces and volumetric attacks:

• rateLimitConfig.endpoints:  
  - Each endpoint pattern (e.g., "/api/auth/*") has specific requests/window constraints.  
  - Overridable for roles (admin, api) with increased or reduced limits.  
• DDoS Protection:  
  - wafConfig.rules.rate_limiting.ddos_protection:  
    * threshold, window, and integration with cloudflare for advanced challenge-based defenses.  
    * queue settings to handle surges in request volume without crashing.  

### 3.3 IP Allowlisting
Strict check for trusted networks:

• ipAllowlistConfig.networks:  
  - office_networks: Corporate subnets allowed full privileges.  
  - vpn_networks: Remote access subnets requiring MFA.  
  - cloud_services: Restricted routes for external providers.  
• enforce_mode (strict/report):  
  - Strict blocks unrecognized IP ranges.  
  - Report logs the violations for auditing.  
• default_action (deny/allow) ensures a safe fallback to deny if the IP is unrecognized.  

---

## 4. Data Security

Data security includes encryption, classification, and strict access policies:

1. Encryption at Rest:  
   • AES-256 used for columns containing sensitive PII.  
   • Key management with rotation policies.  
   • Database encryption built on top of Supabase’s native encryption feature.  

2. Encryption in Transit:  
   • TLS 1.3 enforced for all public endpoints.  
   • HSTS (Strict-Transport-Security) enabled per wafConfig.rules.request_rules.security_headers.  

3. Data Classification:  
   • Public, Internal, Confidential, Restricted classification.  
   • Access privileges determined by classification level.  

4. Backup and Recovery:  
   • Full daily snapshots stored in encrypted S3 buckets.  
   • Hourly incremental backups.  
   • Automatic restore tested monthly to ensure recoverability.  

5. Access Control:  
   • RBAC combined with IP allowlist ensures only authorized users with permitted networks can read/write critical data.  
   • All data modifications enforced by the app-level authorization checks and WAF-based validations.  

---

## 5. API Security

API security is enforced through a combination of WAF rules, authentication tokens, and specialized validation:

1. Endpoint Security:  
   • wafConfig.rules.request_rules.required_headers ensures user-agent/host presence.  
   • wafConfig.rules.api_security.require_authentication blocks unauthenticated calls except for public endpoints.  
   • rateLimitConfig.endpoints mandates request volume limits to prevent abuse.  

2. Input Validation:  
   • All incoming data validated by Zod or a similar library in the application layer.  
   • WAF’s sql_injection and xss modules provide an additional protective shield.  

3. Output Encoding:  
   • Consistent escaping of special characters to thwart injection vulnerabilities.  
   • Strict JSON-based responses with minimal error disclosure.  

4. Security Headers:  
   • X-Frame-Options, X-Content-Type-Options, Referrer-Policy set as per wafConfig.rules.request_rules.security_headers.  
   • CSP directives (wafConfig.rules.content_security) reduce the risk of malicious scripts.  

5. Versioning & Deprecation:  
   • /v1/ prefix ensures backward compatibility for critical API changes.  
   • Outdated or insecure endpoints gradually phased out with error logs for usage tracking.  

---

## 6. Compliance

Regulatory and industry-standard compliance are integrated throughout the platform:

1. GDPR  
   • Data Subject Rights: Supports data deletion and export functionalities.  
   • Privacy by Design: Minimal data collection, encryption, and restricted access.  
   • Cookie Consent: Provided for relevant site features to secure user consent.  

2. SOC 2  
   • Regular security audits proving the effectiveness of controls around availability, confidentiality, processing integrity.  
   • Continuous monitoring of wafConfig.rules to ensure no unauthorized changes.  

3. CCPA  
   • Provides user rights for data disclosure and deletion.  
   • Rate-limited identity verification requests to protect user identity.  

4. PCI DSS  
   • Payment-related flows integrated through Stripe with secure fields.  
   • Network segmentation of payment flow from general traffic.  

5. Control Mappings  
   • The platform uses function renderCompliance(...) to generate a compliance matrix.  
   • Each compliance requirement is mapped to relevant WAF rules, rate-limiting endpoints, or IP allowlist configurations.  

---

## 7. Security Monitoring

Detailed security monitoring is essential to detect threats and respond promptly:

1. Logging & Alerting:  
   • All WAF decisions are logged (wafConfig.monitoring.logging).  
   • IP-based violations (ipAllowlistConfig.monitoring.log_violations) are recorded, and alerts (alert_on_violation) can be triggered.  
   • Rate-limit violations produce 429 responses and are tracked for potential suspicious patterns.  

2. Metrics & Thresholds:  
   • Key metrics: blocked_requests_count, attack_attempts_by_type, ip_reputation_scores, rate_limit_violations, and more.  
   • Custom alerting channels: Slack, PagerDuty, Email.  
   • ipAllowlistConfig.monitoring.alert_threshold sets violation triggers per minute.  

3. Incident Response:  
   • Escalation paths are defined for critical severity events.  
   • Real-time notifications for repeated unauthorized attempts or DDoS-level surges.  
   • Integration with Sentry or DataDog for event correlation and root cause analysis.  

4. Threat Intelligence Integration:  
   • IP reputation checks from wafConfig.rules.ip_rules.ip_reputation_enabled.  
   • Automated blocking for known malicious sources.  
   • Regular updates from threat feeds ensure real-time protective measures.  

---

## 8. Utility Functions

Below are outlines of two functions used within the documentation process. These are not part of the production application code but serve to generate diagrams and compliance references in an automated manner:

### 8.1 generateSecurityDiagram(diagramType, securityComponents, relationships)
Generates a comprehensive Mermaid diagram reflecting the multi-layered security model:
1. diagramType: e.g., "layered".
2. securityComponents: Object describing WAF, rate limiting, IP allowlist, encryption layers, etc.
3. relationships: Object specifying the directional relationships among components.

Returns:
• A string containing the Mermaid markup for the security diagram.

### 8.2 renderCompliance(complianceData, controlMappings, validationProcedures)
Renders a markdown table of compliance requirements:
1. complianceData: Detailed requirements for GDPR, SOC 2, CCPA, PCI DSS.
2. controlMappings: Mapping of each requirement to actual technical controls in wafConfig, rateLimitConfig, ipAllowlistConfig.
3. validationProcedures: Steps to verify these controls operationally.

Returns:
• A multi-row markdown table linking each compliance requirement with the controlling mechanism and test procedure.

---

## 9. Exports

Below is an example of how we can unify the security documentation elements into a single exportable object. This export is useful for programmatic inclusion in automated docs or DevSecOps pipelines.

```ts
export const securityDocumentation = {
  sections: [
    {
      title: "Security Overview",
      details: "Comprehensive overview of the multi-layered model..."
    },
    {
      title: "Authentication and Authorization",
      details: "Details on JWT, OAuth2, RBAC/ABAC, MFA, session security..."
    },
    {
      title: "Network Security",
      details: "WAF rules, rate limiting, DDoS protection, IP allowlisting..."
    },
    {
      title: "Data Security",
      details: "Encryption at rest, encryption in transit, data classification..."
    },
    {
      title: "API Security",
      details: "Endpoint validation, request/response sanitization..."
    },
    {
      title: "Compliance",
      details: "GDPR, SOC 2, CCPA, PCI DSS, control mappings, enforcement..."
    },
    {
      title: "Security Monitoring",
      details: "Logs, alerts, metrics, incident response, threat intelligence..."
    }
  ],
  diagrams: {
    wafFlow: "Mermaid or other visual representation for WAF request flow...",
    networkLayers: "Mermaid-based layered network diagram..."
  },
  complianceFrameworks: {
    gdpr: "Implementation references for article 5 (data minimization)...",
    soc2: "Controls mapped to trust service categories...",
    ccpa: "Procedures for data collection notification...",
    pciDss: "Segmentation of payment flows, encryption for card data..."
  },
  securityControls: {
    wafRulesReference: "Points to wafConfig.rules in waf-rules.json",
    rateLimitConfigReference: "Points to rateLimitConfig.endpoints in rate-limits.json",
    ipAllowlistReference: "Points to ipAllowlistConfig.networks in ip-allowlist.json"
  },
  monitoringConfig: {
    alerts: "Slack, email, or PagerDuty integrated with threshold-based triggers...",
    logs: "Centralized logging approach with aggregated security events..."
  }
};
```

---

**End of "infrastructure/docs/security.md"**