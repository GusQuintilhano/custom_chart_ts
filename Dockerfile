# Dockerfile para Custom Charts SDK - iFood
# Baseado na golden image do iFood: ifood/docker-images/golden/nodejs

# Stage 1: Build stage
FROM node:18-alpine AS dist

# Metadados
LABEL maintainer="iFood Data Visualization Team"
LABEL description="Custom Charts SDK - ThoughtSpot Chart SDK para visualização de dados"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source=".../custom-charts"

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache de layers)
# O wildcard package*.json já copia package-lock.json quando existe
COPY charts-router/package*.json ./charts-router/
COPY trellis-chart/package*.json ./trellis-chart/
COPY boxplot-chart/package*.json ./boxplot-chart/
COPY shared/package*.json ./shared/

# Instalar dependências de todos os projetos (incluindo dev para build)
# Usa npm ci quando há package-lock.json, npm install caso contrário
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
# Verificar se o build foi bem-sucedido
RUN cd charts-router && npm run build && \
    test -f dist/server.js || (echo "ERROR: charts-router/dist/server.js not found" && exit 1) && \
    cd ../trellis-chart && npm run build && \
    cd ../boxplot-chart && npm run build

# Stage 2: Production stage
# Usar imagem base pública como fallback (golden image do iFood requer acesso ao registry interno)
FROM node:18-alpine AS production

# Metadados
LABEL maintainer="iFood Data Visualization Team"
LABEL description="Custom Charts SDK - ThoughtSpot Chart SDK para visualização de dados"
LABEL version="1.0.0"

# Configurar diretório de trabalho
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
RUN test -f charts-router/dist/server.js || (echo "ERROR: charts-router/dist/server.js not found after copy" && ls -la charts-router/ && ls -la charts-router/dist/ 2>/dev/null || echo "dist directory does not exist" && exit 1)

# Criar diretório para logs
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=8080

# Comando de start
WORKDIR /app/charts-router
CMD ["node", "dist/server.js"]
