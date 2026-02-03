# Guia Docker

Um único **Dockerfile** é usado pelo GitLab CI e localmente (docker-compose): build do binário Go (`server.go`) e imagem final baseada na Golden Image Node 18. Porta 8080. Gate Golden Image compliant (`CI_REGISTRY`).

## Início Rápido

### Usando Docker Compose (Recomendado)

```bash
# Subir o ambiente completo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar o ambiente
docker-compose down
```

O servidor estará disponível em: http://localhost:8080

### Usando Docker diretamente

```bash
# Construir a imagem (passar CI_REGISTRY se build local)
docker build -t ifood-muze-charts --build-arg CI_REGISTRY=registry.infra.ifood-prod.com.br .

# Executar o container
docker run -p 8080:8080 ifood-muze-charts

# Ou usar os scripts npm
npm run docker:build
npm run docker:run
```

## 📋 Comandos Disponíveis

### NPM Scripts

```bash
npm run docker:build    # Construir imagem Docker
npm run docker:run      # Executar container
npm run docker:up       # Subir com docker-compose
npm run docker:down     # Parar docker-compose
npm run serve           # Servidor de desenvolvimento (no container)
```

### Docker Compose

```bash
docker-compose up -d           # Subir em background
docker-compose up              # Subir e ver logs
docker-compose down            # Parar e remover containers
docker-compose restart         # Reiniciar containers
docker-compose logs -f         # Ver logs em tempo real
docker-compose exec dev-server bash  # Acessar shell do container
```

## Estrutura do container

- **Base final**: Golden Image Node 18 (`ifood/docker-images/golden/nodejs/18:1-edge`)
- **Porta**: 8080
- **Aplicação**: servidor Go (`/app/charts-router`), endpoints `/`, `/health`, `/trellis`, `/boxplot`

## Troubleshooting

### Porta já em uso
```bash
# Alterar porta no docker-compose.yml
ports:
  - "8081:8080"  # Usar porta 8081 no host
```

### Rebuild da imagem
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Ver logs de erro
```bash
docker-compose logs dev-server
```

## Build e teste local da imagem

Para validar a imagem antes de subir ou após mudanças no Dockerfile:

### 1. Build local

Na raiz do projeto (onde está o Dockerfile):

```bash
# Passar CI_REGISTRY para o Dockerfile (Golden Image)
docker build -t custom-charts:local --build-arg CI_REGISTRY=registry.infra.ifood-prod.com.br .
```

### 2. Testar a imagem

O script `scripts/test-gitlab-image.sh` sobe o container, aguarda 5s e valida `/health`, `/`, `/trellis` e `/boxplot`.

**Imagem buildada localmente (sem pull):**

```bash
./scripts/test-gitlab-image.sh --local custom-charts:local 18080
```

**Imagem do registry (ex.: após pipeline no GitLab):**

Pré-requisitos: VPN iFood, `docker login` no registry.

```bash
# Tag padrão (dev)
./scripts/test-gitlab-image.sh

# Imagem e porta explícitas
./scripts/test-gitlab-image.sh registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:dev 18080
```

Se algum endpoint falhar, o script exibe as últimas 30 linhas de log do container e termina com código 1.

## CI/CD (GitLab)

- Validar estrutura (README.md, package.json, **Dockerfile**, docker-compose.yml)
- Build da imagem via pipeline `ifood-docker` com `BUILD_DOCKERFILE_PATH: Dockerfile`
- Gate Golden Image: uso de `CI_REGISTRY` no Dockerfile
- Teste da imagem: feito localmente (build + `scripts/test-gitlab-image.sh --local` ou pull + script)

