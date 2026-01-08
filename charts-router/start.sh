#!/bin/sh
# Script de entrada para encontrar e executar server.js
# Para golden image do iFood: arquivos estão em /app/app/charts-router
# Para Railway: arquivos estão em /app/charts-router

cd /app/app/charts-router 2>/dev/null || cd /app/charts-router

if [ -f dist/server.js ]; then
  exec /app/node/node dist/server.js
elif [ -f dist/charts-router/src/server.js ]; then
  exec /app/node/node dist/charts-router/src/server.js
else
  echo "ERROR: server.js not found"
  find dist -name "server.js" 2>/dev/null || echo "No server.js found in dist/"
  exit 1
fi

