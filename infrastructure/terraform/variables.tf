###############################################################################
# TERRAFORM VARIABLES DEFINITION FILE
# ---------------------------------------------------------------------------
# This file defines all global variables required to deploy the B2B sales
# intelligence and engagement platform's infrastructure. The variable
# definitions cover environment configuration, core project parameters,
# Vercel integration, database configuration, cache settings, monitoring,
# and security details. These blocks collectively fulfill the project's
# technical specification and ensure a production-grade Terraform setup.
###############################################################################

###############################################################################
# 1. CORE PROJECT VARIABLES (project_variables)
# These variables establish the main context for the deployment environment
# and the project name used in resource naming and tagging.
###############################################################################

# environment
# ---------------------------------------------------------------------------
# Specifies the deployment environment for the platform.
# Accepted values are "development", "staging", or "production".
variable "environment" {
  type        = string
  description = "Deployment environment (development/staging/production)"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Valid environment values are 'development', 'staging', or 'production'."
  }
}

# project_name
# ---------------------------------------------------------------------------
# Defines a descriptive name for the B2B sales platform project.
# Used to label and identify resources throughout the infrastructure.
variable "project_name" {
  type        = string
  description = "Name of the B2B sales platform project"
}

# region
# ---------------------------------------------------------------------------
# Sets the primary geographical region for deployments (e.g., "us-east-1").
# This may be referenced by modules that create regional resources.
variable "region" {
  type        = string
  description = "Primary deployment region"
  default     = "us-east-1"
}

###############################################################################
# 2. VERCEL DEPLOYMENT VARIABLES (vercel_variables)
# These variables define configuration details for hosting the Next.js
# application on Vercel, including team/project specifics and edge settings.
###############################################################################

# vercel_team_id
# ---------------------------------------------------------------------------
# Identifies the Vercel team under which the project will be managed.
variable "vercel_team_id" {
  type        = string
  description = "Unique Vercel team identifier for organizing deployments"
}

# vercel_project_id
# ---------------------------------------------------------------------------
# Identifies the specific Vercel project. Required for automations and
# environment linkage within Vercel’s platform.
variable "vercel_project_id" {
  type        = string
  description = "Unique Vercel project identifier for managing deployments"
}

# vercel_edge_config
# ---------------------------------------------------------------------------
# Defines a map of strings used to configure additional Vercel Edge Network
# parameters. Potential keys include custom routes, caching, or advanced
# edge behaviors.
variable "vercel_edge_config" {
  type        = map(string)
  description = "Map of key-value pairs for Vercel edge network configuration"
  default     = {}
}

###############################################################################
# 3. DATABASE CONFIGURATION VARIABLES (database_variables)
# These variables detail the Supabase/PostgreSQL database parameters, covering
# instance sizing, replica counts, backup retention, and maintenance windows.
###############################################################################

# db_instance_size
# ---------------------------------------------------------------------------
# Indicates the size or tier of the Supabase-managed PostgreSQL instance
# (e.g., "standard", "premium"). Influences CPU and memory allocations.
variable "db_instance_size" {
  type        = string
  description = "Performance tier of the Supabase PostgreSQL instance"
  default     = "standard"
}

# db_replica_count
# ---------------------------------------------------------------------------
# Specifies the number of read replicas for scaling read-heavy workloads.
# Must be a non-negative integer.
variable "db_replica_count" {
  type        = number
  description = "Number of read replicas to distribute read operations"
  default     = 0

  validation {
    condition     = var.db_replica_count >= 0
    error_message = "db_replica_count must be a non-negative integer."
  }
}

# db_backup_retention_days
# ---------------------------------------------------------------------------
# Determines how many days to retain automated database backups. Critical
# for disaster recovery compliance and point-in-time recovery capabilities.
variable "db_backup_retention_days" {
  type        = number
  description = "Days of backup retention for the PostgreSQL database"
  default     = 7

  validation {
    condition     = var.db_backup_retention_days >= 1
    error_message = "db_backup_retention_days must be at least 1."
  }
}

# db_performance_insights
# ---------------------------------------------------------------------------
# Boolean toggle controlling whether advanced performance insights are
# enabled for detailed query and resource monitoring.
variable "db_performance_insights" {
  type        = bool
  description = "Enables advanced performance monitoring on the PostgreSQL instance"
  default     = false
}

# db_maintenance_window
# ---------------------------------------------------------------------------
# Defines a dedicated period (e.g., "sat:03:00-sat:07:00") for database
# maintenance tasks, ensuring minimal disruption to end-users.
variable "db_maintenance_window" {
  type        = string
  description = "Scheduled maintenance window for database instance (e.g., 'sun:03:00-sun:07:00')"
  default     = "sun:03:00-sun:07:00"
}

###############################################################################
# 4. CACHE CONFIGURATION VARIABLES (cache_variables)
# These variables govern the Redis Enterprise cache layer, specifying version,
# node sizing, cluster sizing, high availability, and backup windows.
###############################################################################

# redis_version
# ---------------------------------------------------------------------------
# Declares the version of Redis Enterprise to deploy (e.g., "6.0" or "7.0").
variable "redis_version" {
  type        = string
  description = "Redis Enterprise version for the cache cluster"
  default     = "6.0"
}

# redis_node_size
# ---------------------------------------------------------------------------
# Selects the node size/tier for Redis (e.g., "small", "medium", "large"),
# aligning with capacity and performance needs.
variable "redis_node_size" {
  type        = string
  description = "Redis node size/tier for resource allocation"
  default     = "medium"
}

# redis_cluster_size
# ---------------------------------------------------------------------------
# Number of nodes in the Redis cluster (3+ recommended for highly
# available production).
variable "redis_cluster_size" {
  type        = number
  description = "Number of nodes in the Redis cluster for HA and sharding"
  default     = 3

  validation {
    condition     = var.redis_cluster_size >= 1
    error_message = "redis_cluster_size must be at least 1."
  }
}

# redis_multi_az
# ---------------------------------------------------------------------------
# Enables multi-AZ deployment, improving resilience by distributing
# Redis nodes across availability zones.
variable "redis_multi_az" {
  type        = bool
  description = "Boolean value determining whether to enable multi-AZ for Redis"
  default     = false
}

# redis_backup_window
# ---------------------------------------------------------------------------
# CRON-like or time notation specifying when Redis backups occur, typically
# in off-peak windows.
variable "redis_backup_window" {
  type        = string
  description = "Scheduled backup window for Redis cluster (e.g., '0 3 * * *')"
  default     = "0 3 * * *"
}

###############################################################################
# 5. MONITORING & LOGGING VARIABLES (monitoring_variables)
# Variables for DataDog, Sentry, and general alert/log retention configurations
# across the platform's infrastructure.
###############################################################################

# datadog_api_key
# ---------------------------------------------------------------------------
# Holds the API key for integrating with DataDog, enabling metrics,
# logs, and traces ingestion.
variable "datadog_api_key" {
  type        = string
  description = "API key used to configure DataDog monitoring"
  default     = ""
}

# sentry_dsn
# ---------------------------------------------------------------------------
# Specifies the Sentry DSN (Data Source Name) enabling application error
# tracking and performance monitoring.
variable "sentry_dsn" {
  type        = string
  description = "Sentry DSN for error and performance monitoring"
  default     = ""
}

# alert_thresholds
# ---------------------------------------------------------------------------
# A map of numeric thresholds used in alerting (e.g., CPU usage, memory usage,
# request latency). Each key represents a distinct metric threshold.
variable "alert_thresholds" {
  type = map(number)
  description = "Map of numeric alert thresholds for metrics and performance indicators"
  default     = {}
}

# log_retention_days
# ---------------------------------------------------------------------------
# Number of days to retain logs for auditing, security compliance, and
# historical monitoring details.
variable "log_retention_days" {
  type        = number
  description = "Retention period in days for logs"
  default     = 7
}

###############################################################################
# 6. SECURITY AND ACCESS CONTROL VARIABLES (security_variables)
# These variables define critical security configurations for restricting
# access, setting up WAF rules, determining SSL policies, and encryption keys
# used across backups or data at rest.
###############################################################################

# allowed_ip_ranges
# ---------------------------------------------------------------------------
# A list of CIDR blocks representing trusted networks that may access
# platform workloads or infrastructure resources.
variable "allowed_ip_ranges" {
  type        = list(string)
  description = "List of CIDR blocks allowed to access secured resources"
  default     = []
}

# waf_rules_enabled
# ---------------------------------------------------------------------------
# A map of booleans, referencing toggles for WAF rule sets. A key might
# represent a specific rule ID or category, and the boolean indicates
# whether it is active.
variable "waf_rules_enabled" {
  type        = map(bool)
  description = "Map of WAF rule identifiers to toggle on/off"
  default     = {}
}

# ssl_policy
# ---------------------------------------------------------------------------
# Defines the TLS/SSL policy enforced at load balancers or edge proxies (e.g.,
# "TLSv1.2_2021"). Ensures modern encryption standards.
variable "ssl_policy" {
  type        = string
  description = "SSL/TLS policy enforced on load balancers or networking layers"
  default     = "TLSv1.2_2021"
}

# backup_encryption_key
# ---------------------------------------------------------------------------
# Contains the key or reference needed to encrypt backups at rest. May be
# a direct KMS alias, a user-managed key ARN, or a passphrase in some systems.
variable "backup_encryption_key" {
  type        = string
  description = "Encryption key or ARN used to secure infrastructure backups"
  default     = ""
}