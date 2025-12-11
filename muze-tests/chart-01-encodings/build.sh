#!/bin/bash

# Build script para gerar pacote .zip do Custom Chart

echo "🔨 Building Custom Chart: ifood-muze-conditional-colors"

# Limpar dist anterior
rm -rf dist/
mkdir -p dist/ifood-muze-conditional-colors

# Copiar arquivos necessários
cp src/index.js dist/ifood-muze-conditional-colors/
cp src/index.html dist/ifood-muze-conditional-colors/
cp src/styles.css dist/ifood-muze-conditional-colors/
cp manifest.json dist/ifood-muze-conditional-colors/

# Criar arquivo .zip
cd dist
zip -r ifood-muze-conditional-colors-v1.0.0.zip ifood-muze-conditional-colors/
cd ..

echo "✅ Build concluído!"
echo "📦 Arquivo gerado: dist/ifood-muze-conditional-colors-v1.0.0.zip"




