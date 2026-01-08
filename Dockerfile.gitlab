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
# Verificar se o build foi bem-sucedido (aceitar qualquer localização de server.js)
RUN cd charts-router && npm run build && \
    (find dist -name "server.js" -type f | head -1 | grep -q . || (echo "ERROR: server.js not found after build" && find dist -type f && exit 1)) && \
    cd ../trellis-chart && npm run build && \
    cd ../boxplot-chart && npm run build

# Stage 2: Production stage
FROM registry.infra.ifood-prod.com.br/ifood/docker-images/golden/nodejs/18:1-edge AS production

# Copiar apenas os arquivos necessários do stage de build
COPY --from=dist /app /app/app

EXPOSE 8080

# Usar script de entrada que encontra server.js em qualquer localização
# O script já está incluído na cópia acima, apenas garantir permissão
RUN chmod +x /app/app/charts-router/start.sh

ENTRYPOINT [ "/executor", "/app/app/charts-router/start.sh" ]
