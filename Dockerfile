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

# Configurar TypeScript para não verificar tipos de shared (skipLibCheck já está ativo)

# Copiar código fonte do trellis-chart (já estamos em /workspace/trellis-chart)
COPY trellis-chart/ ./

# Criar symlink para node_modules em shared para que TypeScript encontre dependências
RUN ln -s /workspace/trellis-chart/node_modules /workspace/shared/node_modules || true

# Build do projeto (o path mapping @shared/* aponta para ../shared/)
RUN npm run build

# Expor porta (Railway define a porta via $PORT)
EXPOSE 3000

# Voltar para o diretório do trellis-chart para o start
WORKDIR /workspace/trellis-chart

# Comando de start (usa PORT do Railway)
CMD ["npm", "start"]

