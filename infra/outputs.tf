output "account_id" {
  description = "Account the state is pointed at. Check this before any apply."
  value       = data.aws_caller_identity.current.account_id
}

output "zone_id" {
  description = "Route 53 hosted zone for the apex domain"
  value       = data.aws_route53_zone.main.zone_id
}

output "public_ip" {
  description = "Elastic IP. Both A records point here."
  value       = aws_eip.app.public_ip
}

output "instance_id" {
  description = "Pass to: aws ssm start-session --target <id> --profile glazewave"
  value       = aws_instance.app.id
}

output "uploads_bucket" {
  description = "AWS_S3_BUCKET for backend/.env"
  value       = aws_s3_bucket.uploads.bucket
}

output "cognito_user_pool_id" {
  description = "AWS_COGNITO_USER_POOL for backend/.env"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "AWS_COGNITO_CLIENT_ID for backend/.env"
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_base_uri" {
  description = "REACT_APP_AWS_COGNITO_USER_POOL_BASE_URI for frontend/.env"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.region}.amazoncognito.com"
}
