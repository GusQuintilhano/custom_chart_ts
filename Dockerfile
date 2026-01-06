# Dockerfile para Custom Charts SDK - iFood
# Baseado na golden image do iFood: ifood/docker-images/golden/nodejs

# Usar golden image do iFood como base
FROM registry.ifoodcorp.com.br/ifood/docker-images/golden/nodejs:18-alpine

# Metadados
LABEL maintainer="iFood Data Visualization Team"
LABEL description="Custom Charts SDK - ThoughtSpot Chart SDK para visualização de dados"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts"

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache de layers)
COPY charts-router/package*.json ./charts-router/
COPY trellis-chart/package*.json ./trellis-chart/
COPY boxplot-chart/package*.json ./boxplot-chart/
COPY shared/package*.json ./shared/

# Instalar dependências do charts-router (servidor principal)
WORKDIR /app/charts-router
RUN npm ci --only=production

# Instalar dependências dos gráficos
WORKDIR /app/trellis-chart
RUN npm ci --only=production

WORKDIR /app/boxplot-chart
RUN npm ci --only=production

# Copiar código fonte
WORKDIR /app
COPY charts-router/ ./charts-router/
COPY trellis-chart/ ./trellis-chart/
COPY boxplot-chart/ ./boxplot-chart/
COPY shared/ ./shared/

# Build dos projetos
WORKDIR /app/charts-router
RUN npm run build

WORKDIR /app/trellis-chart
RUN npm run build

WORKDIR /app/boxplot-chart
RUN npm run build

# Criar diretório para logs
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Usar usuário não-root (se a golden image já definir, respeitar)
# A golden image do iFood geralmente já configura um usuário não-root

# Expor porta (padrão 3000, pode ser sobrescrito via PORT)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Voltar para o diretório do charts-router para o start
WORKDIR /app/charts-router

# Comando de start
CMD ["node", "dist/server.js"]
