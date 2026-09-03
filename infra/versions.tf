terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket       = "glazewave-tfstate-124666675445"
    key          = "glazewave/main.tfstate"
    region       = "us-east-1"
    profile      = "glazewave"
    encrypt      = true
    use_lockfile = true
  }
}
