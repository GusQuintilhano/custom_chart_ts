#!/bin/sh
# Script de entrada para encontrar e executar server.js
# Para golden image do iFood: arquivos estão em /app/app/charts-router
# Para Railway: arquivos estão em /app/charts-router

cd /app/app/charts-router 2>/dev/null || cd /app/charts-router

# Tentar diferentes localizações possíveis e ajustar diretório de trabalho
if [ -f dist/server.js ]; then
  NODE_CMD="${NODE_CMD:-node}"
  exec $NODE_CMD dist/server.js
elif [ -f dist/src/server.js ]; then
  NODE_CMD="${NODE_CMD:-node}"
  cd dist/src 2>/dev/null || cd dist
  exec $NODE_CMD server.js
elif [ -f dist/charts-router/src/server.js ]; then
  NODE_CMD="${NODE_CMD:-node}"
  cd dist/charts-router/src 2>/dev/null || cd dist
  exec $NODE_CMD server.js
else
  echo "ERROR: server.js not found"
  echo "Current directory: $(pwd)"
  echo "Looking for server.js in:"
  find dist -name "server.js" 2>/dev/null || echo "No server.js found in dist/"
  ls -la dist/ 2>/dev/null || echo "dist/ does not exist"
  exit 1
fi

