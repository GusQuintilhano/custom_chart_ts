#!/bin/bash
# Script para verificar e testar a imagem do GitLab CI/CD

set -e

REGISTRY="registry.infra.ifood-prod.com.br"
PROJECT_PATH="ifood/data/viz/custom-charts"

echo "=== Verificação da Imagem do GitLab CI/CD ==="
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando"
    exit 1
fi

echo "✅ Docker está rodando"
echo ""

# Verificar autenticação
echo "🔍 Verificando autenticação..."
if ! docker pull "${REGISTRY}/ifood/docker-images/golden/nodejs/18:1-edge" > /dev/null 2>&1; then
    echo "⚠️  Não autenticado. Faça login:"
    echo "   docker login ${REGISTRY}"
    exit 1
fi

echo "✅ Autenticado no registry"
echo ""

# Tentar diferentes nomes de imagem possíveis
echo "🔍 Tentando encontrar a imagem publicada..."
echo ""

POSSIBLE_TAGS=(
    "dev"
    "latest"
    "main"
    "master"
)

FOUND_IMAGE=""

for TAG in "${POSSIBLE_TAGS[@]}"; do
    IMAGE_NAME="${REGISTRY}/${PROJECT_PATH}:${TAG}"
    echo -n "   Tentando ${IMAGE_NAME}... "
    
    if timeout 10 docker pull "${IMAGE_NAME}" > /dev/null 2>&1; then
        echo "✅ ENCONTRADA!"
        FOUND_IMAGE="${IMAGE_NAME}"
        break
    else
        echo "❌ não encontrada"
    fi
done

echo ""

if [ -z "$FOUND_IMAGE" ]; then
    echo "❌ Nenhuma imagem encontrada no registry"
    echo ""
    echo "📋 Possíveis causas:"
    echo "   1. O pipeline ainda está rodando"
    echo "   2. A imagem ainda não foi publicada"
    echo "   3. O nome da imagem é diferente do esperado"
    echo ""
    echo "🔍 Verifique o pipeline:"
    echo "   https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts/-/pipelines"
    echo ""
    echo "💡 Quando o pipeline terminar, execute:"
    echo "   ./test-gitlab-registry-image.sh"
    echo ""
    exit 1
fi

echo "✅ Imagem encontrada: ${FOUND_IMAGE}"
echo ""

# Mostrar detalhes
echo "📦 Detalhes da imagem:"
docker images "${FOUND_IMAGE}" | head -2
echo ""

# Perguntar se quer testar
read -p "Deseja testar a imagem agora? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo "✅ Imagem encontrada. Execute ./test-gitlab-registry-image.sh para testar"
    exit 0
fi

# Testar a imagem
echo "🚀 Testando a imagem..."
echo ""

# Parar containers anteriores
docker ps -a | grep "test-gitlab" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
docker ps -a | grep "test-gitlab" | awk '{print $1}' | xargs -r docker rm 2>/dev/null || true

# Liberar porta 8080
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    docker ps | grep ":8080" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
    sleep 2
fi

# Iniciar container
CONTAINER_NAME="test-gitlab-registry-$(date +%s)"
echo "📦 Iniciando container: ${CONTAINER_NAME}"

docker run -d \
  --name "${CONTAINER_NAME}" \
  -p 8080:8080 \
  "${FOUND_IMAGE}"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar container"
    exit 1
fi

echo "✅ Container iniciado"
echo ""

# Aguardar
echo "⏳ Aguardando inicialização (10s)..."
sleep 10

# Verificar se está rodando
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "❌ Container não está rodando!"
    docker logs "${CONTAINER_NAME}" 2>&1 | tail -20
    exit 1
fi

# Testar endpoints
echo "🧪 Testando endpoints..."
echo ""

FAILED=false

# Health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null || echo "000")
echo -n "  - /health: "
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK"
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

# Trellis
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/trellis 2>/dev/null || echo "000")
echo -n "  - /trellis: "
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ OK"
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

# Boxplot
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/boxplot 2>/dev/null || echo "000")
echo -n "  - /boxplot: "
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ OK"
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

echo ""

if [ "$FAILED" = false ]; then
    echo "✅ TESTE CONCLUÍDO COM SUCESSO!"
    echo ""
    echo "📝 Imagem: ${FOUND_IMAGE}"
    echo "🌐 Endpoints:"
    echo "   - http://localhost:8080/health"
    echo "   - http://localhost:8080/trellis"
    echo "   - http://localhost:8080/boxplot"
    echo ""
    echo "📋 Comandos:"
    echo "   Logs:  docker logs -f ${CONTAINER_NAME}"
    echo "   Parar: docker stop ${CONTAINER_NAME}"
    exit 0
else
    echo "❌ TESTE FALHOU"
    echo "📋 Logs: docker logs ${CONTAINER_NAME}"
    exit 1
fi
