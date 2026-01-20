#!/bin/bash
# Script para diagnosticar problemas de conectividade com o registry

REGISTRY="registry.infra.ifood-prod.com.br"
GOLDEN_IMAGE="${REGISTRY}/ifood/docker-images/golden/nodejs/18:1-edge"
PROJECT_IMAGE="${REGISTRY}/ifood/data/viz/custom-charts:dev-amd64"

echo "=== Diagnóstico de Conectividade com Registry ==="
echo ""

# 1. Verificar Docker
echo "1️⃣ Verificando Docker..."
if docker info > /dev/null 2>&1; then
    echo "   ✅ Docker está rodando"
else
    echo "   ❌ Docker não está rodando"
    exit 1
fi
echo ""

# 2. Verificar autenticação
echo "2️⃣ Verificando autenticação..."
if [ -f ~/.docker/config.json ]; then
    if grep -q "registry.infra.ifood-prod.com.br" ~/.docker/config.json; then
        echo "   ✅ Credenciais encontradas no config.json"
        echo "   📝 Tipo: $(grep -A 2 "registry.infra.ifood-prod.com.br" ~/.docker/config.json | grep -E "credsStore|auth" | head -1)"
    else
        echo "   ⚠️  Nenhuma credencial encontrada para o registry"
    fi
else
    echo "   ⚠️  Arquivo ~/.docker/config.json não encontrado"
fi
echo ""

# 3. Testar conectividade básica
echo "3️⃣ Testando conectividade básica..."
if ping -c 1 -W 2 registry.infra.ifood-prod.com.br > /dev/null 2>&1; then
    echo "   ✅ Host acessível via ping"
else
    echo "   ⚠️  Host não acessível via ping (pode ser normal se ping estiver bloqueado)"
fi
echo ""

# 4. Testar pull da golden image
echo "4️⃣ Testando pull da golden image (referência)..."
echo "   ${GOLDEN_IMAGE}"
if docker pull "${GOLDEN_IMAGE}" > /dev/null 2>&1; then
    echo "   ✅ Pull da golden image funcionou!"
    echo "   ✅ Conectividade e autenticação OK"
else
    PULL_ERROR=$(docker pull "${GOLDEN_IMAGE}" 2>&1 | tail -1)
    echo "   ❌ Falha no pull da golden image"
    echo "   Erro: $PULL_ERROR"
    echo ""
    echo "   📋 Possíveis causas:"
    if echo "$PULL_ERROR" | grep -q "unauthorized\|authentication\|401\|403"; then
        echo "      - Problema de autenticação"
        echo "      - Credenciais expiradas"
        echo "      - Token inválido"
    elif echo "$PULL_ERROR" | grep -q "timeout\|deadline\|connection"; then
        echo "      - Problema de rede/conectividade"
        echo "      - VPN não conectada"
        echo "      - Firewall bloqueando"
        echo "      - Registry inacessível"
    else
        echo "      - Erro desconhecido"
    fi
fi
echo ""

# 5. Testar pull da imagem do projeto
echo "5️⃣ Testando pull da imagem do projeto..."
echo "   ${PROJECT_IMAGE}"
if docker pull "${PROJECT_IMAGE}" > /dev/null 2>&1; then
    echo "   ✅ Pull da imagem do projeto funcionou!"
    echo "   ✅ Imagem disponível no registry"
else
    PULL_ERROR=$(docker pull "${PROJECT_IMAGE}" 2>&1 | tail -1)
    echo "   ❌ Falha no pull da imagem do projeto"
    echo "   Erro: $PULL_ERROR"
    echo ""
    if echo "$PULL_ERROR" | grep -q "manifest unknown\|not found\|404"; then
        echo "   📋 A imagem ainda não foi publicada ou não existe"
        echo "   💡 Verifique se o pipeline terminou:"
        echo "      https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts/-/pipelines"
    fi
fi
echo ""

# Resumo
echo "════════════════════════════════════════════════════"
echo "📋 Resumo:"
echo ""

if docker pull "${GOLDEN_IMAGE}" > /dev/null 2>&1; then
    if docker pull "${PROJECT_IMAGE}" > /dev/null 2>&1; then
        echo "✅ Tudo OK! Você pode testar a imagem:"
        echo "   ./test-gitlab-image-only.sh"
    else
        echo "⚠️  Conectividade OK, mas imagem do projeto não encontrada"
        echo "   Aguarde o pipeline terminar ou verifique o nome da tag"
    fi
else
    echo "❌ Problema de conectividade ou autenticação"
    echo ""
    echo "🔧 Soluções:"
    echo "   1. Verifique sua VPN (se necessário)"
    echo "   2. Faça login novamente:"
    echo "      docker login ${REGISTRY}"
    echo "   3. Use um Personal Access Token do GitLab"
    echo "   4. Verifique se está na rede do iFood"
fi
echo ""
