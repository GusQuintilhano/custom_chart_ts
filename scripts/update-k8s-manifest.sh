#!/usr/bin/env bash
# Atualiza o image tag do dataviz-custom-chart no repositório k8s-manifests e abre MR.
# Uso: chamado pela pipeline (job update-k8s-manifest) após build-release em tag.
# Variáveis esperadas: CI_COMMIT_TAG, K8S_MANIFESTS_UPDATE_TOKEN (opcional; se vazia, só exibe instruções).

set -e

DEPLOYMENT_PATH="manifests/new-singlecluster-apps/cluster-data-applications/dataviz/app/dataviz-custom-chart/deployment.yaml"
IMAGE_NAME="registry.infra.ifood-prod.com.br/ifood/data/viz/dataviz-custom-charts"
K8S_REPO="https://code.ifoodcorp.com.br/ifood/data/platform/k8s-manifests.git"
GITLAB_API="https://code.ifoodcorp.com.br/api/v4"
PROJECT_PATH="ifood%2Fdata%2Fplatform%2Fk8s-manifests"
BRANCH_PREFIX="chore/dataviz-custom-chart-"

if [ -z "$CI_COMMIT_TAG" ]; then
  echo "CI_COMMIT_TAG nao definido. Abortando."
  exit 1
fi

NEW_TAG="$CI_COMMIT_TAG"
BRANCH_NAME="${BRANCH_PREFIX}${NEW_TAG}"

if [ -z "$K8S_MANIFESTS_UPDATE_TOKEN" ]; then
  echo "K8S_MANIFESTS_UPDATE_TOKEN nao configurado."
  echo "Para ativacao automatica: em Settings > CI/CD > Variables, crie K8S_MANIFESTS_UPDATE_TOKEN (project access token do k8s-manifests com write)."
  echo "Ou atualize manualmente o deployment em k8s-manifests para image tag ${NEW_TAG}."
  exit 0
fi

REPO_URL="https://oauth2:${K8S_MANIFESTS_UPDATE_TOKEN}@code.ifoodcorp.com.br/ifood/data/platform/k8s-manifests.git"

echo "Clonando k8s-manifests..."
git clone --depth 1 --branch main "$REPO_URL" k8s-manifests-repo
cd k8s-manifests-repo

git config user.email "ci@ifood.com.br"
git config user.name "custom-charts pipeline"

echo "Atualizando image para ${IMAGE_NAME}:${NEW_TAG} em ${DEPLOYMENT_PATH}..."
sed -i.bak "s|dataviz-custom-charts:v[0-9.]*|dataviz-custom-charts:${NEW_TAG}|g" "$DEPLOYMENT_PATH"
rm -f "${DEPLOYMENT_PATH}.bak"

if git diff --quiet; then
  echo "Nenhuma alteracao (tag ja aplicada?). Encerrando."
  exit 0
fi

git checkout -b "$BRANCH_NAME"
git add "$DEPLOYMENT_PATH"
git commit -m "chore(dataviz-custom-chart): update image to ${NEW_TAG}"

echo "Enviando branch ${BRANCH_NAME}..."
git push origin "$BRANCH_NAME"

echo "Criando merge request..."
MR_RESPONSE=$(curl -s -w "\n%{http_code}" --request POST \
  --header "PRIVATE-TOKEN: ${K8S_MANIFESTS_UPDATE_TOKEN}" \
  --header "Content-Type: application/json" \
  --data "{
    \"source_branch\": \"${BRANCH_NAME}\",
    \"target_branch\": \"main\",
    \"title\": \"chore(dataviz-custom-chart): deploy ${NEW_TAG}\",
    \"description\": \"Atualizacao automatica da imagem dataviz-custom-charts para ${NEW_TAG} (release do custom_charts).\"
  }" \
  "${GITLAB_API}/projects/${PROJECT_PATH}/merge_requests")

HTTP_BODY=$(echo "$MR_RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$MR_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "201" ]; then
  MR_URL=$(echo "$HTTP_BODY" | sed -n 's/.*"web_url":"\([^"]*\)".*/\1/p')
  echo "Merge request criado: ${MR_URL}"
else
  echo "Falha ao criar MR (HTTP ${HTTP_CODE}). Crie manualmente:"
  echo "  ${GITLAB_API/https:\\/\\/code.ifoodcorp.com.br/}/ifood/data/platform/k8s-manifests/-/merge_requests/new?merge_request%5Bsource_branch%5D=${BRANCH_NAME}"
fi
