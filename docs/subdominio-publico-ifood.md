# Subdomínio público para o serviço (iFood)

Guia para criar um registro de subdomínio público no Route 53, baseado no procedimento interno iFood.

**URL alvo para este serviço:** http://dataviz-custom-chart.ifoodcorp.com.br/

**Pré-requisito:** ter concluído o guia [Exposing your application at iFood](https://confluence.ifoodcorp.com.br ou link interno equivalente).

---

## Passo a passo resumido (dataviz-custom-chart.ifoodcorp.com.br)

Use os blocos abaixo na ordem. Só é necessário preencher o **origin** no `terragrunt.hcl` (valor do guia "Exposing your application").

1. Clonar os repos (se ainda não tiver).
2. Definir variáveis e localizar a hosted zone (comandos abaixo).
3. Criar a pasta, colar o `terragrunt.hcl` (ajustar `origin`), commit, push, MR, Atlantis.

---

## 1. Clonar os repositórios

Na sua máquina, com acesso ao GitLab iFood:

```bash
git clone git@git.ifoodcorp.com.br:ifood/sre/cloud-infra/aws-infrastructure-live.git
git clone git@git.ifoodcorp.com.br:ifood/sre/cloud-infra/aws-legacy-infrastructure-live.git
```

---

## 2. Domínio e subdomínio (dataviz-custom-chart)

Para **http://dataviz-custom-chart.ifoodcorp.com.br/** usamos domínio interno produção:

| Campo     | Valor |
|----------|--------|
| DOMAIN   | ifoodcorp.com.br |
| SUBDOMAIN| dataviz-custom-chart |
| FQDN     | dataviz-custom-chart.ifoodcorp.com.br |

Variáveis de ambiente:

```bash
export DOMAIN="ifoodcorp.com.br"
export SUBDOMAIN="dataviz-custom-chart"
```

---

## 3. Identificar a hosted zone

**Primeiro no aws-infrastructure-live** (ifoodcorp.com.br costuma estar aqui):

```bash
cd aws-infrastructure-live
find . -path "*/route53/zone/public/*" -type d | grep $DOMAIN
```

Se não aparecer nada, **no aws-legacy-infrastructure-live**:

```bash
cd aws-legacy-infrastructure-live
find . -path "*/route53/zone/public/*" -type d | grep $DOMAIN
```

Exemplo de resultado para ifoodcorp.com.br (caminho pode variar):

```
./ifood-prod/production/_global/route53/zone/public/ifoodcorp.com.br
```

Definir (use o caminho que o `find` retornou):

```bash
export HOSTED_ZONE_PATH="./ifood-prod/production/_global/route53/zone/public/ifoodcorp.com.br"   # ajustar conforme o find
export ROUTE53_PATH=$(echo $HOSTED_ZONE_PATH | sed 's|/route53/.*|/route53|')
```

---

## 4. Criar a pasta do registro

No repositório onde está a hosted zone:

```bash
mkdir -p "$ROUTE53_PATH/record/$SUBDOMAIN.$DOMAIN"
cd "$ROUTE53_PATH/record/$SUBDOMAIN.$DOMAIN"
```

Com as variáveis já definidas, isso cria e entra em `record/dataviz-custom-chart.ifoodcorp.com.br`.

---

## 5. Criar o arquivo terragrunt.hcl

Crie `terragrunt.hcl` dentro dessa pasta. Abaixo o conteúdo já com o FQDN **dataviz-custom-chart.ifoodcorp.com.br**. Você só precisa **trocar o `origin`** pelo valor que você obteve no guia "Exposing your application at iFood" (ex.: algo como `origin-kong-...internal-services-<environment>.dc-ifood.com`).

Confirme a `component_version` no **Route53 Record Inputs Catalog** interno se quiser usar a mais recente.

```hcl
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
  origin = "origin-kong-internal-services-main.internal-services-<environment>.dc-ifood.com"  # substituir pelo origin do guia Exposing
}

inputs = {
  name    = local.fqdn
  zone_id = dependency.route53_zone.outputs.zone_id

  origin     = local.origin
  cloudflare = false
}
```

---

## 6. Commit e push

```bash
git checkout -b feat/subdomain-dataviz-custom-chart
git add .
git commit -m "feat: add namespace for dataviz-custom-chart"
git push origin feat/subdomain-dataviz-custom-chart
```

---

## 7. Merge Request

1. Abra um MR no GitLab a partir da branch `feat/subdomain-dataviz-custom-chart`.
2. Em "Requires 1 approval from Code Owners", verifique os revisores e peça a revisão.

---

## 8. Aplicar com Atlantis

1. O Atlantis fará o plan automaticamente no MR.
2. Localize o comentário "Ran Plan for dir" do @Marvin, abra o output e confira se o plano está correto.
3. Comente no MR: `atlantis apply` para criar o registro.
4. Com sucesso, o MR será mergeado e o subdomínio ficará ativo.

---

## 9. Próximos passos

- Validar o registro no console AWS Route 53.
- Acessar http://dataviz-custom-chart.ifoodcorp.com.br/ e validar o serviço.
- Em caso de dúvida ou problema: canal **#engineering-support**.
