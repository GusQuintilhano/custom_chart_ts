# 🔗 Integração com Databricks - Custom Charts Observabilidade

## 📋 Visão Geral

Este documento descreve como integrar o sistema de observabilidade dos Custom Charts com o Databricks para coleta e análise de dados.

## 🚀 APIs Disponíveis

### 1. Coleta de Eventos de Analytics em Lote
```
GET /api/data-collection/analytics/bulk
```

**Parâmetros:**
- `startDate` (obrigatório): Data inicial no formato YYYY-MM-DD
- `endDate` (obrigatório): Data final no formato YYYY-MM-DD  
- `limit` (opcional): Número máximo de registros (padrão: 10000, máx: 50000)
- `offset` (opcional): Offset para paginação (padrão: 0)
- `format` (opcional): Formato de saída - json|jsonl|csv (padrão: jsonl)

**Exemplo:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-domain.com/api/data-collection/analytics/bulk?startDate=2024-01-01&endDate=2024-01-31&format=jsonl"
```

### 2. Coleta de Eventos de Auditoria
```
GET /api/data-collection/audit/bulk
```

**Parâmetros:** Mesmos da API de analytics

### 3. Métricas Agregadas
```
GET /api/data-collection/metrics/aggregated
```

**Parâmetros:**
- `startDate` (obrigatório): Data inicial
- `endDate` (obrigatório): Data final
- `granularity` (opcional): daily|hourly (padrão: daily)

### 4. Schema dos Dados
```
GET /api/data-collection/schema
```

Retorna o schema completo dos dados para configuração no Databricks.

## 🔐 Autenticação

Todas as APIs de coleta de dados requerem autenticação via Bearer token:

```bash
Authorization: Bearer YOUR_DATABRICKS_TOKEN
```

**Configuração no servidor:**
```bash
# Variáveis de ambiente
DATABRICKS_ACCESS_TOKEN=your_secure_token_here
DATA_COLLECTION_TOKEN=alternative_token
```

## 📊 Estrutura dos Dados

### Eventos de Analytics
```json
{
  "type": "usage|performance|error|interaction|config",
  "chartType": "trellis|boxplot", 
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionId": "unique_session_id",
  "userId": "user_id_if_available",
  "userAgent": "browser_info",
  "ip": "client_ip",
  "config": {
    "method": "GET",
    "path": "/trellis",
    "responseTime": 150,
    "statusCode": 200
  },
  "renderTime": 150,
  "dataSize": 1024,
  "numMeasures": 3,
  "numDimensions": 2
}
```

### Eventos de Auditoria
```json
{
  "action": "create|update|delete|view|export|share",
  "resource": "chart-trellis",
  "resourceId": "optional_resource_id",
  "userContext": {
    "userId": "user123",
    "sessionId": "session456", 
    "userAgent": "browser_info",
    "ip": "192.168.1.1",
    "organization": "company_name",
    "department": "analytics",
    "role": "analyst",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "metadata": {
    "requestId": "req_789",
    "method": "GET",
    "path": "/trellis"
  }
}
```

## 🔄 Configuração no Databricks

### 1. Criação de Tabelas

```sql
-- Tabela de eventos de analytics
CREATE TABLE custom_charts_analytics (
  type STRING,
  chartType STRING,
  timestamp TIMESTAMP,
  sessionId STRING,
  userId STRING,
  userAgent STRING,
  ip STRING,
  config MAP<STRING, STRING>,
  renderTime DOUBLE,
  dataSize BIGINT,
  numMeasures INT,
  numDimensions INT,
  interactionType STRING,
  element STRING,
  error STRING,
  stack STRING
) USING DELTA
PARTITIONED BY (DATE(timestamp), chartType);

-- Tabela de eventos de auditoria  
CREATE TABLE custom_charts_audit (
  action STRING,
  resource STRING,
  resourceId STRING,
  userContext STRUCT<
    userId: STRING,
    sessionId: STRING,
    userAgent: STRING,
    ip: STRING,
    organization: STRING,
    department: STRING,
    role: STRING,
    timestamp: TIMESTAMP
  >,
  oldValue MAP<STRING, STRING>,
  newValue MAP<STRING, STRING>,
  metadata MAP<STRING, STRING>
) USING DELTA
PARTITIONED BY (DATE(userContext.timestamp), action);
```

### 2. Job de Ingestão Automática

```python
# Databricks Notebook - Ingestão de Dados Custom Charts

import requests
import json
from datetime import datetime, timedelta
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

# Configurações
API_BASE_URL = "https://your-charts-domain.com/api/data-collection"
DATABRICKS_TOKEN = dbutils.secrets.get("custom-charts", "databricks-token")

def collect_analytics_data(start_date, end_date):
    """Coleta dados de analytics do Custom Charts"""
    
    url = f"{API_BASE_URL}/analytics/bulk"
    headers = {"Authorization": f"Bearer {DATABRICKS_TOKEN}"}
    params = {
        "startDate": start_date,
        "endDate": end_date,
        "format": "jsonl",
        "limit": 50000
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        # Processa JSONL
        lines = response.text.strip().split('\n')
        events = [json.loads(line) for line in lines if line.strip()]
        
        # Converte para DataFrame do Spark
        df = spark.createDataFrame(events)
        
        # Salva na tabela Delta
        df.write \
          .format("delta") \
          .mode("append") \
          .option("mergeSchema", "true") \
          .saveAsTable("custom_charts_analytics")
          
        print(f"Coletados {len(events)} eventos de analytics")
        return len(events)
    else:
        print(f"Erro na coleta: {response.status_code} - {response.text}")
        return 0

def collect_audit_data(start_date, end_date):
    """Coleta dados de auditoria do Custom Charts"""
    
    url = f"{API_BASE_URL}/audit/bulk"
    headers = {"Authorization": f"Bearer {DATABRICKS_TOKEN}"}
    params = {
        "startDate": start_date,
        "endDate": end_date,
        "format": "jsonl",
        "limit": 50000
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        lines = response.text.strip().split('\n')
        events = [json.loads(line) for line in lines if line.strip()]
        
        df = spark.createDataFrame(events)
        
        df.write \
          .format("delta") \
          .mode("append") \
          .option("mergeSchema", "true") \
          .saveAsTable("custom_charts_audit")
          
        print(f"Coletados {len(events)} eventos de auditoria")
        return len(events)
    else:
        print(f"Erro na coleta de auditoria: {response.status_code}")
        return 0

# Execução principal
if __name__ == "__main__":
    # Coleta dados do dia anterior
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    today = datetime.now().strftime("%Y-%m-%d")
    
    print(f"Coletando dados de {yesterday} até {today}")
    
    analytics_count = collect_analytics_data(yesterday, today)
    audit_count = collect_audit_data(yesterday, today)
    
    print(f"Coleta concluída: {analytics_count} analytics, {audit_count} audit")
```

### 3. Agendamento do Job

```python
# Configurar job para executar diariamente às 02:00
# Cron: 0 0 2 * * ?

# Ou usar Databricks Workflows:
{
  "name": "Custom Charts Data Collection",
  "schedule": {
    "quartz_cron_expression": "0 0 2 * * ?",
    "timezone_id": "America/Sao_Paulo"
  },
  "tasks": [
    {
      "task_key": "collect_data",
      "notebook_task": {
        "notebook_path": "/path/to/custom_charts_ingestion"
      }
    }
  ]
}
```

## 📈 Análises Recomendadas

### 1. Uso dos Gráficos
```sql
-- Uso por tipo de gráfico nos últimos 30 dias
SELECT 
  chartType,
  COUNT(*) as total_usage,
  COUNT(DISTINCT sessionId) as unique_sessions,
  COUNT(DISTINCT userId) as unique_users
FROM custom_charts_analytics 
WHERE timestamp >= current_date() - INTERVAL 30 DAYS
  AND type = 'usage'
GROUP BY chartType;
```

### 2. Performance
```sql
-- Performance média por tipo de gráfico
SELECT 
  chartType,
  AVG(renderTime) as avg_render_time,
  PERCENTILE(renderTime, 0.95) as p95_render_time,
  COUNT(*) as total_renders
FROM custom_charts_analytics 
WHERE timestamp >= current_date() - INTERVAL 7 DAYS
  AND type = 'performance'
  AND renderTime IS NOT NULL
GROUP BY chartType;
```

### 3. Erros
```sql
-- Top erros por frequência
SELECT 
  error,
  chartType,
  COUNT(*) as error_count,
  COUNT(DISTINCT sessionId) as affected_sessions
FROM custom_charts_analytics 
WHERE timestamp >= current_date() - INTERVAL 7 DAYS
  AND type = 'error'
GROUP BY error, chartType
ORDER BY error_count DESC
LIMIT 10;
```

### 4. Auditoria de Usuários
```sql
-- Atividade de usuários por departamento
SELECT 
  userContext.department,
  userContext.organization,
  COUNT(*) as total_actions,
  COUNT(DISTINCT userContext.userId) as unique_users,
  COUNT(DISTINCT DATE(userContext.timestamp)) as active_days
FROM custom_charts_audit
WHERE userContext.timestamp >= current_date() - INTERVAL 30 DAYS
GROUP BY userContext.department, userContext.organization
ORDER BY total_actions DESC;
```

## 🔧 Configurações de Ambiente

### Variáveis de Ambiente no Servidor
```bash
# Observabilidade
OBSERVABILITY_ENABLED=true
ANALYTICS_ENABLED=true
AUDIT_ENABLED=true

# Tokens de acesso
DATABRICKS_ACCESS_TOKEN=your_secure_token
DATA_COLLECTION_TOKEN=alternative_token

# Logs
ANALYTICS_LOG_PATH=./logs/analytics.jsonl
REQUEST_LOGGING=true
RESPONSE_LOGGING=false
AUDIT_LOG=true

# Retenção de dados (dias)
ANALYTICS_RETENTION_DAYS=90
AUDIT_RETENTION_DAYS=2555
```

### Configuração no Databricks
```python
# Secrets no Databricks
dbutils.secrets.put("custom-charts", "databricks-token", "your_token_here")
dbutils.secrets.put("custom-charts", "api-base-url", "https://your-domain.com")
```

## 🚨 Monitoramento e Alertas

### 1. Alertas de Coleta
```sql
-- Verificar se a coleta está funcionando
SELECT 
  DATE(timestamp) as collection_date,
  COUNT(*) as events_collected
FROM custom_charts_analytics
WHERE timestamp >= current_date() - INTERVAL 7 DAYS
GROUP BY DATE(timestamp)
ORDER BY collection_date DESC;
```

### 2. Qualidade dos Dados
```sql
-- Verificar qualidade dos dados
SELECT 
  COUNT(*) as total_events,
  COUNT(CASE WHEN userId IS NULL THEN 1 END) as missing_user_id,
  COUNT(CASE WHEN sessionId IS NULL THEN 1 END) as missing_session_id,
  COUNT(CASE WHEN renderTime IS NULL AND type = 'performance' THEN 1 END) as missing_render_time
FROM custom_charts_analytics
WHERE timestamp >= current_date() - INTERVAL 1 DAYS;
```

## 📞 Suporte

Para dúvidas sobre a integração:
1. Verifique os logs do servidor Custom Charts
2. Teste as APIs manualmente com curl
3. Verifique as configurações de token
4. Consulte a documentação do schema: `GET /api/data-collection/schema`

## 🔄 Versionamento

- **v1.0**: APIs básicas de coleta
- **v1.1**: Adição de métricas agregadas
- **v1.2**: Suporte a webhooks (planejado)
- **v1.3**: Streaming de dados em tempo real (planejado)