# Documentação - Custom Charts

Índice da documentação do projeto. Use este README para encontrar o documento certo.

---

## Deploy e observabilidade

| Documento | Uso |
|-----------|-----|
| [**deploy-ifood-passo-a-passo.md**](./deploy-ifood-passo-a-passo.md) | **Processo completo de deploy no iFood.** Passo a passo: pré-requisitos, build/release, namespace K8s, deploy (k8s-manifests/Argo), subdomínio, Akamai, Kong, validação e troubleshooting (incl. JSON em vez de gráfico). |
| [**railway-vs-ifood-deploy.md**](./railway-vs-ifood-deploy.md) | Diferenças Railway vs iFood, reescrita de HTML, riscos, observabilidade (analytics + capacidade), **API única para Databricks** (`GET /api/observability`), retenção 30 dias. |

---

## Infraestrutura iFood (runbooks)

Guias para expor e operar o serviço na infra iFood (Kong, Akamai, K8s).

| Documento | Uso |
|-----------|-----|
| [subdominio-publico-ifood.md](./subdominio-publico-ifood.md) | Criar subdomínio público (Route 53, etc.). |
| [akamai-property-ifood.md](./akamai-property-ifood.md) | Criar propriedade Akamai (edge/CDN) para o FQDN do serviço. |
| [kong-route-ifood.md](./kong-route-ifood.md) | Criar ou atualizar rota e service no Kong (dataviz-custom-chart). |
| [kubernetes-namespace-creation.md](./kubernetes-namespace-creation.md) | Criar namespace Kubernetes (dataviz-custom-chart) no cluster internal-services. |

**TASK.md** (na raiz do repo) é um checklist que orquestra subdomínio + Akamai + Kong; referencia os guias acima.

---

## ThoughtSpot Chart SDK

Documentação para **desenvolver** charts com o ThoughtSpot Chart SDK (Trellis, Boxplot, etc.).

| Caminho | Conteúdo |
|---------|----------|
| [**sdk/README.md**](./sdk/README.md) | Índice da documentação do SDK: guias, aprendizados, referência, exemplos. |
| [sdk/guias/guia-completo.md](./sdk/guias/guia-completo.md) | Guia passo a passo (início rápido, deploy, troubleshooting). |
| [sdk/aprendizados/](./sdk/aprendizados/) | APRENDIZADOS_COMPLETOS.md, APRENDIZADOS_E_ACHADOS.md, COLUMNS_VIZ_PROP_DEFINITION.md, QUALIDADE_E_REFATORACAO.md. |
| [sdk/referencia/DOCUMENTACAO_TECNICA_OFICIAL.md](./sdk/referencia/DOCUMENTACAO_TECNICA_OFICIAL.md) | Referência técnica consolidada do Chart SDK. |
| [sdk/exemplos/trellis-chart/](./sdk/exemplos/trellis-chart/) | Exemplo completo: Trellis Chart (README, aprendizados do exemplo). |

**Para começar:** [sdk/README.md](./sdk/README.md) ou [sdk/guias/guia-completo.md](./sdk/guias/guia-completo.md).

---

## Outros

- **README.md** (raiz): visão do projeto, charts disponíveis, analytics, API.
- **CONTRIBUTING.md**: como contribuir, estrutura do projeto, versionamento.
- **CHANGELOG.md**: mudanças por versão.
- **DOCKER.md**: build e execução com Docker/docker-compose.
- **k8s/README.md**: manifests K8s de referência (deploy real é via k8s-manifests/Argo).
