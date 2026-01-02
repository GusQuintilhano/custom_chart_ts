# Dockerfile para deploy do Trellis Chart no Railway
# Chart SDK customizado para ThoughtSpot

FROM node:18-alpine

# Metadados
LABEL maintainer="iFood Data Visualization Team"
LABEL description="Trellis Chart - Custom Chart SDK para ThoughtSpot"
LABEL version="1.0.0"

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos do trellis-chart
COPY trellis-chart/package*.json ./

# Instalar dependências
RUN npm ci || npm install

# Copiar código fonte do trellis-chart
COPY trellis-chart/ ./

# Build do projeto
RUN npm run build

# Expor porta (Railway define a porta via $PORT)
EXPOSE 3000

# Comando de start (usa PORT do Railway)
CMD ["npm", "start"]

