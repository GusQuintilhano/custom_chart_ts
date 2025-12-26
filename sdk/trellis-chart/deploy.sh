#!/bin/bash

# Script de deploy no Railway
# Projeto: ts-custom-charts

set -e

echo "🚀 Iniciando deploy no Railway..."
echo "📦 Projeto: ts-custom-charts"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
  echo "❌ Erro: package.json não encontrado"
  echo "Execute este script do diretório: custom-charts/chart-07-multi-measures-sdk"
  exit 1
fi

# Verificar se railway CLI está instalado
if ! command -v railway &> /dev/null; then
  echo "❌ Railway CLI não encontrado"
  echo "Instale com: npm i -g @railway/cli"
  exit 1
fi

echo "✅ Railway CLI encontrado"
echo ""

# Verificar login
echo "🔐 Verificando login..."
if railway whoami &> /dev/null; then
  echo "✅ Já está logado no Railway"
else
  echo "⚠️  Não está logado. Execute: railway login"
  echo "   Isso abrirá o navegador para autenticação"
  exit 1
fi

echo ""
echo "📋 Inicializando projeto no Railway..."
echo "   Nome do projeto: ts-custom-charts"
echo ""

# Inicializar projeto
railway init ts-custom-charts --yes || {
  echo "⚠️  Projeto já existe ou erro ao criar"
  echo "   Continuando com o projeto existente..."
}

echo ""
echo "🔨 Fazendo deploy..."
railway up

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📊 Próximos passos:"
echo "   1. Ver URL: railway domain"
echo "   2. Ver logs: railway logs"
echo "   3. Abrir dashboard: railway open"
echo ""
echo "🔗 Configure no ThoughtSpot:"
echo "   - Adicione a URL ao CSP (Content Security Policy)"
echo "   - Crie Custom Chart apontando para a URL"




