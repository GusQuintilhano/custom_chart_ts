#!/bin/bash

# Script de deploy para Coolify - Desenvolvimento e Produção
# Este script pode ser usado para automatizar o deploy

set -e

# Função para mostrar ajuda
show_help() {
    echo "🚀 Script de Deploy - Custom Charts SDK"
    echo ""
    echo "Uso: ./deploy.sh [AMBIENTE]"
    echo ""
    echo "Ambientes disponíveis:"
    echo "  dev        Deploy para desenvolvimento"
    echo "  prod       Deploy para produção"
    echo "  both       Deploy para ambos ambientes"
    echo "  test       Apenas testar builds localmente"
    echo ""
    echo "Exemplos:"
    echo "  ./deploy.sh dev"
    echo "  ./deploy.sh prod"
    echo "  ./deploy.sh both"
}

# Função para testar build
test_build() {
    local env=$1
    local dockerfile=$2
    local port=$3
    
    echo "📦 Construindo imagem para $env..."
    docker build -f $dockerfile -t custom-charts:$env .

    echo "🧪 Testando a imagem $env..."
    docker run --rm -d --name custom-charts-test-$env -p $port:8080 custom-charts:$env

    # Aguardar alguns segundos para o container iniciar
    sleep 15

    # Testar health check
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ Health check $env passou!"
    else
        echo "❌ Health check $env falhou!"
        docker logs custom-charts-test-$env
        docker stop custom-charts-test-$env
        return 1
    fi

    # Parar container de teste
    docker stop custom-charts-test-$env
    echo "✅ Teste $env concluído com sucesso!"
}

# Verificar argumentos
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

ENVIRONMENT=$1

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Erro: Docker não está rodando"
    exit 1
fi

case $ENVIRONMENT in
    "dev")
        echo "🔧 Preparando deploy para DESENVOLVIMENTO..."
        test_build "development" "Dockerfile" "3001"
        ;;
    "prod")
        echo "🏭 Preparando deploy para PRODUÇÃO..."
        test_build "production" "Dockerfile" "3002"
        ;;
    "both")
        echo "🔄 Preparando deploy para AMBOS ambientes..."
        test_build "development" "Dockerfile" "3001"
        test_build "production" "Dockerfile" "3002"
        ;;
    "test")
        echo "🧪 Testando builds localmente..."
        test_build "development" "Dockerfile" "3001"
        test_build "production" "Dockerfile" "3002"
        echo "✅ Todos os testes passaram!"
        exit 0
        ;;
    *)
        echo "❌ Ambiente inválido: $ENVIRONMENT"
        show_help
        exit 1
        ;;
esac

echo ""
echo "✅ Deploy preparado com sucesso para $ENVIRONMENT!"
echo ""
echo "📋 Configuração no Coolify:"

if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "both" ]; then
    echo ""
    echo "🔧 DESENVOLVIMENTO:"
    echo "  - Branch: develop"
    echo "  - Dockerfile: Dockerfile"
    echo "  - Domínio: dev-charts.seudominio.com"
    echo "  - Variáveis de ambiente:"
    echo "    NODE_ENV=development"
    echo "    ANALYTICS_ENABLED=true"
    echo "    DEBUG=*"
    echo "    LOG_LEVEL=debug"
fi

if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "both" ]; then
    echo ""
    echo "🏭 PRODUÇÃO:"
    echo "  - Branch: main"
    echo "  - Dockerfile: Dockerfile"
    echo "  - Domínio: charts.seudominio.com"
    echo "  - Variáveis de ambiente:"
    echo "    NODE_ENV=production"
    echo "    ANALYTICS_ENABLED=true"
    echo "    LOG_LEVEL=info"
fi

echo ""
echo "🔗 Endpoints disponíveis:"
echo "  - Health check: /health"
echo "  - Trellis Chart: /trellis"
echo "  - Boxplot Chart: /boxplot"
echo "  - Analytics API: /api/analytics"