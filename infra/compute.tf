data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023_arm64.value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name

  # delete_on_termination stays false so a terminated instance leaves the volume
  # behind with MySQL and the ES indexes intact. The orphan costs ~$2.40/mo until
  # you delete it by hand, which is the point.
  root_block_device {
    volume_size           = var.root_volume_gb
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = false
  }

  disable_api_termination = true

  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
  }

  # 2GB of RAM runs Elasticsearch, MySQL and node together only with swap
  # present. Provisioning happens in Phase 5; this just makes the box survivable.
  user_data = <<-EOT
    #!/bin/bash
    set -eux
    dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl -w vm.swappiness=10
    echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
    dnf -y update
  EOT

  # ignore_changes stops a new AMI release or an edited user_data script from
  # replacing the box. prevent_destroy stops everything else, including
  # `terraform destroy` — remove it deliberately when you actually want it gone.
  lifecycle {
    ignore_changes  = [user_data, ami]
    prevent_destroy = true
  }

  tags = { Name = "glazewave" }
}

# Releasing this loses the address both A records point at, and a new one takes
# a DNS TTL to propagate.
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  lifecycle {
    prevent_destroy = true
  }

  tags = { Name = "glazewave" }
}
