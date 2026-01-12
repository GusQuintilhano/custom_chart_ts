# API de Analytics - Documentação

Esta documentação descreve os endpoints disponíveis para acessar os logs de utilização dos gráficos customizados.

## 📍 Base URL

A base URL depende do ambiente onde o servidor está rodando:

```
{BASE_URL}/api/analytics
```

Exemplos:
- Produção: `https://seu-servidor.com/api/analytics`
- Staging: `https://staging-seu-servidor.com/api/analytics`
- Local: `http://localhost:8080/api/analytics`

## 🔐 Autenticação

Atualmente, os endpoints não requerem autenticação. Em produção, considere adicionar autenticação (API key, OAuth, etc.).

## 📊 Endpoints Disponíveis

### 1. POST /api/analytics/event

**Descrição:** Envia eventos de analytics do cliente (frontend) para o servidor.

**Método:** `POST`

**Content-Type:** `application/json`

**Request Body:**

Pode enviar um evento único ou múltiplos eventos em lote:

**Evento único:**
```json
{
  "event": {
    "type": "usage",
    "chartType": "boxplot",
    "timestamp": "2024-01-15T12:00:00.000Z",
    "sessionId": "abc123",
    "config": {
      "numMeasures": 1,
      "numDimensions": 2
    }
  }
}
```

**Múltiplos eventos (lote):**
```json
{
  "events": [
    {
      "type": "usage",
      "chartType": "boxplot",
      "timestamp": "2024-01-15T12:00:00.000Z",
      "sessionId": "abc123",
      "config": {}
    },
    {
      "type": "performance",
      "chartType": "boxplot",
      "timestamp": "2024-01-15T12:00:01.000Z",
      "sessionId": "abc123",
      "renderTime": 150.5
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Saved 1 event(s)"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "No events provided"
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Error description"
}
```

**Nota:** Este endpoint é usado internamente pelos gráficos. Para consultar eventos, use o endpoint `GET /api/analytics/events`.

---

### 2. GET /api/analytics/events

**Descrição:** Retorna eventos de analytics armazenados. Útil para consulta externa (ex: carregamento para Databricks, dashboards, etc.).

**Método:** `GET`

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `offset` | integer | Não | Número de eventos para pular (paginação). Padrão: `0` | `0`, `1000`, `2000` |
| `limit` | integer | Não | Número máximo de eventos para retornar. Padrão: `1000`, Máximo: `10000` | `100`, `1000`, `5000` |
| `type` | string | Não | Filtrar por tipo de evento. Valores válidos: `usage`, `performance`, `error`, `interaction`, `config` | `usage`, `performance` |
| `chartType` | string | Não | Filtrar por tipo de gráfico. Valores válidos: `boxplot`, `trellis` | `boxplot`, `trellis` |

**Exemplos de Request:**

```bash
# Buscar primeiros 1000 eventos
GET /api/analytics/events?limit=1000

# Buscar eventos de uso do boxplot
GET /api/analytics/events?type=usage&chartType=boxplot

# Paginação: eventos 1000-2000
GET /api/analytics/events?offset=1000&limit=1000

# Eventos de performance com paginação
GET /api/analytics/events?type=performance&offset=0&limit=500

# Eventos de erro de todos os gráficos
GET /api/analytics/events?type=error
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "type": "usage",
        "chartType": "boxplot",
        "timestamp": "2024-01-15T12:00:00.000Z",
        "sessionId": "abc123",
        "userId": null,
        "config": {
          "numMeasures": 1,
          "numDimensions": 2
        }
      },
      {
        "type": "performance",
        "chartType": "boxplot",
        "timestamp": "2024-01-15T12:00:01.000Z",
        "sessionId": "abc123",
        "renderTime": 150.5,
        "dataSize": 1000
      }
    ],
    "pagination": {
      "offset": 0,
      "limit": 1000,
      "total": 5423,
      "returned": 1000,
      "hasMore": true
    },
    "filters": {
      "type": null,
      "chartType": null
    }
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid type filter. Valid types: usage, performance, error, interaction, config"
}
```

**Response (503 Service Unavailable):**
```json
{
  "success": false,
  "message": "Analytics disabled"
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 📋 Tipos de Eventos

### 1. Usage (Uso do Gráfico)

Rastreia quando um gráfico é renderizado.

**Campos:**
- `type`: `"usage"`
- `chartType`: `"boxplot"` ou `"trellis"`
- `timestamp`: ISO 8601 timestamp
- `sessionId`: ID único da sessão
- `userId`: ID do usuário (opcional) - **Capturado do contexto do ThoughtSpot quando disponível**
- `config`: Objeto com configurações do gráfico (ex: `numMeasures`, `numDimensions`)

**Exemplo:**
```json
{
  "type": "usage",
  "chartType": "boxplot",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "sessionId": "abc123",
  "config": {
    "numMeasures": 1,
    "numDimensions": 2
  }
}
```

### 2. Performance (Performance de Renderização)

Rastreia métricas de performance do gráfico.

**Campos:**
- `type`: `"performance"`
- `chartType`: `"boxplot"` ou `"trellis"`
- `timestamp`: ISO 8601 timestamp
- `sessionId`: ID único da sessão
- `userId`: ID do usuário (opcional) - **Herdado do evento de usage quando disponível**
- `renderTime`: Tempo de renderização em milissegundos (opcional)
- `dataSize`: Tamanho dos dados processados (opcional)

**Exemplo:**
```json
{
  "type": "performance",
  "chartType": "boxplot",
  "timestamp": "2024-01-15T12:00:01.000Z",
  "sessionId": "abc123",
  "renderTime": 150.5,
  "dataSize": 1000
}
```

### 3. Error (Erros)

Rastreia erros que ocorrem durante a renderização.

**Campos:**
- `type`: `"error"`
- `chartType`: `"boxplot"` ou `"trellis"`
- `timestamp`: ISO 8601 timestamp
- `sessionId`: ID único da sessão
- `error`: Mensagem de erro
- `stack`: Stack trace (opcional)
- `context`: Objeto com contexto adicional (opcional)

**Exemplo:**
```json
{
  "type": "error",
  "chartType": "boxplot",
  "timestamp": "2024-01-15T12:00:02.000Z",
  "sessionId": "abc123",
  "error": "Error message",
  "stack": "Error: ...\n    at ...",
  "context": {}
}
```

### 4. Interaction (Interações do Usuário)

Rastreia interações do usuário com o gráfico (preparado para uso futuro).

**Campos:**
- `type`: `"interaction"`
- `chartType`: `"boxplot"` ou `"trellis"`
- `timestamp`: ISO 8601 timestamp
- `sessionId`: ID único da sessão
- `interactionType`: Tipo de interação (ex: `hover`, `click`, `tooltip`)
- `element`: Elemento interagido
- `metadata`: Metadados adicionais (opcional)

**Exemplo:**
```json
{
  "type": "interaction",
  "chartType": "boxplot",
  "timestamp": "2024-01-15T12:00:03.000Z",
  "sessionId": "abc123",
  "interactionType": "hover",
  "element": "boxplot-group-0",
  "metadata": {}
}
```

### 5. Config (Configurações)

Rastreia configurações utilizadas (preparado para uso futuro).

**Campos:**
- `type`: `"config"`
- `chartType`: `"boxplot"` ou `"trellis"`
- `timestamp`: ISO 8601 timestamp
- `sessionId`: ID único da sessão
- `configKey`: Chave da configuração
- `configValue`: Valor da configuração

**Exemplo:**
```json
{
  "type": "config",
  "chartType": "boxplot",
  "timestamp": "2024-01-15T12:00:04.000Z",
  "sessionId": "abc123",
  "configKey": "yScale",
  "configValue": "log"
}
```

---

## 🔍 Exemplos de Uso

### Exemplo 1: Buscar todos os eventos de uso do boxplot

```bash
curl "https://seu-servidor.com/api/analytics/events?type=usage&chartType=boxplot&limit=1000"
```

### Exemplo 2: Buscar eventos de performance com paginação

```bash
# Primeira página
curl "https://seu-servidor.com/api/analytics/events?type=performance&offset=0&limit=1000"

# Segunda página
curl "https://seu-servidor.com/api/analytics/events?type=performance&offset=1000&limit=1000"
```

### Exemplo 3: Buscar todos os erros

```bash
curl "https://seu-servidor.com/api/analytics/events?type=error"
```

### Exemplo 4: Buscar eventos do trellis chart

```bash
curl "https://seu-servidor.com/api/analytics/events?chartType=trellis&limit=500"
```

### Exemplo 5: Usando Python (requests)

```python
import requests

base_url = "https://seu-servidor.com"
response = requests.get(f"{base_url}/api/analytics/events", params={
    "type": "usage",
    "chartType": "boxplot",
    "limit": 1000,
    "offset": 0
})

data = response.json()
events = data["data"]["events"]
print(f"Total de eventos: {len(events)}")
```

### Exemplo 6: Buscar todos os eventos com paginação automática

```python
import requests

base_url = "https://seu-servidor.com"
all_events = []
offset = 0
limit = 1000

while True:
    response = requests.get(f"{base_url}/api/analytics/events", params={
        "limit": limit,
        "offset": offset
    })
    
    data = response.json()
    events = data["data"]["events"]
    
    if not events:
        break
    
    all_events.extend(events)
    
    # Verificar se há mais eventos
    if not data["data"]["pagination"]["hasMore"]:
        break
    
    offset += limit

print(f"Total de eventos: {len(all_events)}")
```

---

## 📊 Retenção de Dados

- Os eventos são armazenados em arquivos JSONL diários
- O sistema mantém automaticamente apenas os últimos **30 dias** de logs
- Arquivos mais antigos que 30 dias são automaticamente removidos
- Formato dos arquivos: `analytics-YYYY-MM-DD.jsonl`

---

## 👤 Rastreamento de Usuário

O sistema tenta capturar informações do usuário do contexto do ThoughtSpot SDK quando disponível. O `userId` é incluído automaticamente nos eventos de analytics quando o ThoughtSpot SDK expõe essas informações.

**Como funciona:**
- O código tenta acessar propriedades do contexto (`ctx.userId`, `ctx.user.id`, `ctx.user.username`, etc.)
- Se encontrado, o `userId` é incluído nos eventos de analytics
- Se não encontrado (SDK não expõe), o `userId` fica `undefined` (comportamento anterior)

**Eventos que incluem userId:**
- ✅ Usage events (via `trackUsage`)
- ✅ Performance events (via herança de `BaseAnalyticsEvent`)
- ✅ Error events (via herança de `BaseAnalyticsEvent`)
- ✅ Interaction events (via herança de `BaseAnalyticsEvent`)
- ✅ Config events (via herança de `BaseAnalyticsEvent`)

**Nota:** Se o ThoughtSpot SDK não expuser informações de usuário no contexto, o `userId` ficará `undefined`. Isso é normal e não afeta o funcionamento do sistema.

---

## ⚙️ Configuração

O sistema de analytics pode ser habilitado/desabilitado através de variáveis de ambiente:

```bash
# Habilitar/desabilitar analytics (default: true)
ANALYTICS_ENABLED=true

# Tipo de armazenamento (default: file)
ANALYTICS_STORAGE_TYPE=file

# Caminho dos logs (default: ./logs/analytics.jsonl)
ANALYTICS_LOG_PATH=./logs/analytics.jsonl
```

Se `ANALYTICS_ENABLED=false`, os endpoints retornarão:
- `POST /api/analytics/event`: 200 OK com `"message": "Analytics disabled"`
- `GET /api/analytics/events`: 503 Service Unavailable

---

## 🛠️ Troubleshooting

### Endpoint retorna 503 "Analytics disabled"

**Causa:** Analytics está desabilitado no servidor.

**Solução:** Verifique a variável de ambiente `ANALYTICS_ENABLED` no servidor.

### Endpoint retorna array vazio

**Causa:** Não há eventos no período consultado ou filtros muito restritivos.

**Solução:** 
- Verifique os filtros aplicados
- Tente remover filtros para ver todos os eventos
- Verifique se há eventos nos logs do servidor

### Erro 400 "Invalid type filter"

**Causa:** Tipo de evento inválido no parâmetro `type`.

**Solução:** Use apenas valores válidos: `usage`, `performance`, `error`, `interaction`, `config`

### Erro 400 "Invalid chartType filter"

**Causa:** Tipo de gráfico inválido no parâmetro `chartType`.

**Solução:** Use apenas valores válidos: `boxplot`, `trellis`

### Timeout em requisições grandes

**Causa:** Buscar muitos eventos pode demorar.

**Solução:** 
- Use paginação (`limit` menor, múltiplas requisições)
- Use filtros para reduzir o volume de dados
- Considere processar em lotes

---

## 📚 Referências

- Código da API: `charts-router/src/routes/analytics.ts`
- Tipos TypeScript: `shared/types/analytics.ts`
- Storage: `charts-router/src/utils/analyticsStorage.ts`
- README Analytics: Ver `README.md` seção "Sistema de Analytics"
