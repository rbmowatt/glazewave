resource "aws_cognito_user_pool" "main" {
  name = "glazewave"

  # A destroyed pool takes every registered user with it, and the pool id is
  # baked into both .env files.
  deletion_protection = "ACTIVE"

  lifecycle {
    prevent_destroy = true
  }

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

  # The admin console shares this client. redirect_uri is matched by exact
  # string, so the console builds its own from window.location.origin, so both
  # spellings here - and the logout entries need the trailing slash, because
  # logout_uri is matched the same way.
  callback_urls = [
    "https://${var.domain_name}/login",
    "http://localhost:3000/login",
    "https://${var.domain_name}/admin/callback",
    "http://localhost:5173/admin/callback",
  ]

  logout_urls = [
    "https://${var.domain_name}/logout",
    "http://localhost:3000/logout",
    "https://${var.domain_name}/admin/",
    "http://localhost:5173/admin/",
  ]

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}

# The resource is aws_cognito_user_group, NOT aws_cognito_user_pool_group -
# that second name is the CloudFormation/API spelling and the provider has
# never had it. Under hashicorp/aws 6.63.0 it fails at plan time with "does not
# support resource type", which reads like a version problem rather than a typo.
#
# Membership arrives as a cognito:groups claim on both the id and the access
# token, which is what middleware/Viewer.js reads. Membership is deliberately
# NOT managed here: the pool sets username_attributes = ["email"], so the
# username is a generated UUID, and this repo is public.
#
#   POOL=$(terraform output -raw cognito_user_pool_id)
#   aws cognito-idp list-users --user-pool-id "$POOL" \
#     --filter 'email = "<addr>"' --query 'Users[].Username' --output text --profile glazewave
#   aws cognito-idp admin-add-user-to-group --user-pool-id "$POOL" \
#     --username <uuid> --group-name admins --profile glazewave
resource "aws_cognito_user_group" "admins" {
  name         = "admins"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Write access to catalog data and the Cognito admin routes"
}
