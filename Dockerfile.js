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

# Copiar arquivos necessários
COPY charts-router/dist/ ./charts-router/dist/
COPY trellis-chart/dist/ ./trellis-chart/dist/
COPY boxplot-chart/dist/ ./boxplot-chart/dist/
COPY shared/ ./shared/

# Se não existir dist, criar servidor mínimo
RUN if [ ! -f "charts-router/dist/server.js" ]; then \
        mkdir -p charts-router/dist && \
        echo 'const express = require("express"); const path = require("path"); const app = express(); app.use(express.static(".")); app.get("/health", (req, res) => res.json({status: "ok", charts: ["trellis", "boxplot"]})); app.get("/", (req, res) => res.json({message: "Charts Router", charts: {trellis: "/trellis", boxplot: "/boxplot"}})); app.get("/trellis", (req, res) => res.sendFile(path.join(__dirname, "../../trellis-chart/dist/index.html"))); app.get("/boxplot", (req, res) => res.sendFile(path.join(__dirname, "../../boxplot-chart/dist/index.html"))); const PORT = process.env.PORT || 3000; app.listen(PORT, "0.0.0.0", () => console.log(`Charts router listening on port ${PORT}`));' > charts-router/dist/server.js; \
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

# Comando para iniciar
CMD ["node", "charts-router/dist/server.js"]