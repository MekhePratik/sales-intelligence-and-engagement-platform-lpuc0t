###############################################################################
# Imported External Library Version
###############################################################################
terraform {
  # hashicorp/terraform ~> 1.0 for core Terraform functionality
  required_version = ">= 1.0"
}

###############################################################################
# Variable: environment
# - Deployment environment (staging or production).
# - Enforced by the validation condition below.
###############################################################################
variable "environment" {
  type        = string
  description = "Deployment environment (staging/production)"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

###############################################################################
# Variable: storage_bucket_name
# - Name of the S3 bucket for Supabase Storage.
# - Must comply with standard S3 bucket naming conventions.
###############################################################################
variable "storage_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for Supabase Storage"

  validation {
    condition = can(regex("^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", var.storage_bucket_name))
    error_message = "Bucket name must be between 3 and 63 characters, start and end with a lowercase letter or number, and contain only lowercase letters, numbers, and hyphens."
  }
}

###############################################################################
# Variable: storage_region
# - AWS region for storage bucket deployment.
# - Must be a valid AWS region string (e.g., us-east-1).
###############################################################################
variable "storage_region" {
  type        = string
  description = "AWS region for storage bucket deployment"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d{1}$", var.storage_region))
    error_message = "Must be a valid AWS region identifier (e.g., us-east-1)."
  }
}

###############################################################################
# Variable: storage_versioning
# - Flag to enable versioning for the storage bucket.
# - Defaults to true, ensuring object history is retained.
###############################################################################
variable "storage_versioning" {
  type        = bool
  description = "Enable versioning for the storage bucket"
  default     = true
}

###############################################################################
# Variable: storage_lifecycle_rules
# - Lifecycle management rules for storing/transitioning/expiring objects.
# - Accepts a list of objects with transitions and expiration settings.
###############################################################################
variable "storage_lifecycle_rules" {
  type = list(object({
    enabled = bool
    id      = string
    prefix  = string
    transitions = list(object({
      days          = number
      storage_class = string
    }))
    expiration = object({
      days = number
    })
  }))
  description = "Lifecycle rules for storage objects"
  default     = []
}

###############################################################################
# Variable: cdn_config
# - CloudFront CDN configuration details to front the storage bucket.
# - Includes SSL certificate ARN, price class, and custom aliases.
###############################################################################
variable "cdn_config" {
  type = object({
    enabled      = bool
    price_class  = string
    aliases      = list(string)
    ssl_cert_arn = string
  })
  description = "CloudFront CDN configuration"
  default = {
    enabled      = true
    price_class  = "PriceClass_100"
    aliases      = []
    ssl_cert_arn = ""
  }
}

###############################################################################
# Variable: cors_rules
# - Cross-Origin Resource Sharing (CORS) settings for the storage bucket.
# - Defines allowed methods, origins, headers, and exposed headers.
###############################################################################
variable "cors_rules" {
  type = list(object({
    allowed_headers = list(string)
    allowed_methods = list(string)
    allowed_origins = list(string)
    expose_headers  = list(string)
    max_age_seconds = number
  }))
  description = "CORS rules for the storage bucket"
  default = [{
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "PUT", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }]
}

###############################################################################
# Variable: tags
# - Map of tags to apply to all related AWS resources for organizational context.
###############################################################################
variable "tags" {
  type        = map(string)
  description = "Tags to apply to all resources"
  default     = {}
}