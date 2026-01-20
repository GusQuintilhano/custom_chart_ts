#!/bin/bash
# Script para verificar autenticação e testar a imagem do GitLab

set -e

REGISTRY="registry.infra.ifood-prod.com.br"
GOLDEN_IMAGE="${REGISTRY}/ifood/docker-images/golden/nodejs/18:1-edge"
PROJECT_IMAGE="${REGISTRY}/ifood/data/viz/custom-charts:dev-amd64"

echo "=== Verificação de Acesso e Autenticação ==="
echo ""

# 1. Verificar conectividade
echo "1️⃣ Verificando conectividade com o registry..."
if curl -I -k --max-time 5 https://${REGISTRY}/v2/ > /dev/null 2>&1; then
    HTTP_CODE=$(curl -I -k --max-time 5 https://${REGISTRY}/v2/ 2>&1 | grep "HTTP" | awk '{print $2}')
    if [ "$HTTP_CODE" = "401" ]; then
        echo "   ✅ Registry acessível (requer autenticação)"
    else
        echo "   ⚠️  Registry respondeu com HTTP $HTTP_CODE"
    fi
else
    echo "   ❌ Registry não acessível (problema de rede/VPN)"
    echo ""
    echo "   💡 Verifique:"
    echo "      - VPN conectada (se necessário)"
    echo "      - Conectividade de rede"
    exit 1
fi
echo ""

# 2. Verificar autenticação atual
echo "2️⃣ Verificando autenticação do Docker..."
echo "   Testando pull da golden image (referência)..."
if docker pull "${GOLDEN_IMAGE}" > /dev/null 2>&1; then
    echo "   ✅ Autenticação OK - credenciais funcionando!"
    AUTH_OK=true
else
    PULL_ERROR=$(docker pull "${GOLDEN_IMAGE}" 2>&1 | tail -1)
    echo "   ❌ Falha na autenticação"
    echo "   Erro: $PULL_ERROR"
    AUTH_OK=false
    
    if echo "$PULL_ERROR" | grep -q "unauthorized\|401\|403"; then
        echo ""
        echo "   📋 Credenciais expiradas ou inválidas"
        echo ""
        echo "   🔧 Solução: Faça login novamente"
        echo "      docker login ${REGISTRY}"
        echo ""
        echo "   💡 Use um Personal Access Token do GitLab:"
        echo "      - Acesse: https://code.ifoodcorp.com.br/-/user_settings/personal_access_tokens"
        echo "      - Crie um token com escopo 'read_registry'"
        echo "      - Use o token como senha (username pode ser qualquer coisa)"
        echo ""
        read -p "   Deseja fazer login agora? (s/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[SsYy]$ ]]; then
            docker login "${REGISTRY}"
            if [ $? -eq 0 ]; then
                echo "   ✅ Login realizado com sucesso!"
                AUTH_OK=true
            else
                echo "   ❌ Falha no login"
                exit 1
            fi
        else
            echo "   ❌ Abortando. Faça login e tente novamente."
            exit 1
        fi
    elif echo "$PULL_ERROR" | grep -q "timeout\|deadline"; then
        echo ""
        echo "   📋 Problema de timeout (pode ser rede lenta ou VPN)"
        echo "   💡 Tente novamente ou verifique sua conexão"
        exit 1
    fi
fi
echo ""

# 3. Se autenticação OK, testar imagem do projeto
if [ "$AUTH_OK" = true ]; then
    echo "3️⃣ Testando pull da imagem do projeto..."
    echo "   ${PROJECT_IMAGE}"
    
    if docker pull "${PROJECT_IMAGE}" > /dev/null 2>&1; then
        echo "   ✅ Imagem encontrada e baixada!"
        echo ""
        echo "════════════════════════════════════════════════════"
        echo "✅ Tudo OK! Pronto para testar a imagem"
        echo ""
        echo "📝 Execute agora:"
        echo "   ./test-gitlab-image-only.sh"
        echo ""
        exit 0
    else
        PULL_ERROR=$(docker pull "${PROJECT_IMAGE}" 2>&1 | tail -1)
        echo "   ❌ Falha ao fazer pull da imagem"
        echo "   Erro: $PULL_ERROR"
        echo ""
        
        if echo "$PULL_ERROR" | grep -q "manifest unknown\|not found\|404"; then
            echo "   📋 A imagem ainda não foi publicada"
            echo "   💡 Verifique se o pipeline terminou:"
            echo "      https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts/-/pipelines"
        else
            echo "   📋 Erro desconhecido"
        fi
        echo ""
        exit 1
    fi
fi
