# Verificação de conformidade com as regras documentadas

Data: 2026-02. Referência: `.cursor/rules/.cursorrules` e regras por stack em `.cursor/rules/stack-*.mdc`.

---

## Resumo

| Área | Status | Observações |
|------|--------|-------------|
| Go (server.go) | Conforme (após correções) | Constantes + writeJSON aplicados |
| Docker / Golden Image | Conforme | ARG CI_REGISTRY, ENTRYPOINT /executor, path/tag fixos |
| GitLab CI | Conforme | BUILD_DOCKERFILE_PATH, validate, variáveis |
| TypeScript (tsconfig) | Conforme | strict: true em charts-router e trellis-chart |
| Vite | Conforme | base, alias @shared |
| Express (estrutura) | Parcial | Falta middleware de erro centralizado; uso de console.* |
| Tipagem (any) | Pendente | 113 ocorrências de `any` em 15 arquivos TS |
| Logging (Express) | Pendente | console.log/error/warn em charts-router; regra: usar logger do shared |

---

## 1. Go (server.go)

**Regras:** stack-go.mdc, .cursorrules [Specific Framework Rules] Go.

- **Constantes para headers:** Corrigido: `headerContentType`, `contentTypeJSON` definidos; handlers usam `writeJSON`.
- **writeJSON:** Corrigido: função única que define Content-Type e faz Encode; todos os handlers usam.
- **Handlers enxutos:** OK: cada handler só monta payload e chama writeJSON.
- **Porta:** OK: `os.Getenv("PORT")` com default "8080".
- **Structs com tags json:** OK.

**Status:** Conforme após as alterações feitas nesta verificação.

---

## 2. Docker e Golden Image

**Regras:** stack-docker.mdc, stack-golden-image.mdc.

- **Multi-stage:** OK: stage `dist` (build Go), stage `production` (Golden Image).
- **ARG CI_REGISTRY:** OK: usado no FROM do stage production.
- **Path e tag fixos:** OK: `ifood/docker-images/golden/nodejs/18:1-edge`.
- **ENTRYPOINT:** OK: `["/executor", "/app/charts-router"]`.
- **EXPOSE 8080:** OK.
- **docker-compose:** OK: build.args CI_REGISTRY, Dockerfile único, healthcheck /health.

**Status:** Conforme.

---

## 3. GitLab CI

**Regras:** stack-gitlab-ci.mdc, stack-golden-image.mdc.

- **BUILD_DOCKERFILE_PATH:** OK: `$CI_PROJECT_DIR/Dockerfile`.
- **validate:** OK: verifica README.md, package.json, Dockerfile, docker-compose.yml.
- **build / build-release:** OK: trigger ifood-docker, CONTAINER_IMAGE_TAG correto.
- **Variáveis:** OK: SERVICE_NAME, NODE_VERSION, FORCE_RELEASE.

**Status:** Conforme.

---

## 4. TypeScript (tsconfig)

**Regras:** stack-typescript.mdc.

- **strict: true:** OK em charts-router e trellis-chart (e boxplot conforme padrão).
- **module / moduleResolution:** OK: ESNext, node.
- **paths @shared:** OK em charts-router e trellis-chart.
- **Tipagem (any):** Não conforme: 113 usos de `any` em 15 arquivos (shared, trellis-chart, boxplot-chart). Regra: nenhum `any`; usar `unknown` e type guards.

**Status:** tsconfig conforme; tipagem com `any` pendente de revisão gradual.

---

## 5. Vite

**Regras:** stack-vite.mdc.

- **base:** OK: `/trellis/` em trellis-chart; boxplot deve ter `/boxplot/`.
- **alias @shared:** OK: resolve para `../shared`.
- **build.outDir, rollupOptions.input:** OK.

**Status:** Conforme.

---

## 6. Express (charts-router)

**Regras:** stack-express.mdc.

- **Ordem de middleware:** OK: express.json(), analyticsMiddleware, rotas. Falta middleware de erro (4 argumentos) explícito no final.
- **Handlers async + try/catch:** OK em routes/analytics.ts.
- **Validação de entrada:** OK em POST /event e GET /events.
- **Logging:** Não conforme: uso de `console.log`, `console.error`, `console.warn` em server.ts, middleware/analytics.ts, utils/analyticsStorage.ts, routes/analytics.ts. Regra: usar logger do shared em fluxos de produção.

**Status:** Parcial; pendente: middleware de erro centralizado e substituição de console.* por logger.

---

## 7. Shared

**Regras:** stack-shared.mdc.

- **Constantes para fetch:** Corrigido: HEADER_CONTENT_TYPE e CONTENT_TYPE_JSON em analytics.ts.
- **Tipos exportados:** OK: types/analytics, common, etc.
- **Uso de any:** 3 ocorrências em shared (analytics.ts); reduzir conforme regra.

**Status:** Parcial; pendente: eliminar `any` onde possível.

---

## 8. Correções aplicadas nesta verificação

1. **server.go:** Inclusão de constantes `headerContentType` e `contentTypeJSON`; criação de `writeJSON(w, v)`; todos os handlers passaram a usar `writeJSON`.
2. **shared/utils/analytics.ts:** Inclusão de `HEADER_CONTENT_TYPE` e `CONTENT_TYPE_JSON`; uso no `fetch` em `sendEvents`.

---

## 9. Pendências recomendadas (não bloqueantes)

1. **Tipagem:** Revisar os 15 arquivos com `any` e substituir por tipos concretos ou `unknown` + type guards (priorizar APIs e tipos exportados).
2. **Express – logger:** Introduzir uso do logger do shared em charts-router (server.ts, routes, middleware, utils) no lugar de console.log/error/warn.
3. **Express – middleware de erro:** Adicionar middleware `(err, req, res, next)` no final do pipeline que logue o erro e responda com JSON + status 500 (ou status em err).
4. **JSDoc:** Garantir JSDoc em funções públicas e APIs em shared e charts-router onde o nome não for suficiente (conforme regra de documentação).

---

*Documento gerado a partir da verificação do codebase contra as regras em .cursor/rules/.*
