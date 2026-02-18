# Guia Docker

Um único **Dockerfile** é usado pelo GitLab CI e localmente (docker-compose): build dos charts (Trellis, Boxplot) + **charts-router** (Node/Express) e imagem final baseada na Golden Image Node 18. Porta 8080. Sem Go/CGO. Gate Golden Image compliant (`CI_REGISTRY`).

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
- **Aplicação**: charts-router (Node/Express em `/app/charts-router`), endpoints `/`, `/health`, `/trellis`, `/boxplot` (HTML dos charts)

## Teste local (stage test)

O stage `test` usa Node Alpine e valida que o charts-router sobe e responde:

```bash
# Build da imagem de teste
docker build --target test -t dataviz-custom-charts-test .

# Rodar e testar
docker run --rm -p 8080:8080 dataviz-custom-charts-test
# Em outro terminal:
curl -s http://localhost:8080/health
curl -sI http://localhost:8080/trellis   # deve ser HTML (Content-Type: text/html)
```

Ou use o script:

```bash
./scripts/test-docker-local.sh
```

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

## Reproduzir no seu VPS (ambiente de DEV)

Para rodar a mesma forma que o Docker é criado e como ele trata as requisições em um VPS seu (sem depender do registry ou da Golden Image iFood):

### 1. Build da imagem (stage `test`)

O stage `test` usa apenas `node:18-alpine` e não depende do registry iFood:

```bash
# Na raiz do projeto (onde está o Dockerfile)
docker build --target test -t custom-charts:vps .
```

Isso faz o mesmo que o pipeline: build dos charts (Trellis + Boxplot) e do charts-router, e gera uma imagem que sobe o Express na porta 8080.

### 2. Rodar o container no VPS

```bash
docker run -d -p 8080:8080 --name custom-charts custom-charts:vps
```

Serviço disponível em: `http://<IP-do-VPS>:8080`

- Health: `curl http://<IP-do-VPS>:8080/health`
- Trellis: `http://<IP-do-VPS>:8080/trellis`
- Boxplot: `http://<IP-do-VPS>:8080/boxplot`

### 3. Como as requisições são tratadas (dentro do container)

| Pedido | Comportamento |
|--------|----------------|
| `GET /health` | JSON `{ status: "ok" }` |
| `GET /` | JSON com info do serviço (charts, paths) |
| `GET /trellis` | Lê `trellis-chart/dist/index.html`, reescreve `src="/assets/..."` para `src="/trellis/assets/..."`, envia HTML com `Content-Type: text/html` |
| `GET /boxplot` | Idem com `boxplot-chart/dist/index.html` e `src="/boxplot/assets/..."` |
| `GET /trellis/assets/:filename` | Ficheiro em `trellis-chart/dist/assets/` com `Content-Type: application/javascript` (`.js`) ou `text/css` (`.css`) |
| `GET /boxplot/assets/:filename` | Idem para `boxplot-chart/dist/assets/` |
| `GET /assets/:filename` | Fallback: procura o ficheiro em trellis e depois em boxplot; envia com Content-Type correto (nunca JSON) |

O HTML dos charts referencia scripts em `/trellis/assets/...` ou `/boxplot/assets/...` para evitar que um proxy na frente responda em `/assets/*` com JSON.

### 4. Opcional: proxy reverso no VPS (HTTPS / domínio)

Se quiser usar um domínio e HTTPS (ex.: `https://charts.seudominio.com`):

- **Nginx**: proxy_pass para `http://127.0.0.1:8080`; garantir que não altere `Content-Type` nem reescreva paths.
- **Caddy**: `reverse_proxy localhost:8080` (HTTPS automático).

Exemplo Caddy (Caddyfile):

```
charts.seudominio.com {
    reverse_proxy localhost:8080
}
```

Depois aponte o ThoughtSpot (ou um iframe de teste) para `https://charts.seudominio.com/trellis` ou `/boxplot`.

### 5. Logs e reinício

```bash
docker logs -f custom-charts    # acompanhar logs
docker restart custom-charts    # reiniciar após novo build
```

Para subir uma nova versão: `docker stop custom-charts && docker rm custom-charts`, fazer o build de novo e rodar o `docker run` acima.

---

## CI/CD (GitLab)

- Validar estrutura (README.md, package.json, **Dockerfile**, docker-compose.yml)
- Build da imagem via pipeline `ifood-docker` com `BUILD_DOCKERFILE_PATH: Dockerfile`
- Gate Golden Image: uso de `CI_REGISTRY` no Dockerfile
- Teste da imagem: feito localmente (build + `scripts/test-gitlab-image.sh --local` ou pull + script)

