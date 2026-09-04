resource "aws_s3_bucket" "uploads" {
  bucket = "glazewave-uploads-${data.aws_caller_identity.current.account_id}"

  lifecycle {
    prevent_destroy = true
  }
}

# Versioning is what makes an overwritten or deleted upload recoverable; the
# bucket is public-read, so a bad object key is a real possibility.
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

# BucketOwnerEnforced disables ACLs entirely. This is why upload.js must drop
# its acl:"public-read" option: S3 rejects the header with
# AccessControlListNotSupported rather than ignoring it.
resource "aws_s3_bucket_ownership_controls" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Public read comes from the bucket policy below, so policies must stay
# permitted while ACLs remain blocked.
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadUploads"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.uploads.arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.uploads]
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://${var.domain_name}", "https://www.${var.domain_name}"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }
}
