# Manifests K8s de referência (dataviz-custom-charts)

Estes arquivos servem de **referência** para o que deve estar no repositório **k8s-manifests** (deploy real via Argo). O deploy não é feito a partir deste repo.

**MR em uso:** [!3177 feat: add dataviz-custom-chart app (deployment, service, ingress)](https://code.ifoodcorp.com.br/ifood/data/platform/k8s-manifests/-/merge_requests/3177)  
**Branch:** `feat/add-dataviz-custom-chart`  
**Path no k8s-manifests:** `manifests/new-singlecluster-apps/cluster-data-applications/dataviz/app/dataviz-custom-chart/`

## Runtime atual (a partir da 0.1.2)

- **Imagem:** Node.js (charts-router Express). Não há mais binário Go.
- **ENTRYPOINT na imagem:** `/executor node dist/server.js` (Golden Image).
- **Porta:** 8080.
- **Health check:** `GET /health` (200).

## O que garantir no k8s-manifests

1. **Imagem:** `registry.infra.ifood-prod.com.br/ifood/data/viz/custom-charts:v0.1.2` (path do projeto GitLab; tag conforme release).
2. **Sem `command`/`args`** no Deployment: a imagem já define o entrypoint; não sobrescrever com o binário Go antigo.
3. **Porta do container:** 8080.
4. **Namespace:** `dataviz` (ou o definido no Argo para o app).
5. **Probes:** usar `httpGet` em `:8080/health` para readiness e liveness, se o chart permitir.

## Uso

- O deploy está no MR !3177 (branch `feat/add-dataviz-custom-chart`). Imagem no registry: `.../ifood/data/viz/custom-charts:TAG` (path do projeto, não dataviz-custom-charts). Garantir tag `v0.1.2` (runtime Node) e Deployment sem `command`/`args`.
- Os arquivos desta pasta (`k8s/`) espelham o esperado; podem ser usados para conferir ou para abrir ajustes no k8s-manifests (ex.: tag da imagem, probes em `/health`).
