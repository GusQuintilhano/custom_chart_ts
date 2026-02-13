
# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.1.2] - 2026-02-13

_(Nenhuma alteração adicional.)_

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
