# Custom Charts SDK - iFood

Charts desenvolvidos com ThoughtSpot Chart SDK para visualização de dados no ThoughtSpot.

## 📊 Charts Disponíveis

### Trellis Chart

- **Localização:** [`trellis-chart/`](./trellis-chart/)
- **URL:** `.../trellis`
- **Tipo:** Chart SDK
- **Descrição:** Chart que permite visualizar múltiplas medidas simultaneamente em formato "crosschart" (trellis)

### Boxplot Chart

- **Localização:** [`boxplot-chart/`](./boxplot-chart/)
- **URL:** `.../boxplot`
- **Tipo:** Chart SDK
- **Descrição:** Boxplot para visualização de distribuições estatísticas com quartis, mediana e outliers

## 🚀 Integração

Estes charts são servidos usando roteamento por path e integrados com o ThoughtSpot.

### Estrutura de Roteamento

O servidor `charts-router/` roteia múltiplos gráficos na mesma URL base:
- `/trellis` → Trellis Chart
- `/boxplot` → Boxplot Chart

### Código Compartilhado

Utilitários e funções comuns estão em `shared/`:
- `shared/utils/` - Formatters, calculations, logger, statistical
- `shared/config/` - Inicialização do Chart SDK
- `shared/types/` - Tipos TypeScript comuns

## 📚 Documentação

**Índice geral:** [**docs/README.md**](./docs/README.md) – deploy, infra iFood, CI/Docker, SDK.

- **Deploy e observabilidade:** [docs/railway-vs-ifood-deploy.md](./docs/railway-vs-ifood-deploy.md) (API única para Databricks, 30 dias de retenção).
- **Chart SDK (desenvolver gráficos):** [docs/sdk/README.md](./docs/sdk/README.md) – guias, aprendizados, referência, exemplos.

## 📊 Sistema de Analytics

O projeto inclui um sistema completo de tracking de utilização dos gráficos que rastreia automaticamente uso, performance, erros e interações.

### Visão Geral

O sistema de analytics rastreia automaticamente:
- **Uso dos gráficos**: frequência, usuários, timestamps
- **Performance**: tempo de renderização, tamanho dos dados
- **Erros**: exceções e contexto
- **Interações**: tooltips, hovers, cliques
- **Configurações**: parâmetros utilizados

### Configuração

#### Variáveis de Ambiente

```bash
# Habilitar/desabilitar analytics (default: true)
ANALYTICS_ENABLED=true

# Caminho do diretório/arquivo de log (default: './logs/analytics.jsonl' - nome do arquivo diário é derivado)
ANALYTICS_LOG_PATH=./logs/analytics.jsonl
```

O armazenamento é em **arquivo** (JSONL por dia). Há retenção fixa de **30 dias**; arquivos mais antigos são removidos automaticamente.

#### Configuração no Cliente (Frontend)

Por padrão, o cliente usa `/api/analytics/event` como endpoint. Para customizar:

```javascript
// No console do navegador ou no código
window.ANALYTICS_ENDPOINT = '.../api/analytics/event';
window.ANALYTICS_ENABLED = true; // ou false para desabilitar
```

### Armazenamento

Os eventos são salvos em **arquivos diários** no formato JSON Lines (um evento por linha). O sistema mantém **exatamente 30 dias** de histórico; arquivos mais antigos são removidos automaticamente.

**Estrutura de arquivos:**
- `./logs/analytics-2024-01-15.jsonl` (15 de Janeiro 2024)
- `./logs/analytics-2024-01-16.jsonl` (16 de Janeiro 2024)
- `./logs/analytics-2024-02-14.jsonl` (14 de Fevereiro 2024)
- Arquivos mais antigos que 30 dias são automaticamente removidos

**Formato do arquivo:**
```json
{"type":"usage","chartType":"trellis","timestamp":"2024-01-15T12:00:00.000Z","sessionId":"...","config":{...}}
{"type":"performance","chartType":"trellis","timestamp":"2024-01-15T12:00:01.000Z","sessionId":"...","renderTime":150.5,...}
```

**Rotação automática:**
- Um novo arquivo é criado a cada dia
- Arquivos com data anterior a (hoje - 30 dias) são removidos automaticamente
- Mantém exatamente 30 dias de histórico no nosso ambiente
- Limpeza acontece quando um novo dia começa (na primeira escrita do dia)

**Análise dos logs:**
```bash
# Ver eventos de um dia específico
cat logs/analytics-2024-01-15.jsonl | jq -r '.type' | sort | uniq -c

# Filtrar eventos de erro dos últimos 30 dias (todos os arquivos)
cat logs/analytics-*.jsonl | jq 'select(.type == "error")'

# Estatísticas de performance dos últimos 30 dias
cat logs/analytics-*.jsonl | jq 'select(.type == "performance") | .renderTime' | awk '{sum+=$1; count++} END {print "Média:", sum/count, "ms"}'

# Listar todos os arquivos de log (últimos 30 dias)
ls -lh logs/analytics-*.jsonl

# Contar quantos dias de logs temos
ls logs/analytics-*.jsonl | wc -l
```

#### Consulta e ingestão externa (ex.: Databricks)

Use **GET /api/observability** para obter em um único JSON os **eventos (logs)** e o **snapshot de capacidade** (métricas do processo/container). Ideal para um job que consome essa API e grava no Databricks ou em outro destino.

- **Eventos:** vêm dos arquivos dos últimos 30 dias (mesma fonte de `GET /api/analytics/events`).
- **Métricas:** snapshot atual (memória, uptime, cgroup quando em Kubernetes/Docker).
- Recomenda-se chamar a API periodicamente (ex.: diariamente) e persistir no destino para não depender apenas dos 30 dias locais.

Ver detalhes em [docs/railway-vs-ifood-deploy.md](docs/railway-vs-ifood-deploy.md) (seção "Uma única API para consumir e enviar ao Databricks").

### Estrutura dos Eventos

#### Evento de Uso
```json
{
  "type": "usage",
  "chartType": "trellis",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "sessionId": "1234567890-abc",
  "userId": "user123",
  "config": {
    "numMeasures": 3,
    "hasSecondaryDimension": true
  }
}
```

#### Evento de Performance
```json
{
  "type": "performance",
  "chartType": "trellis",
  "timestamp": "2024-01-01T12:00:01.000Z",
  "sessionId": "1234567890-abc",
  "renderTime": 150.5,
  "dataSize": 10240,
  "numMeasures": 3,
  "numDimensions": 2,
  "containerWidth": 800,
  "containerHeight": 600
}
```

#### Evento de Erro
```json
{
  "type": "error",
  "chartType": "trellis",
  "timestamp": "2024-01-01T12:00:02.000Z",
  "sessionId": "1234567890-abc",
  "error": "Cannot read property 'x' of undefined",
  "stack": "Error: ...",
  "context": {
    "sessionId": "..."
  }
}
```

#### Evento de Interação
```json
{
  "type": "interaction",
  "chartType": "trellis",
  "timestamp": "2024-01-01T12:00:03.000Z",
  "sessionId": "1234567890-abc",
  "interactionType": "tooltip_open",
  "element": "tooltip",
  "metadata": {
    "position": {"x": 100, "y": 200}
  }
}
```

### API Endpoints

#### POST /api/analytics/event

Recebe eventos de analytics do cliente.

**Request:**
```json
{
  "events": [
    {
      "type": "usage",
      "chartType": "trellis",
      ...
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Saved 1 event(s)"
}
```

#### GET /api/analytics/events

Endpoint para consulta de eventos pelo sistema externo (ex: serviço de banco de dados). Retorna eventos do arquivo de log interno.

**Query Parameters:**
- `offset` (opcional): Número de eventos para pular (default: 0)
- `limit` (opcional): Número máximo de eventos para retornar (default: 1000, max: 10000)
- `type` (opcional): Filtrar por tipo de evento (`usage`, `performance`, `error`, `interaction`, `config`)
- `chartType` (opcional): Filtrar por tipo de gráfico (`trellis`, `boxplot`)

**Exemplo de Request:**
```
GET /api/analytics/events?offset=0&limit=100&type=performance&chartType=trellis
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "type": "performance",
        "chartType": "trellis",
        "timestamp": "2024-01-01T12:00:01.000Z",
        "sessionId": "1234567890-abc",
        "renderTime": 150.5,
        ...
      }
    ],
    "pagination": {
      "offset": 0,
      "limit": 100,
      "total": 5000,
      "returned": 100,
      "hasMore": true
    },
    "filters": {
      "type": "performance",
      "chartType": "trellis"
    }
  }
}
```

**Uso para Sistema Externo:**

Um sistema externo (ex: serviço de migração para banco de dados) pode consultar este endpoint periodicamente:

```bash
# Buscar primeiros 1000 eventos
curl ".../api/analytics/events?limit=1000"

# Buscar próximos 1000 eventos
curl ".../api/analytics/events?offset=1000&limit=1000"

# Buscar apenas eventos de erro
curl ".../api/analytics/events?type=error"

# Buscar eventos de performance do Trellis Chart
curl ".../api/analytics/events?type=performance&chartType=trellis"
```

O sistema externo pode usar a paginação (`offset` e `hasMore`) para processar todos os eventos em lotes.

#### GET /api/observability

Retorna em **um único payload** os eventos (logs) e as métricas de capacidade atuais. Uso típico: job que envia os dados para o Databricks.

**Query Parameters:** `offset`, `limit`, `type`, `chartType` (mesmos de `GET /api/analytics/events`).

**Resposta:** `exported_at`, `events` (data, pagination, filters), `metrics` (current, history sempre `[]`).

#### GET /api/metrics

Snapshot atual de capacidade do processo e do container (memória, uptime, cgroup quando disponível).

### Como Usar

1. **Iniciar o Servidor**
   ```bash
   cd charts-router
   npm install
   npm run build
   npm start
   ```

2. **Os Gráficos Automaticamente**
   - Rastreiam uso quando renderizados
   - Medem performance automaticamente
   - Capturam erros se ocorrerem
   - Enviam eventos para `/api/analytics/event`

3. **Verificar Logs**
   ```bash
   # Eventos são salvos em arquivos diários (últimos 30 dias)
   ls logs/analytics-*.jsonl

   # Ver eventos de um dia
   cat logs/analytics-2024-01-15.jsonl | jq -r '.type' | sort | uniq -c

   # Filtrar erros
   cat logs/analytics-*.jsonl | jq -s 'add | map(select(.type == "error"))'
   ```

### Privacidade

O sistema não rastreia:
- Dados sensíveis dos usuários
- Conteúdo dos dados visualizados
- Informações pessoais identificáveis (exceto IP e user-agent se necessário)

### Performance

- Tracking é assíncrono e não bloqueia renderização
- Eventos são enviados em lote (batch de 10 eventos ou a cada 5 segundos)
- Falhas de tracking não afetam o funcionamento dos gráficos

### Troubleshooting

#### Analytics não está funcionando

1. Verificar se `ANALYTICS_ENABLED` não está como `false`
2. Verificar permissões de escrita no diretório `logs/`
3. Verificar console do navegador para erros de rede
4. Verificar logs do servidor para erros de storage

#### Logs não estão sendo criados

1. Verificar se o diretório `logs/` existe e tem permissões de escrita
2. Verificar `ANALYTICS_LOG_PATH` se foi customizado
3. Verificar logs do servidor para erros

#### Performance degradada

1. Verificar quantidade de arquivos em `logs/` (retenção é 30 dias)
2. Verificar se há muitos eventos sendo gerados
3. Usar `GET /api/observability` com `limit` para ingestão externa em lotes

### Arquitetura

O sistema é composto por:

- **Cliente (Frontend)**: `shared/utils/analytics.ts` e `shared/utils/performanceMonitor.ts`
- **Servidor (Backend)**: `charts-router/src/utils/analyticsStorage.ts`, `charts-router/src/middleware/analytics.ts`, `charts-router/src/routes/analytics.ts`
- **Tipos**: `shared/types/analytics.ts`

## 📄 Licença

Veja [LICENSE](./LICENSE) para mais detalhes.
