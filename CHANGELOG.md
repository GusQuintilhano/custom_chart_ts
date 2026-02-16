
# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- **GET /api/observability**: API única que retorna eventos (logs) e métricas de capacidade em um único JSON para ingestão no Databricks ou outro destino
- **GET /api/metrics**: Snapshot de capacidade do processo e do container (memória, uptime, cgroup quando em Kubernetes/Docker)

### Mudado
- Observabilidade: armazenamento apenas em arquivo (JSONL por dia); retenção fixa de **30 dias** no nosso ambiente
- Correção da retenção: removidos arquivos com data <= (hoje - 30 dias), mantendo exatamente 30 dias (antes mantinha 31)
- Documentação: README, CONTRIBUTING, docs/railway-vs-ifood-deploy e charts-router alinhados ao estado atual (sem PostgreSQL, 30 dias, API única)

### Removido
- Integração com PostgreSQL (módulo db, rotas /api/metrics/history, variáveis ANALYTICS_DB_URL, DATABASE_URL, ANALYTICS_STORAGE_TYPE, METRICS_INTERVAL_SEC)

## [0.1.2] - 2026-02-13

### Mudado
- Runtime em produção passa a ser apenas Node.js (charts-router Express); removidos Go e binário CGO do Dockerfile
- Dockerfile: stages apenas Node (charts-build, router-build, test, production); imagem final usa Golden Image Node 18; stage production sem `RUN` (cópia de `node_modules` do router-build) por compatibilidade com imagem sem `/bin/sh`
- CI alinhada ao padrão ifood-backend (include `pipelines/ifood-backend/main.yml`); variáveis SERVICE_NAME, GOLDEN_IMG_*, BUILD_*, KUBERNETES_*, HELM_CHART; deploy automático desligado (production/sandbox `when: never`), deploy via k8s-manifests/Argo

### Corrigido
- pipeline_variables_check: definido `DATADOG_DEFAULT_MONITOR: "false"` para não exigir DATADOG_MONITOR_OPERATIONS
- sandbox_helm_dry_run: desabilitado (repo não tem `k8s/values-dev.yaml`)
- Build da imagem de produção: erro `fork/exec /bin/sh: no such file or directory` no stage production (Golden Image distroless) — produção passou a copiar `node_modules` do stage router-build em vez de rodar `npm ci`

## [0.1.1] - 2026-02-12

### Adicionado
- Build dos charts (Trellis e Boxplot) na imagem Docker: `/trellis` e `/boxplot` passam a servir o HTML do gráfico para o ThoughtSpot carregar no iframe (em vez de JSON)
- Stage de teste local no Dockerfile (`docker build --target test`) para validar binário estático e chart HTML em base glibc
- Documentação do teste local no DOCKER.md e script `scripts/test-docker-local.sh`
- Override de dependência `axios` para `>=1.13.5` (trellis-chart e boxplot-chart) para atender ao gate de segurança Snyk SCA

### Corrigido
- Erro no K8s ao subir o pod: `fork/exec /app/charts-router: no such file or directory` — binário Go passou a ser construído com `CGO_ENABLED=0` (estático), compatível com a Golden Image
- Redeclaração de variáveis no boxplot-chart (`containerWidth`/`containerHeight`) que quebrava o build

### Mudado
- Dockerfile: stage `go-build` para o binário; novo stage `charts-build` para compilar trellis-chart e boxplot-chart; cópia de `/app/static/trellis` e `/app/static/boxplot` na imagem final
- server.go: rota `/trellis` e `/boxplot` servem arquivos estáticos (index.html e assets) a partir de `/app/static`
- shared/package.json: adicionada dependência `@thoughtspot/ts-chart-sdk` para o build do trellis resolver os tipos
- boxplot-chart: no Docker usa `npx vite build` (sem `tsc`) até correção completa dos tipos

## [0.1.0] - 2025-01-03

### Adicionado
- Projeto inicial de Custom Charts para ThoughtSpot
- Estrutura base para desenvolvimento
- Documentação inicial

[0.1.2]: https://code.ifoodcorp.com.br/ifood/data/viz/custom_charts/releases/tag/v0.1.2
[Unreleased]: https://code.ifoodcorp.com.br/ifood/data/viz/custom_charts/compare/v0.1.2...HEAD

[0.1.1]: https://code.ifoodcorp.com.br/ifood/data/viz/custom_charts/releases/tag/v0.1.1
[0.1.0]: https://code.ifoodcorp.com.br/ifood/data/viz/custom_charts/releases/tag/v0.1.0
