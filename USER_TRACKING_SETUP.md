# 👤 Configuração de Rastreamento de Usuários - ThoughtSpot

## 🎯 Objetivo
Este documento explica como configurar o sistema para capturar informações dos usuários do ThoughtSpot que acessam os Custom Charts.

## 🔍 Como Funciona Atualmente

O sistema tenta capturar informações do usuário através de **múltiplas estratégias**:

### 1. **Headers HTTP** (Mais Confiável)
```typescript
// O sistema procura por estes headers:
X-User-ID, X-TS-User-ID, X-ThoughtSpot-User
X-Username, X-User-Name, X-User-Email
X-Organization, X-Org-ID, X-Tenant
X-SAML-User, X-SSO-User
X-Remote-User, X-Forwarded-User
```

### 2. **API do ThoughtSpot** (Automático)
```typescript
// Faz chamadas para:
/api/rest/2.0/auth/session/info  // Info da sessão atual
/api/rest/2.0/users/current      // Info do usuário atual
```

### 3. **Contexto do SDK** (Limitado)
```typescript
// Tenta extrair do CustomChartContext:
ctx.user?.username, ctx.user?.id
ctx.organization, ctx.orgId
// Mas não há garantia que existam
```

### 4. **JWT Tokens** (Se Disponível)
```typescript
// Decodifica JWT do header Authorization:
payload.sub, payload.user_id, payload.username
```

## ⚙️ Configurações Necessárias

### **Opção 1: Configurar Headers no Proxy/Load Balancer**

Se você tem um proxy (nginx, Apache, etc.) na frente do ThoughtSpot:

```nginx
# nginx.conf
location /custom-charts/ {
    proxy_pass http://custom-charts-backend/;
    
    # Adicionar headers do usuário
    proxy_set_header X-User-ID $remote_user;
    proxy_set_header X-Username $http_x_username;
    proxy_set_header X-User-Email $http_x_user_email;
    proxy_set_header X-Organization $http_x_organization;
    
    # Headers SAML/SSO se disponíveis
    proxy_set_header X-SAML-User $http_saml_user;
    proxy_set_header X-SSO-User $http_sso_user;
}
```

### **Opção 2: Configurar ThoughtSpot para Enviar Headers**

No ThoughtSpot, configure custom headers para gráficos embedados:

```javascript
// No código de embed do ThoughtSpot
const embed = new LiveboardEmbed('#embed-container', {
    // ... outras configurações
    customizations: {
        style: {
            customCSS: {
                // CSS customizado se necessário
            }
        }
    },
    // Adicionar headers customizados
    additionalFlags: {
        'custom-chart-headers': true
    }
});
```

### **Opção 3: Configurar Variáveis de Ambiente**

```bash
# .env ou variáveis de ambiente
THOUGHTSPOT_URL=https://your-thoughtspot-instance.com
THOUGHTSPOT_API_TOKEN=your_api_token_here

# Habilitar diferentes métodos de captura
USER_TRACKING_METHODS=headers,api,context,jwt
USER_TRACKING_CACHE_TTL=300  # 5 minutos

# Debug para ver o que está sendo capturado
USER_TRACKING_DEBUG=true
ANALYTICS_DEBUG=true
```

## 🔧 Implementação por Método

### **Método 1: Headers HTTP**

**Mais confiável** - Configure seu proxy/load balancer:

```bash
# Exemplo com HAProxy
http-request set-header X-User-ID %[req.hdr(remote-user)]
http-request set-header X-Organization %[req.hdr(x-org)]
```

**Vantagens:**
- ✅ Funciona sempre
- ✅ Não depende do ThoughtSpot SDK
- ✅ Controle total sobre os dados

### **Método 2: API do ThoughtSpot**

**Automático** - Já implementado, precisa apenas de configuração:

```bash
# Configurar URL do ThoughtSpot
THOUGHTSPOT_URL=https://your-instance.thoughtspot.com

# Token de API (opcional, usa cookies da sessão por padrão)
THOUGHTSPOT_API_TOKEN=your_token
```

**Vantagens:**
- ✅ Automático
- ✅ Usa sessão existente do usuário
- ✅ Informações completas do ThoughtSpot

**Limitações:**
- ⚠️ Depende de conectividade com ThoughtSpot
- ⚠️ Pode ter latência adicional

### **Método 3: Contexto do SDK**

**Limitado** - Já implementado, mas sem garantias:

```typescript
// Já funciona automaticamente, mas pode não ter dados
// Depende de como o ThoughtSpot configura o contexto
```

**Vantagens:**
- ✅ Direto do ThoughtSpot
- ✅ Sem configuração adicional

**Limitações:**
- ❌ Não garantido pelo SDK
- ❌ Pode estar vazio

## 🧪 Como Testar

### 1. **Ativar Debug**
```bash
# Adicionar nas variáveis de ambiente
USER_TRACKING_DEBUG=true
ANALYTICS_DEBUG=true
REQUEST_LOGGING=true
```

### 2. **Verificar Logs**
```bash
# Procurar nos logs do servidor:
[USER_TRACKING] User info captured: { userId: "...", method: "headers" }
[ANALYTICS] Event saved with user: { userId: "...", organization: "..." }
```

### 3. **Testar APIs**
```bash
# Verificar se está capturando
curl -H "X-User-ID: test-user" \
     -H "X-Organization: test-org" \
     "https://your-charts.com/trellis"

# Verificar nos dados coletados
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://your-charts.com/api/data-collection/analytics/bulk?startDate=2024-01-23&endDate=2024-01-23"
```

## 📊 Verificar se Está Funcionando

### **1. Dashboard de Métricas**
```bash
# Verificar usuários únicos
curl "https://your-charts.com/api/metrics/users?days=1"

# Deve retornar:
{
  "uniqueUsers": 5,        # > 0 se estiver capturando
  "topUsers": [
    { "userId": "user123", "sessionCount": 3 }
  ]
}
```

### **2. Dados no Databricks**
```sql
-- Verificar se tem dados de usuário
SELECT 
  userId,
  COUNT(*) as events,
  COUNT(DISTINCT sessionId) as sessions
FROM custom_charts_analytics 
WHERE DATE(timestamp) = CURRENT_DATE()
  AND userId IS NOT NULL
GROUP BY userId;
```

### **3. Logs de Auditoria**
```bash
# Verificar auditoria
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://your-charts.com/api/audit/events?limit=10"

# Deve mostrar userContext preenchido:
{
  "userContext": {
    "userId": "user123",
    "organization": "company",
    "sessionId": "session456"
  }
}
```

## 🚨 Troubleshooting

### **Problema: userId sempre null**

**Soluções:**
1. ✅ Verificar se headers estão sendo enviados
2. ✅ Configurar THOUGHTSPOT_URL
3. ✅ Ativar debug para ver tentativas
4. ✅ Verificar conectividade com ThoughtSpot API

### **Problema: Informações incompletas**

**Soluções:**
1. ✅ Combinar múltiplos métodos
2. ✅ Configurar headers customizados
3. ✅ Verificar configuração SAML/SSO

### **Problema: Performance lenta**

**Soluções:**
1. ✅ Usar cache (já implementado)
2. ✅ Priorizar headers sobre API
3. ✅ Ajustar USER_TRACKING_CACHE_TTL

## 📋 Checklist de Implementação

### **Básico (Mínimo)**
- [ ] Configurar THOUGHTSPOT_URL
- [ ] Ativar USER_TRACKING_DEBUG=true
- [ ] Testar com um usuário
- [ ] Verificar logs

### **Avançado (Recomendado)**
- [ ] Configurar headers no proxy/load balancer
- [ ] Configurar variáveis de ambiente completas
- [ ] Testar todos os métodos de captura
- [ ] Configurar alertas para falhas
- [ ] Documentar para a equipe

### **Produção**
- [ ] Desativar debug (USER_TRACKING_DEBUG=false)
- [ ] Configurar retenção de dados
- [ ] Monitorar performance
- [ ] Configurar backup dos logs

## 🎯 Resultado Esperado

Após a configuração, você terá:

```json
{
  "userId": "joao.silva@empresa.com",
  "userName": "João Silva", 
  "organization": "Empresa LTDA",
  "department": "Analytics",
  "sessionId": "sess_123456",
  "ip": "192.168.1.100",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**Em todos os eventos de:**
- ✅ Analytics (uso dos gráficos)
- ✅ Performance (tempo de renderização)
- ✅ Erros (problemas técnicos)
- ✅ Auditoria (ações realizadas)

Isso permitirá análises como:
- 👥 Quem mais usa os gráficos
- 📊 Departamentos mais ativos
- 🕐 Horários de pico de uso
- 🐛 Usuários afetados por erros
- 📈 Adoção por organização