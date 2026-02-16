# Criar rota Kong (iFood)

Guia para criar ou atualizar rotas e serviços Kong do seu app na infra iFood.

**Serviço:** dataviz-custom-chart → FQDN `dataviz-custom-chart.ifoodcorp.com.br`

**Pré-requisitos:** Acesso ao repositório **kong-configs** e permissão para abrir MRs.

---

## 1. Clonar o repositório

```bash
git clone git@git.ifoodcorp.com.br:ifood/sre/network-l7/kong/kong-configs.git
cd kong-configs
```

---

## 2. Onde ficam route e service

Para **production** (kong-internal-services-main), espelhando o dataviz-api:

- **Route:** `production/kong-internal-services-main/routes/dataviz_custom_chart.yaml`
- **Service:** `production/kong-internal-services-main/services/dataviz_custom_chart.yaml`

Tags e nomes devem bater com o **Tompero** (service name e impact level): https://tompero.ifoodcorp.com.br/

---

## 3. Conteúdo da route

- **name:** `dataviz_custom_chart`
- **service:** `dataviz_custom_chart`
- **hosts:** `dataviz-custom-chart.ifoodcorp.com.br`
- **tags:** `serviceName_dataviz-custom-chart`, `impactLevel_3`
- **paths:** `/.+($|/$)` (todas as rotas)
- **plugins:** cors, ifood-rate-limiting-redis (ex.: igual ao dataviz-api)

---

## 4. Conteúdo do service

- **name:** `dataviz_custom_chart`
- **host:** endpoint do Kubernetes Ingress (ex.: `dataviz-custom-chart.aws-data-prd.dc-ifood.com` para produção)
- **port:** 443 (https) em produção; 80 em sandbox se for http
- **tags:** `serviceName_dataviz-custom-chart`, `impactLevel_3`

**Importante:** O `host` do service deve ser o **hostname do Ingress** onde o app está rodando no K8s. Se o app for deployado em outro cluster/namespace, ajuste esse host (ex.: após criar a Application no Argo).

---

## 5. Sandbox

Arquivos já criados para sandbox (MR separado):

- **Route:** `sandbox/kong-internal-services-main/routes/dataviz_custom_chart.yaml` — host `dataviz-custom-chart.ifood-sandbox.com.br`
- **Service:** `sandbox/kong-internal-services-main/services/dataviz_custom_chart.yaml` — backend `dataviz-custom-chart.aws.cluster-01.k8s.internal-services-sandbox.dc-ifood.com:80` (http)

Abra primeiro o MR de sandbox (branch `feat/kong-dataviz-custom-chart-sandbox`). Após aprovação e apply, valide e depois abra/merge o MR de production.

---

## 6. Commit, push e MR

```bash
git checkout -b feat/kong-dataviz-custom-chart
git add production/kong-internal-services-main/routes/dataviz_custom_chart.yaml
git add production/kong-internal-services-main/services/dataviz_custom_chart.yaml
git commit -m "feat: add Kong route and service for dataviz-custom-chart.ifoodcorp.com.br"
git push origin feat/kong-dataviz-custom-chart
```

- Abra o **Merge Request** no GitLab.
- O **Traffic Team** acompanha os MRs em kong-configs; não é obrigatório abrir ticket no #engineering-support para produção.

---

## 7. Validação

- Após o merge, monitore logs e métricas.
- Dashboards Kong no Datadog e access log no Kibana (conforme doc interna).

---

## 8. Como testar em sandbox

Após o **merge** do MR de sandbox no kong-configs, o Kong já encaminha tráfego para o backend. O teste só funciona de ponta a ponta se o **backend** (charts-router) estiver deployado no K8s sandbox no host configurado no service (`dataviz-custom-chart.aws.cluster-01.k8s.internal-services-sandbox.dc-ifood.com`). Se ainda não existir Application no Argo para o custom_charts nesse cluster, o Kong responde mas o backend retorna 502/503 até o deploy estar no ar.

**Pré-requisitos**

- VPN iFood conectada.
- Merge em sandbox já aplicado (config do Kong já propagada).
- DNS: `dataviz-custom-chart.ifood-sandbox.com.br` deve resolver na sua rede (sandbox); se não resolver, conferir com a equipe de rede/DNS ou uso de hosts internos do Kong sandbox.

**Testes com curl (quando o backend estiver no ar)**

```bash
# Health check
curl -s -o /dev/null -w "%{http_code}" https://dataviz-custom-chart.ifood-sandbox.com.br/health
# Esperado: 200

# Raiz (JSON com links dos charts)
curl -s https://dataviz-custom-chart.ifood-sandbox.com.br/

# Trellis Chart (HTML)
curl -s -o /dev/null -w "%{http_code}" https://dataviz-custom-chart.ifood-sandbox.com.br/trellis
# Esperado: 200
```

**No navegador**

- `https://dataviz-custom-chart.ifood-sandbox.com.br/` — índice do router.
- `https://dataviz-custom-chart.ifood-sandbox.com.br/trellis` — Trellis Chart.
- `https://dataviz-custom-chart.ifood-sandbox.com.br/boxplot` — Boxplot Chart.

Se o **backend ainda não estiver deployado** em sandbox, o Kong pode retornar 502 Bad Gateway ou 503. Nesse caso é preciso garantir o deploy do app no cluster sandbox (Application no Argo/repo de deploy) e o Ingress apontando para o host do service.

**Se o curl retornar `000` (sem resposta HTTP)**

Significa que a conexão não chegou ao servidor (DNS, rede ou SSL). Rode:

```bash
# 1) O host resolve?
nslookup dataviz-custom-chart.ifood-sandbox.com.br

# 2) Onde falha? (DNS / connect / SSL / timeout)
curl -v --connect-timeout 5 https://dataviz-custom-chart.ifood-sandbox.com.br/health
```

Possíveis causas: DNS do sandbox não configurado para sua rede/VPN; domínio sandbox só acessível por outro caminho (ex.: ingress interno); certificado ou SNI diferente. Nesses casos é comum testar o Kong/backend por URL interna ou via equipe de rede/Traffic Team.

---

## Referências

- Guia interno: "Creating Kong route"
- Tompero (service name / impact level): https://tompero.ifoodcorp.com.br/
- Kong Datadog / Kibana (observabilidade)
