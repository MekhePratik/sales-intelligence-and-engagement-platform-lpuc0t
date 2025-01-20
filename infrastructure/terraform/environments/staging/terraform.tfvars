################################################################################
# PROJECT CONFIGURATION VARIABLES
# These variables define the fundamental project context for the staging
# environment, such as environment name, project name, and region. They align
# with the "project_configuration" export specified in the JSON file.
################################################################################

environment             = "staging"
project_name            = "b2b-sales-platform"
region                  = "us-east-1"

################################################################################
# VERCEL CONFIGURATION
# Variables that optimize how this staging environment is deployed and tested
# on Vercel, addressing preview builds, automatic deployment, and regions.
# Matches the "vercel_configuration" export in the JSON specification.
################################################################################

vercel_team_id              = "REPLACE_WITH_YOUR_VERCEL_TEAM_ID"
vercel_project_id           = "REPLACE_WITH_YOUR_VERCEL_PROJECT_ID"
preview_deployment_enabled  = true
auto_deployment_enabled     = false
deployment_regions          = ["iad1", "sfo1", "fra1"]

################################################################################
# DATABASE CONFIGURATION
# Staging-tuned Supabase database settings, addressing instance size, replica
# count, backup retention, performance insights, maintenance routines, and
# maximum connections. Corresponds to "database_configuration" export.
################################################################################

db_instance_size             = "standard"
db_replica_count             = 0
db_backup_retention_days     = 7
performance_insights_enabled = true
auto_vacuum_enabled          = true
max_connections              = 50

################################################################################
# CACHE CONFIGURATION
# This block customizes the Redis cache for the staging environment, including
# version, node size, cluster size, memory policy, and backup for comprehensive
# pre-release testing. Matches "cache_configuration" export.
################################################################################

redis_version      = "6.2"
redis_node_size    = "small"
redis_cluster_size = 1
maxmemory_policy   = "allkeys-lru"
backup_enabled     = false

################################################################################
# MONITORING CONFIGURATION
# Enhanced monitoring for staging, integrating with DataDog, Sentry, and various
# alert thresholds. Booleans for debugging and a trace sampling rate help gather
# deeper performance insights before production. Matches "monitoring_configuration."
################################################################################

datadog_api_key       = "REPLACE_WITH_DATADOG_API_KEY"
sentry_dsn            = "REPLACE_WITH_SENTRY_DSN"
log_retention_days    = 7
alert_thresholds      = {
  cpu_usage = {
    warning  = 70
    critical = 90
  }
  memory_usage = {
    warning  = 80
    critical = 95
  }
  request_latency = {
    warning  = 200
    critical = 500
  }
}
debug_mode_enabled    = true
trace_sampling_rate   = 0.5

################################################################################
# SECURITY CONFIGURATION
# Security rules suitable for staging, covering IP allowlists, WAF rule toggles,
# TLS version requirements, and rate limiting for authentication and APIs.
# Fulfills the "security_configuration" export.
################################################################################

allowed_ip_ranges = [
  "0.0.0.0/0"
]

waf_rules_enabled = {
  commonCoreRules  = true
  advancedSqlRules = false
}

min_tls_version    = "TLSv1.2"
auth_rate_limit    = 100
api_rate_limit     = 200