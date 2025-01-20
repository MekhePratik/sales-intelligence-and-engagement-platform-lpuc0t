###############################################################################
# TERRAFORM OUTPUTS FOR REDIS ENTERPRISE CACHE INFRASTRUCTURE MODULE
# ---------------------------------------------------------------------------
# This file exposes key attributes of the Redis cluster and its monitoring
# configuration. These outputs are critical for downstream modules or
# environments requiring details on how to connect to Redis, authenticate, and
# observe monitoring data. Each output is documented extensively to ensure
# clarity in enterprise-scale deployments.
###############################################################################

###############################################################################
# REDIS CONNECTION STRING
# ---------------------------------------------------------------------------
# A consolidated URI-style string that includes the endpoint, port, and
# authentication token. With TLS enabled, it uses the "rediss" scheme to
# ensure encrypted communication. The sensitive flag is set to true to mask
# the password from logs and CLI output.
###############################################################################
output "redis_connection_string" {
  description = "Full Redis connection string for application configuration"
  value       = "rediss://:${redis_enterprise_cluster.main.auth_token}@${redis_enterprise_cluster.main.endpoint}:${redis_enterprise_cluster.main.port}"
  sensitive   = true
}

###############################################################################
# REDIS ENDPOINT (HOSTNAME)
# ---------------------------------------------------------------------------
# Represents only the hostname/address of the Redis cluster. Useful for
# configuring certain clients or containers that inject credentials separately.
###############################################################################
output "redis_host" {
  description = "Redis cluster endpoint hostname"
  value       = redis_enterprise_cluster.main.endpoint
}

###############################################################################
# REDIS PORT
# ---------------------------------------------------------------------------
# The TCP port on which the Redis cluster listens. Typically defaults to 6379.
# This is used in any service or application that connects to Redis.
###############################################################################
output "redis_port" {
  description = "Redis cluster port number"
  value       = redis_enterprise_cluster.main.port
}

###############################################################################
# REDIS AUTH TOKEN
# ---------------------------------------------------------------------------
# The secure token required for authentication to the Redis cluster. This is
# generated automatically and marked as sensitive to prevent exposure in logs.
###############################################################################
output "redis_auth_token" {
  description = "Authentication token for Redis cluster access"
  value       = redis_enterprise_cluster.main.auth_token
  sensitive   = true
}

###############################################################################
# REDIS MONITORING ENDPOINT
# ---------------------------------------------------------------------------
# The URL or endpoint at which core Redis metrics can be accessed. External
# observability platforms can scrape or poll this endpoint to gather memory
# usage, CPU usage, ops/sec, etc.
###############################################################################
output "monitoring_endpoint" {
  description = "Redis monitoring metrics endpoint URL"
  value       = redis_enterprise_monitoring.main.metrics_endpoint
}

###############################################################################
# ALERT CONFIGURATION
# ---------------------------------------------------------------------------
# Encapsulates the alert thresholds and rules used to trigger notifications
# based on CPU usage, memory usage, number of connections, and other vital
# performance indicators. External systems can consume these to manage alert
# lifecycles or integrate with incident management tools.
###############################################################################
output "alert_configuration" {
  description = "Redis monitoring alert rules and thresholds"
  value       = redis_enterprise_monitoring.main.alert_rules
}