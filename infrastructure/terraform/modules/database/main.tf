###############################################################################
# Terraform configuration for provisioning and managing a scalable PostgreSQL
# database infrastructure on Supabase Enterprise, including read replicas,
# backup configuration, encryption, and monitoring. This module references
# variables defined in variables.tf and fulfills the requirements from the
# technical specification:
# 1. Scalable Data Platform on Supabase (High-Level Description)
# 2. Data Management Strategy (Partitioning, Indexing, Backup, Encryption)
# 3. Infrastructure Requirements (Supabase Enterprise + Read Replicas)
# 4. Security Controls (Encryption at rest and in transit)
###############################################################################

###############################################################################
# Terraform Settings & Provider Configuration
###############################################################################
terraform {
  required_version = ">= 1.0"

  # Third-party providers with explicit versions for reliability and reproducibility
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0" # Supabase provider version
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0" # Random provider version
    }
  }
}

# Supabase provider configuration, leveraging variables from variables.tf:
#   var.project_name - distinct project identifier
#   var.region       - Supabase region for latency optimization
provider "supabase" {
  project = var.project_name
  region  = var.region
}

###############################################################################
# Locals: Centralized assignments derived from the JSON specification
# These address dynamic behavior such as environment-based toggles and
# naming conventions for the PostgreSQL instance, read replicas, backups,
# monitoring, encryption scope, and maintenance windows.
###############################################################################
locals {
  # Construct a database name based on project and environment
  database_name       = "${var.project_name}-${var.environment}-db"

  # Enable backups only in production
  backup_enabled      = var.environment == "production" ? true : false

  # Enable read replicas only in production
  replica_enabled     = var.environment == "production" ? true : false

  # Enable monitoring in all environments except development
  # (In practice, development environment usage in var.environment
  #  must be conceptually validated or extended as needed).
  monitoring_enabled  = var.environment != "development" ? true : false

  # Force encryption to be enabled true by default
  encryption_enabled  = true

  # Alternate maintenance window logic based on environment
  maintenance_window  = var.environment == "production" ? "sun:03:00-sun:07:00" : "sat:03:00-sat:07:00"

  # Map "instance_class" to the tier variable from variables.tf
  instance_class      = var.database_tier

  # Map "replica_count" to read_replica_count from variables.tf
  replica_count       = var.read_replica_count
}

###############################################################################
# Random Resource: Administrative Password Generation
# Securely generates a strong password to authenticate as an admin or
# privileged role in the PostgreSQL instance. Keeping this in state is
# acceptable if state encryption is enabled. For additional security,
# consider an external vault or secret manager.
###############################################################################
resource "random_password" "db_admin_password" {
  length           = 16
  special          = true
  override_special = "!#%&*()-_=+[]{}<>:?/"
}

###############################################################################
# Primary Database Resource: supabase_database
# This resource represents the main PostgreSQL database instance on Supabase.
# Addresses vertical scaling (instance_class), naming, and environment-based
# maintenance windows and encryption. Exports key information:
#    - connection_string: Sensitive
#    - host: Named
#    - instance_class: Named
###############################################################################
resource "supabase_database" "main" {
  # Hypothetical arguments demonstrating how we might pass
  # name, scaling tier, encryption, admin credentials, etc.
  name                = local.database_name
  instance_class      = local.instance_class
  admin_username      = "admin"
  admin_password      = random_password.db_admin_password.result
  maintenance_window  = local.maintenance_window

  # Typically these booleans and encryption features would be
  # part of a real provider's parameters or automatic in Supabase.
  encryption_enabled  = local.encryption_enabled

  # Example placeholders for various data management strategies:
  #   partitioning, indexing, data retention, etc.
  # In real usage, these might be separate modules or config variables.
  partitioning_strategy = "organization_id"      # Pseudo
  indexing_strategy     = ["email", "created_at"] # Pseudo
}

###############################################################################
# Database Replica Resource: supabase_database_replica
# Creates read replicas for horizontal scalability of read operations.
# Only used if local.replica_enabled is true. Exports:
#    - connection_strings: Sensitive
#    - replica_count: Named
###############################################################################
resource "supabase_database_replica" "replica" {
  # Hypothetical argument controlling the number of replicas
  count = local.replica_enabled ? local.replica_count : 0

  # References the primary database ID
  source_database_id = supabase_database.main.name

  # Illustrative connections array
  connection_strings = [
    "postgres://${random_password.db_admin_password.result}@replica-endpoint-1",
    "postgres://${random_password.db_admin_password.result}@replica-endpoint-2"
  ]
}

###############################################################################
# Database Backup Resource: supabase_database_backup
# Manages backup configuration for point-in-time recovery, etc.
# Exports the following attributes:
#    - retention_days
#    - pitr_enabled
#    - backup_window
###############################################################################
resource "supabase_database_backup" "backup" {
  # The name references the primary database instance for alignment
  name            = "${local.database_name}-backup"
  # Realistically might reference a supabase_database.main ID
  database_id     = supabase_database.main.name

  # Toggled based on environment (production or else)
  pitr_enabled    = local.backup_enabled

  # Custom backup retention (in days)
  retention_days  = var.backup_retention_days

  # Backup scheduling window typically aligns with maintenance
  backup_window   = local.maintenance_window
}

###############################################################################
# Database Monitoring Resource: supabase_database_monitoring
# Provides metrics and alerting for the main database. Exports:
#    - alert_configurations (map of objects)
#    - metrics_enabled (bool)
###############################################################################
resource "supabase_database_monitoring" "monitoring" {
  # Typically references the primary database
  database_id         = supabase_database.main.name

  # Enable metrics if not in development environment
  metrics_enabled     = local.monitoring_enabled

  # Example alert configurations as a placeholder
  # In practice, this might accept more structured objects.
  alert_configurations = {
    cpu_usage = {
      threshold = 80
      action    = "notify"
    }
    disk_space = {
      threshold = 90
      action    = "notify"
    }
  }
}

###############################################################################
# Database Encryption Resource: supabase_database_encryption
# Manages encryption for data at rest, referencing a hypothetical KMS Key
# or a random-generated encryption key. Exports:
#    - encryption_key_id (Sensitive)
#    - encryption_enabled (bool)
###############################################################################
resource "random_id" "db_encryption_key" {
  byte_length = 16
}

resource "supabase_database_encryption" "encryption" {
  # Toggling encryption on or off as driven by local configuration
  encryption_enabled = local.encryption_enabled

  # Hypothetical reference to an externally managed KMS or a random key
  encryption_key_id  = random_id.db_encryption_key.hex
}

###############################################################################
# Outputs Section
# Terraform module exports. Each resource's key exposed attributes are
# declared here. Some are sensitive, some are named. They must be retrieved
# by upstream consumers (e.g., to pass to other modules or resources).
###############################################################################

# -------------------- supabase_database outputs ------------------------------
output "supabase_database_connection_string" {
  description = "Sensitive primary database connection string"
  sensitive   = true

  # Hypothetical output - real resource attributes may differ
  value = "postgres://${random_password.db_admin_password.result}@${supabase_database.main.name}"
}

output "supabase_database_host" {
  description = "Host (non-sensitive) for the primary database"
  value       = supabase_database.main.name
}

output "supabase_database_instance_class" {
  description = "Named tier or sizing class for the primary database instance"
  value       = local.instance_class
}

# ---------------- supabase_database_replica outputs --------------------------
# connection_strings are an array of read replica connection URLs
output "supabase_database_replica_connection_strings" {
  description = "Sensitive read replica connection strings array"
  sensitive   = true

  # Because we used count, we access each index if any replicas are created.
  value = flatten([
    for r in supabase_database_replica.replica :
    r.connection_strings
  ])
}

output "supabase_database_replica_count" {
  description = "Count of read replicas for horizontal read scaling"
  value       = local.replica_count
}

# ----------------- supabase_database_backup outputs --------------------------
output "supabase_database_backup_retention_days" {
  description = "Specifies the number of days to retain backups"
  value       = supabase_database_backup.backup.retention_days
}

output "supabase_database_backup_pitr_enabled" {
  description = "Whether point-in-time recovery is enabled for backups"
  value       = supabase_database_backup.backup.pitr_enabled
}

output "supabase_database_backup_window" {
  description = "Window in which backups occur"
  value       = supabase_database_backup.backup.backup_window
}

# ------------- supabase_database_monitoring outputs --------------------------
output "supabase_database_monitoring_alert_configurations" {
  description = "Alert rules configured for the database"
  value       = supabase_database_monitoring.monitoring.alert_configurations
}

output "supabase_database_monitoring_metrics_enabled" {
  description = "Indicates whether advanced metrics and monitoring are enabled"
  value       = supabase_database_monitoring.monitoring.metrics_enabled
}

# ------------- supabase_database_encryption outputs --------------------------
output "supabase_database_encryption_key_id" {
  description = "Reference to the encryption key ID for data at rest encryption"
  sensitive   = true
  value       = supabase_database_encryption.encryption.encryption_key_id
}

output "supabase_database_encryption_enabled" {
  description = "Indicates if encryption at rest is enabled for the database"
  value       = supabase_database_encryption.encryption.encryption_enabled
}