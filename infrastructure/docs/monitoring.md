<!--
  -----------------------------------------------------------------------------
  MONITORING DOCUMENTATION MODULE
  -----------------------------------------------------------------------------
  File: infrastructure/docs/monitoring.md
  Description:
    Comprehensive documentation of the B2B Sales Platform monitoring and
    observability strategy, integrating performance monitoring, error handling,
    success criteria tracking, and real-time security monitoring. This includes
    code-based references to Datadog dashboards for both API and web layers, as
    well as Sentry-based alerts and OpenTelemetry for distributed tracing.

  -----------------------------------------------------------------------------
  EXTERNAL IMPORTS (with version comments)
  -----------------------------------------------------------------------------
  // Using @datadog/datadog-api-client version ^1.0.0 for DataDog API management
  // Using @sentry/node version ^7.0.0 for advanced error tracking
  // Using @opentelemetry/api version ^1.0.0 for distributed tracing

  -----------------------------------------------------------------------------
  INTERNAL IMPORTS (named imports from JSON configuration files)
  -----------------------------------------------------------------------------
  // NOTE: The following references illustrate integration with local JSON files:
  //   1) ../monitoring/datadog/dashboards/api.json (named: apiDashboard) -> 
  //      Using members: { dashboard_config }
  //   2) ../monitoring/datadog/dashboards/web.json (named: webDashboard) ->
  //      Using members: { dashboard_config }
  //   3) ../monitoring/sentry/alerts.json (named: sentryAlerts) ->
  //      Using members: { alert_rules, notification_settings, escalation_policies }
  //      In the actual file, the "escalation_policies" key is not present; we map
  //      the "alert_grouping" content as needed for demonstration.

  -----------------------------------------------------------------------------
  FUNCTION: generateMonitoringDocs
  -----------------------------------------------------------------------------
  - Purpose:
      Generates comprehensive monitoring documentation from configuration files
      with enhanced alert and incident management details. It returns a single
      string of Markdown-formatted content covering all aspects of the monitoring
      strategy and references the relevant data from Datadog and Sentry configs.

  - Parameters:
      1) apiDashboard: object (represents ../monitoring/datadog/dashboards/api.json)
      2) webDashboard: object (represents ../monitoring/datadog/dashboards/web.json)
      3) sentryAlerts: object (represents ../monitoring/sentry/alerts.json)

  - Steps:
      1) Extract and validate monitoring configurations from input files.
      2) Generate overview section with comprehensive monitoring strategy.
      3) Document technical metrics including Core Web Vitals and API performance.
      4) Document business KPIs with target thresholds.
      5) Document enhanced alert rules with severity levels and response times.
      6) Document notification routing and escalation procedures.
      7) Document dashboard layouts with visualization best practices.
      8) Document incident response procedures with severity classification.
      9) Include communication templates and post-mortem process.
      10) Format output in markdown with proper sections and navigation.
-->

```ts
/**
 * Generates an all-inclusive B2B Sales Platform monitoring guide in Markdown.
 * @param apiDashboard  Object containing API dashboard configuration.
 * @param webDashboard  Object containing Web dashboard configuration.
 * @param sentryAlerts  Object containing Sentry alert configuration.
 * @returns             A single string with full Markdown documentation.
 */
export function generateMonitoringDocs(
  apiDashboard: {
    dashboard_config: {
      title: string;
      description?: string;
      layout_type?: string;
      widgets?: unknown[];
      template_variables?: unknown[];
      tags?: string[];
      refresh_rate?: string;
    };
  },
  webDashboard: {
    dashboard_config: {
      title: string;
      description?: string;
      layout_type?: string;
      widgets?: unknown[];
      template_variables?: unknown[];
      tags?: string[];
      refresh_rate?: string;
    };
  },
  sentryAlerts: {
    alert_rules: Record<string, unknown>;
    notification_settings: Record<string, unknown>;
    // The JSON spec includes escalation_policies, but the actual file only has alert_grouping
    // We map them accordingly to avoid incomplete implementation.
    escalation_policies?: Record<string, unknown>;
    alert_grouping?: Record<string, unknown>;
  }
): string {
  // Ensure we have valid references to the Sentry fields to avoid incomplete usage
  const resolvedEscalationPolicies =
    sentryAlerts.escalation_policies || sentryAlerts.alert_grouping || {};

  // The final, combined Markdown content
  const doc = `# B2B Sales Platform Monitoring & Observability

## 1. Monitoring Overview
This document provides a comprehensive monitoring strategy for the B2B Sales Platform, detailing infrastructure coverage, observability pillars, and team responsibility. Key components include:

- Integration with Datadog for metrics, dashboards, and alerts.
- Integration with Sentry for error tracking, alert escalation, and incident management.
- OpenTelemetry instrumentation for distributed tracing across services.
- Security and compliance considerations for real-time threat detection.

### Infrastructure & Application Coverage
- **API Services**: Captures performance metrics, error rates, resource usage.
- **Web Application**: Core Web Vitals, user experience metrics, business KPIs.
- **Database & Cache**: Observed through Datadog dashboards, integrated with the platform to report query performance, cache hit rates, and resource limits.
- **Security Monitoring**: Real-time detection of authentication anomalies, rate-limiting triggers, and data compliance checks.

### Team Responsibility Matrix
- **Platform Team**: Maintains Datadog dashboards, manages threshold configurations.
- **Backend Team**: Owns API performance, Sentry error triage, escalations.
- **Security Team**: Manages security alerts, incident response, escalations, compliance.
- **DevOps Team**: Oversees infrastructure monitoring, resource provisioning, and scaling.

### Tools & Integrations
- **Datadog**: Visualization, dashboards, metric-based alerts, business KPIs.
- **Sentry**: Error boundary instrumentation, alert routing, performance metrics.
- **OpenTelemetry**: Distributed tracing and context propagation between microservices.
- **Cost Management**: Monitoring usage-based billing across external services, ensuring alignment with budget constraints.

## 2. Metrics and KPIs
Proactive monitoring hinges on both technical metrics (e.g., API response time) and business KPIs (e.g., lead conversion rates). Below are key areas:

### Technical Metrics
- **Core Web Vitals** (LCP, FID, CLS) for user experience.
- **API Response Times** to track p95 latencies and meet SLA targets.
- **Error Rates** using rolling averages to detect systemic issues.
- **Resource Consumption** (CPU, Memory, Disk) for capacity planning.
- **Cache Hit Rate** to ensure performance optimizations are effective.

### Business KPIs
- **User Adoption**: Target of 80% active usage within 30 days.
- **Lead Quality Improvement**: 40% increase in lead conversions via AI scoring.
- **Time Savings**: 60% reduction in prospecting due to automation and streamlined ops.
- **ROI**: 3x return on investment within 6 months, tracked monthly and quarterly.

### Example Metric References
- API Dashboard: ${apiDashboard.dashboard_config.title}
- Web Dashboard: ${webDashboard.dashboard_config.title}

## 3. Alerting Configuration
A robust alerting model ensures immediate response to performance degradation, errors, and security anomalies.

### Alert Rules & Severity Levels
Sentry alert rules define:
\`\`\`json
${JSON.stringify(sentryAlerts.alert_rules, null, 2)}
\`\`\`
- **Warning** thresholds trigger cautionary Slack notifications.
- **Critical** thresholds fire pager notifications to the on-call engineer.
- **Security** events escalate to the security on-call rotation.

### Notification & Escalation Procedures
Notification settings are as follows:
\`\`\`json
${JSON.stringify(sentryAlerts.notification_settings, null, 2)}
\`\`\`
Escalation policies or grouping logic:
\`\`\`json
${JSON.stringify(resolvedEscalationPolicies, null, 2)}
\`\`\`

- **On-Call Rotation**: Weekly rotation for backend engineers; immediate escalation if unacknowledged.
- **Channel Routing**: Slack channels for initial triage (`#backend-alerts`, `#security-alerts`), email digests for daily or weekly summaries.
- **Response Times**: Critical calls within 15 minutes; security events immediate.

## 4. Monitoring Dashboards
Datadog dashboards compile relevant metrics for rapid visualization and analysis.

### API Performance Dashboard
\`\`\`json
${JSON.stringify(apiDashboard.dashboard_config, null, 2)}
\`\`\`
- Focus on API response times, error rates, and database query performance.
- Organized to highlight hotspots, resource usage, and business metric overlays.

### Web Application Dashboard
\`\`\`json
${JSON.stringify(webDashboard.dashboard_config, null, 2)}
\`\`\`
- Emphasizes Core Web Vitals, bundle sizes, client-side errors, and user adoption analytics.
- Real-time reflection of front-end performance to maintain user experience goals.

### Visualization Best Practices
- **Simple Layouts**: Group widgets by domain (performance, business, security).
- **Threshold Markers**: Quick-glance severity lines for CPU, memory, or error spikes.
- **Variable Templates**: Filter by service, environment, and region.

## 5. Incident Response
Structured escalation directs the right resources at the right time, minimizing downtime.

### Incident Severity Classification
- **SEV1**: Critical product outage or significant data loss. Immediate paging of whole team.
- **SEV2**: High-level issues impacting partial functionality or major KPI dips.
- **SEV3**: Non-critical bugs or minor performance degradations, triaged during business hours.
- **SEV4**: Information-only or cosmetic issues with minimal user impact.

### Response Procedures
1. **Detection**: Automated alert triggers from Datadog + Sentry.
2. **Acknowledgement**: On-call engineer claims the incident within 15 minutes.
3. **Diagnosis**: Investigate logs, metrics, and traces to isolate cause.
4. **Resolution**: Deploy fixes or mitigate the impact. Provide interim solutions if needed.
5. **Communication**: Status updates on Slack channels and incident trackers with timely ETAs.

### Communication Templates
- **Incident Alert**: “Hello team, we have a [SEVx] incident impacting [service].”
- **Resolution Update**: “All services stabilized. Root cause: [brief summary]. Plan: [long-term fix detail].”

### Post-Mortem & Continuous Improvement
- **Post-Mortem**: Document root cause, response timeline, lessons learned.
- **Follow-Up Actions**: Refine alerts, update runbooks, schedule new sprints for improvements.
- **Review Cycle**: Recurring monthly sessions to verify all action items complete.

`;
  return doc;
}
```

<!--
  -----------------------------------------------------------------------------
  EXPORT: monitoringDocs
  -----------------------------------------------------------------------------
  The "monitoringDocs" object provides a structured representation of the
  documentation sections, allowing each portion to be individually accessible
  if needed. This includes:
    - overview (string)
    - metrics (object)
    - alerts (object)
    - dashboards (object)
    - incidentResponse (object)
  Implementing a single string reference for each textual block to demonstrate
  the comprehensive code-based approach and synergy with the function above.
-->
```ts
export const monitoringDocs = {
  overview: "Monitoring Overview: Comprehensive coverage for the B2B Sales Platform...",
  metrics: {
    description: "Core Web Vitals, API metrics, business KPIs, and success criteria tracking."
  },
  alerts: {
    strategy: "Uses Sentry for error tracking and Datadog for performance-based alerts...",
    routing: "Slack channels and PagerDuty integrations for immediate incident notification..."
  },
  dashboards: {
    api: "Datadog API dashboard references performance, error, and business metrics in real time.",
    web: "Datadog Web dashboard focusing on user experience (Core Web Vitals) and business KPIs."
  },
  incidentResponse: {
    classification: "SEV1 to SEV4 categories with strict SLAs and on-call responsibilities.",
    postmortem: "Document root cause, timeline, follow-up tasks, and continuous improvement steps."
  }
};
```