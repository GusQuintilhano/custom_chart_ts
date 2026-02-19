# Railway vs iFood: diferenças de deploy e riscos

## Como cada ambiente funciona

No **GitHub** ([GusQuintilhano/custom_chart_ts](https://github.com/GusQuintilhano/custom_chart_ts)) o deploy (Railway/Coolify) usa o **charts-router**: um único app que expõe **Trellis** e **Boxplot** em `/trellis` e `/boxplot`, igual ao iFood.

### Railway / GitHub (charts-router)

- **O que sobe:** charts-router (build de trellis-chart + boxplot-chart + charts-router).
- **URLs:** `https://ts-custom-charts-production.up.railway.app/trellis` e `.../boxplot`.
- **Comportamento do server:** ao servir `GET /trellis` e `GET /boxplot`, o server **reescreve o HTML** antes de enviar: troca `src="/assets/` por `src="/trellis/assets/` (ou `/boxplot/assets/`). Assim o browser sempre pede `/trellis/assets/...` ou `/boxplot/assets/...`, que são atendidos pelo `express.static` montado nesses paths. Não existe rota em `/assets` na raiz; pedidos a `/assets` ou `/assets/*` recebem 404 com mensagem "Use /trellis or /boxplot".

### iFood (charts-router, alinhado ao GitHub)

- **O que sobe:** mesmo conceito (charts-router com `/trellis` e `/boxplot`).
- **URL do chart:** `https://dataviz-custom-chart.xxx/trellis` (e `/boxplot`).
- **Alinhamento:** o server faz a **mesma reescrita de HTML** em `GET /trellis` e `GET /boxplot`. Assets são servidos apenas em `/trellis/assets/*` e `/boxplot/assets/*`; não há rota dinâmica em `/assets`.

## Por que funcionava no Railway e não no iFood?

- No **GitHub/Railway** o server já reescrevia o HTML, então o browser nunca pedia `/assets/` na raiz; pedia `/trellis/assets/` ou `/boxplot/assets/`.
- No **iFood** o server enviava o `index.html` cru (com `src="/assets/..."`). O browser pedia `GET /assets/main-xxx.js` no mesmo host; sem rota adequada ou com proxy diferente, a resposta podia ser JSON → "MIME type application/json", gráfico não carregava.
- Com a reescrita de HTML, o browser passa a pedir apenas `/trellis/assets/...` ou `/boxplot/assets/...`; não existe rota em `/assets` (pedidos a `/assets` recebem 404).

## O que mais pode quebrar (e como evitar)

| Risco | Descrição | Mitigação |
|-------|-----------|-----------|
| **Build com base errado** | Dist gerado com `base: '/'` (cache, build antigo, CI diferente). HTML pede `/assets/...` e o server reescreve para `/trellis/assets/` ou `/boxplot/assets/`. | Garantir que no Docker/CI não haja cache antigo de `dist` e que sempre rode `vite build` com o `vite.config` atual (base `/trellis/` e `/boxplot/`). |
| **CORS** | Se o chart fizer `fetch()` para outro domínio, o servidor precisa enviar cabeçalhos CORS adequados. | Hoje o chart roda dentro do iframe do ThoughtSpot; os assets são same-origin. Se no futuro o chart chamar APIs externas, configurar CORS no charts-router ou no Kong. |
| **X-Frame-Options** | Se a resposta tiver `X-Frame-Options: DENY` (ou `SAMEORIGIN` com origem diferente), o ThoughtSpot não consegue embutir o chart no iframe. | Não definir `X-Frame-Options` no charts-router (ou usar `ALLOW-FROM` se o Kong/proxy exigir). Kong/proxy não devem injetar DENY. |
| **CSP (Content-Security-Policy)** | Política muito restritiva pode bloquear scripts ou estilos do chart. | Se Kong ou o app passarem a enviar CSP, incluir `script-src`/`style-src` que permitam os assets do chart (e o domínio do ThoughtSpot, se necessário). |
| **Kong/proxy reescrevendo path** | Ex.: Kong enviar `GET /` em vez de `GET /trellis` para o backend. O router veria `/` e devolveria JSON. | Configurar Kong (ou proxy) para manter o path (`/trellis`, `/boxplot`, `/trellis/assets/...`, etc.) ao repassar para o charts-router. |
| **Whitelist no ThoughtSpot** | A URL do chart no iFood é diferente da do Railway. Se não estiver na whitelist, o ThoughtSpot não carrega o iframe. | Incluir a URL de produção iFood (ex.: `https://dataviz-custom-chart.xxx/trellis`) na whitelist do cluster ThoughtSpot. |

## Contrato do proxy e URL do chart (iFood)

Para o chart carregar corretamente, o backend (charts-router) deve receber os paths **exatamente** como abaixo. O proxy/Kong deve estar configurado em função disso.

- **URL do chart no ThoughtSpot (iFood):** deve ser a que resulte em o **backend receber** `GET /trellis` e `GET /trellis/assets/*` (ex.: `https://dataviz-custom-chart.ifoodcorp.com.br/trellis` se o proxy não adicionar prefixo). Se o proxy expuser outra path (ex.: `/v2/trellis`), ele deve **repassar para o app como** `GET /trellis` (strip do prefixo), para que o charts-router sirva HTML e assets nos paths que conhece.
- **Proxy/Kong:** deve repassar para o charts-router os paths `/trellis`, `/boxplot`, `/trellis/assets/*` e `/boxplot/assets/*` **sem alterar o path** (ou mapeando ex.: `/v2/trellis` → `/trellis` no backend). Não é necessário repassar `/assets/*` (o backend devolve 404 para `/assets`). Não deve devolver JSON para paths de chart; a resposta deve vir do charts-router (HTML ou JS/CSS com `Content-Type` correto).

## Checklist pós-deploy

Após merge e deploy da nova imagem:

1. **Health:** `curl -s https://dataviz-custom-chart.ifoodcorp.com.br/health` deve retornar JSON com `status: ok`.
2. **HTML:** `curl -sI https://dataviz-custom-chart.ifoodcorp.com.br/trellis` deve ter `Content-Type: text/html`. O corpo (ex.: `curl -s https://.../trellis`) deve conter `src="/trellis/assets/` (não `/assets/` nem `/v2/`).
3. **Asset:** uma URL de script presente no HTML (ex.: `.../trellis/assets/main-XXX.js`) deve retornar 200 e `Content-Type: application/javascript`.

Em aba anônima no navegador: abrir a URL do chart, abrir DevTools (aba Rede). Verificar que `index.html` e os `.js`/`.css` dos assets retornam 200 e `Content-Type` correto (text/html e application/javascript ou text/css), **não** `application/json`. Se algo falhar nos passos 2 ou 3, o problema está no proxy/roteamento (path ou Content-Type), não no build ou no server do repo.
| **HTTPS / mixed content** | Página ThoughtSpot em HTTPS e chart em HTTP → bloqueio. | Servir o chart em HTTPS (Kong/TLS na frente do charts-router). |
| **Cache de HTML/JS antigo** | Navegador ou CDN servindo HTML/JS antigo com paths errados. | Headers de cache adequados para o chart (ex.: revalidação para `index.html` e assets). Após deploy, testar em aba anônima ou com cache desabilitado. |

## Observabilidade

O charts-router (Railway e iFood) coleta informações de uso e opcionalmente eventos do cliente:

| Origem | O que é coletado | Onde |
|--------|-------------------|------|
| **Servidor** | Cada requisição a `/trellis` ou `/boxplot`: tipo de gráfico, método, path, tempo de resposta, status HTTP, user-agent, IP. Evento tipo `usage`. | Middleware `analyticsMiddleware` grava no storage ao final da resposta. |
| **Cliente** | Eventos enviados pelo chart (performance, erro, interação, config): `POST /api/analytics/event`. Tipos: `usage`, `performance`, `error`, `interaction`, `config`. | Rotas em `charts-router/src/routes/analytics.ts`. |
| **Consulta** | Leitura dos eventos gravados com paginação e filtros por tipo e chart: `GET /api/analytics/events?offset=0&limit=100&type=usage&chartType=trellis`. | Mesmo router; storage em arquivo (JSONL por dia, retenção 30 dias). |
| **Capacidade (pod/container)** | Uso de memória do processo e do container (Kubernetes/Docker): `GET /api/metrics`. Retorna `process.memory` (heap, rss, etc.), `process.uptimeSeconds` e, quando em cgroup, `container.memory` (usageBytes, limitBytes, usagePercent). | `charts-router/src/utils/capacityMetrics.ts`; rota `GET /api/metrics` na mesma API. |

- **Configuração:** `ANALYTICS_ENABLED` (default ativo; `false` desliga coleta e respostas das APIs de analytics). `ANALYTICS_LOG_PATH` para diretório dos arquivos de log.
- **Histórico:** retenção fixa de **30 dias** no nosso ambiente; arquivos de log mais antigos são removidos automaticamente.
- **Tipos:** definidos em `shared/types/analytics.ts` (UsageEvent, PerformanceEvent, ErrorEvent, InteractionEvent, ConfigEvent).
- **Capacidade do Kubernetes:** a mesma API que expõe os logs (`/api/analytics/events`) também expõe métricas de capacidade do **pod/container** em `GET /api/metrics` (processo + cgroup). Para capacidade do **cluster** (nós, allocatable, etc.) seria necessário integrar com a API do Kubernetes (ServiceAccount + RBAC no cluster); hoje não está implementado.
- No repo GitHub pode existir ainda middleware de observability/error-tracking e rotas `/api/audit`, `/api/metrics`, `/api/data-collection`; no iFood a observabilidade é analytics (servidor + cliente + eventos) + capacidade do pod em `GET /api/metrics`.

## Uma única API para consumir e enviar ao Databricks

Use **GET /api/observability** para obter **logs (eventos) e capacidade em um único JSON**. Ideal para um job que consome essa API e grava no Databricks (ou outro destino).

**URL:** `GET /api/observability`

**Query params:**

| Parâmetro | Descrição |
|-----------|-----------|
| **offset** | Eventos: índice inicial (default 0). |
| **limit** | Eventos: quantidade (default 1000, max 10000). |
| **type** | Eventos: filtrar por tipo (`usage`, `performance`, `error`, `interaction`, `config`). |
| **chartType** | Eventos: filtrar por gráfico (`trellis`, `boxplot`). |

**Exemplo:** `GET /api/observability?limit=2000`

**Resposta (um único payload):**

```json
{
  "exported_at": "2025-02-04T...",
  "events": {
    "data": [ ... ],
    "pagination": { "offset": 0, "limit": 2000, "total": 150, "returned": 150, "hasMore": false },
    "filters": { "type": null, "chartType": null }
  },
  "metrics": {
    "current": { "timestamp": "...", "process": { "memory": {...}, "uptimeSeconds": ... }, "container": {...} },
    "history": [ ... ]
  }
}
```

- **events.data**: eventos de analytics (logs) já paginados/filtrados.
- **metrics.current**: snapshot atual de capacidade (processo + container).
- **metrics.history**: sempre `[]`; o histórico de capacidade fica no destino (ex.: Databricks) após cada ingestão.

Um job (Airflow, cron, Databricks Job, etc.) pode chamar essa API periodicamente e enviar o JSON para o Databricks (por exemplo, escrevendo em Delta ou em uma tabela).

## Recomendações

1. **Garantir base no build:** no Docker/CI, não reutilizar `dist` de outro build; rodar `npm run build` (que chama `vite build`) dentro do contexto do monorepo para trellis e boxplot, para que `base: '/trellis/'` e `base: '/boxplot/'` sejam aplicados.
2. **Testar após deploy:** abrir a URL do chart no iFood em aba anônima, abrir o DevTools (Console + Network) e confirmar que os assets (`.js`/`.css`) retornam 200 e `Content-Type` correto (não JSON).
3. **Whitelist:** confirmar com o time ThoughtSpot que a URL de produção iFood está na whitelist do cluster usado no iFood.
