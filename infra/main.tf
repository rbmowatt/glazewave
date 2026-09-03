data "aws_caller_identity" "current" {}

# Route 53 created this zone during domain registration, so it is read, not
# managed. Declaring it as a resource would fight the registrar.
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}
