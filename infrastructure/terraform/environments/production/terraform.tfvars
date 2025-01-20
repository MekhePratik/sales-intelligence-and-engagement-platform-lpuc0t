################################################################################
# PROJECT CONFIGURATION VARIABLES (project_configuration)
# ------------------------------------------------------------------------------
# These variables provide core project context for the production environment,
# fulfilling the "Infrastructure Requirements" (Section 4.5) and "Deployment
# Environment" (Section 8.1). They enable naming and organization of all
# resources and deployments, ensuring consistent references across modules.
################################################################################

# environment
# ------------------------------------------------------------------------------
# Indicates the active environment for Terraform-managed resources. This must
# match one of the valid options (production/staging/development, etc.).
# Here, we set it to "production" for the live system.
environment = "production"

# project_name
# ------------------------------------------------------------------------------
# Defines the name of the B2B sales intelligence platform project. Used to label
# and tag resources, providing consistent references in the infrastructure.
project_name = "b2b-sales-platform"

# region
# ------------------------------------------------------------------------------
# Specifies the primary deployment region for global resources. Many Terraform
# modules and providers will reference this region for provisioned services.
region = "us-east-1"


################################################################################
# VERCEL DEPLOYMENT CONFIGURATION VARIABLES (vercel_configuration)
# ------------------------------------------------------------------------------
# Pertaining to "Cloud Services" requirements (Section 8.2) for connecting and
# deploying the Next.js application on the Vercel platform. These variables
# handle team scoping, project IDs, multi-region deployments, and advanced
# edge behavior.
################################################################################

# vercel_team_id
# ------------------------------------------------------------------------------
# Identifier for the Vercel team owning this project. Allows you to organize
# deployments under a specific team within Vercel.
vercel_team_id = "TEAM_ID_PRODUCTION_PLACEHOLDER"

# vercel_project_id
# ------------------------------------------------------------------------------
# Identifier for the Vercel project. Used by Terraform to link and deploy to
# the correct project within the specified team.
vercel_project_id = "PROJECT_ID_PRODUCTION_PLACEHOLDER"

# deployment_regions
# ------------------------------------------------------------------------------
# A list of regions (by short identifiers) for distributed Vercel deployments.
# Examples might include "iad1", "gru1", "cdg1", etc. Using multiple regions
# can reduce latency for a global user base.
deployment_regions = [
  "iad1",
  "ams1",
  "hnd1"
]

# edge_config
# ------------------------------------------------------------------------------
# A map of key-value pairs for further edge personalization with Vercel.
# This can include custom headers, cache policies, or specialized behaviors
# specific to the production environment.
edge_config = {
  cache_control   = "max-age=300, public"
  custom_header   = "X-Environment-Production"
  advanced_option = "enabled"
}


################################################################################
# SUPABASE ENTERPRISE DATABASE CONFIGURATION (database_configuration)
# ------------------------------------------------------------------------------
# These variables correspond to "Infrastructure Requirements" (Section 4.5) and
# "Cloud Services" (Section 8.2), ensuring a production-level PostgreSQL instance
# with high availability, performance monitoring, backups, and routine maintenance.
################################################################################

# db_instance_size
# ------------------------------------------------------------------------------
# Determines the performance tier or instance type for the primary PostgreSQL.
# Acceptable values range from "standard", "premium", or more specific tiers
# like "db.r5.large" in certain providers.
db_instance_size = "standard"

# db_replica_count
# ------------------------------------------------------------------------------
# Specifies how many read replicas are created for scaling out read-heavy
# workloads. A value of 1 or more is useful for production to reduce load on
# the primary instance.
db_replica_count = 1

# db_backup_retention_days
# ------------------------------------------------------------------------------
# Number of days to retain database backups. Enables point-in-time restoration
# strategies, fulfilling disaster recovery and compliance expectations.
db_backup_retention_days = 7

# db_multi_az
# ------------------------------------------------------------------------------
# A toggle (true/false) indicating whether the database is deployed in Multi-AZ
# mode. In production, setting this to true can increase availability by
# distributing nodes across zones.
db_multi_az = true

# db_performance_insights
# ------------------------------------------------------------------------------
# A toggle enabling advanced performance profiling for the database, granting
# deeper visibility into slow queries and resource usage patterns.
db_performance_insights = true

# db_maintenance_window
# ------------------------------------------------------------------------------
# A reserved weekly window (e.g., "sun:03:00-sun:07:00") when automatic database
# maintenance can occur without impacting peak production traffic.
db_maintenance_window = "sun:03:00-sun:07:00"


################################################################################
# REDIS ENTERPRISE CACHE CONFIGURATION (cache_configuration)
# ------------------------------------------------------------------------------
# Addresses "Cloud Services" (Section 8.2) for high availability, multi-AZ cache
# clusters in production, and "Infrastructure Requirements" (Section 4.5) to
# improve system performance through efficient caching and minimal latency.
################################################################################

# redis_version
# ------------------------------------------------------------------------------
# Specifies the Enterprise Redis version in a production environment (e.g., "6.0",
# "7.0"). Maintains consistency with the desired feature set and performance
# characteristics.
redis_version = "6.0"

# redis_node_size
# ------------------------------------------------------------------------------
# Determines the size or tier of each Redis node. Examples: "small", "medium",
# "large". Affects the memory and CPU footprint for each node.
redis_node_size = "medium"

# redis_cluster_size
# ------------------------------------------------------------------------------
# Number of nodes in the Redis Enterprise cluster. A typical production setup
# has at least 3 nodes for high availability, sharding, and resilience.
redis_cluster_size = 3

# redis_multi_az
# ------------------------------------------------------------------------------
# Whether the Redis cluster is spread across multiple availability zones. Helps
# mitigate downtime from zone-level outages in a production environment.
redis_multi_az = true

# redis_snapshot_retention
# ------------------------------------------------------------------------------
# Days to retain automated Redis backups/snapshots. Used for data recovery if
# cache contents must be preserved or rolled back.
redis_snapshot_retention = 7


################################################################################
# MONITORING & ALERTING CONFIGURATION (monitoring_configuration)
# ------------------------------------------------------------------------------
# Aligned with "Cross-Cutting Concerns" for Monitoring & Security (Sections 2.4,
# 7.3) and supports deeper real-time awareness of application health, performance
# metrics, and error tracking in production.
################################################################################

# datadog_api_key
# ------------------------------------------------------------------------------
# API key for DataDog integration, capturing logs, metrics, and traces. Typically
# stored securely via environment variables or secret managers.
datadog_api_key = ""

# sentry_dsn
# ------------------------------------------------------------------------------
# DSN for Sentry to collect errors, exceptions, and performance data from
# the production application environment.
sentry_dsn = ""

# alert_thresholds
# ------------------------------------------------------------------------------
# A map of threshold values for production alerts. Could include CPU usage,
# memory usage, request latency, or custom app metrics. Keys must match the
# monitoring integration logic.
alert_thresholds = {
  # Example metric keys:
  # "cpu_usage"        = 80
  # "memory_usage"     = 85
  # "request_latency"  = 300
}

# log_retention_days
# ------------------------------------------------------------------------------
# Defines how many days logs should be retained in the logging system (e.g.,
# DataDog, Elasticsearch). Longer retention aids compliance and auditing.
log_retention_days = 7

# apm_sampling_rate
# ------------------------------------------------------------------------------
# Numerical rate (0-1) controlling trace sampling for application performance
# monitoring (APM). For instance, 1 means collect all traces, while 0.3 means
# sample 30%.
apm_sampling_rate = 1


################################################################################
# SECURITY & ACCESS CONTROL CONFIGURATION (security_configuration)
# ------------------------------------------------------------------------------
# Fulfills "Security Scope" and compliance (GDPR, SOC 2) via WAF rules, IP
# whitelisting, SSL enforcement, and encryption management in production.
################################################################################

# allowed_ip_ranges
# ------------------------------------------------------------------------------
# List of CIDR blocks permitted to reach privileged endpoints or infrastructure
# resources (e.g., 10.0.0.0/16). Production environment typically restricts
# admin access to known corporate networks or VPN IPs.
allowed_ip_ranges = []

# waf_rules_enabled
# ------------------------------------------------------------------------------
# A map of booleans to toggle specific WAF rule sets by ID or category. For
# instance, { "SQL_INJECTION" = true, "XSS_PROTECTION" = true }.
waf_rules_enabled = {}

# ssl_policy
# ------------------------------------------------------------------------------
# Specifies the TLS policy enforced by load balancers or edge proxies. Production
# usage should remain on modern protocols like "TLSv1.2_2021" or higher.
ssl_policy = "TLSv1.2_2021"

# backup_encryption_key
# ------------------------------------------------------------------------------
# Key identifier or KMS alias used for encrypting backups at rest. This is
# critical for securing sensitive data in a production environment.
backup_encryption_key = ""

# security_scan_schedule
# ------------------------------------------------------------------------------
# CRON-like syntax defining a recurring schedule for automated security scans
# (e.g., vulnerability, compliance checks). Weekly or daily intervals are common.
security_scan_schedule = "0 2 * * 1"