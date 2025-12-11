# Análise de Problemas - Chart Multi-Measures

## 🔍 Problemas Identificados

### 1. **NaN nos Labels das Linhas (Measure Names)**
**Sintoma:** Os labels das linhas mostram "NaN" em vez dos nomes das medidas.

**Causa Raiz:**
- O `labelFormatter` configurado em `rows.headers.labelFormatter` **não está sendo chamado** pelo Muze
- Quando usamos `.rows(['measure_name'])`, o Muze cria facets (trellis chart) e pode não usar o `labelFormatter` para os headers das linhas
- Os logs do `labelFormatter` não aparecem no console, confirmando que não está sendo executado

**Evidências:**
- Logs extensivos no código mostram que os dados estão corretos antes da renderização
- `measure_name` está presente e válido nos dados pivotados
- O `labelFormatter` tem logs de debug que nunca aparecem

### 2. **Barras Todas com a Mesma Altura**
**Sintoma:** Todas as barras aparecem com a mesma altura, apesar de terem valores diferentes.

**Causa Raiz:**
- Quando usamos `.rows(['measure_name'])`, o Muze cria **facets separados** (uma linha para cada medida)
- Por padrão, o Muze **normaliza a escala Y por facet** para facilitar comparação dentro de cada facet
- Mesmo com `scale: { domain: [0, globalMax * 1.1] }`, o Muze pode estar ignorando ou sobrescrevendo essa configuração por facet
- A configuração `facets: { normalize: false }` pode não estar funcionando como esperado

**Evidências:**
- Os logs mostram valores diferentes: `Min/Max: 0.0257 / 0.1400`
- O domínio global está sendo calculado corretamente
- Mas o gráfico renderiza barras uniformes

### 3. **Tooltip Sem Valor Formatado**
**Sintoma:** O tooltip aparece mas não mostra o valor formatado da medida.

**Causa Raiz:**
- O tooltip foi simplificado para `show: true` sem `formatter` customizado
- O tooltip padrão do Muze pode não estar formatando corretamente os valores quando usamos dados pivotados

## 💡 Soluções Propostas

### Solução 1: Abordagem Alternativa (Sem `.rows()`)

Em vez de usar `.rows(['measure_name'])` que cria facets, podemos criar o gráfico de forma diferente:

**Opção A: Usar `color` para diferenciar medidas em um único gráfico**
```javascript
// Em vez de .rows(['measure_name']), usar apenas .columns() e .color()
muze
  .canvas()
  .data(dmPivoted)
  .columns(dimensionNames)
  .color({
    field: 'measure_name',
    range: colorRange
  })
  .layers([{
    mark: 'bar',
    encoding: {
      y: 'measure_value',
      y0: 0
    }
  }])
```

**Vantagens:**
- Escala Y compartilhada garantida (um único gráfico)
- Labels funcionam normalmente
- Tooltip mais simples

**Desvantagens:**
- Não cria linhas separadas (trellis)
- Todas as medidas ficam no mesmo gráfico

**Opção B: Criar múltiplos gráficos manualmente**
- Criar um gráfico separado para cada medida
- Renderizar cada um em um container diferente
- Controlar escala Y manualmente

### Solução 2: Usar Outra Biblioteca

Se o Muze não suporta adequadamente trellis charts com escala compartilhada, podemos considerar:

#### **Plotly.js**
- ✅ Suporte nativo para subplots (trellis charts)
- ✅ Controle total sobre escalas compartilhadas
- ✅ Tooltips customizáveis
- ✅ Bem documentado
- ❌ Não é a biblioteca padrão do ThoughtSpot (pode precisar de aprovação)

#### **D3.js**
- ✅ Controle total sobre renderização
- ✅ Flexibilidade máxima
- ❌ Mais complexo, requer mais código
- ❌ Não é a biblioteca padrão do ThoughtSpot

#### **Chart.js**
- ✅ Simples e direto
- ✅ Suporta múltiplos datasets
- ❌ Não tem suporte nativo para trellis charts
- ❌ Não é a biblioteca padrão do ThoughtSpot

### Solução 3: Workaround no Muze (Tentativa Final)

Antes de mudar de biblioteca, podemos tentar:

1. **Forçar labels manualmente via DOM**
   - Após renderização, acessar o DOM e substituir "NaN" pelos nomes corretos
   - Usar `setTimeout` para garantir que o gráfico foi renderizado

2. **Usar `calculateVariable` para criar um campo auxiliar**
   - Criar um campo que combine `measure_name` com um identificador único
   - Usar esse campo no `.rows()` em vez de `measure_name` diretamente

3. **Verificar se há uma API do Muze para acessar facets**
   - Pode haver uma forma de configurar facets individualmente
   - Verificar documentação do Muze sobre trellis charts

## 🎯 Recomendação

**Prioridade 1:** Tentar Solução 1 (Opção A) - remover `.rows()` e usar apenas `color` para diferenciar medidas. Isso resolve ambos os problemas (NaN e barras iguais) de forma mais simples.

**Prioridade 2:** Se a Opção A não atender ao requisito de ter linhas separadas, implementar Solução 3 (Workaround via DOM) para corrigir os labels.

**Prioridade 3:** Se ainda não funcionar, considerar Plotly.js como alternativa, mas isso requer aprovação para usar biblioteca externa no ThoughtSpot.

## 📝 Próximos Passos

1. Implementar Solução 1 (Opção A) e testar
2. Se não atender requisitos, implementar Solução 3 (Workaround DOM)
3. Avaliar necessidade de mudar para Plotly.js se as soluções anteriores falharem



