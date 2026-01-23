# 🧪 Teste de Observabilidade no Railway

## 🎯 Objetivo
Testar o sistema completo de observabilidade dos Custom Charts no Railway antes do deploy no GitLab.

## 🚀 Deploy no Railway

### 1. **Configurar Variáveis de Ambiente**
```bash
# Observabilidade
OBSERVABILITY_ENABLED=true
ANALYTICS_ENABLED=true
AUDIT_ENABLED=true

# Debug para testes
USER_TRACKING_DEBUG=true
ANALYTICS_DEBUG=true
REQUEST_LOGGING=true
RESPONSE_LOGGING=true
AUDIT_LOG=true

# Databricks (para testes)
DATABRICKS_ACCESS_TOKEN=test-token-123
DATA_COLLECTION_TOKEN=railway-test-token

# ThoughtSpot (se disponível)
THOUGHTSPOT_URL=https://your-thoughtspot-instance.com

# Logs
ANALYTICS_LOG_PATH=./logs/analytics.jsonl
ANALYTICS_RETENTION_DAYS=30
AUDIT_RETENTION_DAYS=90
```

### 2. **Fazer Deploy**
```bash
# Commit e push para Railway
git add .
git commit -m "feat: Add complete observability system for testing"
git push origin railway-main
```

## 🧪 Testes a Realizar

### **1. Teste Básico de Funcionamento**
```bash
# URL do Railway (substitua pela sua)
RAILWAY_URL="https://your-app.railway.app"

# 1. Health check
curl "$RAILWAY_URL/health"

# 2. Testar gráficos
curl "$RAILWAY_URL/trellis"
curl "$RAILWAY_URL/boxplot"
```

### **2. Teste de Captura de Usuários**
```bash
# Simular usuário com headers
curl -H "X-User-ID: test-user-123" \
     -H "X-Username: João Silva" \
     -H "X-Organization: iFood" \
     -H "X-Department: Analytics" \
     "$RAILWAY_URL/trellis"

# Verificar se capturou
curl "$RAILWAY_URL/api/metrics/users?days=1"
```

### **3. Teste de APIs de Observabilidade**
```bash
# Métricas gerais
curl "$RAILWAY_URL/api/metrics/health"
curl "$RAILWAY_URL/api/metrics/usage?days=1"
curl "$RAILWAY_URL/api/metrics/performance?days=1"
curl "$RAILWAY_URL/api/metrics/realtime"

# Dashboard consolidado
curl "$RAILWAY_URL/api/metrics/dashboard?days=1"
```

### **4. Teste de Coleta para Databricks**
```bash
# Schema dos dados
curl "$RAILWAY_URL/api/data-collection/schema"

# Coleta de analytics (com token)
curl -H "Authorization: Bearer test-token-123" \
     "$RAILWAY_URL/api/data-collection/analytics/bulk?startDate=2024-01-23&endDate=2024-01-23&format=json"

# Métricas agregadas
curl -H "Authorization: Bearer test-token-123" \
     "$RAILWAY_URL/api/data-collection/metrics/aggregated?startDate=2024-01-23&endDate=2024-01-23"
```

### **5. Teste de Auditoria**
```bash
# Eventos de auditoria (precisa de token)
curl -H "Authorization: Bearer audit-admin-token" \
     "$RAILWAY_URL/api/audit/events?limit=10"

# Resumo de auditoria
curl -H "Authorization: Bearer audit-admin-token" \
     "$RAILWAY_URL/api/audit/summary?days=7"
```

### **6. Teste de Eventos Customizados**
```bash
# Enviar evento de analytics
curl -X POST "$RAILWAY_URL/api/analytics/event" \
     -H "Content-Type: application/json" \
     -d '{
       "event": {
         "type": "usage",
         "chartType": "trellis",
         "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
         "sessionId": "test-session-123",
         "userId": "test-user-123",
         "config": {
           "testMode": true,
           "source": "railway-test"
         }
       }
     }'

# Verificar se foi salvo
curl "$RAILWAY_URL/api/analytics/events?limit=5"
```

## 📊 Validações Esperadas

### **1. Health Check**
```json
{
  "status": "healthy",
  "services": {
    "analytics": true,
    "audit": true,
    "fileStorage": true
  },
  "charts": {
    "trellis": { "available": true },
    "boxplot": { "available": true }
  }
}
```

### **2. Captura de Usuário**
```json
{
  "uniqueUsers": 1,
  "topUsers": [
    { "userId": "test-user-123", "sessionCount": 1 }
  ]
}
```

### **3. Eventos de Analytics**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "type": "usage",
        "chartType": "trellis",
        "userId": "test-user-123",
        "sessionId": "test-session-123",
        "timestamp": "2024-01-23T10:30:00.000Z"
      }
    ]
  }
}
```

### **4. Schema para Databricks**
```json
{
  "success": true,
  "data": {
    "schema": {
      "analytics_events": {
        "fields": {
          "type": { "type": "string" },
          "chartType": { "type": "string" },
          "userId": { "type": "string", "nullable": true }
        }
      }
    },
    "endpoints": {
      "analytics_bulk": "/api/data-collection/analytics/bulk"
    }
  }
}
```

## 🔍 Monitoramento Durante Testes

### **1. Logs do Railway**
```bash
# Verificar logs em tempo real no Railway dashboard
# Procurar por:
[OBSERVABILITY] User context created
[ANALYTICS] Event saved
[AUDIT] Audit event saved
[DATA_COLLECTION] Bulk export requested
```

### **2. Arquivos de Log**
```bash
# Se tiver acesso ao filesystem (via Railway CLI)
railway logs --tail

# Procurar por arquivos:
./logs/analytics-2024-01-23.jsonl
./logs/audit-2024-01-23.jsonl
```

### **3. Performance**
```bash
# Medir tempo de resposta
time curl "$RAILWAY_URL/trellis"
time curl "$RAILWAY_URL/api/metrics/health"

# Verificar overhead do sistema
curl "$RAILWAY_URL/api/metrics/realtime"
```

## 🐛 Troubleshooting

### **Problema: APIs não respondem**
```bash
# Verificar se as rotas foram registradas
curl "$RAILWAY_URL/api/metrics/health"

# Se 404, verificar logs de inicialização
railway logs --tail
```

### **Problema: Usuário não capturado**
```bash
# Testar com headers explícitos
curl -H "X-User-ID: debug-user" \
     -H "X-Username: Debug User" \
     -v "$RAILWAY_URL/trellis"

# Verificar logs de debug
# Deve aparecer: [USER_TRACKING] User info captured
```

### **Problema: Dados não salvos**
```bash
# Verificar se diretório de logs existe
# Verificar permissões de escrita
# Verificar variáveis de ambiente
```

## 📋 Checklist de Testes

### **Funcionalidade Básica**
- [ ] Health check responde
- [ ] Gráficos carregam (trellis e boxplot)
- [ ] APIs de métricas funcionam
- [ ] Logs são gerados

### **Captura de Usuários**
- [ ] Headers HTTP são capturados
- [ ] Usuários aparecem nas métricas
- [ ] Contexto é salvo nos eventos
- [ ] Debug logs mostram captura

### **APIs de Coleta**
- [ ] Schema é retornado corretamente
- [ ] Bulk export funciona
- [ ] Autenticação por token funciona
- [ ] Formatos JSON/JSONL funcionam

### **Auditoria**
- [ ] Eventos de auditoria são salvos
- [ ] API de auditoria funciona (com auth)
- [ ] Resumos são gerados
- [ ] Logs de acesso funcionam

### **Performance**
- [ ] Overhead mínimo (< 50ms)
- [ ] Métricas em tempo real
- [ ] Cache funciona
- [ ] Cleanup automático

## 🎯 Próximos Passos

### **Se Tudo Funcionar:**
1. ✅ Documentar URLs e tokens de teste
2. ✅ Criar exemplos de integração
3. ✅ Fazer merge no GitLab
4. ✅ Configurar produção

### **Se Houver Problemas:**
1. 🔧 Debuggar no Railway
2. 🔧 Ajustar configurações
3. 🔧 Testar novamente
4. 🔧 Documentar soluções

## 📞 URLs de Teste

Após o deploy, testar estas URLs:

```bash
# Substitua pela sua URL do Railway
RAILWAY_URL="https://custom-charts-railway-production.up.railway.app"

# Gráficos
$RAILWAY_URL/trellis
$RAILWAY_URL/boxplot

# APIs de observabilidade
$RAILWAY_URL/api/metrics/health
$RAILWAY_URL/api/metrics/dashboard
$RAILWAY_URL/api/data-collection/schema

# Health check detalhado
$RAILWAY_URL/health
```

## 🎉 Resultado Esperado

Após os testes, teremos validado:
- ✅ Sistema de observabilidade completo
- ✅ Captura de usuários funcionando
- ✅ APIs para Databricks operacionais
- ✅ Auditoria e compliance
- ✅ Performance adequada

Isso nos dará confiança para fazer o deploy no GitLab! 🚀