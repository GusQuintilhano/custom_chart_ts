#!/bin/bash

# Build script para gerar pacote .zip do Custom Chart

echo "🔨 Building Custom Chart: ifood-muze-multi-measures-crosstab"

# Limpar dist anterior
rm -rf dist/
mkdir -p dist/ifood-muze-multi-measures-crosstab

# Copiar arquivos necessários
cp src/index.js dist/ifood-muze-multi-measures-crosstab/
cp src/index.html dist/ifood-muze-multi-measures-crosstab/
cp src/styles.css dist/ifood-muze-multi-measures-crosstab/
cp manifest.json dist/ifood-muze-multi-measures-crosstab/

# Criar arquivo .zip
cd dist
zip -r ifood-muze-multi-measures-crosstab-v1.0.0.zip ifood-muze-multi-measures-crosstab/
cd ..

echo "✅ Build concluído!"
echo "📦 Arquivo gerado: dist/ifood-muze-multi-measures-crosstab-v1.0.0.zip"





