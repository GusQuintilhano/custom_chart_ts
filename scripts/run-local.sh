#!/bin/bash
# Script para baixar e executar a imagem Docker localmente

set -e

REGISTRY="registry.infra.ifood-prod.com.br"
IMAGE_NAME="ifood/data/viz/custom-charts"
TAG="${1:-dev}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"
CONTAINER_NAME="custom-charts"

echo "🐳 Custom Charts - Executar Localmente"
echo "========================================"
echo ""

# Verificar se Docker está rodando
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

echo "✓ Docker está rodando"
echo ""

# Verificar se está logado no registry
if ! docker pull "${FULL_IMAGE}" > /dev/null 2>&1; then
    echo "⚠️  Não foi possível baixar a imagem. Possíveis causas:"
    echo "   1. Você não está logado no registry"
    echo "   2. Você não está na VPN do iFood"
    echo "   3. A imagem ainda não foi construída"
    echo ""
    echo "Para fazer login, execute:"
    echo "   docker login ${REGISTRY}"
    echo ""
    read -p "Deseja tentar fazer login agora? (s/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        docker login "${REGISTRY}"
        echo ""
        echo "Tentando baixar a imagem novamente..."
        docker pull "${FULL_IMAGE}"
    else
        echo "Por favor, faça login manualmente e execute este script novamente."
        exit 1
    fi
else
    echo "✓ Imagem baixada com sucesso"
fi

echo ""

# Parar e remover container existente (se houver)
if docker ps -a | grep -q "${CONTAINER_NAME}"; then
    echo "🛑 Parando container existente..."
    docker stop "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    docker rm "${CONTAINER_NAME}" > /dev/null 2>&1 || true
fi

# Criar diretório para logs (se não existir)
mkdir -p logs

# Executar container
echo "🚀 Iniciando container..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p 8080:8080 \
  -v "$(pwd)/logs:/app/app/logs" \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e ANALYTICS_ENABLED=true \
  "${FULL_IMAGE}"

echo ""
echo "✅ Container iniciado com sucesso!"
echo ""
echo "📊 Endpoints disponíveis:"
echo "   - Health: http://localhost:8080/health"
echo "   - Trellis Chart: http://localhost:8080/trellis"
echo "   - Boxplot Chart: http://localhost:8080/boxplot"
echo "   - Analytics API: http://localhost:8080/api/analytics/events"
echo ""
echo "📝 Comandos úteis:"
echo "   - Ver logs: docker logs -f ${CONTAINER_NAME}"
echo "   - Parar: docker stop ${CONTAINER_NAME}"
echo "   - Remover: docker rm ${CONTAINER_NAME}"
echo ""

