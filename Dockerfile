# Dockerfile simples para desenvolvimento - sem build TypeScript
FROM node:18-alpine

# Instalar ferramentas necessárias
RUN apk add --no-cache curl

WORKDIR /app

# Copiar package.json e instalar dependências
COPY charts-router/package*.json ./charts-router/
RUN cd charts-router && npm install --only=production

# Copiar todos os arquivos
COPY . .

# Verificar se server.js existe, senão criar um mínimo
RUN if [ -f "charts-router/dist/charts-router/src/server.js" ]; then \
        echo "Found compiled server.js"; \
    elif [ -f "charts-router/dist/server.js" ]; then \
        echo "Found server.js in dist root"; \
    else \
        echo "Creating minimal server.js"; \
        mkdir -p charts-router/dist && \
        cat > charts-router/dist/server.js << 'EOF'
const express = require("express");
const path = require("path");
const app = express();

app.use(express.static("."));

app.get("/health", (req, res) => {
    res.json({
        status: "ok", 
        charts: ["trellis", "boxplot"], 
        timestamp: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
    res.json({
        message: "Charts Router - Custom Charts SDK",
        charts: {
            trellis: "/trellis",
            boxplot: "/boxplot"
        },
        status: "running"
    });
});

app.get("/trellis", (req, res) => {
    const indexPath = path.join(__dirname, "../../trellis-chart/dist/index.html");
    if (require("fs").existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({error: "Trellis chart not found", path: indexPath});
    }
});

app.get("/boxplot", (req, res) => {
    const indexPath = path.join(__dirname, "../../boxplot-chart/dist/index.html");
    if (require("fs").existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({error: "Boxplot chart not found", path: indexPath});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Charts router listening on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Trellis Chart: http://localhost:${PORT}/trellis`);
    console.log(`Boxplot Chart: http://localhost:${PORT}/boxplot`);
});
EOF
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

# Comando para iniciar - tentar diferentes caminhos
CMD ["sh", "-c", "if [ -f 'charts-router/dist/charts-router/src/server.js' ]; then node charts-router/dist/charts-router/src/server.js; elif [ -f 'charts-router/dist/server.js' ]; then node charts-router/dist/server.js; else echo 'No server.js found' && exit 1; fi"]