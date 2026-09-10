# The database backup target. Separate from the uploads bucket on purpose: that
# one grants s3:GetObject to "*" through its bucket policy, so a dump written
# there would be a public download of every user row in the app.

resource "aws_s3_bucket" "backups" {
  bucket = "glazewave-backups-${data.aws_caller_identity.current.account_id}"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# The instance role has PutObject but not DeleteObject, so the only way it can
# damage an existing backup is by overwriting its key. Versioning keeps the
# original bytes when that happens.
resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "daily"
    status = "Enabled"

    filter {
      prefix = "daily/"
    }

    expiration {
      days = var.backup_daily_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }

    # A dump interrupted mid-upload leaves parts that are billed but invisible
    # to `s3 ls`.
    abort_incomplete_multipart_upload {
      days_after_initiation = 3
    }
  }

  rule {
    id     = "monthly"
    status = "Enabled"

    filter {
      prefix = "monthly/"
    }

    expiration {
      days = var.backup_monthly_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  # backend/.env exists on the box and nowhere else, so losing the instance
  # loses the MySQL password, the Cognito ids and the demo signing key with it.
  rule {
    id     = "env"
    status = "Enabled"

    filter {
      prefix = "env/"
    }

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_sns_topic" "alerts" {
  name = "glazewave-alerts"
}

# An email subscription is not live until the address clicks the confirmation
# link AWS sends. Until then aws sns publish succeeds and delivers to nobody,
# which is the exact failure mode this topic exists to prevent.
resource "aws_sns_topic_subscription" "alerts_email" {
  count = var.alert_email == null ? 0 : 1

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
