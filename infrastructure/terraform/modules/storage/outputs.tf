###############################################################################
# Output: bucket_name
# - Exposes the name of the created S3 bucket for Supabase Storage configuration
###############################################################################
output "bucket_name" {
  description = "Name of the created S3 bucket for Supabase Storage configuration."
  type        = string
  value       = aws_s3_bucket.main.id
}

###############################################################################
# Output: bucket_arn
# - Exposes the ARN of the created S3 bucket for IAM policy configuration
###############################################################################
output "bucket_arn" {
  description = "ARN of the created S3 bucket for IAM policy configuration."
  type        = string
  value       = aws_s3_bucket.main.arn
}

###############################################################################
# Output: bucket_domain
# - Exposes the domain name of the S3 bucket for direct access configuration
###############################################################################
output "bucket_domain" {
  description = "Domain name of the S3 bucket for direct access configuration."
  type        = string
  value       = aws_s3_bucket.main.bucket_domain_name
}

###############################################################################
# Output: cdn_id
# - Exposes the ID of the CloudFront distribution for CDN management
# - References the resource via index [0] if the distribution is created,
#   otherwise returns null when cdn_config.enabled is false.
###############################################################################
output "cdn_id" {
  description = "ID of the CloudFront distribution for CDN management."
  type        = string
  value       = length(aws_cloudfront_distribution.main) == 0 ? null : aws_cloudfront_distribution.main[0].id
}

###############################################################################
# Output: cdn_domain
# - Exposes the domain name of the CloudFront distribution for application integration
# - Returns null if cdn_config.enabled is false.
###############################################################################
output "cdn_domain" {
  description = "Domain name of the CloudFront distribution for application integration."
  type        = string
  value       = length(aws_cloudfront_distribution.main) == 0 ? null : aws_cloudfront_distribution.main[0].domain_name
}

###############################################################################
# Output: cdn_zone_id
# - Exposes the Route53 hosted zone ID of the CloudFront distribution for DNS configuration
# - Returns null if cdn_config.enabled is false.
###############################################################################
output "cdn_zone_id" {
  description = "Route53 hosted zone ID of the CloudFront distribution for DNS configuration."
  type        = string
  value       = length(aws_cloudfront_distribution.main) == 0 ? null : aws_cloudfront_distribution.main[0].hosted_zone_id
}