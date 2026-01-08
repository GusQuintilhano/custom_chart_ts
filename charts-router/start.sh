#!/bin/sh
# Script de entrada para encontrar e executar server.js

if [ -f dist/server.js ]; then
  exec node dist/server.js
elif [ -f dist/charts-router/src/server.js ]; then
  exec node dist/charts-router/src/server.js
else
  echo "ERROR: server.js not found"
  find dist -name "server.js" 2>/dev/null || echo "No server.js found in dist/"
  exit 1
fi

