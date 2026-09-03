resource "aws_cognito_user_pool" "main" {
  name = "glazewave"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_uppercase = true
    require_symbols   = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

# The hosted UI lives at https://<domain>.auth.<region>.amazoncognito.com and is
# what REACT_APP_AWS_COGNITO_USER_POOL_BASE_URI points at.
resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "glazewave-web"
  user_pool_id = aws_cognito_user_pool.main.id

  # Public SPA client, so no secret. A secret the browser can read is not a secret.
  generate_secret = false

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  supported_identity_providers         = ["COGNITO"]

  callback_urls = [
    "https://${var.domain_name}/login",
    "http://localhost:3000/login",
  ]

  logout_urls = [
    "https://${var.domain_name}/logout",
    "http://localhost:3000/logout",
  ]

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}
