# Analytics - Contexto ThoughtSpot

## 📋 Informações Disponíveis

### ✅ O que sabemos que está disponível

Baseado na documentação oficial do ThoughtSpot:

1. **Audit Logs do ThoughtSpot** (via APIs):
   - `orgId` - ID da organização
   - `userName` - Nome do usuário
   - `userGUID` - GUID do usuário
   - Informações de modelo nos eventos relacionados (CREATE_MODEL, UPDATE_MODEL, etc.)

2. **Session API**:
   - Informações da sessão do usuário logado
   - `orgId` associado à sessão

3. **Headers HTTP** (quando disponíveis via proxy/embed):
   - Headers customizados que o ThoughtSpot pode enviar através de proxies

### ⚠️ O que NÃO está garantido no Chart SDK

**O `CustomChartContext` do ThoughtSpot Chart SDK (`@thoughtspot/ts-chart-sdk`) NÃO garante que as seguintes propriedades estejam disponíveis:**

- ❌ `org` / `organization` / `orgId` / `tenantId`
- ❌ `model` / `modelId` / `worksheetId`
- ❌ `user` / `username` / `userName`
- ❌ `userId` / `user.id`

**Nota:** A função `extractThoughtSpotContext()` tenta acessar essas propriedades, mas elas podem não existir. O resultado será um objeto vazio ou parcial.

## 🔍 Como descobrir o que está disponível

### Debug Mode

Para inspecionar o que realmente está disponível no contexto:

**No Frontend:**
```javascript
// No console do navegador
window.DEBUG_LOGGING = true;
```

**No Servidor:**
```bash
ANALYTICS_DEBUG=true
```

Quando habilitado, a função `extractThoughtSpotContext()` registrará no console:
- Quais chaves estão disponíveis no `ctx`
- Quais chaves estão disponíveis no `chartModel`

### Exemplo de Debug Output

```
[ThoughtSpot Context Debug] Inspecting available properties:
  ctx keys: ['getChartModel', 'emitEvent', ...]
  chartModel keys: ['columns', 'data', 'visualProps', ...]
  ctx known methods: ['getChartModel', 'emitEvent']
```

## 📊 Estratégia Atual de Captura

### 1. Frontend (Chart SDK)

A função `extractThoughtSpotContext()` tenta extrair informações do:
- `CustomChartContext` (ctx)
- `ChartModel`

**Resultado esperado:** Geralmente vazio, a menos que o ThoughtSpot SDK tenha sido atualizado para incluir essas propriedades.

### 2. Backend (HTTP Headers)

O middleware `analyticsMiddleware` captura informações de headers HTTP:
- `x-thoughtspot-org`, `x-org-id`, `x-organization-id`, `x-tenant-id`
- `x-thoughtspot-model`, `x-model-id`, `x-worksheet-id`
- `x-thoughtspot-user`, `x-user-name`, `x-username`
- `x-thoughtspot-user-id`, `x-user-id`

**Resultado esperado:** Depende se o ThoughtSpot ou proxy está enviando esses headers.

### 3. Recomendações Futuras

Para obter informações confiáveis de ORG, MODEL, USER:

1. **Usar Audit Logs do ThoughtSpot**: Acessar via APIs REST do ThoughtSpot
2. **Usar Session API**: Obter informações da sessão do usuário
3. **Configurar Proxy/Embed**: Se usar embed SDK, configurar para passar informações via headers
4. **Custom Metadata**: Adicionar informações customizadas no próprio código do gráfico se necessário

## 🔧 Configuração

### Habilitar Debug

**Frontend:**
```javascript
window.DEBUG_LOGGING = true;
```

**Backend:**
```bash
ANALYTICS_DEBUG=true
```

### Verificar Logs

Os logs de analytics incluem os campos `org`, `model`, `user`, `userId` quando disponíveis. Se não estiverem disponíveis, esses campos serão `undefined` e não aparecerão no JSON.

## 📚 Referências

- [ThoughtSpot Audit Logs Documentation](https://developers.thoughtspot.com/docs/audit-logs)
- [ThoughtSpot Session API](https://developers.thoughtspot.com/docs/session-api)
- [ThoughtSpot Chart SDK GitHub](https://github.com/thoughtspot/ts-chart-sdk)

## ⚠️ Aviso Importante

**Não assuma que essas informações estarão disponíveis automaticamente.** O código foi implementado para tentar capturar o que estiver disponível, mas a documentação oficial do Chart SDK não garante que essas propriedades existam. Use o modo debug para inspecionar o que está realmente disponível no seu ambiente específico.
