################################################################################
# TERRAFORM PROVIDER CONFIGURATIONS FOR B2B SALES INTELLIGENCE PLATFORM
# ------------------------------------------------------------------------------
# This file configures the core providers required to deploy and manage the
# multi-cloud infrastructure of the B2B sales intelligence and engagement
# platform. Each provider block includes environment-specific tuning and
# security controls, aligning with the project's detailed technical and
# compliance requirements. Providers are pinned to specific versions for
# consistency and reliability. Per the specifications, comments are extensively
# documented to ensure clarity and enterprise readiness.
################################################################################

terraform {
  ##############################################################################
  # REQUIRED VERSION & PROVIDERS
  # ----------------------------------------------------------------------------
  # We declare a minimum Terraform version to ensure the proper feature set is
  # available. We also pin each provider to a specific version range for stable
  # and predictable behavior.
  ##############################################################################
  required_version = ">= 1.0.0"

  required_providers {
    # vercel/vercel (v ~> 1.0) -> Provider for Vercel Edge deployments
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    # supabase/supabase (v ~> 1.0) -> Provider for Supabase services
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    # redis-labs/redis (v ~> 1.0) -> Provider for Redis Enterprise usage
    redis-labs = {
      source  = "redis-labs/redis"
      version = "~> 1.0"
    }
    # hashicorp/aws (v ~> 5.0) -> Provider for AWS resources (S3, etc.)
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

################################################################################
# PROVIDER: VERCEL (vercel/vercel v ~> 1.0)
# ------------------------------------------------------------------------------
# This provider manages Vercel’s serverless and edge functions for global
# deployment of the Next.js application. The code below:
#   1. Reads credentials (api_token, team_id) from variables assumed to be
#      declared in variables.tf or a higher-level configuration.
#   2. Dynamically adjusts the 'timeout' based on the environment to allow
#      longer operations in production.
#   3. Configures a hypothetical monitoring block referencing a DataDog API key
#      for integrated metrics (not standard in real usage, but included per the
#      specification's requirement).
################################################################################
provider "vercel" {
  # The Vercel API token used to authenticate Terraform actions against Vercel.
  # In a typical scenario, these would be stored securely or passed via CI/CD.
  api_token = var.vercel_token

  # The Vercel team identifier to associate resources with a specific team.
  team_id = var.vercel_team_id

  # Set provider-specific operation timeout (in seconds) based on environment.
  # Production environment allows a longer timeout for heavier operations.
  timeout = var.environment == "production" ? 180 : 60

  # Retry attempts before failing any provider call, improving resilience
  # in the event of transient API or network flaws.
  retry_attempts = 3

  # Hypothetical monitoring block linking to DataDog, as required by specification.
  monitoring {
    datadog_api_key = var.datadog_api_key
  }
}

################################################################################
# PROVIDER: SUPABASE (supabase/supabase v ~> 1.0)
# ------------------------------------------------------------------------------
# This provider integrates with Supabase to manage services including:
#   - PostgreSQL Database
#   - Authentication settings
#   - Real-time subscriptions
# The snippet below:
#   1. Uses a project_ref and access_token for secure operations.
#   2. Dynamically toggles password authentication and max connections based on
#      whether we are in production.
#   3. Forces monitoring_enabled = true to ensure relevant metrics are gathered.
################################################################################
provider "supabase" {
  # Identifies which Supabase project to interact with, typically a unique ID.
  project_ref  = var.supabase_project_ref

  # Access token for API interactions, ensuring secure writes and updates.
  access_token = var.supabase_access_token

  # Example toggle forcing password-based auth only in production for
  # tighter security, while other environments might rely on JWT-only.
  database_password_auth = var.environment == "production"

  # Sets the maximum DB connections differently in production to handle
  # scale, while limiting in dev/staging to reduce costs/resources.
  max_connections = var.environment == "production" ? 100 : 20

  # Monitoring can be generally enabled for all environments. Fine-tuning can be
  # performed if metrics are not needed in development.
  monitoring_enabled = true
}

################################################################################
# PROVIDER: REDIS-LABS (redis-labs/redis v ~> 1.0)
# ------------------------------------------------------------------------------
# This provider manages Redis Enterprise clusters and associated configurations.
#   1. Credentials (api_url, api_key) for secure interaction with Redis Labs.
#   2. A fixed timeout to safeguard operations on resource creation or updates.
#   3. TLS enforced for data-in-transit security.
#   4. Automatic failover enabled if environment == production for HA.
################################################################################
provider "redis-labs" {
  # The Redis Enterprise API URL for cluster management actions.
  api_url = var.redis_api_url

  # Token or key used to authorize API requests to Redis Labs.
  api_key = var.redis_api_key

  # Global operation timeout in seconds. Extended or reduced as needed.
  timeout = 30

  # TLS ensures connections are encrypted in transit, further meeting compliance.
  tls_enabled = true

  # Enable cluster mode and failover only for production where high availability
  # is crucial to meet uptime SLAs.
  cluster_mode       = var.environment == "production"
  automatic_failover = var.environment == "production"
}

################################################################################
# PROVIDER: AWS (hashicorp/aws v ~> 5.0)
# ------------------------------------------------------------------------------
# AWS resources used by the platform for:
#   - S3-compatible storage
#   - Additional infrastructure such as VPC, security groups, and CloudFront
# This setup:
#   1. Uses var.region for the AWS region.
#   2. Optionally uses var.aws_profile for local credentials or switching roles.
#   3. Optionally assumes an AWS IAM role (role_arn) for cross-account usage.
#   4. Adds default_tags to unify environment labeling on created resources.
#   5. Disables path-style forcing for S3 (s3_force_path_style=false).
################################################################################
provider "aws" {
  # The region variable identifies which AWS region to operate in (e.g. us-east-1).
  region = var.region

  # Typically used for local credential profiles, if not using environment variables.
  profile = var.aws_profile

  # Optionally assume an IAM role for cross-account provisioning. Usually required
  # if Terraform is invoked in a different account context than the target.
  assume_role {
    role_arn = var.aws_role_arn
  }

  # Global tagging to indicate which environment each AWS resource belongs to,
  # aiding cost allocation, compliance, and resource organization.
  default_tags {
    environment = var.environment
  }

  # Setting this to false ensures we use the virtual-hosted–style URLs for S3.
  s3_force_path_style = false
}

################################################################################
# EXPORT: PROVIDER CONFIGURATIONS
# ------------------------------------------------------------------------------
# We expose an object named 'provider_configurations' to summarize key details of
# all providers in one place. This can help other modules, or internal references
# systematically verify, log, or extend provider data.
# NOTE: In a typical Terraform flow, referencing provider blocks across modules
# is done implicitly rather than by an output object. However, this export is
# included to address the specification requiring an aggregate object of
# provider settings for potential cross-module usage or referencing.
################################################################################
output "provider_configurations" {
  description = "Export comprehensive provider configurations with environment-specific settings and security controls."

  value = {
    vercel_provider = {
      name            = "vercel"
      api_token       = var.vercel_token
      team_id         = var.vercel_team_id
      environment     = var.environment
      timeout         = var.environment == "production" ? 180 : 60
      retry_attempts  = 3
      monitoring_key  = var.datadog_api_key
    }
    supabase_provider = {
      name                    = "supabase"
      project_ref             = var.supabase_project_ref
      access_token            = var.supabase_access_token
      environment             = var.environment
      database_password_auth  = var.environment == "production"
      max_connections         = var.environment == "production" ? 100 : 20
      monitoring_enabled      = true
    }
    redis_provider = {
      name               = "redis-labs"
      api_url            = var.redis_api_url
      api_key            = var.redis_api_key
      timeout            = 30
      tls_enabled        = true
      cluster_mode       = var.environment == "production"
      automatic_failover = var.environment == "production"
    }
    aws_provider = {
      name                = "aws"
      region              = var.region
      profile             = var.aws_profile
      aws_role_arn        = var.aws_role_arn
      environment         = var.environment
      s3_force_path_style = false
    }
  }
}