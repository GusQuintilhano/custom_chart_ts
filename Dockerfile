# Dockerfile para deploy do Trellis Chart no Railway
# Chart SDK customizado para ThoughtSpot

FROM node:18-alpine

# Metadados
LABEL maintainer="iFood Data Visualization Team"
LABEL description="Trellis Chart - Custom Chart SDK para ThoughtSpot"
LABEL version="1.0.0"

# Configurar diretório de trabalho
WORKDIR /workspace

# Copiar pasta shared/ primeiro (necessária para imports @shared/*)
COPY shared/ ./shared/

# Copiar arquivos do trellis-chart
COPY trellis-chart/package*.json ./trellis-chart/

# Instalar dependências do trellis-chart
WORKDIR /workspace/trellis-chart
RUN npm ci || npm install

# Copiar código fonte do trellis-chart
COPY trellis-chart/ ./../trellis-chart/

# Build do projeto (o path mapping @shared/* aponta para ../shared/)
RUN npm run build

# Expor porta (Railway define a porta via $PORT)
EXPOSE 3000

# Voltar para o diretório do trellis-chart para o start
WORKDIR /workspace/trellis-chart

# Comando de start (usa PORT do Railway)
CMD ["npm", "start"]

