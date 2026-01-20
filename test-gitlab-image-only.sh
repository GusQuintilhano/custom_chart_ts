#!/bin/bash
# Script para testar APENAS a imagem do GitLab Registry (não local)

set -e

REGISTRY="registry.infra.ifood-prod.com.br"
IMAGE_NAME="${REGISTRY}/ifood/data/viz/custom-charts:dev-amd64"
CONTAINER_NAME="test-gitlab-registry-only"

echo "=== Teste da Imagem do GitLab CI/CD ==="
echo "📦 Imagem: ${IMAGE_NAME}"
echo ""

# Verificar Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando"
    exit 1
fi

echo "✅ Docker está rodando"
echo ""

# Verificar conectividade primeiro (mas não bloquear)
echo "🔍 Verificando conectividade com o registry..."
if docker pull "${REGISTRY}/ifood/docker-images/golden/nodejs/18:1-edge" > /dev/null 2>&1; then
    echo "✅ Conectividade OK"
    echo ""
else
    echo "⚠️  Problema de conectividade detectado"
    echo "   (Continuando mesmo assim...)"
    echo ""
fi

# Tentar fazer pull
echo "📥 Fazendo pull da imagem do GitLab..."
echo "   Imagem: ${IMAGE_NAME}"
echo "   (Isso pode levar alguns minutos...)"
echo ""

PULL_OUTPUT=$(docker pull "${IMAGE_NAME}" 2>&1)
PULL_EXIT=$?

if [ $PULL_EXIT -eq 0 ]; then
    echo ""
    echo "✅ Imagem baixada com sucesso!"
    echo ""
else
    echo ""
    echo "❌ Erro ao fazer pull (código: $PULL_EXIT)"
    echo ""
    echo "$PULL_OUTPUT" | tail -5
    echo ""
    echo "📋 Possíveis causas:"
    echo "   1. Pipeline ainda está rodando"
    echo "   2. Imagem ainda não foi publicada"
    echo "   3. Problema de autenticação (credenciais expiradas)"
    echo "   4. Problema de rede/conectividade/VPN"
    echo "   5. Nome da tag incorreto"
    echo ""
    echo "🔍 Verifique:"
    echo "   - Pipeline: https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts/-/pipelines"
    echo "   - Autenticação: docker login ${REGISTRY}"
    echo "   - VPN/conectividade"
    echo ""
    echo "💡 Tente também outras tags:"
    echo "   docker pull ${REGISTRY}/ifood/data/viz/custom-charts:dev"
    echo "   docker pull ${REGISTRY}/ifood/data/viz/custom-charts:latest"
    echo ""
    exit 1
fi

# Mostrar detalhes
echo "📦 Detalhes da imagem:"
docker images "${IMAGE_NAME}" | head -2
echo ""

# Limpar containers anteriores
echo "🧹 Limpando containers anteriores..."
docker ps -a | grep "${CONTAINER_NAME}" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
docker ps -a | grep "${CONTAINER_NAME}" | awk '{print $1}' | xargs -r docker rm 2>/dev/null || true

# Liberar porta 8080
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "🛑 Liberando porta 8080..."
    docker ps | grep ":8080" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
    sleep 2
fi

# Iniciar container
echo "🚀 Iniciando container..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p 8080:8080 \
  "${IMAGE_NAME}"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar container"
    docker logs "${CONTAINER_NAME}" 2>&1 | tail -20 || true
    exit 1
fi

echo "✅ Container iniciado"
echo ""

# Aguardar
echo "⏳ Aguardando inicialização (10 segundos)..."
sleep 10

# Verificar se está rodando
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "❌ Container não está rodando!"
    echo "📋 Logs:"
    docker logs "${CONTAINER_NAME}" 2>&1 | tail -30
    exit 1
fi

# Mostrar logs
echo "📋 Logs iniciais:"
docker logs "${CONTAINER_NAME}" 2>&1 | tail -15
echo ""

# Testar endpoints
echo "🧪 Testando endpoints..."
echo ""

FAILED=false

# Health
echo -n "  - /health: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
    HEALTH=$(curl -s http://localhost:8080/health 2>/dev/null)
    if echo "$HEALTH" | grep -q "trellisIndexExists.*true"; then
        echo "     ✅ Trellis encontrado"
    fi
    if echo "$HEALTH" | grep -q "boxplotIndexExists.*true"; then
        echo "     ✅ Boxplot encontrado"
    fi
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

# Trellis
echo -n "  - /trellis: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/trellis 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

# Boxplot
echo -n "  - /boxplot: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/boxplot 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

echo ""

# Resumo
echo "════════════════════════════════════════════════════"
if [ "$FAILED" = false ]; then
    echo "✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!"
    echo ""
    echo "📝 Imagem do GitLab CI/CD está funcionando:"
    echo "   - Imagem: ${IMAGE_NAME}"
    echo "   - Container: ${CONTAINER_NAME}"
    echo "   - Todos os endpoints funcionando"
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
