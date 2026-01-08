# Dockerfile para Railway
# Versão simplificada sem golden image do iFood (para uso externo)

# Stage 1: Build stage
FROM node:18-alpine AS dist

# Metadados
LABEL maintainer="iFood Data Visualization Team"
LABEL description="Custom Charts SDK - ThoughtSpot Chart SDK para visualização de dados (Railway)"
LABEL version="1.0.0"

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache de layers)
COPY charts-router/package*.json ./charts-router/
COPY trellis-chart/package*.json ./trellis-chart/
COPY boxplot-chart/package*.json ./boxplot-chart/
COPY shared/package*.json ./shared/

# Instalar dependências de todos os projetos (incluindo dev para build)
RUN cd shared && npm install && \
    cd ../charts-router && npm ci && \
    cd ../trellis-chart && npm ci && \
    cd ../boxplot-chart && npm install

# Copiar código fonte
COPY charts-router/ ./charts-router/
COPY trellis-chart/ ./trellis-chart/
COPY boxplot-chart/ ./boxplot-chart/
COPY shared/ ./shared/

# Build de todos os projetos em um único comando
# Verificar se o build foi bem-sucedido (aceitar qualquer localização de server.js)
RUN cd charts-router && npm run build && \
    (find dist -name "server.js" -type f | head -1 | grep -q . || (echo "ERROR: server.js not found after build" && find dist -type f && exit 1)) && \
    cd ../trellis-chart && npm run build && \
    cd ../boxplot-chart && npm run build

# Stage 2: Production stage (simplificado para Railway)
FROM node:18-alpine AS production

# Instalar apenas runtime dependencies
WORKDIR /app

# Copiar package.json primeiro para instalar dependências
COPY --from=dist /app/charts-router/package*.json ./charts-router/
COPY --from=dist /app/trellis-chart/package*.json ./trellis-chart/
COPY --from=dist /app/boxplot-chart/package*.json ./boxplot-chart/
COPY --from=dist /app/shared/package*.json ./shared/

# Instalar apenas dependências de produção
RUN cd charts-router && npm ci --only=production && \
    cd ../trellis-chart && npm ci --only=production && \
    cd ../boxplot-chart && npm install --only=production && \
    cd ../shared && npm install --only=production || npm install --only=production

# Copiar arquivos compilados e código compartilhado
COPY --from=dist /app/charts-router/dist ./charts-router/dist
COPY --from=dist /app/trellis-chart/dist ./trellis-chart/dist
COPY --from=dist /app/boxplot-chart/dist ./boxplot-chart/dist
COPY --from=dist /app/shared ./shared

# Verificar se os arquivos foram copiados corretamente
RUN find charts-router/dist -name "server.js" -type f | head -1 | grep -q . || \
    (echo "ERROR: server.js not found after copy" && find charts-router/dist -type f 2>/dev/null && ls -la charts-router/ && exit 1)

# Criar diretório para logs
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Copiar script de entrada (antes de mudar usuário)
COPY charts-router/start.sh ./charts-router/start.sh
RUN chmod +x charts-router/start.sh

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expor porta (Railway usa variável PORT)
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Comando de start
WORKDIR /app/charts-router
CMD ["./start.sh"]

