#!/bin/bash
# Script para testar a imagem Docker criada pelo GitLab CI/CD
# Pode testar com imagem do registry ou imagem local

set -e

REGISTRY="registry.infra.ifood-prod.com.br"
PROJECT_PATH="ifood/data/viz/custom-charts"
SERVICE_NAME="dataviz-custom-charts"
TAG="dev"
GITLAB_IMAGE="${REGISTRY}/${PROJECT_PATH}:${TAG}"
LOCAL_IMAGE="dataviz-custom-charts:gitlab-local"
CONTAINER_NAME="test-gitlab-pipeline-image"

echo "=== Teste da Imagem Docker do GitLab CI/CD ==="
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

echo "✅ Docker está rodando"
echo ""

# Escolher qual imagem usar
echo "📦 Escolha a imagem para testar:"
echo "   1. Imagem do GitLab Registry (${GITLAB_IMAGE})"
echo "   2. Imagem local (${LOCAL_IMAGE})"
echo ""
read -p "Escolha (1 ou 2): " -n 1 -r
echo ""

if [[ $REPLY == "1" ]]; then
    IMAGE_NAME="${GITLAB_IMAGE}"
    echo "🔍 Tentando fazer pull da imagem do GitLab..."
    
    # Tentar pull com timeout
    if timeout 30 docker pull "${IMAGE_NAME}" 2>&1 | grep -q "Error\|failed\|timeout"; then
        echo "⚠️  Não foi possível fazer pull da imagem"
        echo ""
        echo "📋 Possíveis causas:"
        echo "   - O pipeline ainda está rodando"
        echo "   - Problema de conectividade"
        echo "   - Você precisa autenticar: docker login ${REGISTRY}"
        echo ""
        echo "🔍 Verifique o pipeline:"
        echo "   https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts/-/pipelines"
        echo ""
        read -p "Deseja testar com imagem local? (s/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[SsYy]$ ]]; then
            IMAGE_NAME="${LOCAL_IMAGE}"
            echo "✅ Usando imagem local"
        else
            echo "❌ Abortando. Aguarde o pipeline terminar."
            exit 1
        fi
    else
        echo "✅ Imagem baixada do GitLab!"
    fi
else
    IMAGE_NAME="${LOCAL_IMAGE}"
    echo "✅ Usando imagem local"
fi

echo ""

# Verificar se a imagem existe
if ! docker images "${IMAGE_NAME}" | grep -q "${SERVICE_NAME}\|${PROJECT_PATH}"; then
    echo "❌ Imagem não encontrada: ${IMAGE_NAME}"
    echo ""
    echo "💡 Para construir a imagem local:"
    echo "   docker build -f Dockerfile.gitlab -t ${LOCAL_IMAGE} ."
    exit 1
fi

# Parar e remover container anterior se existir
if docker ps -a | grep -q "${CONTAINER_NAME}"; then
    echo "🛑 Parando container anterior..."
    docker stop "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    docker rm "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    echo "✅ Container anterior removido"
    echo ""
fi

# Iniciar o container
echo "🚀 Iniciando container..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p 8080:8080 \
  "${IMAGE_NAME}"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar o container"
    docker logs "${CONTAINER_NAME}" 2>&1 | tail -20 || true
    exit 1
fi

echo "✅ Container iniciado"
echo ""

# Aguardar inicialização
echo "⏳ Aguardando container inicializar (10 segundos)..."
sleep 10

# Verificar se está rodando
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "❌ Container não está rodando!"
    echo "📋 Últimos logs:"
    docker logs "${CONTAINER_NAME}" 2>&1 | tail -30
    exit 1
fi

# Mostrar logs iniciais
echo "📋 Logs iniciais:"
docker logs "${CONTAINER_NAME}" 2>&1 | tail -15
echo ""

# Testar endpoints
echo "🧪 Testando endpoints..."
echo ""

FAILED=false

# Health check
echo -n "  - /health: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
    HEALTH_JSON=$(curl -s http://localhost:8080/health 2>/dev/null)
    if echo "$HEALTH_JSON" | grep -q "trellisIndexExists.*true.*boxplotIndexExists.*true"; then
        echo "     ✅ Charts encontrados corretamente"
    fi
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

# /trellis
echo -n "  - /trellis: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/trellis 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

# /boxplot
echo -n "  - /boxplot: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/boxplot 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

# / (root)
echo -n "  - / (root): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "⚠️  HTTP $HTTP_CODE"
fi

echo ""

# Verificar erros nos logs
echo "🔍 Verificando logs por erros..."
ERRORS=$(docker logs "${CONTAINER_NAME}" 2>&1 | grep -i "error\|fatal" | grep -v "Failed to save analytics" | head -3 || true)
if [ -n "$ERRORS" ]; then
    echo "⚠️  Avisos encontrados:"
    echo "$ERRORS" | sed 's/^/     /'
    echo ""
fi

# Resumo
echo "════════════════════════════════════════════════════"
if [ "$FAILED" = false ]; then
    echo "✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!"
    echo ""
    echo "📝 A imagem está funcionando corretamente:"
    echo "   - Container rodando"
    echo "   - Health check OK"
    echo "   - Endpoints dos charts funcionando"
    echo ""
    echo "🌐 Endpoints:"
    echo "   - http://localhost:8080/health"
    echo "   - http://localhost:8080/trellis"
    echo "   - http://localhost:8080/boxplot"
    echo ""
    echo "📝 Comandos:"
    echo "   Logs:  docker logs -f ${CONTAINER_NAME}"
    echo "   Parar: docker stop ${CONTAINER_NAME}"
    echo "   Remover: docker rm ${CONTAINER_NAME}"
    echo ""
    exit 0
else
    echo "❌ VALIDAÇÃO FALHOU"
    echo ""
    echo "📋 Verifique os logs:"
    echo "   docker logs ${CONTAINER_NAME}"
    echo ""
    exit 1
fi
