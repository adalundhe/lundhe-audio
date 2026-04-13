provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "gear_media" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "gear_media" {
  bucket = aws_s3_bucket.gear_media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "gear_media" {
  bucket = aws_s3_bucket.gear_media.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "gear_media" {
  bucket = aws_s3_bucket.gear_media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "gear_media" {
  bucket = aws_s3_bucket.gear_media.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "gear_media" {
  bucket = aws_s3_bucket.gear_media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "gear_media" {
  bucket = aws_s3_bucket.gear_media.id

  rule {
    id     = "abort-incomplete-multipart-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = var.abort_incomplete_multipart_days
    }
  }
}
