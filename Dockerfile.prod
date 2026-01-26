# Dockerfile para Custom Charts SDK - Coolify
# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache de layers)
COPY charts-router/package*.json ./charts-router/
COPY trellis-chart/package*.json ./trellis-chart/
COPY boxplot-chart/package*.json ./boxplot-chart/
COPY shared/package*.json ./shared/

# Instalar dependências
# Usar npm install para diretórios sem package-lock.json
RUN cd shared && npm install && \
    cd ../charts-router && (npm ci 2>/dev/null || npm install) && \
    cd ../trellis-chart && (npm ci 2>/dev/null || npm install) && \
    cd ../boxplot-chart && npm install

# Copiar código fonte
COPY charts-router/ ./charts-router/
COPY trellis-chart/ ./trellis-chart/
COPY boxplot-chart/ ./boxplot-chart/
COPY shared/ ./shared/

# Build de todos os projetos
RUN cd charts-router && npm run build && \
    cd ../trellis-chart && npm run build && \
    cd ../boxplot-chart && npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# Instalar dumb-init para melhor handling de sinais
RUN apk add --no-cache dumb-init

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copiar apenas arquivos necessários do build
COPY --from=builder --chown=nextjs:nodejs /app/charts-router/dist ./charts-router/dist
COPY --from=builder --chown=nextjs:nodejs /app/charts-router/node_modules ./charts-router/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/charts-router/package.json ./charts-router/package.json
COPY --from=builder --chown=nextjs:nodejs /app/trellis-chart/dist ./trellis-chart/dist
COPY --from=builder --chown=nextjs:nodejs /app/boxplot-chart/dist ./boxplot-chart/dist
COPY --from=builder --chown=nextjs:nodejs /app/shared ./shared

# Criar diretório de logs com permissões adequadas
RUN mkdir -p /app/logs && chown nextjs:nodejs /app/logs

# Mudar para usuário não-root
USER nextjs

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV ANALYTICS_LOG_PATH=/app/logs/analytics.jsonl

# Expor porta
EXPOSE 3000

# Usar dumb-init como entrypoint para melhor handling de sinais
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["node", "charts-router/dist/server.js"]