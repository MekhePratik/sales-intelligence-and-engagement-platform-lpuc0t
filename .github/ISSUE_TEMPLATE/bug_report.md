<!--
  ---------------------------------------------------------------
  GITHUB ISSUE TEMPLATE FOR STANDARDIZED BUG REPORTING (v2.0.0)
  ---------------------------------------------------------------
  Description:
    - This template integrates with project boards, Sentry (@sentry/github@latest),
      DataDog (@datadog/github-actions@latest), and other security workflows,
      ensuring comprehensive data collection and automated debugging processes.

  Changelog:
    - v2.0.0: Added security & monitoring integration.
    - v1.1.0: Enhanced system context requirements.
    - v1.0.0: Initial template version.

  Key Integration Points:
    1) Project Boards
       - Required => true
       - Default Labels => ["bug", "severity", "component", "security", "performance"]
       - Automation => add_to_project: true, auto_assign: true, milestone_assignment: true

    2) Notifications
       - Slack Integration => "platform-alerts" (critical), "development" (general)
       - Email => distribution_lists: ["platform-ops", "development-team"]
       - PagerDuty => service_id: "PLATFORM_CRITICAL"

    3) Monitoring
       - Sentry => issue_linking: true, auto_assignment: true, severity_mapping: true
       - DataDog => metrics_correlation: true, apm_integration: true, alert_correlation: true

    4) Security
       - Security Labels => ["security", "vulnerability", "data-privacy"]
       - Security Team Mention => true
       - Security Workflow Trigger => true

  Validation Rules:
    - All required sections must be completed
    - Reproduction steps must be numbered and complete
    - System context must include environment and version
    - Security impact must be assessed for all bugs
    - Critical severity requires immediate team notification
    - Error information must include monitoring references when available
-->

---
name: "Bug Report"
about: "Create a bug report to help us identify and fix issues efficiently."
title: "[BUG]: "
labels: ["bug"]
assignees: ""
---

<!--
  ------------------------------------------------------------------------
  SECTION: SEVERITY LEVELS
  ------------------------------------------------------------------------
  Below is a reference table for selecting the proper Impact Level (Critical,
  High, Medium, Low). Please select an appropriate level under "Impact Level"
  in the "Bug Description" section to help us route and prioritize your bug.
-->

<details>
  <summary><strong>Severity Level Reference</strong></summary>

| Level     | Description                                     | Response Time  | Notification Channels                | Auto-Assign                     |
|-----------|-------------------------------------------------|----------------|--------------------------------------|---------------------------------|
| Critical  | System down or core functionality broken        | 15 minutes     | slack + pagerduty + email            | platform_ops, security_team     |
| High      | Major feature broken, significant user impact    | 1 hour         | slack + email                        | development_team                |
| Medium    | Feature partially broken, moderate impact        | 4 hours        | slack                                | development_team                |
| Low       | Minor issue, minimal impact                      | Next sprint    | github                               | triage_team                     |

</details>

<br />

<!--
  ---------------------------------------------------------------------------------------
  SECTION 1: BUG DESCRIPTION (REQUIRED)
  ---------------------------------------------------------------------------------------
  Purpose:
    - Provide a comprehensive overview of the bug with essential data for urgency assessment
    - Must include security impact assessment if any
  Fields:
    1) Summary
    2) Expected Behavior
    3) Actual Behavior
    4) Impact Level (select from the severity table above)
    5) Security Impact Assessment (describe potential confidentiality / data exposures)
-->

## 1. Bug Description

1. **Summary**  
   <!--
     A concise yet thorough description of the issue. Include relevant background
     or context to help others understand the problem quickly.
   -->

2. **Expected Behavior**  
   <!--
     Describe what you expected to happen under normal conditions (i.e., if there
     were no bug present).
   -->

3. **Actual Behavior**  
   <!--
     Outline the actual outcome that occurred, highlighting the discrepancy from
     the expected behavior. Include any relevant conditions or states observed.
   -->

4. **Impact Level**  
   <!--
     Select one of: Critical, High, Medium, Low.
     Refer to the "Severity Level Reference" above for guidance on classification.
   -->

5. **Security Impact Assessment**  
   <!--
     Use this field to assess if data privacy, system integrity, or any compliance
     requirements (e.g., GDPR, SOC 2) are affected. If you suspect a security issue,
     please label this issue with "security" and mention the Security Team.
   -->


<!--
  ---------------------------------------------------------------------------------------
  SECTION 2: REPRODUCTION STEPS (REQUIRED)
  ---------------------------------------------------------------------------------------
  Purpose:
    - Provide a numbered, step-by-step procedure to reproduce this bug. This
      ensures developers and QA can consistently replicate the problem.
  Fields:
    - Prerequisites
    - Step-by-step instructions
    - Expected outcome (from those steps)
    - Actual outcome (from those steps)
-->

## 2. Reproduction Steps

1. **Prerequisites**  
   <!--
     List any setup or configurations needed prior to reproducing the bug. For example,
     specific user roles, environment variables, or data states.
   -->

2. **Step-by-step Instructions**  
   1. ...
   2. ...
   3. ...
   <!--
     Provide each step in a numbered format. The final step should clearly show
     how to arrive at the bug condition.
   -->

3. **Expected Outcome**  
   <!--
     Describe the result that should happen if everything functioned correctly
     given the steps above.
   -->

4. **Actual Outcome**  
   <!--
     Describe what currently happens given the steps above. This might restate
     or expand on the "Actual Behavior" from the Bug Description.
   -->


<!--
  ---------------------------------------------------------------------------------------
  SECTION 3: SYSTEM CONTEXT (REQUIRED)
  ---------------------------------------------------------------------------------------
  Purpose:
    - Capture crucial environment details. This data is essential for reproducing,
      correlating metrics, and diagnosing issues accurately.
  Fields:
    - Environment (Production/Staging/Development)
    - Deployment Region
    - Browser/Device
    - Operating System
    - Application Version
    - User Role/Permissions
-->

## 3. System Context

- **Environment**:  
  <!-- e.g., Production, Staging, Development -->

- **Deployment Region**:  
  <!-- e.g., US-East, EU-West, APAC, etc. -->

- **Browser/Device**:  
  <!-- e.g., Chrome 116 on Windows 10, Safari iOS, or Another Device -->

- **Operating System**:  
  <!-- e.g., Windows 11, macOS 13, Ubuntu 22.04, iOS 16, Android 13 -->

- **Application Version**:  
  <!-- Provide the exact app version if known. If not, specify the commit hash or date. -->

- **User Role/Permissions**:  
  <!-- Provide relevant user role (e.g., Admin, Manager, Regular User, API Client) -->


<!--
  ---------------------------------------------------------------------------------------
  SECTION 4: ERROR INFORMATION (OPTIONAL, BUT STRONGLY RECOMMENDED)
  ---------------------------------------------------------------------------------------
  Purpose:
    - Collect detailed error data for correlation with Sentry, DataDog,
      or other monitoring solutions. Usually crucial for immediate debugging.
  Fields:
    - Error Message
    - Stack Trace
    - Log Snippets
    - Screenshots
    - Sentry Issue ID
    - DataDog Trace ID
    - Related Alerts
-->

## 4. Error Information (If available)

- **Error Message**:  
  <!-- Provide the exact error message as displayed on UI or logs -->

- **Stack Trace**:  
  ```text
  <!--
    Paste any relevant stack traces here. If it is extensive, consider uploading
    a snippet or referencing a Gist.
  -->
  ```

- **Log Snippets**:  
  ```text
  <!--
    Provide relevant lines from system logs, console logs, or server logs.
    Redact sensitive information if necessary.
  -->
  ```

- **Screenshots**:  
  <!-- Attach or paste screenshots, if applicable, to visually illustrate the error state. -->

- **Sentry Issue ID**:  
  <!-- Sentry automatically links this bug with the specified ID if provided. -->

- **DataDog Trace ID**:  
  <!-- Helps to correlate any APM traces within DataDog for deeper diagnosis. -->

- **Related Alerts**:  
  <!-- If there are Slack, PagerDuty, or Email alerts triggered by monitoring, reference them here. -->


<!--
  ---------------------------------------------------------------------------------------
  SECTION 5: ADDITIONAL CONTEXT (OPTIONAL)
  ---------------------------------------------------------------------------------------
  Purpose:
    - Provide any extra documentation, references, metrics, or background that
      might help in addressing or triaging the bug.
  Fields:
    - Related Issues
    - User Impact
    - Workarounds
    - Recent Changes
    - Performance Impact
-->

## 5. Additional Context (If applicable)

- **Related Issues**:  
  <!-- Link to any GitHub issues or external tickets that might be relevant. -->

- **User Impact**:  
  <!-- How many users are affected? Is there a financial or operational cost? -->

- **Workarounds**:  
  <!-- Describe any existing temporary solutions that mitigate the issue. -->

- **Recent Changes**:  
  <!-- Mention code merges, deployments, or config changes that coincide with this bug. -->

- **Performance Impact**:  
  <!-- Note if the bug negatively affects response times, CPU usage, or memory. -->


<!--
  ------------------------------------------------------------------------------------------------------
  END OF TEMPLATE
  ------------------------------------------------------------------------------------------------------
  Instructions:
    - Complete all Required Sections: Bug Description, Reproduction Steps, System Context.
    - Provide Error Information (strongly recommended if available). 
    - Add any Additional Context that might be relevant.
    - Once submitted, automation will:
      1) Assign labels: ["bug", "severity", "component", "security", "performance"] as needed.
      2) Correlate with Sentry & DataDog if Sentry Issue ID / DataDog Trace ID fields are present.
      3) Mention the correct teams based on Impact Level:
         - Critical: platform_ops + security_team
         - High, Medium: development_team
         - Low: triage_team
    - If security risk is suspected, please add "security" label and mention @security_team explicitly.

  Thank you for helping us maintain a reliable and secure platform!
-->