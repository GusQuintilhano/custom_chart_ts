#!/bin/sh
# Script de entrada para encontrar e executar server.js
# Para golden image do iFood: arquivos estão em /app/app/charts-router
# Para Railway: arquivos estão em /app/charts-router

BASE_DIR="/app/app/charts-router"
if [ ! -d "$BASE_DIR" ]; then
  BASE_DIR="/app/charts-router"
fi

cd "$BASE_DIR" || exit 1

# Tentar diferentes localizações possíveis
# Quando arquivos estão em dist/charts-router/src/, precisamos executar de lá
# para que os imports relativos funcionem corretamente
if [ -f dist/server.js ]; then
  NODE_CMD="${NODE_CMD:-node}"
  exec $NODE_CMD dist/server.js
elif [ -f dist/src/server.js ]; then
  NODE_CMD="${NODE_CMD:-node}"
  cd dist/src || exit 1
  exec $NODE_CMD server.js
elif [ -f dist/charts-router/src/server.js ]; then
  NODE_CMD="${NODE_CMD:-node}"
  cd dist/charts-router/src || exit 1
  exec $NODE_CMD server.js
else
  echo "ERROR: server.js not found"
  echo "Current directory: $(pwd)"
  echo "Base directory: $BASE_DIR"
  echo "Looking for server.js in:"
  find dist -name "server.js" 2>/dev/null || echo "No server.js found in dist/"
  ls -la dist/ 2>/dev/null || echo "dist/ does not exist"
  exit 1
fi

