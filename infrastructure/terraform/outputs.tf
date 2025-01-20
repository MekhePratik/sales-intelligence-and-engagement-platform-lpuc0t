###############################################################################
# Terraform Outputs for B2B Sales Intelligence Platform Infrastructure
# -------------------------------------------------------------------------------
# This file exposes the required outputs from the database, cache, and storage
# modules for broader consumption by the application and other infrastructure
# components. It addresses:
#  - Infrastructure Requirements (4.5)
#  - Cloud Services Integration (8.2)
#  - Deployment Environment Outputs (8.1)
# 
# The outputs defined below adhere to the JSON specification:
#   1) database_url
#   2) database_replicas
#   3) redis_config
#   4) storage_config
#   5) monitoring_endpoints
#
# Each output is annotated with extensive comments and references the imported
# Terraform modules (database, cache, storage) as declared elsewhere in the
# overall infrastructure codebase.
###############################################################################

###############################################################################
# Module References
# -------------------------------------------------------------------------------
# These references assume that the 'database', 'cache', and 'storage' modules
# are declared in another Terraform file (e.g. main.tf) within the same
# directory. Each module call must export the specific attributes that we
# here re-expose as top-level outputs.
###############################################################################
#
# Example:
# module "database" {
#   source = "./modules/database"
#   # <var assignments>
# }
#
# module "cache" {
#   source = "./modules/cache"
#   # <var assignments>
# }
#
# module "storage" {
#   source = "./modules/storage"
#   # <var assignments>
# }
#
###############################################################################

###############################################################################
# 1) DATABASE_URL
# -------------------------------------------------------------------------------
# Purpose:
#   - Exposes the primary secure PostgreSQL connection URL (including
#     authentication credentials and SSL mode) provided by Supabase Enterprise.
# Details:
#   - Aligns with the specification for "database_url" output:
#       type: string
#       members_exposed: connection_string
#       export_type: sensitive
#   - Consumed by serverless functions, application containers, or other
#     microservices that need to connect to the main database.
###############################################################################
output "database_url" {
  description = "Secure PostgreSQL database connection URL with authentication credentials and SSL configuration"
  value       = module.database.supabase_database_connection_string
  sensitive   = true
}

###############################################################################
# 2) DATABASE_REPLICAS
# -------------------------------------------------------------------------------
# Purpose:
#   - Provides a list of one or more read replica URLs for horizontally scaled
#     database reads.
# Details:
#   - Aligns with the specification for "database_replicas" output:
#       type: list(string)
#       members_exposed: replica_urls
#       export_type: sensitive
#   - Used by replica-aware services that can redirect heavy read traffic
#     away from the primary database to improve performance and throughput.
###############################################################################
output "database_replicas" {
  description = "List of PostgreSQL read replica connection URLs for horizontal scaling"
  value       = module.database.supabase_database_replica_connection_strings
  sensitive   = true
}

###############################################################################
# 3) REDIS_CONFIG
# -------------------------------------------------------------------------------
# Purpose:
#   - Consolidates critical Redis Enterprise cluster information (endpoint,
#     port, authentication token) into an easily consumable Terraform object.
# Details:
#   - Aligns with the specification for "redis_config" output:
#       type: object
#       members_exposed: endpoint (string), port (number), auth_token (string)
#       export_type: sensitive
#   - endpoint: DNS or IP address for the Redis cluster
#   - port: Port number (commonly 6379)
#   - auth_token: Secure string used for authenticating Redis connections
#   - Marked sensitive to avoid leaking auth credentials in CLI or logs.
###############################################################################
output "redis_config" {
  description = "Redis Enterprise cluster configuration including sharding and replication settings"
  value = {
    endpoint   = module.cache.redis_cluster_endpoint
    port       = module.cache.redis_cluster_port
    auth_token = module.cache.redis_cluster_auth_token
  }
  sensitive = true
}

###############################################################################
# 4) STORAGE_CONFIG
# -------------------------------------------------------------------------------
# Purpose:
#   - Captures relevant storage and CDN configuration details, enabling the
#     application or CI/CD pipelines to upload, retrieve, and serve static
#     assets globally.
# Details:
#   - Aligns with the specification for "storage_config" output:
#       type: object
#       members_exposed: bucket_name (string), cdn_domain (string)
#       export_type: named
#   - bucket_name: The Supabase- or AWS-backed S3 bucket for file storage
#   - cdn_domain: The CDN distribution domain for efficient static asset delivery
###############################################################################
output "storage_config" {
  description = "Storage and CDN configuration for global asset delivery and caching"
  value = {
    bucket_name = module.storage.storage_bucket    # Expects the child module to expose 'storage_bucket'
    cdn_domain  = module.storage.cdn_distribution  # Expects the child module to expose 'cdn_distribution'
  }
}

###############################################################################
# 5) MONITORING_ENDPOINTS
# -------------------------------------------------------------------------------
# Purpose:
#   - Unifies the infrastructure monitoring URLs or endpoints for database and
#     cache layers into a single exported object, facilitating direct DataDog,
#     Grafana, or other third-party integrations.
# Details:
#   - Aligns with the specification for "monitoring_endpoints" output:
#       type: object
#       members_exposed:
#         database_metrics (string)
#         cache_metrics (string)
#   - database_metrics: Hypothetical endpoint or reference to track database
#     performance and alerts (e.g., from Supabase monitoring).
#   - cache_metrics: Official Redis monitoring endpoint returned by the cache
#     module, typically used for real-time metrics ingestion and alerting.
###############################################################################
locals {
  # Demonstrates a potential placeholder or conditional logic
  # referencing 'supabase_database_monitoring_metrics_enabled'. If the
  # database monitoring resource had an actual endpoint attribute,
  # we would reference it directly. Here, we assume a default.
  database_monitoring_endpoint = module.database.supabase_database_monitoring_metrics_enabled == true ?
    "https://monitoring.example.com/database" :
    "monitoring-disabled"
}

output "monitoring_endpoints" {
  description = "Infrastructure monitoring endpoints for DataDog integration and alerting"
  value = {
    database_metrics = local.database_monitoring_endpoint
    cache_metrics    = module.cache.redis_monitoring_metrics_endpoint
  }
}