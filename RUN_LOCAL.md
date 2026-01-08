# Como rodar a imagem Docker localmente

Este guia mostra como baixar e executar a imagem Docker do registry do GitLab localmente.

## 📋 Pré-requisitos

- Docker instalado e rodando
- Acesso ao registry do GitLab (`registry.infra.ifood-prod.com.br`)
- Credenciais de autenticação (token ou usuário/senha)

## 🔐 Autenticação no Registry

### Opção 1: Login com usuário e senha

```bash
docker login registry.infra.ifood-prod.com.br
# Digite seu usuário e senha quando solicitado
```

### Opção 2: Login com token do GitLab

```bash
# Criar token de acesso no GitLab (Settings > Access Tokens)
# Com permissões: read_registry, write_registry

docker login registry.infra.ifood-prod.com.br -u <seu-usuario> -p <seu-token>
```

## 📥 Baixar a Imagem

### Imagem de desenvolvimento (tag: dev)

```bash
docker pull registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:dev
```

### Imagem de release (tag: versão específica)

```bash
# Exemplo: se houver uma tag v1.0.0
docker pull registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:v1.0.0
```

### Listar tags disponíveis

Você pode verificar as tags disponíveis no GitLab:
- Acesse: `https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts/container_registry`
- Ou use a API do GitLab

## 🚀 Executar a Imagem

### Execução básica

```bash
docker run -d \
  --name custom-charts \
  -p 8080:8080 \
  registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:dev
```

### Com variáveis de ambiente

```bash
docker run -d \
  --name custom-charts \
  -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e ANALYTICS_ENABLED=true \
  registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:dev
```

### Com volume para logs (opcional)

```bash
docker run -d \
  --name custom-charts \
  -p 8080:8080 \
  -v $(pwd)/logs:/app/app/logs \
  registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:dev
```

## ✅ Verificar se está rodando

### Verificar logs

```bash
docker logs custom-charts
```

### Verificar status

```bash
docker ps | grep custom-charts
```

### Testar endpoints

```bash
# Health check
curl http://localhost:8080/health

# Trellis Chart
curl http://localhost:8080/trellis

# Boxplot Chart
curl http://localhost:8080/boxplot

# API de Analytics
curl http://localhost:8080/api/analytics/events?limit=10
```

## 🛑 Parar e Remover

```bash
# Parar o container
docker stop custom-charts

# Remover o container
docker rm custom-charts

# Remover a imagem (opcional)
docker rmi registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:dev
```

## 🔧 Usando Docker Compose

Crie um arquivo `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  custom-charts:
    image: registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:dev
    container_name: custom-charts-prod
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - NODE_ENV=production
      - ANALYTICS_ENABLED=true
    volumes:
      - ./logs:/app/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Execute:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Notas Importantes

1. **Porta**: A imagem expõe a porta 8080 (padrão da golden image do iFood)
2. **Health Check**: O container tem health check configurado
3. **Logs**: Os logs de analytics são salvos em `/app/app/logs/` dentro do container
4. **Golden Image**: A imagem usa a golden image do iFood que já configura usuário não-root e outras boas práticas

## 🔍 Troubleshooting

### Erro de autenticação

```bash
# Verificar se está logado
docker login registry.infra.ifood-prod.com.br

# Verificar credenciais salvas
cat ~/.docker/config.json
```

### Porta já em uso

```bash
# Usar outra porta (ex: 3000)
docker run -d -p 3000:8080 --name custom-charts \
  registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:dev
```

### Ver logs detalhados

```bash
# Logs em tempo real
docker logs -f custom-charts

# Últimas 100 linhas
docker logs --tail 100 custom-charts
```

### Entrar no container

```bash
docker exec -it custom-charts sh
```

