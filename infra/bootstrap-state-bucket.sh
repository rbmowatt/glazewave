#!/usr/bin/env bash
# Creates the S3 bucket that holds Terraform state. Run once, before the first
# `terraform init`. Terraform cannot create its own backend bucket.
#
# Safe to re-run: every step is idempotent.

set -euo pipefail

PROFILE="glazewave"
REGION="us-east-1"
ACCOUNT="124666675445"
BUCKET="glazewave-tfstate-${ACCOUNT}"

echo "Bucket: $BUCKET"
echo

# us-east-1 rejects --create-bucket-configuration; every other region requires it.
if aws s3api head-bucket --bucket "$BUCKET" --profile "$PROFILE" 2>/dev/null; then
  echo "already exists, skipping create"
else
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --profile "$PROFILE"
  echo "created"
fi

# Versioning is what makes a corrupted or truncated state recoverable.
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled \
  --profile "$PROFILE"
echo "versioning enabled"

aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --profile "$PROFILE"
echo "public access blocked"

aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}' \
  --profile "$PROFILE"
echo "encryption enabled"

echo
echo "Done. Verify:"
echo "  aws s3api get-bucket-versioning --bucket $BUCKET --profile $PROFILE"
