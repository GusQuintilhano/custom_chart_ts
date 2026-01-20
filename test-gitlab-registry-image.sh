#!/bin/bash
# Script para testar APENAS a imagem criada pelo GitLab CI/CD (não local)

set -e

REGISTRY="registry.infra.ifood-prod.com.br"
PROJECT_PATH="ifood/data/viz/custom-charts"
TAG="dev"
IMAGE_NAME="${REGISTRY}/${PROJECT_PATH}:${TAG}"
CONTAINER_NAME="test-gitlab-registry-image"

echo "=== Teste da Imagem Docker do GitLab CI/CD (Registry) ==="
echo ""
echo "📦 Imagem: ${IMAGE_NAME}"
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

echo "✅ Docker está rodando"
echo ""

# Verificar autenticação
echo "🔍 Verificando autenticação no registry..."
if ! docker pull "${REGISTRY}/ifood/docker-images/golden/nodejs/18:1-edge" > /dev/null 2>&1; then
    echo "⚠️  Não autenticado no registry do iFood"
    echo ""
    echo "📝 Você precisa fazer login primeiro:"
    echo "   docker login ${REGISTRY}"
    echo ""
    echo "   Use um token de acesso pessoal do GitLab (não senha)"
    echo ""
    read -p "Deseja fazer login agora? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        docker login "${REGISTRY}"
        if [ $? -ne 0 ]; then
            echo "❌ Falha no login. Abortando."
            exit 1
        fi
        echo "✅ Login realizado"
        echo ""
    else
        echo "❌ Abortando. Faça login e tente novamente."
        exit 1
    fi
else
    echo "✅ Já autenticado no registry"
    echo ""
fi

# Tentar fazer pull da imagem
echo "📥 Fazendo pull da imagem do GitLab CI/CD..."
echo "   Isso pode levar alguns minutos se a imagem for grande..."
echo ""

PULL_OUTPUT=$(docker pull "${IMAGE_NAME}" 2>&1)
PULL_EXIT_CODE=$?

if [ $PULL_EXIT_CODE -ne 0 ]; then
    echo "❌ Erro ao fazer pull da imagem"
    echo ""
    echo "$PULL_OUTPUT" | head -10
    echo ""
    echo "📋 Possíveis causas:"
    echo "   1. O pipeline do GitLab ainda está rodando"
    echo "   2. A imagem ainda não foi publicada"
    echo "   3. Problema de conectividade/rede"
    echo "   4. Nome da imagem incorreto"
    echo ""
    echo "🔍 Verifique o pipeline no GitLab:"
    echo "   https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts/-/pipelines"
    echo ""
    echo "💡 Dica: Aguarde o pipeline terminar e tente novamente"
    exit 1
fi

echo "✅ Imagem baixada com sucesso!"
echo ""

# Verificar detalhes da imagem
echo "📦 Detalhes da imagem:"
docker images "${IMAGE_NAME}" | head -2
echo ""

# Parar e remover container anterior se existir
if docker ps -a | grep -q "${CONTAINER_NAME}"; then
    echo "🛑 Parando container anterior..."
    docker stop "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    docker rm "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    echo "✅ Container anterior removido"
    echo ""
fi

# Verificar se porta 8080 está livre
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Porta 8080 já está em uso"
    echo "   Parando containers que possam estar usando..."
    docker ps | grep ":8080" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
    sleep 2
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
    echo "     Resposta: $(echo $HEALTH_JSON | python3 -c 'import sys, json; d=json.load(sys.stdin); print(f\"trellis: {d[\"paths\"][\"trellisIndexExists\"]}, boxplot: {d[\"paths\"][\"boxplotIndexExists\"]}\")' 2>/dev/null || echo 'OK')"
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
    echo "📝 A imagem do GitLab CI/CD está funcionando corretamente:"
    echo "   - Imagem baixada do registry: ${IMAGE_NAME}"
    echo "   - Container rodando"
    echo "   - Health check OK"
    echo "   - Endpoints dos charts funcionando"
    echo ""
    echo "🌐 Endpoints disponíveis:"
    echo "   - http://localhost:8080/health"
    echo "   - http://localhost:8080/trellis"
    echo "   - http://localhost:8080/boxplot"
    echo ""
    echo "📝 Comandos úteis:"
    echo "   Ver logs:  docker logs -f ${CONTAINER_NAME}"
    echo "   Parar:     docker stop ${CONTAINER_NAME}"
    echo "   Remover:   docker rm ${CONTAINER_NAME}"
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
