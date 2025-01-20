# Security Policy

This document serves as the overarching security policy and guidelines for the B2B Sales Intelligence Platform, defining how we protect data, manage vulnerabilities, and enforce strict security protocols. The details herein address core requirements for authentication, authorization, data security, and vulnerability management. References to our internal WAF configuration and authentication mechanisms (including Supabase Auth) are included, ensuring coherence with our overall security architecture.

---

## 1. Security Principles

1.1 Defense in Depth  
• We layer multiple security controls (e.g., WAF, DDoS mitigation, role-based access) to reduce the likelihood of successful attacks.  
• The platform integrates “wafConfig.rules” from our internal JSON specification (infrastructure/security/waf-rules.json) as a primary perimeter defense layer.  

1.2 Least Privilege  
• We grant only minimal necessary permissions to each role, service, or application component.  
• Supabase Auth is restricted to the smallest scope required for user management, ensuring that tokens and privileges remain tightly constrained.

1.3 Continuous Monitoring  
• We leverage real-time and periodic security monitoring to detect anomalies, as defined in the “monitoring” configuration of wafConfig.  
• Performance tracking and suspicious request patterns are continuously reviewed for potential indicators of compromise.

1.4 Secure by Default  
• All new features undergo threat modeling and secure coding reviews.  
• Default configurations require encryption in transit (TLS) and robust authentication (JWT tokens, secure cookies).

---

## 2. Scope of Protection

2.1 Platform Components  
• All web-facing endpoints of the B2B Sales Intelligence Platform residing under the official domain are covered by these security policies.  
• Integration points, including third-party email providers or CRM systems, must undergo security assessments before activation.

2.2 Data Classes  
• The policy applies to all lead data, user information, analytics, logs, API keys, and system configurations.  
• We distinguish between public, internal, confidential, and restricted information based on business sensitivity and compliance regulations.

2.3 Physical and Cloud Environments  
• Both production and development environments are subject to the same fundamental security requirements.  
• Supabase, Redis, and other managed services are configured with restricted network access, TLS encryption, and strict credentials.

2.4 Policy Scope Exceptions  
• Third-party libraries or artifacts considered out-of-scope for direct monitoring (e.g., user-owned data) must still pass baseline checks.  
• Components or regions specified as future-phase or pilot-based may receive extra scrutiny prior to general availability.

---

## 3. Security Responsibilities

3.1 Executive Leadership  
• Ensure the security policy aligns with business goals and regulatory requirements.  
• Evaluate resourcing for security instrumentation, incident response, and vulnerability management.

3.2 Security Team  
• Maintain configurations for wafConfig.rules, including IP rules, request rules, and attack protection parameters.  
• Oversee vulnerability assessments, coordinate patching, and handle escalations from DDoS or intrusion events.

3.3 Development Team  
• Follow secure coding practices for all new services, expansions of the Supabase Auth environment, and deployment pipelines.  
• Collaborate on code reviews to detect potential flaws in JWT or API Key handling, logging, and data classification logic.

3.4 Operational Team  
• Monitor daily logs and alerts from WAF, intrusion detection, and security scanners.  
• Execute incident response playbooks and rely on the “monitoring” section in our wafConfig for advanced log correlation.

---

## 4. Policy Updates

4.1 Maintenance  
• The policy is reviewed at least annually or after major platform changes that impact authentication, authorization, or data flows.  
• We track all modifications in version-controlled documentation to ensure traceability.

4.2 Approval  
• Updates require sign-off by Security, Compliance, and the CTO. Major edits also involve the legal department if compliance obligations are affected.

4.3 Communication  
• Approved revisions are announced to all stakeholders in Slack channels and internal newsletters.  
• Critical updates (e.g., new encryption standards or vulnerability handling procedures) trigger mandatory training sessions.

---

# Vulnerability Disclosure Program

This section outlines how external researchers and internal teams can identify and responsibly disclose security vulnerabilities within our B2B Sales Intelligence Platform.

## 1. Reporting Process

1.1 Submission Channels  
• Vulnerabilities must be reported via our dedicated security email or bug bounty platform.  
• Reports must include clear replication steps, affected endpoints, and relevant logs or screenshots wherever possible.

1.2 Acknowledgment and Tracking  
• We acknowledge receipt of disclosures within 48 hours.  
• We assign a unique tracking ID to each submission and provide status updates until resolution.

1.3 Verification  
• Security engineers verify the vulnerability validity against environment logs (including “wafConfig.monitoring” for suspicious patterns).  
• Severity is determined by potential risk area (e.g., data exfiltration or access control bypass).

## 2. Scope of Program

2.1 In-Scope Targets  
• Our primary domain and official subdomains.  
• APIs integrated with supabase.auth flows and other production endpoints explicitly listed in the bounty guidelines.

2.2 Out-of-Scope Targets  
• Sandbox or staging environments are reviewed separately.  
• External services not owned by us, including certain third-party providers, are not covered by the bounty. However, critical vulnerabilities discovered in integrated services should still be reported to our team.

## 3. Reward Structure

3.1 Severity-Based Rewards  
• High impact (e.g., remote code execution or critical authentication bypass) qualifies for higher payouts.  
• Low severity or incomplete PoCs may receive recognition, but might be ineligible for financial rewards.

3.2 Bounty Payout Logistics  
• Rewards are typically paid via the bug bounty platform used.  
• Payouts can be adjusted based on the clarity of the report, reproducibility, and potential business risk.

## 4. Safe Harbor Provisions

4.1 Good Faith Testing  
• Researchers acting in good faith shall not be legally pursued for their testing, provided they respect in-scope limitations.  
• Social engineering or unauthorized modifications are disallowed under the program.

4.2 Non-Disclosure  
• We request that researchers refrain from publicly disclosing details until a patch is released, or 90 days have elapsed without remediation.  
• Coordinated disclosure ensures minimal harm to our customers and leads.

---

# Authentication Implementation

Our platform strongly emphasizes secure, high-availability authentication methods to protect user and lead data.

## 1. JWT Implementation

1.1 Token Generation  
• JWT tokens are generated through Supabase Auth (refer to “src/backend/src/config/supabase.ts”).  
• Auth tokens rely on secure, random secrets set via environment variables, validated via “api_security” rules in wafConfig.

1.2 Validation  
• All incoming requests require valid JWT tokens. The “require_authentication” and “jwt_verification” sections in wafConfig.rules enforce signature checks and algorithm restrictions (HS256 by default).

1.3 Expiration and Rotation  
• Tokens are issued with short lifetimes to reduce window of compromise.  
• Automatic rotation is disabled on the public client but actively managed for server-side flows to ensure fresh tokens for long sessions.

## 2. OAuth Configuration

2.1 Supported Providers  
• Google and LinkedIn are integrated for Single Sign-On (SSO).  
• Strict OIDC compliance is enforced, verifying issuer claims and redirect URIs.

2.2 Client Credential Handling  
• OAuth client IDs and secrets are stored securely within environment variables and masked in logs (as enforced by logging sanitization).  
• “supabase.auth” extends these configurations for user convenience and streamlined account linking.

## 3. API Key Management

3.1 Key Structure  
• We generate secure hashed keys matching the format in “wafConfig.api_security.api_key_validation”.  
• Keys are used for external integrations, e.g., 1st-party CRM connectors or partner applications, with rate limiting enforced by wafConfig’s “api_key_validation.rate_limiting”.

3.2 Rotation Policy  
• All API keys must be rotated every 90 days.  
• Key owners receive advanced notification and a reporting ID for updated keys. Once expired, old keys are invalidated across all platform routes.

## 4. MFA Requirements

4.1 TOTP Provisioning  
• Users can opt for Time-based One-Time Password (TOTP) codes via authenticator apps.  
• Supabase supports storing user MFA preferences through the “persistSession” mechanism on specialized server components, ensuring minimal friction for second-factor onboarding.

4.2 Enforcement  
• MFA is mandatory for administrative roles responsible for lead scoring, data exports, or any critical system modifications.  
• We periodically check MFA usage logs to ensure compliance, track suspicious repeated failures, and enforce lockouts if exceeded.

---

# Authorization Framework

Detailed permissions ensure correct access levels for each role, preventing data leakage or unauthorized modifications.

## 1. Role Definitions

1.1 Admin  
• Full access to platform features and data, including advanced lead scoring insights, system configuration, and user provisioning.  
• Integration with supabase.auth to assign elevated claims in JWT payloads.

1.2 Manager  
• Intermediate privileges for team management, campaign oversight, and moderate lead data editing.  
• Subset of Admin capabilities restricted for advanced data analytics or system-level settings.

1.3 User  
• Standard operational privileges including basic lead lookup, email campaign creation, and limited personal dashboards.  
• Read-only access for certain analytics unless specifically upgraded.

1.4 API  
• Headless or service-based calls, heavily restricted by authentication tokens and usage of “api_key_validation” from wafConfig.  
• Typically assigned 5x rate limit multipliers under certain overrides, ensuring robust integration scaling.

## 2. Permission Matrix

| Functionality               | Admin | Manager | User | API  |
|----------------------------|:-----:|:-------:|:----:|:----:|
| Manage Organization        |  Yes  |   No    |  No  | No   |
| Lead Search & Management   |  Yes  |   Yes   | Yes  | Yes  |
| Campaign Creation          |  Yes  |   Yes   | Yes  | Yes  |
| System Settings            |  Yes  |   No    |  No  | No   |
| Data Export                |  Yes  |   Yes   |  No  | No   |
| Analytics Dashboard        |  Yes  |   Yes   | Yes  | No   |
| API Key Generation         |  Yes  |   No    |  No  | No   |

## 3. Access Control Lists (ACL)

3.1 Resource Tagging  
• All leads, campaigns, or analytics entries may be tagged with required read/write groups or role-based attributes.  
• Custom fields define org-level or data sensitivity controls that map to ACL checks.

3.2 Enforcement  
• ACL checks occur at each restricted route, verifying the user’s role and resource classification.  
• If the user lacks the relevant claims, “403 Forbidden” is triggered through the platform’s error handling layer.

## 4. Authorization Flows

4.1 Role Assignment  
• Roles are assigned post-authentication, typically from supabase.auth user metadata.  
• Admins can escalate or downgrade roles within the same organization domain, with logging in a secure audit trail.

4.2 Policy Updates  
• ACL modifications require a security team review to ensure minimal risk of unauthorized expansions.  
• We store revision histories for transparency and potential rollback in case of misconfiguration.

---

# Data Protection

Protecting our platform’s data is imperative; we employ multiple encryption layers, robust classification, stable backups, and purposeful retention strategies.

## 1. Encryption Methods

1.1 Data at Rest  
• AES-256-GCM for critical data fields, optionally using column-level encryption in Supabase (via pgcrypto or KMS-based vaulting).  
• Hard drives in production are encrypted at the infrastructure level, ensuring compliance with SOC 2 standards.

1.2 Data in Transit  
• All external communications use TLS (1.3 or later), including calls to supabase.  
• Strict-Transport-Security (HSTS) ensures all subdomains require HTTPS.

## 2. Data Classification

2.1 Classification Tiers  
• Public: Non-sensitive documentation, marketing assets.  
• Internal: Limited distribution data (internal playbooks).  
• Confidential: PII, leads, sensitive email content.  
• Restricted: Admin credentials, encryption keys, API secrets.

2.2 Handling Requirements  
• Confidential data must only appear in authorized contexts (internal dashboards or secure log aggregates).  
• Access to restricted data requires explicit approval and continuous logging, referencing wafConfig’s “attack_protection” sections for potential security triggers.

## 3. Backup Procedures

3.1 Frequency  
• Databases are backed up daily; we store incremental backups hourly in supabase-managed archives.  
• Log backups are performed in near real-time to ensure minimal data loss in a recovery scenario.

3.2 Restoration Testing  
• We test restore procedures monthly, simulating partial or full data recoveries.  
• Results are documented and any discovered issues are escalated to the security or reliability team.

## 4. Data Retention

4.1 Standard Retention  
• Leads and user activity logs are kept for 24 months to align with typical sales cycles.  
• Customer usage data older than two years is anonymized or securely purged, subject to compliance needs.

4.2 Compliance Overrides  
• GDPR requests may force early deletion of personal data beyond standard policy.  
• Our system respects user-initiated data removal in accordance with “Right to Be Forgotten” regulations.

---

# Infrastructure Security

Outlining core network and service-level defenses that mitigate advanced threats, drawing on specialized WAF configurations, DDoS strategies, and real-time monitoring.

## 1. WAF Rules

1.1 wafConfig Overview  
• We rely on wafConfig (infrastructure/security/waf-rules.json) to define IP rules, request size limits, SQL injection detection, and content security policies.  
• Notable features:  
  - ip_rules for allow/block lists.  
  - request_rules limiting max URI length and enforcing strict HTTP methods.  
  - attack_protection policies for SQLi, XSS, CSRF, and path traversal.

1.2 Application Integration  
• All inbound traffic passes through these WAF layers, with blocking or challenge actions triggered on suspicious behavior.  
• By default, suspicious events raise a “warn” log event, and critical attacks yield immediate “block” outcomes.

1.3 Logging and Alerting  
• “monitoring.logging” integrates with Datadog or Slack. We escalate critical events like repeated IP block triggers.  
• “alerts” in wafConfig helps define thresholds for blocked requests, ddos_attempts, or ip_reputation flagged transactions.

## 2. DDoS Mitigation

2.1 Rate Limiting  
• We enforce token bucket or sliding window rate limiting rules per endpoint, referencing “rate-limits.json.”  
• The “api_security” and “rate_limiting” sections in wafConfig detail DDoS thresholds, queue policies, and IP reputation checks.

2.2 Cloud Provider Support  
• For large-scale volumetric attacks, we integrate with Cloudflare usage in wafConfig. Cloudflare can challenge or ban malicious traffic.

## 3. Security Monitoring

3.1 Real-Time Analytics  
• wafConfig.monitoring tracks key metrics: blocked_requests_count, ip_reputation_scores, rule_effectiveness.  
• Logging uses structured error codes to expedite triage and resolution.

3.2 Observability Stack  
• Combined with Supabase logs and external logs from custom intrusion detection, these events feed into a centralized aggregator.  
• Anomaly detection rules highlight unusual patterns like repeated lead searches from single IP addresses.

## 4. Incident Response

4.1 Playbook  
• Define incident severity levels (Low, Medium, High).  
• Steps include isolating suspicious traffic at WAF, restricting supabase.auth token generation if compromised, and rolling credentials as needed.

4.2 Communication  
• Major incidents notify relevant teams within 15 minutes.  
• If a breach involves PII, legal and compliance are engaged to handle mandatory disclosures, especially under GDPR or CCPA.

4.3 Post-Mortem  
• Following each incident, we perform root-cause analysis, update wafConfig or rate-limits.json if needed, and refine detection rules.  
• Lessons learned are documented to foster a stronger security posture and reduce recurrences.

---

# Compliance Framework

Our platform aligns with several key legal and industry-specific regulations.

## 1. GDPR Compliance

1.1 Data Principles  
• Data minimization ensures we do not store extraneous lead data.  
• “Right to Erasure” requests are processed within 30 days, using secure data scrubbing routines.

1.2 Technical Controls  
• Encryption at rest, mandatory TLS, and restricted access policies.  
• Logging sensitive personal data is masked as per “logging sanitization.”

## 2. SOC 2 Controls

2.1 Security & Availability  
• We conduct annual SOC 2 audits verifying the effectiveness of organizational controls, including role-based restrictions and vulnerability scanning.  
• Auditors review wafConfig, supabase configurations, and incident response protocols.

2.2 Confidentiality & Privacy  
• We implement robust monitoring to ensure that confidential data (e.g., leads, personal info) is only accessible by authorized staff.  
• All changes to critical WAF or ACL configurations are logged.

## 3. CCPA Requirements

3.1 Consumer Rights  
• California residents can request disclosure of how their data is used, ensure its deletion, or opt-out of its sale.  
• We maintain a separate “data subject request” process for leads flagged as California residents.

3.2 Enforcement  
• Our data pipeline flags relevant leads and ensures they are subject to CCPA constraints at the point of collection.  
• For email campaigns, unsubscribes align with state-specific privacy guidelines.

## 4. PCI DSS Standards

4.1 Payment Handling  
• While primary billing occurs in a separate PCI-compliant environment, the B2B Sales Intelligence Platform references compliance for any partial card data that may appear in logs.  
• All potential card data is masked or truncated in application logs to meet PCI DSS requirements.

4.2 Periodic Attestations  
• Regular scanning for potential cardholder data in monitoring logs. If detected, immediate scrubbing and policy update are mandated.  
• Security scanning includes verifying no card data is stored in supabase data tables or in unencrypted form.

---

# Exports

## 1. Reporting Guidelines

This policy document designates “reporting_guidelines” as a named export. In practice, these guidelines detail how vulnerabilities should be responsibly reported and how the organization acknowledges and rewards such disclosures. They incorporate:

• Rapid triage and continuous status updates to reporters.  
• Clear scoping rules for in-scope vs. out-of-scope assets.  
• Safe harbor provisions to protect ethical hackers acting in good faith.

## 2. Security Measures

Our “security_measures” enumerates the key approaches to maintaining robust security, covering:

• Authentication:  
  - “JWT Tokens” through Supabase Auth (see src/backend/src/config/supabase.ts).  
  - “OAuth 2.0” integrations with Google and LinkedIn.  
  - “API Keys” with rotation every 90 days.  

• Authorization:  
  - Role-Based Access Control (RBAC) ensures minimal privileges.  
  - Permission checks enforced at each route, referencing wafConfig for advanced request inspection.  

• Encryption:  
  - Data at rest protected by AES-256.  
  - TLS 1.3 for all in-transit communications.  

• Monitoring & Compliance:  
  - “wafConfig.monitoring” tracks suspicious activities, escalates according to severity.  
  - Tools to ensure alignment with GDPR, SOC 2, CCPA, PCI DSS.  

With these measures in place, our B2B Sales Intelligence Platform upholds the strictest security standards, continuously refining our policies, configurations, and monitoring to thwart emerging threats.

---

**Document Version:** 1.0  
**Last Review Date:** 2023-10-04  
**Next Scheduled Review:** 2024-10-01