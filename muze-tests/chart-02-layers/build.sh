#!/bin/bash

echo "🔨 Building Custom Chart: ifood-muze-layered-chart"

rm -rf dist/
mkdir -p dist/ifood-muze-layered-chart

cp src/index.js dist/ifood-muze-layered-chart/
cp src/index.html dist/ifood-muze-layered-chart/
cp src/styles.css dist/ifood-muze-layered-chart/
cp manifest.json dist/ifood-muze-layered-chart/

cd dist
zip -r ifood-muze-layered-chart-v1.0.0.zip ifood-muze-layered-chart/
cd ..

echo "✅ Build concluído: dist/ifood-muze-layered-chart-v1.0.0.zip"




