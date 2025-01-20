# Using external library "terraform" version "~> 1.0"
terraform {
  required_version = ">= 1.0"
}

################################################################################
# Variable: project_name
# This variable sets the core name used for resource naming conventions.
# It is crucial for ensuring uniform naming across all related infrastructure
# resources within the cartridge of the B2B sales intelligence and engagement
# platform. The value must be provided for consistent naming patterns.
################################################################################
variable "project_name" {
  type        = string
  description = "Project name for resource naming"
}

################################################################################
# Variable: environment_name
# This variable identifies the target environment (e.g., staging or production).
# It supports environment-specific deployments, facilitating separate
# infrastructure contexts for testing, pre-production, and live use cases.
################################################################################
variable "environment_name" {
  type        = string
  description = "Environment name (staging/production)"
}

################################################################################
# Variable: redis_version
# This specifies the required Redis Enterprise version for the cache component.
# Select a version approved for production to ensure stability and compatibility
# with identified usage patterns (session caching, rate limiting, ephemeral
# data, etc.). During upgrades, the version may be changed here to facilitate
# zero-downtime rolling updates.
################################################################################
variable "redis_version" {
  type        = string
  description = "Redis Enterprise version"
  default     = "6.0"
}

################################################################################
# Variable: cluster_mode_enabled
# Determines if the Redis Enterprise deployment will utilize cluster mode.
# This allows for horizontal scaling and sharding capabilities, improving
# performance and reliability, especially under high load. If false, the
# deployment remains as a single primary node with optional replicas.
################################################################################
variable "cluster_mode_enabled" {
  type        = bool
  description = "Enable/disable Redis cluster mode"
  default     = true
}

################################################################################
# Variable: node_count
# Governs the number of Redis cluster nodes to be provisioned. For high
# availability, at least three nodes are recommended (1 primary and 2
# replicates). Larger clusters deliver improved throughput and resilience in
# distributed workloads.
################################################################################
variable "node_count" {
  type        = number
  description = "Number of Redis cluster nodes"
  default     = 3
}

################################################################################
# Variable: instance_size
# Describes the compute tier or size for Redis instances (e.g., small, medium,
# large). This sizing influences memory capacity and CPU resources. Select a
# tier that aligns with the caching demands of the production or staging
# environment to maintain optimal performance and cost-effectiveness.
################################################################################
variable "instance_size" {
  type        = string
  description = "Redis instance size/tier"
}

################################################################################
# Variable: backup_retention_days
# Defines how many days to retain backup data for this Redis cluster. Higher
# values provide more comprehensive disaster recovery but increase storage
# costs. Adjust according to compliance requirements and risk tolerance.
################################################################################
variable "backup_retention_days" {
  type        = number
  description = "Backup retention period in days"
  default     = 7
}

################################################################################
# Variable: monitoring_enabled
# This toggle determines whether extended monitoring is activated. When set
# to true, additional metrics and telemetry are collected and forwarded to the
# configured monitoring framework. This enhances visibility into performance
# metrics like cache hit rates, memory usage, and resource saturation.
################################################################################
variable "monitoring_enabled" {
  type        = bool
  description = "Enable/disable Redis monitoring"
  default     = true
}

################################################################################
# Variable: alert_thresholds
# A map of numeric thresholds governing monitoring alert triggers. Key examples
# include:
#   - cpu_usage: CPU usage threshold
#   - memory_usage: Memory utilization threshold
#   - ops_per_sec: Maximum operations per second limit
#   - total_connections: Maximum client connection count
# Adjust these values to suit the operational baseline and performance
# expectations of the environment.
################################################################################
variable "alert_thresholds" {
  type        = map(number)
  description = "Monitoring alert thresholds"
  default     = {
    cpu_usage         = 80
    memory_usage      = 85
    ops_per_sec       = 20000
    total_connections = 1000
  }
}