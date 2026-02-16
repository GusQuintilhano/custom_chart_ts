#!/usr/bin/env bash
# Comandos para criar o subdomínio dataviz-custom-chart.ifoodcorp.com.br
# Execute estes passos na ordem. Os repositórios devem ser clonados na sua máquina (acesso iFood).

set -e

DOMAIN="ifoodcorp.com.br"
SUBDOMAIN="dataviz-custom-chart"
REPO_INFRA="${REPO_INFRA:-$HOME/aws-infrastructure-live}"
REPO_LEGACY="${REPO_LEGACY:-$HOME/aws-legacy-infrastructure-live}"

echo "=== 1. Variáveis ==="
echo "export DOMAIN=\"$DOMAIN\""
echo "export SUBDOMAIN=\"$SUBDOMAIN\""
echo ""

echo "=== 2. Localizar hosted zone (execute em um dos repos abaixo) ==="
echo "# Primeiro tente em aws-infrastructure-live:"
echo "cd $REPO_INFRA"
echo "find . -path \"*/route53/zone/public/*\" -type d | grep \$DOMAIN"
echo ""
echo "# Se não achar, tente em aws-legacy-infrastructure-live:"
echo "cd $REPO_LEGACY"
echo "find . -path \"*/route53/zone/public/*\" -type d | grep \$DOMAIN"
echo ""
echo "=== 3. Definir caminho (use o resultado do find acima) ==="
echo "export HOSTED_ZONE_PATH=\"./caminho/ate/route53/zone/public/$DOMAIN\""
echo "export ROUTE53_PATH=\$(echo \$HOSTED_ZONE_PATH | sed 's|/route53/.*|/route53|')"
echo ""

echo "=== 4. Criar pasta e entrar ==="
echo "mkdir -p \"\$ROUTE53_PATH/record/\$SUBDOMAIN.\$DOMAIN\""
echo "cd \"\$ROUTE53_PATH/record/\$SUBDOMAIN.\$DOMAIN\""
echo ""

echo "=== 5. Copiar terragrunt.hcl ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HCL_SRC="$SCRIPT_DIR/../docs/terragrunt-dataviz-custom-chart.hcl"
echo "# Edite o arquivo e substitua o 'origin' pelo valor do guia Exposing your application."
if [ -f "$HCL_SRC" ]; then
  echo "cp \"$HCL_SRC\" ./terragrunt.hcl"
  echo "# Remova as linhas de comentário no topo do terragrunt.hcl após copiar:"
  echo "sed -i '' '/^# Copie este arquivo/,/^# Antes de usar/d' ./terragrunt.hcl 2>/dev/null || true"
else
  echo "# Arquivo em: docs/terragrunt-dataviz-custom-chart.hcl"
  echo "# Copie o conteúdo para ./terragrunt.hcl e ajuste o 'origin'."
fi
echo ""

echo "=== 6. Commit e push ==="
echo "git checkout -b feat/subdomain-dataviz-custom-chart"
echo "git add ."
echo "git commit -m \"feat: add namespace for dataviz-custom-chart\""
echo "git push origin feat/subdomain-dataviz-custom-chart"
echo ""

echo "=== 7. Depois: abrir MR no GitLab e comentar 'atlantis apply' após aprovação ==="
