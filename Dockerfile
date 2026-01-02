# Dockerfile para ambiente de desenvolvimento e produção
# Container para servir os charts e executar builds

FROM node:18-alpine

# Metadados
LABEL maintainer="iFood Data Visualization Team"
LABEL description="Custom Charts para ThoughtSpot usando Muze Studio"
LABEL version="1.0.0"

# Instalar Python para alguns scripts e ferramentas úteis
RUN apk add --no-cache python3 py3-pip bash git

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração primeiro (para cache de layers)
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para builds)
RUN npm ci || npm install

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p dev/charts/*/dist

# Expor porta para servidor de desenvolvimento
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Comando padrão - servidor HTTP para servir os charts
CMD ["npm", "run", "serve"]

