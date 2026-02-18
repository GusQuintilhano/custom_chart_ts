# Deploy no Coolify (VPS)

Guia para subir o Custom Charts (Trellis + Boxplot) no seu VPS usando Coolify, sem depender do registry ou da Golden Image iFood.

## Repositório de referência (GitHub)

Para deploy no Coolify a partir do repositório público:

- **URL:** `https://github.com/GusQuintilhano/custom_chart_ts`
- **Branch (teste VPS/Coolify):** `test` — recomendada para ambiente de teste no Coolify (inclui `docker-compose.vps.yml` e doc).
- **Branch (dev):** `develop`
- **Branch (prod):** `main`

No Coolify, ao criar o recurso com "Public Repository", use a URL acima e escolha a branch (ex.: `test` para o ambiente de teste no VPS).

- **Se o repo tiver `docker-compose.vps.yml`:** use o build pack **Docker Compose** e em **Docker Compose Location** ponha `docker-compose.vps.yml`; a porta do serviço é **8080**.
- **Se não tiver:** use o build pack **Dockerfile** e selecione o Dockerfile do ambiente (ex.: `Dockerfile.dev` para dev). Na secção de rede, defina a **porta** que o app expõe (o README do [custom_chart_ts](https://github.com/GusQuintilhano/custom_chart_ts) indica 3000 para dev; o Dockerfile principal usa 8080).

## O que você precisa

- VPS com Coolify instalado e acessível (dashboard web).
- Repositório do projeto no Git (GitHub, GitLab, etc.) acessível pelo Coolify (público ou com Deploy Key / GitHub App).
- Domínio ou IP do VPS para acessar o serviço (ex.: `https://charts.seudominio.com` ou `http://IP:8080`).

## Passo a passo no Coolify

### 1. Criar novo recurso

No dashboard do Coolify, abra o projeto onde quer o app e clique em **Create New Resource**.

### 2. Escolher origem do código

- **Repositório público:** escolha "Public Repository" e cole a URL do repositório (ex.: `https://github.com/org/custom_charts.git`).
- **Repositório privado:** use "Github App" ou "Deploy Key" (configure antes conforme a doc do Coolify).

### 3. Build Pack: Docker Compose

- O Coolify costuma vir com **Nixpacks** como padrão.
- Troque para **Docker Compose** no dropdown do build pack.

### 4. Configurar o Build Pack

| Campo | Valor |
|-------|--------|
| **Docker Compose Location** | `docker-compose.vps.yml` |
| **Base Directory** | `/` (raiz do repo) |
| **Branch** | Deixe o padrão (ex.: `main`) ou escolha a branch desejada |

O ficheiro `docker-compose.vps.yml` usa o stage **test** do Dockerfile (Node 18 Alpine), sem Golden Image nem registry iFood.

Clique em **Continue**.

### 5. Rede / Domínio / Porta

- **Porta do serviço:** o app escuta na porta **8080** (já definida no compose). No Coolify, ao atribuir domínio ao serviço, informe a porta **8080** (ex.: em "Port" ou no domínio como `https://seudominio.com:8080` conforme a UI).
- **Domínio:** se usar proxy reverso do Coolify (Traefik), atribua um domínio ao serviço (ex.: `charts.seudominio.com`). O proxy encaminha para a porta 8080 do container.
- Se não atribuir domínio, o serviço pode ficar acessível só pela porta mapeada no host (ex.: `http://IP-do-VPS:8080`), dependendo da configuração do Coolify.

### 6. Deploy

Clique em **Deploy** (ou equivalente). O Coolify vai:

1. Clonar o repositório
2. Executar `docker compose -f docker-compose.vps.yml build` (com contexto do Base Directory)
3. Subir o container e expor conforme a rede/domínio

Aguarde o build terminar. O primeiro deploy pode demorar (build dos charts + router).

---

## Como obter as informações (logs e estado)

### Logs de deploy

- No Coolify: na página do recurso, abra a aba **Deployments** ou **Logs** para ver o log do último deploy (build e início do container).
- Use isso para ver se o build falhou ou se o container subiu.

### Logs em tempo real (runtime)

- **Pelo Coolify:** muitas instalações mostram "Logs" ou "Runtime Logs" na página do recurso; abra e acompanhe o stdout do container (incluindo os nossos `console.log` se alterarmos a instrumentação para stdout).
- **Pelo SSH no VPS:** se tiver acesso ao servidor:

```bash
# Entrar no servidor
ssh usuario@ip-do-vps

# Listar containers (Coolify costuma nomear com UUIDs ou nomes do recurso)
docker ps

# Logs do container do custom-charts (substitua CONTAINER_ID ou nome pelo que aparecer em docker ps)
docker logs -f CONTAINER_ID
```

Para encontrar o container pelo nome do serviço no compose:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
# Procure por muze-dev-server ou pelo nome que o Coolify deu ao serviço
docker logs -f muze-dev-server
```

### Endpoints para testar

Depois do deploy, confira:

| URL | O que esperar |
|-----|----------------|
| `http://SEU-DOMINIO-OU-IP:8080/health` | JSON: `{"status":"ok"}` |
| `http://SEU-DOMINIO-OU-IP:8080/trellis` | HTML da página do Trellis Chart |
| `http://SEU-DOMINIO-OU-IP:8080/boxplot` | HTML da página do Boxplot Chart |

Se o Coolify estiver a fazer proxy por domínio (sem porta na URL), use por exemplo `https://charts.seudominio.com/health`, `/trellis`, `/boxplot`.

---

## Resumo do que o Coolify usa

- **Ficheiro:** `docker-compose.vps.yml` na raiz do repo.
- **Build:** Dockerfile com `target: test` (imagem Node 18 Alpine, sem registry iFood).
- **Serviço:** `dev-server`, porta 8080, healthcheck em `/health`.
- **Logs:** pela UI do Coolify (Runtime Logs) ou por `docker logs` no VPS.

Se em algum passo a UI do Coolify for diferente (ex.: "Docker Compose Location" noutro sítio ou com outro nome), use este guia como referência e ajuste ao que aparecer no seu painel.
