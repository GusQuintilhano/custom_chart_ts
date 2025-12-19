#!/bin/bash

# Build script para gerar pacote .zip do Custom Chart

echo "🔨 Building Custom Chart: ifood-muze-ranked-bars"

# Limpar dist anterior
rm -rf dist/
mkdir -p dist/ifood-muze-ranked-bars

# Copiar arquivos necessários
cp src/index.js dist/ifood-muze-ranked-bars/
cp src/index.html dist/ifood-muze-ranked-bars/
cp src/styles.css dist/ifood-muze-ranked-bars/
cp manifest.json dist/ifood-muze-ranked-bars/

# Criar arquivo .zip
cd dist
zip -r ifood-muze-ranked-bars-v1.0.0.zip ifood-muze-ranked-bars/
cd ..

echo "✅ Build concluído!"
echo "📦 Arquivo gerado: dist/ifood-muze-ranked-bars-v1.0.0.zip"

