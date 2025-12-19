#!/bin/bash

# Build script para gerar pacote .zip do Custom Chart

echo "🔨 Building Custom Chart: ifood-muze-interactive-dual"

# Limpar dist anterior
rm -rf dist/
mkdir -p dist/ifood-muze-interactive-dual

# Copiar arquivos necessários
cp src/index.js dist/ifood-muze-interactive-dual/
cp src/index.html dist/ifood-muze-interactive-dual/
cp src/styles.css dist/ifood-muze-interactive-dual/
cp manifest.json dist/ifood-muze-interactive-dual/

# Criar arquivo .zip
cd dist
zip -r ifood-muze-interactive-dual-v1.0.0.zip ifood-muze-interactive-dual/
cd ..

echo "✅ Build concluído!"
echo "📦 Arquivo gerado: dist/ifood-muze-interactive-dual-v1.0.0.zip"

