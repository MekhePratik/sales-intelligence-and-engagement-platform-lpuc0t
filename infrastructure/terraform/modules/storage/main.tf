###############################################################################
# Main Terraform configuration for the Supabase-compatible S3 bucket and CDN
# integration, addressing encryption, versioning, lifecycle, CORS, replication,
# and logging. This file references variables from variables.tf and uses the
# AWS provider (hashicorp/aws ~> 5.0). It exposes S3 bucket and CloudFront
# distribution resources with a high level of detail to fulfill the enterprise
# needs of a B2B sales intelligence platform.
###############################################################################

###############################################################################
# Terraform Block
# - Declares required providers for AWS at version ~> 5.0
###############################################################################
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

###############################################################################
# Provider Configuration: AWS
# - Configures the AWS provider to use the specified region from variables.tf
###############################################################################
provider "aws" {
  region = var.storage_region
}

###############################################################################
# Locals
# - resource_prefix: concatenates environment and bucket name for resource naming
# - bucket_domain: references the bucket's regional domain name for convenience
###############################################################################
locals {
  resource_prefix = "${var.environment}-${var.storage_bucket_name}"
  bucket_domain   = aws_s3_bucket.main.bucket_regional_domain_name
}

###############################################################################
# aws_s3_bucket: Main S3 Bucket
# - Creates the primary S3 bucket used by Supabase Storage
# - Includes resource naming, tags, and private ACL
###############################################################################
resource "aws_s3_bucket" "main" {
  bucket = local.resource_prefix
  acl    = "private"

  # Merge any provided tags with Name and Environment to ensure clarity
  tags = merge(
    var.tags,
    {
      Name        = local.resource_prefix
      Environment = var.environment
    }
  )
}

###############################################################################
# aws_s3_bucket_server_side_encryption_configuration
# - Configures server-side encryption (SSE) using either AWS KMS or AES256
# - Leverages the kms_key_id variable if provided
###############################################################################
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.kms_key_id != "" ? "aws:kms" : "AES256"
      kms_master_key_id = var.kms_key_id != "" ? var.kms_key_id : null
    }
  }
}

###############################################################################
# aws_s3_bucket_versioning
# - Enables or suspends versioning based on storage_versioning variable
###############################################################################
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.bucket

  versioning_configuration {
    status = var.storage_versioning ? "Enabled" : "Suspended"
  }
}

###############################################################################
# aws_s3_bucket_lifecycle_rule
# - Defines lifecycle rules for objects in the bucket using the
#   storage_lifecycle_rules variable. Each rule in var.storage_lifecycle_rules
#   is mapped to a dynamic block. The resource name is kept for consistency with
#   the specification.
###############################################################################
resource "aws_s3_bucket_lifecycle_rule" "main" {
  bucket = aws_s3_bucket.main.bucket

  dynamic "rule" {
    for_each = var.storage_lifecycle_rules
    content {
      id      = rule.value.id
      enabled = rule.value.enabled
      prefix  = rule.value.prefix

      # Transition blocks for each specified transition
      dynamic "transition" {
        for_each = rule.value.transitions
        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      # Expiration block if days > 0, as per typical usage
      lifecycle {
        ignore_changes = [
          # This can be extended if necessary to ignore changes to some
          # sensitive fields or ephemeral attributes
        ]
      }

      expiration {
        days = rule.value.expiration.days
      }
    }
  }
}

###############################################################################
# aws_s3_bucket_cors_configuration
# - Configures CORS rules for the bucket, allowing specified methods, headers,
#   and origins. Based on cors_rules variable.
###############################################################################
resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.main.bucket

  cors_rule {
    for_each        = toset(range(length(var.cors_rules)))
    id              = var.cors_rules[cors_rule.key].allowed_methods[0]
    allowed_methods = var.cors_rules[cors_rule.key].allowed_methods
    allowed_origins = var.cors_rules[cors_rule.key].allowed_origins
    allowed_headers = var.cors_rules[cors_rule.key].allowed_headers
    expose_headers  = var.cors_rules[cors_rule.key].expose_headers
    max_age_seconds = var.cors_rules[cors_rule.key].max_age_seconds
  }
}

###############################################################################
# aws_s3_bucket_public_access_block
# - Ensures that public ACLs and policies are blocked, enhancing security
###############################################################################
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.bucket

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

###############################################################################
# aws_s3_bucket_logging
# - Configures server access logging for the bucket, referencing the
#   logging_config object if any logging is desired. This typically requires
#   a separate S3 bucket to store logs, which can be specified in logging_config.
###############################################################################
resource "aws_s3_bucket_logging" "main" {
  bucket = aws_s3_bucket.main.bucket

  dynamic "target_bucket" {
    for_each = var.logging_config.target_bucket != "" ? [var.logging_config.target_bucket] : []
    content  = target_bucket.value
  }

  target_prefix = var.logging_config.target_prefix

  # This block merges tags for the logging feature if needed
  depends_on = [aws_s3_bucket.main]
}

###############################################################################
# aws_s3_bucket_replication_configuration
# - Configures cross-region replication (CRR) or same-region replication (SRR)
#   based on replication_config object, which should define appropriate IAM roles
#   and destinations. If replication is not configured, the resource is omitted.
###############################################################################
resource "aws_s3_bucket_replication_configuration" "main" {
  count  = var.replication_config.role_arn != "" && length(var.replication_config.rules) > 0 ? 1 : 0
  bucket = aws_s3_bucket.main.bucket

  role = var.replication_config.role_arn

  dynamic "rule" {
    for_each = lookup(var.replication_config, "rules", [])
    content {
      id     = rule.value.id
      status = rule.value.status

      filter {
        prefix = rule.value.prefix
      }

      destination {
        bucket        = rule.value.destination_bucket
        storage_class = rule.value.storage_class
      }
    }
  }
}

###############################################################################
# aws_cloudfront_origin_access_identity
# - Creates an origin access identity (OAI) to restrict S3 bucket access to
#   CloudFront when cdn_config.enabled is true.
###############################################################################
resource "aws_cloudfront_origin_access_identity" "main" {
  count = var.cdn_config.enabled ? 1 : 0

  comment = "Origin Access Identity for ${local.resource_prefix}"

  # This line is an exposed attribute in the JSON specification
}

###############################################################################
# aws_cloudfront_distribution
# - Sets up a CloudFront distribution in front of the S3 bucket to serve
#   content via CDN with optional custom SSL certificate and aliases.
###############################################################################
resource "aws_cloudfront_distribution" "main" {
  count = var.cdn_config.enabled ? 1 : 0

  # General configuration
  enabled             = var.cdn_config.enabled
  price_class         = var.cdn_config.price_class
  default_root_object = "index.html"

  # Aliases for custom domains
  aliases = var.cdn_config.aliases

  # Primary S3 origin configuration guarded by OAI
  origin {
    domain_name = local.bucket_domain
    origin_id   = "s3-${local.resource_prefix}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main[0].cloudfront_access_identity_path
    }
  }

  # Default cache behavior referencing the S3 origin
  default_cache_behavior {
    target_origin_id       = "s3-${local.resource_prefix}"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    compress         = true
    cache_policy_id  = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized policy
    response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03" # Managed SecurityHeaders policy

    # Optional function or lambda associations can be added here if needed
  }

  # Viewer certificate: either custom ACM or default CloudFront certificate
  viewer_certificate {
    acm_certificate_arn            = var.cdn_config.ssl_cert_arn != "" ? var.cdn_config.ssl_cert_arn : null
    ssl_support_method             = var.cdn_config.ssl_cert_arn != "" ? "sni-only" : null
    cloudfront_default_certificate = var.cdn_config.ssl_cert_arn == ""
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Logging, if desired, can be added with a logging_config block as well
  depends_on = [
    aws_cloudfront_origin_access_identity.main,
    aws_s3_bucket_public_access_block.main,
    aws_s3_bucket.main
  ]

  # Tags for organizational tracking
  tags = merge(
    var.tags,
    {
      Name        = "${local.resource_prefix}-cdn"
      Environment = var.environment
    }
  )
}