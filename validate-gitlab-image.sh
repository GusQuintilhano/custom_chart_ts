#!/bin/bash
# Script para validar a imagem Docker criada pelo GitLab CI/CD

set -e

REGISTRY="registry.infra.ifood-prod.com.br"
PROJECT_PATH="ifood/data/viz/custom-charts"
SERVICE_NAME="dataviz-custom-charts"
TAG="dev"
IMAGE_NAME="${REGISTRY}/${PROJECT_PATH}:${TAG}"
CONTAINER_NAME="validate-gitlab-image"

echo "=== Validação da Imagem Docker do GitLab CI/CD ==="
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

# Parar e remover container anterior se existir
if docker ps -a | grep -q "${CONTAINER_NAME}"; then
    echo "🛑 Parando container anterior..."
    docker stop "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    docker rm "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    echo "✅ Container anterior removido"
    echo ""
fi

# Verificar autenticação no registry
echo "🔍 Verificando autenticação no registry..."
echo "   Tentando fazer pull da imagem..."
echo ""

PULL_OUTPUT=$(docker pull "${IMAGE_NAME}" 2>&1)
PULL_EXIT_CODE=$?

if [ $PULL_EXIT_CODE -ne 0 ]; then
    echo "⚠️  Não foi possível fazer pull da imagem"
    echo ""
    echo "📋 Possíveis causas:"
    echo "   1. O pipeline do GitLab ainda está rodando"
    echo "   2. Problema de conectividade/rede"
    echo "   3. Você precisa autenticar no registry"
    echo "   4. A imagem ainda não foi publicada"
    echo ""
    echo "🔍 Verifique o pipeline no GitLab:"
    echo "   https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts/-/pipelines"
    echo ""
    echo "📝 Para autenticar (se necessário):"
    echo "   docker login ${REGISTRY}"
    echo ""
    echo "💡 Alternativa: Testar com imagem local"
    read -p "Deseja testar com a imagem local (dataviz-custom-charts:gitlab-local)? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        IMAGE_NAME="dataviz-custom-charts:gitlab-local"
        echo "✅ Usando imagem local: ${IMAGE_NAME}"
        echo ""
    else
        echo "❌ Abortando. Aguarde o pipeline terminar e tente novamente."
        exit 1
    fi
else
    echo "✅ Imagem baixada com sucesso!"
    echo ""
fi

echo "✅ Imagem baixada com sucesso!"
echo ""

# Verificar detalhes da imagem
echo "📦 Detalhes da imagem:"
docker images "${IMAGE_NAME}" | head -2
echo ""

# Iniciar o container
echo "🚀 Iniciando container de validação..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p 8080:8080 \
  "${IMAGE_NAME}"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar o container"
    exit 1
fi

echo "✅ Container iniciado"
echo ""

# Aguardar inicialização
echo "⏳ Aguardando container inicializar (10 segundos)..."
sleep 10

# Mostrar logs iniciais
echo ""
echo "📋 Logs iniciais do container:"
docker logs "${CONTAINER_NAME}" | tail -20
echo ""

# Verificar se o container está rodando
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "❌ Container não está rodando!"
    echo "📋 Últimos logs:"
    docker logs "${CONTAINER_NAME}" | tail -30
    exit 1
fi

echo "✅ Container está rodando"
echo ""

# Testar endpoints
echo "🧪 Testando endpoints..."
echo ""

# Testar health check
echo -n "  - /health: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
    # Mostrar resposta do health check
    HEALTH_RESPONSE=$(curl -s http://localhost:8080/health)
    echo "     Resposta: $(echo $HEALTH_RESPONSE | python3 -m json.tool 2>/dev/null | head -5 || echo $HEALTH_RESPONSE | head -c 100)"
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

# Testar /trellis
echo -n "  - /trellis: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/trellis || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

# Testar /boxplot
echo -n "  - /boxplot: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/boxplot || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "❌ FALHOU (HTTP $HTTP_CODE)"
    FAILED=true
fi

# Testar / (rota raiz)
echo -n "  - / (root): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "⚠️  HTTP $HTTP_CODE (pode ser esperado)"
fi

echo ""

# Verificar logs por erros
echo "🔍 Verificando logs por erros..."
ERRORS=$(docker logs "${CONTAINER_NAME}" 2>&1 | grep -i "error\|fatal\|failed" | grep -v "Failed to save analytics" | head -5 || true)
if [ -n "$ERRORS" ]; then
    echo "⚠️  Erros encontrados nos logs:"
    echo "$ERRORS"
    echo ""
else
    echo "✅ Nenhum erro crítico encontrado nos logs"
    echo ""
fi

# Resumo final
echo "════════════════════════════════════════════════════"
if [ -z "$FAILED" ]; then
    echo "✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!"
    echo ""
    echo "📝 A imagem do GitLab CI/CD está funcionando corretamente:"
    echo "   - Container iniciado e rodando"
    echo "   - Health check respondendo"
    echo "   - Endpoints dos charts funcionando"
    echo ""
    echo "🌐 Endpoints disponíveis:"
    echo "   - Health: http://localhost:8080/health"
    echo "   - Trellis: http://localhost:8080/trellis"
    echo "   - Boxplot: http://localhost:8080/boxplot"
    echo ""
    echo "📝 Comandos úteis:"
    echo "   Ver logs:     docker logs -f ${CONTAINER_NAME}"
    echo "   Parar:        docker stop ${CONTAINER_NAME}"
    echo "   Remover:      docker rm ${CONTAINER_NAME}"
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
