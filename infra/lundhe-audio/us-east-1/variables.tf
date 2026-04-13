variable "aws_region" {
  description = "AWS region for the Lundhe Audio gear-media bucket."
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "S3 bucket used for owned-gear photos/documents."
  type        = string
  default     = "lundhe-audio-gear-photos"
}

variable "cors_allowed_origins" {
  description = "Additional production origins allowed to upload/download directly via presigned URLs."
  type        = list(string)
  default     = []
}

variable "abort_incomplete_multipart_days" {
  description = "Days before incomplete multipart uploads are aborted automatically."
  type        = number
  default     = 7
}
