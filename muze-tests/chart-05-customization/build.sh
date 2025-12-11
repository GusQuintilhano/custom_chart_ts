#!/bin/bash

# Build script para gerar pacote .zip do Custom Chart

echo "🔨 Building Custom Chart: ifood-muze-branded-chart"

# Limpar dist anterior
rm -rf dist/
mkdir -p dist/ifood-muze-branded-chart

# Copiar arquivos necessários
cp src/index.js dist/ifood-muze-branded-chart/
cp src/index.html dist/ifood-muze-branded-chart/
cp src/styles.css dist/ifood-muze-branded-chart/
cp manifest.json dist/ifood-muze-branded-chart/

# Criar arquivo .zip
cd dist
zip -r ifood-muze-branded-chart-v1.0.0.zip ifood-muze-branded-chart/
cd ..

echo "✅ Build concluído!"
echo "📦 Arquivo gerado: dist/ifood-muze-branded-chart-v1.0.0.zip"





