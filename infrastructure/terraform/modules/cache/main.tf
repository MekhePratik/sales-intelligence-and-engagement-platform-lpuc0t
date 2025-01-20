###############################################################################
# TERRAFORM CONFIGURATION FOR REDIS ENTERPRISE CACHE INFRASTRUCTURE
# -------------------------------------------------------------------------
# This file defines the enterprise-grade Redis cache layer in a B2B sales
# intelligence and engagement platform. It leverages the following elements:
#   - A Redis Enterprise cluster resource with high availability and optional
#     sharding (cluster mode) based on user-defined parameters
#   - Monitoring and alerting configuration for detailed performance insights
#     and proactive threshold-based notifications
#   - Automated backup scheduling and retention policies for disaster recovery
#   - Security settings encompassing TLS encryption and network ACLs for
#     restricted access
#
# Extensive comments are included to clarify each component of the
# infrastructure, ensuring an enterprise-ready, production-appropriate code
# base.
###############################################################################

###############################################################################
# REQUIRED PROVIDERS
# We specify the minimum Terraform version and pin our providers to known-good
# versions. This ensures consistent behavior and minimizes breaking changes.
###############################################################################
terraform {
  required_version = ">= 1.0"

  # Using 'redis' provider version '~> 1.0'
  # Using 'random' provider version '~> 3.0'
  required_providers {
    redis = {
      source  = "hashicorp/redis"
      version = "~> 1.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

###############################################################################
# LOCALS BLOCK
# -----------------------------------------------------------------------------
# We define local values that derive from input variables. These help unify
# naming conventions and references throughout the configuration, ensuring that
# even if certain variables change, we manage consistent naming across resources.
###############################################################################
locals {
  # RESOURCE_PREFIX:
  # Concise yet unique identifier used in resource naming to differentiate
  # environment-specific deployments (e.g., production vs. staging).
  resource_prefix = "${var.project_name}-${var.environment_name}"

  # CLUSTER_ID:
  # Derived from a randomly generated hex string. This helps distinguish
  # multiple Redis clusters in the same environment while ensuring uniqueness.
  cluster_id = random_id.cluster_id.hex
}

###############################################################################
# RANDOM ID FOR CLUSTER IDENTIFICATION
# -----------------------------------------------------------------------------
# This resource generates a random ID, used to further differentiate Redis
# cluster naming. The 'keepers' block ensures that when either project_name
# or environment_name changes, a new ID is generated, forcing resource
# recreation for consistency.
###############################################################################
resource "random_id" "cluster_id" {
  keepers = {
    prefix = "${var.project_name}-${var.environment_name}"
  }
  byte_length = 4
}

###############################################################################
# RANDOM PASSWORD FOR REDIS AUTHENTICATION TOKEN
# -----------------------------------------------------------------------------
# This resource produces a strong, high-entropy password employed as the
# authentication token for the Redis Enterprise cluster. Special characters
# enhance security, preventing dictionary or brute-force attacks.
###############################################################################
resource "random_password" "auth_token" {
  length           = 32
  special          = true
  override_special = "!@#%^*()_-~?"
}

###############################################################################
# REDIS ENTERPRISE CLUSTER RESOURCE
# -----------------------------------------------------------------------------
# This resource manages the core Redis Enterprise cluster instance:
#   - High Availability is assumed, with multiple nodes suggested (3+).
#   - Cluster mode can be toggled on or off via var.cluster_mode_enabled.
#   - Node count (var.node_count) and instance size (var.instance_size) define
#     the scale/performance of the cluster.
#   - The Redis version is set by var.redis_version.
#   - Auth token is drawn from random_password.auth_token to enforce secure
#     connectivity.
###############################################################################
resource "redis_enterprise_cluster" "main" {
  # Logical name assigned for identification in the management console
  name          = "${local.resource_prefix}-cluster-${local.cluster_id}"

  # Specifies the version of Redis Enterprise to deploy
  redis_version = var.redis_version

  # Defines whether cluster (sharding) mode is enabled:
  # If cluster_mode_enabled is true, the cluster distributes data using shards
  # across multiple nodes, improving throughput and resilience.
  cluster_mode = var.cluster_mode_enabled

  # Number of nodes in the Redis cluster. For production, typically >=3 for HA.
  node_count = var.node_count

  # Ties the cluster sizing to the environment's performance requirements,
  # referencing a suitable tier such as small, medium, or large.
  instance_size = var.instance_size

  # Authentication token used to restrict access to the cache.
  auth_token = random_password.auth_token.result

  # Exposed listening port for Redis. Typically 6379 for standard usage. 
  # Some production setups may colocate multiple ports for cluster mode.
  port = 6379

  # Example field for high availability. This may vary based on the provider's 
  # schema. If set to true, ensures node redundancy and automatic failover.
  high_availability = true

  # Example shard configuration. If cluster mode is enabled, we match the number
  # of shards to the node count. If disabled, there's only a single shard.
  shard_count = var.cluster_mode_enabled ? var.node_count : 1

  # Potential region or data center specification, depending on the provider's
  # configuration. Adjust as needed if multi-region is supported.
  # region = "us-east-1"

  # This field is a placeholder to illustrate referencing the random cluster_id
  # in a provider-specific argument. Typically, the cluster resource might
  # reference an ID or name, but we show it here for demonstration.
  external_reference_id = local.cluster_id
}

###############################################################################
# REDIS MONITORING RESOURCE
# -----------------------------------------------------------------------------
# This resource enables detailed monitoring of the Redis cluster. It captures
# performance metrics (e.g., memory usage, CPU usage, ops/sec), and applies
# threshold-based alert rules. This ensures that when certain resource
# utilization or performance thresholds are breached, the operations team
# receives timely alerts.
###############################################################################
resource "redis_enterprise_monitoring" "main" {
  # Associates monitoring setup with the primary Redis cluster
  cluster_id = redis_enterprise_cluster.main.id

  # Toggles whether monitoring is enabled for this cluster
  enabled = var.monitoring_enabled

  # Hypothetical endpoint from which metrics can be scraped or consumed.
  # The actual implementation may differ based on the provider.
  metrics_endpoint = "https://${local.resource_prefix}-cluster-${local.cluster_id}.metrics.example.com"

  # Represents custom alert threshold rules. Values are drawn from
  # var.alert_thresholds, which is a map containing numeric limits for
  # CPU usage, memory usage, ops/sec, total connections, etc.
  # Each threshold helps define proactive alerts that allow quick response
  # to performance degradation or resource saturation.
  alert_rules = {
    cpu_usage         = var.alert_thresholds["cpu_usage"]
    memory_usage      = var.alert_thresholds["memory_usage"]
    ops_per_sec       = var.alert_thresholds["ops_per_sec"]
    total_connections = var.alert_thresholds["total_connections"]
  }
}

###############################################################################
# REDIS BACKUP RESOURCE
# -----------------------------------------------------------------------------
# Provides an automated backup schedule to capture cluster snapshots for
# disaster recovery or data retention. Retention days can be adjusted based on
# enterprise compliance or RPO (Recovery Point Objective) considerations.
###############################################################################
resource "redis_enterprise_backup" "main" {
  # Link backups to the same cluster
  cluster_id = redis_enterprise_cluster.main.id

  # A typical CRON-like schedule for daily backups at 3:00 AM UTC. Modify as
  # necessary to off-peak hours or to another schedule that suits the business.
  backup_schedule = "0 3 * * *"

  # The retention policy's days value references var.backup_retention_days,
  # specifying how many days to keep backups before they are pruned.
  retention_days = var.backup_retention_days
}

###############################################################################
# REDIS SECURITY RESOURCE
# -----------------------------------------------------------------------------
# Defines advanced security configurations for the Redis cluster, including:
#   - TLS encryption at the transport layer, preventing unencrypted traffic
#   - Network ACLs that limit access to a list of trusted CIDR blocks
#   - Additional controls can be introduced as needed (e.g., IP whitelisting,
#     firewall integration, etc.)
###############################################################################
resource "redis_enterprise_security" "main" {
  # Tie security settings to the cluster ID from the main cluster resource
  cluster_id = redis_enterprise_cluster.main.id

  # Example TLS configuration placeholders. The actual shape depends on the
  # provider's schema, typically including certificate key paths or references.
  tls_config = {
    enabled     = true
    certificate = "example-cert"      # Placeholder or reference to a cert
    key         = "example-cert-key"  # Placeholder or reference to a key
  }

  # Placeholder network ACL, restricting allowed CIDR ranges for inbound traffic.
  # This helps prevent unauthorized external requests. Adjust to actual needs.
  network_acl = {
    allowed_cidrs = [
      "10.0.0.0/16",
      "192.168.1.0/24"
    ]
    denied_cidrs = []
  }
}

###############################################################################
# OUTPUTS FOR REDIS CLUSTER
# -----------------------------------------------------------------------------
# Expose key data points about our cluster so that other parts of the
# infrastructure can dynamically reference them, such as an application that
# needs to connect to the cache or a devops pipeline that configures secrets.
###############################################################################

# ENDPOINT
output "redis_cluster_endpoint" {
  description = "The hostname or IP address endpoint of the Redis Enterprise cluster"
  value       = redis_enterprise_cluster.main.endpoint
}

# PORT
output "redis_cluster_port" {
  description = "The port number on which the Redis Enterprise cluster is listening"
  value       = redis_enterprise_cluster.main.port
}

# AUTH TOKEN
output "redis_cluster_auth_token" {
  description = "The authentication token for secure Redis connections"
  value       = random_password.auth_token.result
}

###############################################################################
# OUTPUTS FOR REDIS MONITORING
# -----------------------------------------------------------------------------
# Publishes monitoring-related outputs, giving external modules or operators
# visibility into metrics consumption endpoints and alerting configurations.
###############################################################################

# METRICS ENDPOINT
output "redis_monitoring_metrics_endpoint" {
  description = "Endpoint at which performance metrics can be collected"
  value       = redis_enterprise_monitoring.main.metrics_endpoint
}

# ALERT RULES
output "redis_monitoring_alert_rules" {
  description = "Defined alert rules for CPU, memory usage, operations per second, etc."
  value       = redis_enterprise_monitoring.main.alert_rules
}

###############################################################################
# OUTPUTS FOR REDIS BACKUP
# -----------------------------------------------------------------------------
# Exposes the backup schedule and retention policy, offering convenient
# references for documentation, compliance checks, or integration with
# external disaster recovery systems.
###############################################################################

# BACKUP SCHEDULE
output "redis_backup_backup_schedule" {
  description = "Cron-like expression that defines the frequency of Redis backups"
  value       = redis_enterprise_backup.main.backup_schedule
}

# RETENTION POLICY
output "redis_backup_retention_policy" {
  description = "Retention details for how long backup snapshots are kept"
  value = {
    days = redis_enterprise_backup.main.retention_days
  }
}

###############################################################################
# OUTPUTS FOR REDIS SECURITY
# -----------------------------------------------------------------------------
# Surfaces critical security configurations, helping external systems or
# administrators remain aware of encryption and access control settings.
###############################################################################

# TLS CONFIG
output "redis_security_tls_config" {
  description = "TLS encryption configuration details for securing Redis connections"
  value       = redis_enterprise_security.main.tls_config
}

# NETWORK ACL
output "redis_security_network_acl" {
  description = "Network ACL rules restricting inbound traffic to trusted CIDR blocks"
  value       = redis_enterprise_security.main.network_acl
}