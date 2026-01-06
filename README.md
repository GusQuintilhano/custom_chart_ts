# Custom Charts SDK - iFood

Charts desenvolvidos com ThoughtSpot Chart SDK para visualização de dados no ThoughtSpot.

## 📊 Charts Disponíveis

### Trellis Chart

- **Localização:** [`trellis-chart/`](./trellis-chart/)
- **URL:** `https://ts-custom-charts-production.up.railway.app/trellis`
- **Tipo:** Chart SDK
- **Descrição:** Chart que permite visualizar múltiplas medidas simultaneamente em formato "crosschart" (trellis)

### Boxplot Chart

- **Localização:** [`boxplot-chart/`](./boxplot-chart/)
- **URL:** `https://ts-custom-charts-production.up.railway.app/boxplot`
- **Tipo:** Chart SDK
- **Descrição:** Boxplot para visualização de distribuições estatísticas com quartis, mediana e outliers

## 🚀 Integração

Estes charts são servidos via **Railway** usando roteamento por path e integrados com o ThoughtSpot.

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

Documentação completa disponível em [`docs/sdk/`](./docs/sdk/):
- **Aprendizados**: [`docs/sdk/aprendizados/`](./docs/sdk/aprendizados/)
- **Guias**: [`docs/sdk/guias/`](./docs/sdk/guias/)
- **Exemplos**: [`docs/sdk/exemplos/`](./docs/sdk/exemplos/)
- **Referência**: [`docs/sdk/referencia/`](./docs/sdk/referencia/)

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

# Tipo de armazenamento: 'file', 'database', 'file+database' (default: 'file')
ANALYTICS_STORAGE_TYPE=file

# Caminho do arquivo de log (default: './logs/analytics.jsonl')
ANALYTICS_LOG_PATH=./logs/analytics.jsonl

# URL do banco de dados (necessário se usar 'database' ou 'file+database')
ANALYTICS_DB_URL=postgresql://user:pass@localhost:5432/analytics
```

#### Configuração no Cliente (Frontend)

Por padrão, o cliente usa `/api/analytics/event` como endpoint. Para customizar:

```javascript
// No console do navegador ou no código
window.ANALYTICS_ENDPOINT = 'https://seu-servidor.com/api/analytics/event';
window.ANALYTICS_ENABLED = true; // ou false para desabilitar
```

### Armazenamento

#### Fase 1: Arquivos de Log Diários (Padrão)

Os eventos são salvos em arquivos diários no formato JSON Lines (um evento por linha). **O sistema mantém apenas os últimos 30 dias de logs internos** - arquivos mais antigos que 30 dias são automaticamente removidos.

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
- Arquivos mais antigos que 30 dias são automaticamente removidos
- Mantém sempre os últimos 30 dias para economizar espaço em disco
- Limpeza acontece automaticamente quando um novo dia começa

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

#### Fase 2: Consulta Externa para Banco de Dados

Os eventos são mantidos nos arquivos de log internos dos últimos 30 dias (ex: `./logs/analytics-2024-01-15.jsonl`, `./logs/analytics-2024-01-16.jsonl`, etc.). Um sistema externo pode consultar os eventos através do endpoint `GET /api/analytics/events` e armazená-los no banco de dados antes que sejam removidos automaticamente.

**Fluxo:**
1. Eventos são salvos automaticamente em arquivos de log diários
2. Sistema externo consulta `GET /api/analytics/events` periodicamente (diariamente recomendado)
3. Sistema externo processa e armazena no banco de dados
4. Arquivos mais antigos que 30 dias são automaticamente removidos
5. **Importante**: Sistema externo deve processar eventos regularmente para não perder dados antes da remoção automática

**Recomendação:**
- Sistema externo deve consultar os eventos diariamente ou no máximo semanalmente
- Processar eventos regularmente garante que nenhum dado seja perdido antes da remoção automática (30 dias)
- Logs internos servem como backup temporário (30 dias)
- O endpoint retorna eventos de todos os arquivos dos últimos 30 dias

**Vantagens:**
- Separação de responsabilidades (armazenamento interno vs. banco de dados)
- Logs internos servem como backup
- Sistema externo pode processar em seu próprio ritmo
- Não impacta performance do servidor de gráficos

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
curl "http://localhost:3000/api/analytics/events?limit=1000"

# Buscar próximos 1000 eventos
curl "http://localhost:3000/api/analytics/events?offset=1000&limit=1000"

# Buscar apenas eventos de erro
curl "http://localhost:3000/api/analytics/events?type=error"

# Buscar eventos de performance do Trellis Chart
curl "http://localhost:3000/api/analytics/events?type=performance&chartType=trellis"
```

O sistema externo pode usar a paginação (`offset` e `hasMore`) para processar todos os eventos em lotes.

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
   # Ver eventos salvos
   cat logs/analytics.jsonl
   
   # Contar eventos por tipo
   cat logs/analytics.jsonl | jq -r '.type' | sort | uniq -c
   
   # Filtrar erros
   cat logs/analytics.jsonl | jq 'select(.type == "error")'
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

1. Verificar tamanho do arquivo de log (pode precisar de rotação)
2. Considerar migrar para banco de dados
3. Verificar se há muitos eventos sendo gerados

### Arquitetura

O sistema é composto por:

- **Cliente (Frontend)**: `shared/utils/analytics.ts` e `shared/utils/performanceMonitor.ts`
- **Servidor (Backend)**: `charts-router/src/utils/analyticsStorage.ts`, `charts-router/src/middleware/analytics.ts`, `charts-router/src/routes/analytics.ts`
- **Tipos**: `shared/types/analytics.ts`

### Próximos Passos (Opcional)

- Script de migração para banco de dados (`charts-router/scripts/migrateLogsToDB.ts`)
- Implementação de DatabaseStorage em `analyticsStorage.ts`
- Integração com Datadog ou Google Analytics
- Dashboard de métricas

## 📄 Licença

Veja [LICENSE](./LICENSE) para mais detalhes.
