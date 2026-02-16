# Copie este arquivo para o repositório da infra (aws-infrastructure-live ou aws-legacy-infrastructure-live)
# em: $ROUTE53_PATH/record/dataviz-custom-chart.ifoodcorp.com.br/terragrunt.hcl
#
# Antes de usar: substitua o valor de "origin" abaixo pelo valor do guia "Exposing your application at iFood".

include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "route53_zone" {
  config_path = format("%s/_global/route53/zone/public/${basename(dirname(get_terragrunt_dir()))}", dirname(find_in_parent_folders("account.hcl")))
}

locals {
  component_create  = true
  component_name    = "aws/route53/record"
  component_version = "25.09.5"

  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl")).locals
  fqdn   = "dataviz-custom-chart.ifoodcorp.com.br"
  origin = "origin-kong-internal-services-main.internal-services-<environment>.dc-ifood.com"  # SUBSTITUIR pelo origin do guia Exposing
}

inputs = {
  name    = local.fqdn
  zone_id = dependency.route53_zone.outputs.zone_id

  origin     = local.origin
  cloudflare = false
}
