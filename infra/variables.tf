variable "region" {
  description = "AWS region for all glazewave resources"
  type        = string
  default     = "us-east-1"
}

variable "profile" {
  description = "Local AWS CLI profile. Ignored when credentials come from the environment, as in CI."
  type        = string
  default     = "glazewave"
}

variable "domain_name" {
  description = "Apex domain registered in Route 53"
  type        = string
  default     = "glazewave.com"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "10.20.1.0/24"
}

variable "instance_type" {
  description = "ARM instance. 2GB is the floor for Elasticsearch plus MySQL plus node on one box."
  type        = string
  default     = "t4g.small"
}

variable "root_volume_gb" {
  type    = number
  default = 30
}

variable "ssh_ingress_cidr" {
  description = "Set to a /32 to open port 22. Left null, access is SSM Session Manager only."
  type        = string
  default     = null
}

variable "cognito_domain_prefix" {
  description = "Must be unique across all Cognito hosted UI domains in the region."
  type        = string
  default     = "glazewave-auth"
}
