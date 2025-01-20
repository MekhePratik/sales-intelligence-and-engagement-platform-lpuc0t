terraform {
  # hashicorp/terraform (>=1.0): Core Terraform functionality for variable definitions
  required_version = ">= 1.0"
}

# -----------------------------------------------------------------------------
# Variable: project_name
# Purpose : Holds the project name for resource naming, tagging, and tracking
#           across the entire infrastructure.
# -----------------------------------------------------------------------------
variable "project_name" {
  type        = string
  description = "Project name for resource naming and tagging across the entire infrastructure."
}

# -----------------------------------------------------------------------------
# Variable: environment
# Purpose : Identifies the deployment environment (e.g. 'production' or 'staging')
#           to differentiate resources and apply environment-based configurations.
# Validation : Ensures that the environment variable is one of the accepted values.
# -----------------------------------------------------------------------------
variable "environment" {
  type        = string
  description = "Environment name (e.g. 'production' or 'staging') used for environment-specific configurations."

  validation {
    condition     = can(index(["production", "staging"], var.environment))
    error_message = "Valid environment values are 'production' or 'staging' only. Please ensure you provide one of these values."
  }
}

# -----------------------------------------------------------------------------
# Variable: region
# Purpose : Specifies the primary AWS region for deploying the PostgreSQL database
#           in close proximity to the application services for reduced latency.
# -----------------------------------------------------------------------------
variable "region" {
  type        = string
  description = "AWS region for database deployment, ensuring geographical alignment with application workloads."
}

# -----------------------------------------------------------------------------
# Variable: database_tier
# Purpose : Determines the performance characteristics and resource allocations
#           for the PostgreSQL database instance. Typically 'standard', 'premium',
#           or other tiers supported by the provider.
# Default  : Defaults to 'standard' to suit common mid-range production workloads.
# -----------------------------------------------------------------------------
variable "database_tier" {
  type        = string
  description = "Database instance tier configuration specifying performance and resource scaling for the PostgreSQL database."
  default     = "standard"
}

# -----------------------------------------------------------------------------
# Variable: read_replica_count
# Purpose : Indicates how many read replicas should be provisioned for read-heavy
#           workloads and better horizontal scalability.
# Validation: Must be zero or a positive integer.
# Default  : Defaults to 0 (no read replicas).
# -----------------------------------------------------------------------------
variable "read_replica_count" {
  type        = number
  description = "Number of read replicas to provision for scaling read operations and improving performance."
  default     = 0

  validation {
    condition     = var.read_replica_count >= 0
    error_message = "The read_replica_count must be a non-negative integer (e.g. 0, 1, 2...)."
  }
}

# -----------------------------------------------------------------------------
# Variable: backup_retention_days
# Purpose : Defines how many days to retain database backups. Critical for
#           disaster recovery, compliance, and regulatory obligations.
# Validation: Must be at least 1 day.
# Default  : Defaults to 7 days.
# -----------------------------------------------------------------------------
variable "backup_retention_days" {
  type        = number
  description = "Number of days to retain database backups for point-in-time recovery and compliance requirements."
  default     = 7

  validation {
    condition     = var.backup_retention_days >= 1
    error_message = "backup_retention_days must be at least 1 day to ensure data recoverability."
  }
}

# -----------------------------------------------------------------------------
# Variable: enable_encryption
# Purpose : A toggle to control whether to enable encryption at rest on the
#           PostgreSQL data store. Enhances security posture and meets compliance
#           for handling sensitive information.
# Default  : true (encryption enabled by default).
# -----------------------------------------------------------------------------
variable "enable_encryption" {
  type        = bool
  description = "Boolean value indicating whether to enable data encryption at rest, enhancing data protection and compliance."
  default     = true
}