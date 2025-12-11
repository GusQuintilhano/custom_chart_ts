#!/bin/bash

# Script para empacotar todos os 6 Custom Charts

echo "🔨 Building all Custom Charts..."

charts=(
  "chart-01-encodings:ifood-muze-conditional-colors"
  "chart-02-layers:ifood-muze-layered-chart"
  "chart-03-transforms:ifood-muze-ranked-bars"
  "chart-04-interactivity:ifood-muze-interactive-dual"
  "chart-05-customization:ifood-muze-branded-chart"
  "chart-06-boxplot:ifood-muze-boxplot"
)

for chart_info in "${charts[@]}"; do
  IFS=':' read -r dir name <<< "$chart_info"
  
  echo ""
  echo "📦 Building: $name"
  cd "../../custom-charts/$dir"
  
  if [ -f "build.sh" ]; then
    bash build.sh
  else
    echo "⚠️  Build script não encontrado para $dir"
  fi
  
  cd "../../integration-tests/A3.1-empacotamento"
done

echo ""
echo "✅ Todos os builds concluídos!"
echo "📁 Pacotes gerados em: custom-charts/*/dist/"




