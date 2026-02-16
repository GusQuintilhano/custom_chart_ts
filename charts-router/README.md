# Charts Router

Servidor de roteamento para múltiplos gráficos customizados do ThoughtSpot (Express/Node).

## Rotas

**Gráficos:**
- `/trellis` → Trellis Chart
- `/boxplot` → Boxplot Chart

**APIs:**
- `/health` → Health check (status, paths, existência dos index)
- `GET /api/analytics/events` → Eventos de analytics (logs), paginação e filtros por tipo/chartType
- `POST /api/analytics/event` → Recebe eventos do cliente
- **`GET /api/observability`** → API única: eventos + métricas de capacidade em um JSON (para ingestão no Databricks)
- `GET /api/metrics` → Snapshot atual de capacidade (processo + container/cgroup)

**Armazenamento:** eventos em arquivo (JSONL por dia), retenção **30 dias**; arquivos mais antigos são removidos automaticamente.

## Build e Deploy

O Railway executa automaticamente:

1. Build do `trellis-chart`
2. Build do `boxplot-chart`
3. Build do `charts-router`
4. Inicia o servidor Express

## Desenvolvimento Local

```bash
# Instalar dependências dos charts
cd ../trellis-chart && npm install
cd ../boxplot-chart && npm install

# Instalar dependências do router
cd ../charts-router && npm install

# Build dos charts
cd ../trellis-chart && npm run build
cd ../boxplot-chart && npm run build

# Build e start do router
cd ../charts-router && npm run build && npm start
```

O servidor estará disponível em `http://localhost:3000`

## URLs de Produção

- Trellis Chart: `https://ts-custom-charts-production.up.railway.app/trellis`
- Boxplot Chart: `https://ts-custom-charts-production.up.railway.app/boxplot`

