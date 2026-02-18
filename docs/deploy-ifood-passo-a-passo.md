# Deploy no ambiente iFood – passo a passo

Documento único com todo o processo de deploy do **dataviz-custom-chart** no ambiente iFood, na ordem em que foi feito.

**URL alvo (produção):** https://dataviz-custom-chart.ifoodcorp.com.br/  
**Serviço:** charts-router (Node.js/Express) servindo Trellis Chart (`/trellis`) e Boxplot Chart (`/boxplot`).

---

## Visão geral da ordem

| Ordem | Etapa | Repositório / local | Objetivo |
|-------|--------|----------------------|----------|
| 1 | Pré-requisitos | custom_charts, PSE, Tompero | repository-metadata, conta LEGO, credenciais |
| 2 | Build e release da imagem | custom_charts (GitLab) | Imagem Docker no registry (Golden Image Node, porta 8080) |
| 3 | Namespace Kubernetes | kubernetes-infrastructure-live | Namespace para o app (sandbox e production) |
| 4 | Deploy no cluster (Application + manifests) | k8s-manifests | Deployment, Service, Ingress; Argo CD faz o deploy |
| 5 | Subdomínio público (DNS) | aws-infrastructure-live ou aws-legacy-infrastructure-live | Registro Route 53 para dataviz-custom-chart.ifoodcorp.com.br |
| 6 | Propriedade Akamai | edge-network-live | CDN/edge para o FQDN |
| 7 | Rota e service Kong | kong-configs | Kong encaminha tráfego do FQDN para o Ingress no K8s |
| 8 | Validação | Navegador / curl | Health, /trellis, /boxplot retornam HTML |

Os detalhes de cada etapa estão nas seções abaixo. Guias específicos por tema: [subdominio-publico-ifood.md](./subdominio-publico-ifood.md), [akamai-property-ifood.md](./akamai-property-ifood.md), [kong-route-ifood.md](./kong-route-ifood.md), [kubernetes-namespace-creation.md](./kubernetes-namespace-creation.md).

---

## 1. Pré-requisitos

### 1.1 Repositório custom_charts

- **repository-metadata.yaml** na raiz com `apiVersion: ifood/v2`, `deployment.type: container_registry`.
- **Tompero:** serviço registrado (ex.: `dataviz-custom-chart`), impact level e owners definidos (https://tompero.ifoodcorp.com.br/).
- **Conta LEGO:** confirmar com Tech Lead/Head a conta usada (ex.: **internal-services** para sandbox e production). O Kong e o cluster usados são os dessa conta.

### 1.2 Acessos

- GitLab iFood (repos: custom_charts, k8s-manifests, kubernetes-infrastructure-live, kong-configs, edge-network-live, aws-infrastructure-live / aws-legacy-infrastructure-live).
- Midpoint (opcional): AWS, Kubernetes (token OpenDJ para o cluster), Datadog (conforme documentação PSE First Deploy do iFood).
- Vault (quando o app precisar de secrets): URLs por ambiente na documentação PSE; o chart no k8s-manifests já usa `vault.enabled: true`.

---

## 2. Build e release da imagem Docker

O app em produção é o **charts-router** (Node.js). A imagem deve ser a **Golden Image Node 18**, porta **8080**, entrypoint `/executor node dist/server.js`.

### 2.1 Gerar uma nova tag (release)

No repositório **custom_charts**:

```bash
git fetch origin main
git checkout main
git pull origin main

# Criar tag (ex.: v0.1.2)
git tag v0.1.2 main -m "Release 0.1.2"
git push origin v0.1.2
```

### 2.2 Pipeline

- A pipeline do GitLab (trigger **ifood-docker** ou equivalente) roda no push da tag.
- Job **build-release** publica a imagem no registry:  
  `registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:v0.1.2`
- Conferir no GitLab que o job da tag terminou com sucesso.

### 2.3 Conferir a imagem

- Registry: path do projeto é **ifood/data/viz/custom-charts** (não dataviz-custom-charts).
- A imagem não deve ter `command`/`args` que sobrescrevam o entrypoint (não usar binário Go antigo).

Referência do que a imagem deve ter: [k8s/README.md](../k8s/README.md).

---

## 3. Namespace Kubernetes

Antes de deployar o app, o **namespace** precisa existir no cluster (ex.: `dataviz` ou o definido para o app).

### 3.1 Onde fazer

Repositório **kubernetes-infrastructure-live**. Procedimento completo: [kubernetes-namespace-creation.md](./kubernetes-namespace-creation.md).

### 3.2 Resumo

1. Clonar `kubernetes-infrastructure-live`.
2. Criar branch (ex.: `feat/namespace-dataviz-custom-chart`).
3. Gerar/criar namespace para **sandbox** e **production**:
   - Sandbox: `cluster-01.k8s.internal-services-sandbox.dc-ifood.com`
   - Production: `cluster-01.k8s.internal-services-production.dc-ifood.com`
4. Incluir **userMaintainers** no YAML do namespace.
5. Commit, push, abrir MR.
6. No MR: revisar plano do Atlantis e comentar `atlantis apply -d <path-do-namespace>` para cada cluster (ou conforme política do time).
7. Após merge, o namespace estará disponível para o deploy.

---

## 4. Deploy no cluster (k8s-manifests e Argo CD)

O deploy real é feito pelo **Argo CD** a partir do repositório **k8s-manifests** (GitOps). Não é feito a partir do repositório custom_charts.

### 4.1 Onde está o deploy

- **Repositório:** k8s-manifests (ex.: `ifood/data/platform/k8s-manifests`).
- **MR de referência:** [!3177 feat: add dataviz-custom-chart app](https://code.ifoodcorp.com.br/ifood/data/platform/k8s-manifests/-/merge_requests/3177) (branch `feat/add-dataviz-custom-chart`).
- **Path no repo:** `manifests/new-singlecluster-apps/cluster-data-applications/dataviz/app/dataviz-custom-chart/`.

### 4.2 O que garantir nos manifests

- **Imagem:** `registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:v0.1.2` (ajustar a tag conforme o release).
- **Deployment:** sem `command`/`args` (a imagem já define o entrypoint Node).
- **Porta do container:** 8080.
- **Namespace:** o mesmo criado no passo 3 (ex.: `dataviz`).
- **Probes:** `httpGet` em `:8080/health` para readiness e liveness.
- **Ingress (nginx-aws):** host igual ao configurado no **Kong service** (ex.: `dataviz-custom-chart.aws.cluster-01.k8s.internal-services-production.dc-ifood.com` em produção), para o Kong encaminhar o tráfego corretamente.

### 4.3 Application no Argo CD

O Argo CD só exibe o app se existir uma **Application** (ou ApplicationSet) no repositório de deploy/GitOps apontando para o path do k8s-manifests. O deploy do custom_charts não fica neste repositório (custom_charts); fica no k8s-manifests. Se o app não aparecer no Argo, é preciso criar (ou pedir ao time de deploy) essa Application.

### 4.4 Após merge no k8s-manifests

- Argo CD faz sync (automático ou manual).
- O deployment sobe no namespace definido; o Ingress fica acessível no host configurado (Kong usa esse host como backend).

---

## 5. Subdomínio público (Route 53)

Para o endereço **dataviz-custom-chart.ifoodcorp.com.br** resolver e apontar para a edge (Akamai) e depois para o Kong.

### 5.1 Onde fazer

Repositório **aws-infrastructure-live** ou **aws-legacy-infrastructure-live** (conforme onde estiver a hosted zone de `ifoodcorp.com.br`). Guia completo: [subdominio-publico-ifood.md](./subdominio-publico-ifood.md).

### 5.2 Resumo

1. Clonar os repos de infra AWS (se ainda não tiver).
2. Definir variáveis: `DOMAIN=ifoodcorp.com.br`, `SUBDOMAIN=dataviz-custom-chart`.
3. Localizar a hosted zone:  
   `find . -path "*/route53/zone/public/*" -type d | grep ifoodcorp.com.br`
4. Criar pasta do registro:  
   `mkdir -p "$ROUTE53_PATH/record/dataviz-custom-chart.ifoodcorp.com.br"`
5. Criar `terragrunt.hcl` na pasta (template no doc); ajustar **origin** com o valor do guia "Exposing your application at iFood".
6. Commit, push, branch (ex.: `feat/subdomain-dataviz-custom-chart`), abrir MR.
7. No MR: Atlantis plan; após aprovação, comentar `atlantis apply` para criar o registro.
8. Validar no console Route 53 e, após Akamai/Kong prontos, acessar http(s)://dataviz-custom-chart.ifoodcorp.com.br/

---

## 6. Propriedade Akamai (edge)

Para o tráfego do FQDN passar pela CDN/edge antes de chegar ao Kong.

### 6.1 Pré-requisito

Subdomínio (Route 53) já configurado para dataviz-custom-chart.ifoodcorp.com.br.

### 6.2 Onde fazer

Repositório **edge-network-live**. Guia completo: [akamai-property-ifood.md](./akamai-property-ifood.md).

### 6.3 Resumo

1. Clonar `edge-network-live`.
2. Na raiz: `make edge` (ou `make edge-s3` se for com S3).
3. Nos prompts: FQDN `dataviz-custom-chart.ifoodcorp.com.br`, maintainers, impact level, description.
4. Commit, push, MR (branch ex.: `feat/akamai-dataviz-custom-chart`).
5. Aprovação (ex.: pse-team / #engineering-support); Atlantis plan e apply.
6. Staging: anotar edge_hostname e testar.
7. Produção: atualizar `production_property_version` no terragrunt, novo MR, Atlantis apply.

---

## 7. Rota e service Kong

Para o Kong encaminhar o tráfego de **dataviz-custom-chart.ifoodcorp.com.br** para o backend (Ingress do app no K8s).

### 7.1 Onde fazer

Repositório **kong-configs**. Guia completo: [kong-route-ifood.md](./kong-route-ifood.md).

### 7.2 Arquivos

- **Route:** `production/kong-internal-services-main/routes/dataviz_custom_chart.yaml`  
  - name: `dataviz_custom_chart`, service: `dataviz_custom_chart`, hosts: `dataviz-custom-chart.ifoodcorp.com.br`, paths: `/.+($|/$)`, plugins (cors, rate-limiting).
- **Service:** `production/kong-internal-services-main/services/dataviz_custom_chart.yaml`  
  - name: `dataviz_custom_chart`, **host:** hostname do Ingress do app no K8s (ex.: `dataviz-custom-chart.aws.cluster-01.k8s.internal-services-production.dc-ifood.com`), port: 443 (produção).

Tags alinhadas ao Tompero: `serviceName_dataviz-custom-chart`, `impactLevel_3`.

### 7.3 Sandbox (opcional, recomendado primeiro)

- Criar route e service em `sandbox/kong-internal-services-main/` (host sandbox, backend do cluster sandbox).
- MR separado; após merge e apply, testar antes de fazer production.

### 7.4 Produção

- Commit, push, MR (branch ex.: `feat/kong-dataviz-custom-chart`).
- Traffic Team revisa; não é obrigatório ticket. Após merge, Kong passa a encaminhar para o backend.

---

## 8. Validação

### 8.1 Health check

```bash
curl -s -o /dev/null -w "%{http_code}" https://dataviz-custom-chart.ifoodcorp.com.br/health
# Esperado: 200
```

### 8.2 Raiz (JSON com links)

```bash
curl -s https://dataviz-custom-chart.ifoodcorp.com.br/
# Esperado: JSON com message e charts: /trellis, /boxplot
```

### 8.3 Gráficos (HTML)

- No navegador:
  - https://dataviz-custom-chart.ifoodcorp.com.br/trellis
  - https://dataviz-custom-chart.ifoodcorp.com.br/boxplot
- Devem carregar a **página do gráfico** (HTML), não JSON.

Se aparecer JSON em vez do gráfico, seguir a seção **9. Troubleshooting: JSON em vez do gráfico** abaixo.

### 8.4 ThoughtSpot

- Incluir a URL do chart (ex.: `https://dataviz-custom-chart.ifoodcorp.com.br/trellis`) na whitelist do cluster ThoughtSpot usado no iFood.
- Testar o embed do gráfico em uma resposta do ThoughtSpot.

### 8.5 Contrato do proxy e checklist de Content-Type

- **URL do chart:** deve resultar em o backend receber `GET /trellis` e `GET /trellis/assets/*`. Se o proxy expuser ex.: `/v2/trellis`, deve repassar para o app como `/trellis`.
- **Proxy/Kong:** repassar `/trellis`, `/boxplot`, `/trellis/assets/*`, `/boxplot/assets/*` e `/assets/*` sem alterar o path (ou mapeando prefixo para `/trellis`/`/boxplot`); não devolver JSON para esses paths.
- **Checklist pós-deploy:** (1) `curl -s .../health` → JSON com `status: ok`. (2) `curl -s .../trellis` → HTML com `src="/trellis/assets/` e `Content-Type: text/html`. (3) Uma URL de script do HTML (ex.: `.../trellis/assets/main-XXX.js`) → 200 e `Content-Type: application/javascript`. Em aba anônima, DevTools (Rede): confirmar que `index.html` e os `.js`/`.css` retornam 200 e Content-Type correto, não `application/json`. Detalhes: [railway-vs-ifood-deploy.md](./railway-vs-ifood-deploy.md) (seções "Contrato do proxy" e "Checklist pós-deploy").

---

## 9. Troubleshooting: JSON em vez do gráfico

Se `/trellis` ou `/boxplot` devolverem JSON (ex.: `{"chart":"trellis","status":"available"}`) em vez do HTML do gráfico, a causa é **imagem Docker antiga** ou **tag errada no deploy** (runtime atual é Node.js/charts-router, não Go).

**Checklist para corrigir:**

1. **Garantir imagem nova**
   - Criar tag nova no custom_charts (ex.: `v0.1.2`), push da tag, aguardar pipeline publicar a imagem no registry.
   - No **k8s-manifests**, deployment do dataviz-custom-chart: imagem `.../ifood/data/viz/custom-charts:v0.1.2` (ou tag atual) e **sem** `command`/`args` no Deployment.
   - Argo CD: sync na Application do dataviz-custom-chart (ou aguardar sync automático).
2. **Conferir**
   - Abrir `https://dataviz-custom-chart.ifoodcorp.com.br/trellis` — deve carregar HTML, não JSON.
   - Opcional no pod: `kubectl exec -n dataviz deploy/dataviz-custom-chart -- cat /app/trellis-chart/dist/index.html | head -5` (se existir, o router Node está servindo).
3. **Se existir K8S_MANIFESTS_UPDATE_TOKEN** no projeto custom_charts, a pipeline da tag pode abrir o MR no k8s-manifests atualizando a image; basta aprovar e fazer merge.

### 9.1 Erro "Expected module script but server responded with application/json"

Se no console do navegador aparecer algo como: *"main-xxx.js: Failed to load module script: Expected a JavaScript module but the server responded with a MIME type of application/json"*:

- **Causa provável:** a URL do custom chart no ThoughtSpot está apontando para um endpoint que devolve JSON (ex.: raiz `/` ou uma API), ou o embed está carregando o iframe de forma que os scripts (`.js`) são pedidos ao domínio do ThoughtSpot em vez do nosso.
- **O que conferir no ThoughtSpot:** a URL do chart deve ser a **base do nosso serviço** que serve HTML, ex.: `https://dataviz-custom-chart.ifoodcorp.com.br/trellis` (ou `/boxplot`). Não usar a raiz `/` nem rotas de API. O iframe do embed deve ter como `src` essa URL para que o documento e os assets (JS/CSS) sejam carregados do nosso servidor.
- **No nosso servidor:** as rotas `/trellis` e `/boxplot` servem HTML; `/trellis/assets/*.js` e `/boxplot/assets/*.js` servem os scripts com `Content-Type: application/javascript`. Se a requisição chegar ao nosso serviço, nunca devolvemos JSON para esses paths.

**Avisos de preload/crossorigin** (fontes em dev-ifood.thoughtspot.cloud) e **"resource was preloaded but not used"** vêm do próprio ThoughtSpot; só o time da plataforma ThoughtSpot pode ajustar.

---

## 10. Referências rápidas

| Tema | Documento |
|------|-----------|
| Subdomínio (Route 53) | [subdominio-publico-ifood.md](./subdominio-publico-ifood.md) |
| Akamai (edge) | [akamai-property-ifood.md](./akamai-property-ifood.md) |
| Kong (route + service) | [kong-route-ifood.md](./kong-route-ifood.md) |
| Namespace K8s | [kubernetes-namespace-creation.md](./kubernetes-namespace-creation.md) |
| Manifests K8s (referência) | [k8s/README.md](../k8s/README.md) |
| Deploy Railway vs iFood, observabilidade | [railway-vs-ifood-deploy.md](./railway-vs-ifood-deploy.md) |

**Checklist em formato de tarefa (TASK.md):** na raiz do repositório, [TASK.md](../TASK.md) orquestra subdomínio + Akamai + Kong com os mesmos valores usados aqui.
