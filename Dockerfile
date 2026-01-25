# Dockerfile para desenvolvimento - apenas JavaScript
# Não compila TypeScript, usa arquivos JS existentes

FROM node:18-alpine

# Instalar ferramentas necessárias
RUN apk add --no-cache git curl

WORKDIR /app

# Copiar package.json files primeiro
COPY charts-router/package*.json ./charts-router/
COPY package.json ./

# Instalar apenas dependências de runtime
RUN cd charts-router && npm install --only=production

# Copiar arquivos compilados se existirem
COPY charts-router/dist/ ./charts-router/dist/
COPY trellis-chart/dist/ ./trellis-chart/dist/ 2>/dev/null || echo "Trellis dist not found"
COPY boxplot-chart/dist/ ./boxplot-chart/dist/ 2>/dev/null || echo "Boxplot dist not found"
COPY shared/ ./shared/ 2>/dev/null || echo "Shared not found"

# Verificar se server.js existe e criar se necessário
RUN if [ -f "charts-router/dist/charts-router/src/server.js" ]; then \
        echo "Using existing compiled server.js"; \
    elif [ -f "charts-router/dist/server.js" ]; then \
        echo "Using server.js in dist root"; \
    else \
        echo "Creating minimal server.js"; \
        mkdir -p charts-router/dist && \
        echo 'const express = require("express"); const path = require("path"); const app = express(); app.use(express.static(".")); app.get("/health", (req, res) => res.json({status: "ok", charts: ["trellis", "boxplot"], timestamp: new Date().toISOString()})); app.get("/", (req, res) => res.json({message: "Charts Router - Custom Charts SDK", charts: {trellis: "/trellis", boxplot: "/boxplot"}, status: "running"})); app.get("/trellis", (req, res) => { const indexPath = path.join(__dirname, "../../trellis-chart/dist/index.html"); if (require("fs").existsSync(indexPath)) { res.sendFile(indexPath); } else { res.json({error: "Trellis chart not found", path: indexPath}); } }); app.get("/boxplot", (req, res) => { const indexPath = path.join(__dirname, "../../boxplot-chart/dist/index.html"); if (require("fs").existsSync(indexPath)) { res.sendFile(indexPath); } else { res.json({error: "Boxplot chart not found", path: indexPath}); } }); const PORT = process.env.PORT || 3000; app.listen(PORT, "0.0.0.0", () => { console.log(`Charts router listening on port ${PORT}`); console.log(`Health check: http://localhost:${PORT}/health`); console.log(`Trellis Chart: http://localhost:${PORT}/trellis`); console.log(`Boxplot Chart: http://localhost:${PORT}/boxplot`); });' > charts-router/dist/server.js; \
    fi

# Criar diretório de logs
RUN mkdir -p /app/logs && chmod 777 /app/logs

# Configurar variáveis de ambiente
ENV NODE_ENV=development
ENV PORT=3000
ENV ANALYTICS_ENABLED=true

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando para iniciar - tentar diferentes caminhos para server.js
CMD ["sh", "-c", "if [ -f 'charts-router/dist/charts-router/src/server.js' ]; then node charts-router/dist/charts-router/src/server.js; elif [ -f 'charts-router/dist/server.js' ]; then node charts-router/dist/server.js; else echo 'No server.js found' && exit 1; fi"]