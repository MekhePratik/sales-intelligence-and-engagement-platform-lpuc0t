################################################################################
# TERRAFORM VERSION AND PROVIDER CONSTRAINTS
# ------------------------------------------------------------------------------
# This file enforces Terraform and provider version requirements for the B2B
# sales intelligence platform, ensuring stable and consistent deployments
# across development, staging, and production environments. It references and
# aligns with the technical specification’s infrastructure requirements (4.5)
# and cloud services integration guidelines (8.2).
#
# INTERNAL IMPORT (providers.tf):
# ------------------------------------------------------------------------------
# For consistent alignment with the "provider_configurations" output in
# providers.tf, we define an equivalent set of pinned providers here. Doing so
# guarantees that any references to "provider_configurations" match the
# constraints enforced in this file, thereby preventing version mismatches in
# downstream modules.
################################################################################
terraform {
  ##############################################################################
  # CORE TERRAFORM VERSION
  # ----------------------------------------------------------------------------
  # Lock Terraform to a minimum of v1.5.0 to ensure modern features and
  # performance optimizations are available, including improvements for complex
  # modules and state handling relevant to large-scale enterprise deployments.
  ##############################################################################
  required_version = ">= 1.5.0"

  ##############################################################################
  # REQUIRED PROVIDERS VERSIONS
  # ----------------------------------------------------------------------------
  # Each provider source includes an explicit version range. This prevents
  # unintended upgrades that could disrupt production and ensures feature
  # compatibility with the platform’s architecture. As described in the
  # specification:
  #   - vercel/vercel ~> 1.0
  #   - supabase/supabase ~> 1.0
  #   - redis-labs/redis ~> 1.0
  #   - hashicorp/aws ~> 5.0
  ##############################################################################
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    redis = {
      source  = "redis-labs/redis"
      version = "~> 1.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

################################################################################
# EXPORT: TERRAFORM VERSION REQUIREMENTS
# ------------------------------------------------------------------------------
# The following output, "terraform_version_requirements," consolidates the
# exact version constraints for both the Terraform CLI and all required
# providers in a single object. This export makes the version information
# accessible to any upstream or downstream consumers that may dynamically
# check or log version details, fulfilling the file’s specification of
# exposing version constraints publicly.
################################################################################
output "terraform_version_requirements" {
  description = "Export version constraints for Terraform and providers to ensure consistent versioning across all infrastructure modules"

  value = {
    terraform_version = ">= 1.5.0"
    provider_versions = {
      vercel   = "~> 1.0"
      supabase = "~> 1.0"
      redis    = "~> 1.0"
      aws      = "~> 5.0"
    }
  }
}