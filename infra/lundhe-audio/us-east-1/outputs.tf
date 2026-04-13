output "gear_media_bucket_name" {
  description = "Name of the S3 bucket used for gear photos/documents."
  value       = aws_s3_bucket.gear_media.bucket
}

output "gear_media_bucket_arn" {
  description = "ARN of the S3 bucket used for gear photos/documents."
  value       = aws_s3_bucket.gear_media.arn
}
