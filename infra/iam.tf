resource "aws_iam_role" "app" {
  name = "glazewave-app"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Grants Session Manager shell access without opening port 22 or holding a key.
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# The app reaches S3 through this role, so no access keys live on the instance.
# Requires deleting accessKeyId/secretAccessKey from backend/app/config/s3.js so
# the SDK falls through to instance metadata.
resource "aws_iam_role_policy" "uploads" {
  name = "glazewave-uploads"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.uploads.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app" {
  name = "glazewave-app"
  role = aws_iam_role.app.name
}

# Deliberately no s3:DeleteObject. Retention is the bucket lifecycle's job, so
# nothing on the instance needs delete - and the instance is the thing most
# likely to be compromised. Ransomware that gets this role can write junk into
# new keys; it cannot erase the history.
#
# GetObject is here so a restore can run from the box itself with no other
# credentials, which is the state a bad day starts in.
resource "aws_iam_role_policy" "backups" {
  name = "glazewave-backups"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject"]
        Resource = "${aws_s3_bucket.backups.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.backups.arn
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}
