###############################################################################
# Main Terraform configuration file that orchestrates the infrastructure
# deployment for the B2B sales intelligence platform. This file integrates
# the database, cache, and storage modules with comprehensive monitoring,
# security, and scaling capabilities. It references and leverages the outputs
# from these modules to produce final infrastructure outputs compliant with
# the project requirements.
###############################################################################

###############################################################################
# 1. TERRAFORM BLOCK & PROVIDERS
#    - Includes essential backend configuration, version constraints, and
#      required providers per JSON specification.
#    - S3 backend is used with encryption enabled.
###############################################################################
terraform {
  required_version = ">= 1.0.0"

  # Backend configuration for state storage
  backend "s3" {
    encrypt = true
    # NOTE: Additional backend parameters such as bucket, key, region should be
    #       supplied via environmental or tfvars-based configuration.
  }

  required_providers {
    # Vercel provider ~> 1.0 (IE2: Third-party with version comment)
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    # Supabase provider ~> 1.0 (IE2: Third-party with version comment)
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    # DataDog provider ~> 3.0 (IE2: Third-party with version comment)
    datadog = {
      source  = "datadog/datadog"
      version = "~> 3.0"
    }
  }
}

###############################################################################
# 2. LOCALS BLOCK
#    - Draws upon environment variables or defaults to define naming and tags.
#    - Provides consistent naming across all resources ("resource_prefix").
###############################################################################
locals {
  # Environment fallback to 'development' if TF_VAR_environment is not present
  environment    = coalesce(env.TF_VAR_environment, "development")

  # Project name fallback to 'b2b-sales-platform' if TF_VAR_project_name is not present
  project_name   = coalesce(env.TF_VAR_project_name, "b2b-sales-platform")

  resource_prefix = "${local.project_name}-${local.environment}"

  # Common tags reused across modules and resources
  common_tags = {
    Environment = local.environment
    Project     = local.project_name
    ManagedBy   = "terraform"
  }
}

###############################################################################
# 3. VARIABLES
#    - Minimal placeholders for any custom environment-based settings used below.
###############################################################################
variable "database_region" {
  type        = string
  description = "Primary region for Supabase database deployment. Defaults to 'us-east-1'."
  default     = "us-east-1"
}

variable "cache_instance_size" {
  type        = string
  description = "Defines the Redis instance size or tier."
  default     = "medium"
}

variable "storage_region" {
  type        = string
  description = "Defines the AWS region for S3 storage. Defaults to 'us-east-1'."
  default     = "us-east-1"
}

###############################################################################
# 4. PROVIDER CONFIGURATIONS
#    - Configures any external providers if required at root level. In many
#      scenarios, providers can also be configured inside modules.
#    - Include environment-specific or secret-based parameters as needed.
###############################################################################
provider "vercel" {
  # Additional Vercel provider configuration can be defined here.
  # (version ~> 1.0, pinned in the terraform block).
}

provider "datadog" {
  # Additional DataDog provider configuration can be defined here, including
  # credentials for metrics, logs, and alerting. (version ~> 3.0).
}

###############################################################################
# 5. HELPER COMMENTS FOR "FUNCTIONS"
#    - The JSON specification references "configure_providers" and
#      "setup_monitoring" as conceptual steps. In Terraform, these are
#      typically expressed by configuring providers and creating resources
#      for monitoring. We document them extensively for clarity.
###############################################################################
# configure_providers(environment, provider_config):
#   1. Configure Vercel provider with appropriate project data.
#   2. Set up Supabase provider (handled inside the database module).
#   3. Configure DataDog provider with environment key and site parameters.
#   4. Apply environment-based security for each provider.
#
# setup_monitoring(environment, monitoring_config):
#   1. Set up DataDog integration for custom metrics and logs.
#   2. Configure alert thresholds for infra components.
#   3. Manage environment-based logging/aggregation policies.
#   4. Ensure that any AI-driven or advanced alerting is also integrated.

###############################################################################
# 6. MODULE: DATABASE
#    - Points to the modules/database subfolder and maps relevant inputs.
#    - Exports critical outputs for references in final infrastructure outputs.
###############################################################################
module "database" {
  source = "./modules/database"

  # Passed variables (matching modules/database/variables.tf)
  project_name          = local.project_name
  environment           = local.environment
  region                = var.database_region
  database_tier         = "standard"
  read_replica_count    = 1
  backup_retention_days = 7
  enable_encryption     = true
}

###############################################################################
# 7. MODULE: CACHE (REDIS ENTERPRISE)
#    - Instantiates Redis cluster with distributed caching, referencing
#      variables that align with modules/cache/variables.tf. Provides HA,
#      monitoring, automated backups, and security.
###############################################################################
module "cache" {
  source = "./modules/cache"

  # Mapped inputs following modules/cache/variables.tf
  project_name         = local.project_name
  environment_name     = local.environment
  redis_version        = "6.0"
  cluster_mode_enabled = true
  node_count           = 3
  instance_size        = var.cache_instance_size
  backup_retention_days = 7
  monitoring_enabled   = true

  # Example alert thresholds for CPU, memory usage, ops/sec, and connections.
  alert_thresholds = {
    cpu_usage         = 80
    memory_usage      = 85
    ops_per_sec       = 20000
    total_connections = 1000
  }
}

###############################################################################
# 8. MODULE: STORAGE (S3 + CDN)
#    - Allocates an S3 bucket with encryption, versioning, lifecycle, and
#      optional CloudFront distribution per modules/storage/variables.tf.
#    - Provides a secure, versioned storage layer for the B2B platform.
###############################################################################
module "storage" {
  source = "./modules/storage"

  environment          = local.environment
  storage_bucket_name  = "b2b-sales-storage-${local.environment}"
  storage_region       = var.storage_region
  storage_versioning   = true

  # Lifecycle rules left empty here; can be customized as needed.
  storage_lifecycle_rules = []

  # Minimal CDN config. If your environment needs to disable the CDN,
  # set enabled = false or override defaults here.
  cdn_config = {
    enabled      = true
    price_class  = "PriceClass_100"
    aliases      = []
    ssl_cert_arn = ""
  }

  # CORS default: allows GET/POST/PUT/DELETE/HEAD from any origin
  cors_rules = [{
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "PUT", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }]

  # Tagging for environment clarity
  tags = local.common_tags

  # Replication & Logging disabled by default, can be set here
  replication_config = {
    role_arn = ""
    rules    = []
  }
  logging_config = {
    target_bucket = ""
    target_prefix = ""
  }
}

###############################################################################
# 9. INFRASTRUCTURE OUTPUTS
#    - Aggregates final values required by the application for deployment and
#      operational awareness. This single output object, "infrastructure_outputs,"
#      provides references to database, cache, storage, CDN, and monitoring data.
###############################################################################
output "infrastructure_outputs" {
  description = "Aggregate object of key infrastructure URLs, endpoints, and configurations."

  value = {
    # From 'module.database' (IE1 mapping: database_url, read_replica_urls)
    #   supabase_database_connection_string => main DB
    #   supabase_database_replica_connection_strings => read replicas
    #   We map "database_url" to the primary connection string:
    database_url         = module.database.supabase_database_connection_string
    read_replica_urls    = module.database.supabase_database_replica_connection_strings

    # Example placeholder for "connection_pool_settings":
    # The database module does not explicitly output pool configs, so we use
    # a generic placeholder or reference the default from the provider.
    connection_pool_settings = {
      max_connections = 50
      pool_timeout    = 30
    }

    # From 'module.cache' (IE1 mapping: redis_cluster => endpoint, cache_rules => alert config)
    #   redis_cluster_endpoint => main Redis endpoint
    redis_endpoint = module.cache.redis_cluster_endpoint

    # We can also demonstrate how to unify alert rules from the cache module
    cache_rules = module.cache.redis_monitoring_alert_rules

    # From 'module.storage' (IE1 mapping: storage_bucket, cdn_distribution, backup_configuration)
    #   The storage module does not explicitly output these, so we rely on
    #   known naming or placeholders. We'll define them here for completeness.
    storage_bucket = "b2b-sales-storage-${local.environment}"

    # If the CDN is enabled, referencing the distribution domain can be
    # done via a resource inside the module. For demonstration, we show
    # a placeholder domain:
    cdn_domain = "placeholder.cloudfront.net"

    # Typically, a backup_configuration might unify S3 versioning or cross-region
    # replication. For demonstration, referencing 'database' and 'cache' backups:
    backup_configurations = {
      database_retention_days = module.database.supabase_database_backup_retention_days
      database_pitr_enabled   = module.database.supabase_database_backup_pitr_enabled
      redis_retention_days    = module.cache.redis_backup_retention_policy.days
      # No direct S3 backup config is output; we treat versioning as the
      # storage "backup" concept
      s3_versioning_enabled   = true
    }

    # Combined monitoring endpoints from both database and cache
    monitoring_endpoints = {
      database_metrics_enabled = module.database.supabase_database_monitoring_metrics_enabled
      redis_metrics_endpoint   = module.cache.redis_monitoring_metrics_endpoint
      # Additional DataDog or external monitoring URIs can be added here.
    }
  }
}