# Dockerfile para ambiente de desenvolvimento e testes
# Este projeto não requer containerização para produção,
# mas pode ser útil para ambientes de CI/CD consistentes

FROM node:18-alpine

# Metadados
LABEL maintainer="iFood Data Visualization Team"
LABEL description="Custom Charts para ThoughtSpot usando Muze Studio"
LABEL version="1.0.0"

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY .gitignore ./
COPY .editorconfig ./

# Instalar dependências globais
RUN npm ci --only=production || npm install

# Copiar código fonte (se necessário para testes)
# COPY . .

# Expor porta para servidor de desenvolvimento (se necessário)
EXPOSE 8080

# Comando padrão (pode ser sobrescrito)
CMD ["npm", "run", "serve"]

