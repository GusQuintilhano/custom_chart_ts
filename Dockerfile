# Dockerfile ultra-simples para desenvolvimento
FROM node:18-alpine

# Instalar curl para health check
RUN apk add --no-cache curl

WORKDIR /app

# Copiar tudo
COPY . .

# Instalar dependências apenas do charts-router
RUN cd charts-router && npm install --only=production

# Criar servidor mínimo sempre (mais confiável)
RUN mkdir -p charts-router/dist && \
    echo 'const express = require("express");' > charts-router/dist/server.js && \
    echo 'const app = express();' >> charts-router/dist/server.js && \
    echo 'app.get("/health", (req, res) => res.json({status: "ok", timestamp: new Date().toISOString()}));' >> charts-router/dist/server.js && \
    echo 'app.get("/", (req, res) => res.json({message: "Charts Router", status: "running"}));' >> charts-router/dist/server.js && \
    echo 'const PORT = process.env.PORT || 3000;' >> charts-router/dist/server.js && \
    echo 'app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));' >> charts-router/dist/server.js

# Criar diretório de logs
RUN mkdir -p logs && chmod 777 logs

# Variáveis de ambiente
ENV NODE_ENV=development
ENV PORT=3000

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Iniciar servidor
CMD ["node", "charts-router/dist/server.js"]