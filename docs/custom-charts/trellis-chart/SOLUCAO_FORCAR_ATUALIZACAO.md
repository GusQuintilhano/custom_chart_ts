# Solução: Forçar Atualização Quando Nova Medida é Adicionada

## 🎯 Problema

Quando uma nova medida é adicionada ao gráfico:
- `visualPropEditorDefinition` detecta a nova medida (ex: 7 medidas)
- `getDefaultChartConfig` **NÃO é chamado** novamente
- `getQueriesFromChartConfig` recebe um `chartConfig` cacheado com medidas antigas (ex: 6 medidas)
- A nova medida não aparece porque nunca foi incluída na query

## 💡 Solução Implementada

### Estratégia

Usamos o evento `UpdateVisualProps` do ThoughtSpot Chart SDK para tentar **forçar o ThoughtSpot a re-executar `getDefaultChartConfig`** quando detectamos que há medidas faltando.

### Como Funciona

1. **Detecção de Medidas Faltando**: No `renderChart`, verificamos se todas as medidas do `chartModel` estão presentes nos dados.

2. **Tentativa Imediata de Forçar Atualização**:
   - Quando detectamos medidas faltando, emitimos imediatamente `UpdateVisualProps`
   - Incrementamos um contador `_refresh_trigger` em `_column_dependency`
   - Isso pode fazer o ThoughtSpot detectar uma mudança e re-executar o fluxo completo

3. **Retries com Tentativas Periódicas**:
   - Se as medidas ainda não aparecerem, tentamos novamente a cada 5 tentativas
   - Continuamos tentando por até 30 segundos (30 tentativas a cada 1 segundo)
   - Cada tentativa verifica se os dados foram atualizados

4. **Logs Detalhados**: Registramos todas as tentativas para diagnóstico

### Código Implementado

```typescript
// Quando detectamos medidas faltando:
const tryForceRefresh = async () => {
    try {
        // Sempre obter o chartModel mais recente
        const currentChartModel = ctx.getChartModel();
        const currentVisualProps = currentChartModel.visualProps || {};
        const columnDependency = (currentVisualProps as any)?._column_dependency || {};
        
        // Incrementar contador para forçar detecção de mudança
        const newRefreshTrigger = ((columnDependency as any)?._refresh_trigger || 0) + 1;
        
        await ctx.emitEvent(ChartToTSEvent.UpdateVisualProps, {
            visualProps: {
                ...currentVisualProps,
                _column_dependency: {
                    ...columnDependency,
                    _refresh_trigger: newRefreshTrigger,
                    _missing_measures_count: missingMeasures.length,
                },
            } as any,
        });
    } catch (error) {
        console.warn('Erro ao tentar forçar atualização:', error);
    }
};

// Tentar imediatamente
await tryForceRefresh();

// E durante os retries, a cada 5 tentativas:
if (retryCount % 5 === 0) {
    await tryForceRefresh();
}
```

## ⚠️ Limitações

Esta solução **pode não funcionar** se:
- O ThoughtSpot não reagir ao evento `UpdateVisualProps` para re-executar `getDefaultChartConfig`
- O cache do `ChartConfig` for muito agressivo e não for invalidado pelo evento

## 📊 Resultado Esperado

**Cenário Ideal:**
1. Nova medida é adicionada
2. `renderChart` detecta medida faltando
3. Emite `UpdateVisualProps` imediatamente
4. ThoughtSpot detecta mudança e re-executa `getDefaultChartConfig`
5. Nova medida é incluída na query
6. Dados são atualizados
7. Gráfico re-renderiza com a nova medida

**Cenário Alternativo (se não funcionar):**
1. Nova medida é adicionada
2. `renderChart` detecta medida faltando
3. Emite `UpdateVisualProps` múltiplas vezes
4. ThoughtSpot ainda não re-executa `getDefaultChartConfig`
5. Retry continua tentando por 30 segundos
6. Se não funcionar, usuário precisa mudar uma configuração manualmente (workaround)

## 🧪 Como Testar

1. Adicione uma nova medida ao gráfico
2. Observe os logs no console:
   - `UpdateVisualProps` sendo emitido
   - Se `getDefaultChartConfig` é chamado novamente
   - Se a nova medida aparece nos dados
3. Compare com o comportamento anterior (sem esta solução)

## 📝 Status

- ✅ Implementação completa
- ⏳ Aguardando testes para validar eficácia
- 📊 Logs detalhados para diagnóstico

