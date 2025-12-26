# columnsVizPropDefinition - Guia Completo

## 📊 Resumo Executivo

O `columnsVizPropDefinition` é uma funcionalidade **opcional** do ThoughtSpot Chart SDK que permite definir configurações **específicas por coluna**. Quando usado, essas configurações aparecem na aba **"Configure"** do painel de propriedades do ThoughtSpot, **somente quando o usuário clica em uma coluna específica**.

---

## 🔍 Diferenças Principais

### ✅ Usando apenas `elements` (Solução Simples)

**Localização:** Aba **"Settings"** (Configurações)

**Comportamento:**
- Todas as configurações estão sempre visíveis
- Configurações globais do gráfico
- Acessíveis a qualquer momento

**Estrutura:**
```typescript
{
  elements: [
    {
      type: 'section',
      key: 'chart_options',
      label: 'Opções do Gráfico',
      children: [...]
    }
  ]
}
```

**Vantagens:**
- ✅ Simples de implementar
- ✅ Todas as opções sempre visíveis
- ✅ Não depende de seleção de coluna
- ✅ Funciona bem para configurações globais

**Desvantagens:**
- ❌ Aba "Configure" fica vazia
- ❌ Não há contexto de qual coluna está sendo configurada
- ❌ Pode ser confuso quando há muitas medidas

---

### 🎯 Usando `columnsVizPropDefinition` + `elements` (Solução Avançada)

**Localização:**
- **`elements`**: Aba **"Settings"** (sempre visível)
- **`columnsVizPropDefinition`**: Aba **"Configure"** (somente ao clicar em uma coluna)

**Comportamento:**
- Configurações globais sempre visíveis em "Settings"
- Configurações por coluna aparecem dinamicamente em "Configure" quando o usuário clica em uma coluna
- O ThoughtSpot passa `activeColumnId` para identificar qual coluna está sendo configurada

**Estrutura:**
```typescript
{
  elements: [...], // Configurações globais na aba Settings
  columnsVizPropDefinition: [
    {
      type: ColumnType.MEASURE, // ou ColumnType.ATTRIBUTE
      columnSettingsDefinition: {
        'column-id-1': {
          elements: [
            // Configurações específicas para esta coluna
          ]
        },
        'column-id-2': {
          elements: [
            // Configurações específicas para esta coluna
          ]
        }
      }
    }
  ]
}
```

**Vantagens:**
- ✅ Aba "Configure" funciona corretamente
- ✅ Contexto claro de qual coluna está sendo configurada
- ✅ Interface mais organizada (separação entre global e por coluna)
- ✅ Segue padrão do ThoughtSpot (como gráficos nativos)
- ✅ Melhor UX para gráficos com muitas medidas

**Desvantagens:**
- ⚠️ Implementação mais complexa
- ⚠️ Requer gerenciar múltiplas configurações por coluna
- ⚠️ Configurações por coluna só aparecem ao clicar na coluna

---

## 💡 Impacto Prático no Trellis Chart

### Situação Atual (apenas `elements`)

- ✅ **Aba Settings**: Funciona perfeitamente com todas as configurações organizadas
- ❌ **Aba Configure**: Vazia (sem conteúdo)
- ✅ **Funcionalidade**: Todas as configurações funcionam corretamente
- ✅ **Usabilidade**: Boa para configurações globais

### Se implementássemos `columnsVizPropDefinition`

**O que mudaria:**

1. **Aba Configure passaria a funcionar:**
   - Quando o usuário clicasse em uma coluna (medida), apareceriam as configurações específicas dessa medida
   - Por exemplo: ao clicar em "% Atraso > 10 min", apareceriam apenas as opções dessa medida (cor, formato, casas decimais, tipo de gráfico)

2. **Estrutura de configurações:**
   - **Settings (Global):**
     - Layout e Visualização
     - Dimensões e Tamanhos
     - Tamanhos de Texto
     - Formatação de Dimensões
   
   - **Configure (Por Coluna):**
     - Tipo de Gráfico
     - Cor
     - Formato do Número
     - Casas Decimais

3. **Experiência do usuário:**
   - Mais intuitivo: configurações globais em "Settings", configurações da coluna em "Configure"
   - Mais organizado: menos poluição na aba Settings
   - Mais familiar: segue o padrão dos gráficos nativos do ThoughtSpot

---

## 📋 Migração para `columnsVizPropDefinition`

### O que foi feito

#### 1. Backup Criado
- ✅ Backup completo do código em: `src.backup-20251203-185312/`
- ✅ Backup do arquivo principal: `src/index.ts.backup-20251203-185304`

#### 2. Implementação do `columnsVizPropDefinition`

**Antes (Apenas `elements`):**
```typescript
{
  elements: [
    // Configurações globais
    // Configurações por medida (em sections)
  ]
}
```

**Depois (`elements` + `columnsVizPropDefinition`):**
```typescript
{
  elements: [
    // Apenas configurações globais:
    // - Layout e Visualização
    // - Dimensões e Tamanhos
    // - Tamanhos de Texto
    // - Formatação de Dimensões
  ],
  columnsVizPropDefinition: [
    {
      type: ColumnType.MEASURE,
      columnSettingsDefinition: {
        [measureId]: {
          elements: [
            // Tipo de Gráfico
            // Cor
            // Formato do Número
            // Casas Decimais
          ]
        }
      }
    }
  ]
}
```

---

## 🔄 Compatibilidade

### Leitura de Configurações (RenderChart)

A leitura foi ajustada para ser **100% compatível** com ambos os formatos:

```typescript
// Tenta ler do formato antigo primeiro
const measureConfigOld = visualProps[`measure_${measure.id}`] || {};
// Depois tenta do formato novo
const measureConfigNew = visualProps[measure.id] || {};
// Novo sobrescreve antigo (garantindo migração suave)
const measureConfig = { ...measureConfigOld, ...measureConfigNew };
```

Isso garante que:
- ✅ Configurações antigas continuam funcionando
- ✅ Novas configurações são priorizadas
- ✅ Migração automática e transparente

---

## 📍 Onde Aparecem as Configurações

### Aba "Settings" (Configurações Globais)
- ✅ Layout e Visualização
- ✅ Dimensões e Tamanhos
- ✅ Tamanhos de Texto
- ✅ Formatação de Dimensões

### Aba "Configure" (Configurações por Coluna)
- ✅ Tipo de Gráfico (bar/line)
- ✅ Cor
- ✅ Formato do Número
- ✅ Casas Decimais

**Como usar:** Clique em uma coluna (medida) no gráfico ou no painel de colunas para ver suas configurações na aba "Configure".

---

## 🎯 Benefícios da Migração

1. ✅ **Aba Configure funciona**: Agora as configurações por coluna aparecem corretamente
2. ✅ **Organização melhorada**: Separação clara entre global e por coluna
3. ✅ **Padrão ThoughtSpot**: Segue o padrão dos gráficos nativos
4. ✅ **Compatibilidade total**: Configurações antigas continuam funcionando
5. ✅ **Migração automática**: Não é necessário reconfigurar nada

---

## 🎨 Recomendações

### Para o Trellis Chart (Situação Atual)

**Manter apenas `elements`** é uma escolha válida porque:
- ✅ Todas as configurações já estão funcionando
- ✅ Interface já está bem organizada em seções
- ✅ Configurações por medida já estão agrupadas por seção
- ✅ Não há necessidade imediata de separar por coluna

### Quando considerar `columnsVizPropDefinition`

Use quando:
- 📊 Você tem **muitas medidas** (5+) e a aba Settings fica muito cheia
- 🎯 Quer seguir o **padrão nativo** do ThoughtSpot
- 🔧 Precisa de **configurações muito específicas** por coluna que não fazem sentido globalmente
- 👥 Os usuários estão **familiarizados** com o padrão do ThoughtSpot

---

## 🧪 Hipótese: Uso de `elements` pode estar causando problema com novas medidas

### Hipótese do Usuário

O problema da nova medida não aparecer imediatamente pode estar relacionado ao uso de `elements` no `visualPropEditorDefinition`.

### Análise

**Situação Atual:**
- **`elements`**: Para configurações globais (Layout, Dimensões, Texto, etc.)
- **`columnsVizPropDefinition`**: Para configurações por medida (cor, formato, tipo de gráfico, etc.)

**O Problema:**
Quando uma nova medida é adicionada:
- `visualPropEditorDefinition` é chamado e detecta a nova medida (7 medidas)
- `getDefaultChartConfig` **NÃO** é chamado novamente
- `getQueriesFromChartConfig` recebe um `chartConfig` desatualizado (6 medidas)
- A nova medida não aparece porque não foi incluída na query

**Por que `elements` pode ser o problema?**
1. **`elements` não depende explicitamente das colunas**: As configurações globais em `elements` são estáticas e não mudam quando as colunas mudam
2. **ThoughtSpot pode usar cache**: Se o ThoughtSpot detecta que `elements` não mudou, ele pode pensar que não precisa re-executar `getDefaultChartConfig`
3. **`columnsVizPropDefinition` muda, mas pode não ser suficiente**: Embora `columnsVizPropDefinition` dependa das colunas e mude quando elas mudam, o ThoughtSpot pode não estar usando isso para determinar se precisa re-executar `getDefaultChartConfig`

### Teste Realizado

**Implementação Testada:**
Implementamos a **Opção 3 (Híbrido melhorado)**:
- Mantivemos `elements` para configurações globais
- Adicionamos uma seção `_column_dependency` nos `elements` que depende explicitamente do número de medidas e dimensões
- Isso faz com que o resultado do `visualPropEditorDefinition` mude quando as colunas mudam

**Resultados dos Testes:**

**Teste realizado em:** 04/12/2025

**Evidências dos Logs:**
1. ✅ `visualPropEditorDefinition` detecta corretamente 7 medidas (incluindo "Default Cost Unit")
2. ✅ `columnsVizPropDefinition` contém todas as 7 medidas
3. ✅ `_column_dependency` mostra `_measure_count: 7` (mudou de 6 para 7)
4. ✅ Assinatura das colunas mudou (inclui o novo ID `e6142b50-e554-410e-b1dd-175afa0508fd`)
5. ❌ **`getDefaultChartConfig` NÃO foi chamado** quando a nova medida foi adicionada
6. ❌ `getQueriesFromChartConfig` recebeu um `chartConfig` cacheado com apenas 6 medidas
7. ❌ A query gerada tinha apenas 8 colunas (2 dimensões + 6 medidas antigas)
8. ❌ A nova medida não apareceu porque nunca foi incluída na query

### Conclusão

**A HIPÓTESE FOI REFUTADA.**

Mesmo com:
- `columnsVizPropDefinition` mudando quando as colunas mudam
- `elements` incluindo dependência explícita das colunas (`_column_dependency`)
- Assinatura das colunas mudando

**O ThoughtSpot ainda não re-executa `getDefaultChartConfig` quando uma nova medida é adicionada.**

O problema **NÃO está relacionado ao uso de `elements`**. É uma limitação fundamental do ThoughtSpot que:
- Usa cache do `ChartConfig` 
- Não detecta mudanças nas colunas para re-executar `getDefaultChartConfig`
- Independentemente da estrutura do `visualPropEditorDefinition`

**Solução:**
A única solução conhecida é o **workaround manual**:
- Mudar qualquer configuração do gráfico (ex: toggle "Mostrar Eixo Y") para forçar o ThoughtSpot a re-executar tudo, incluindo `getDefaultChartConfig`

---

## 📝 Exemplo de Implementação

```typescript
const result: VisualPropEditorDefinition = {
  // Configurações globais (aba Settings)
  elements: [
    {
      type: 'section',
      key: 'chart_options',
      label: 'Opções do Gráfico',
      children: [
        // Configurações globais (layout, tamanhos, etc.)
      ]
    }
  ],
  
  // Configurações por coluna (aba Configure)
  columnsVizPropDefinition: [
    {
      type: ColumnType.MEASURE,
      columnSettingsDefinition: Object.fromEntries(
        measureColumns.map(measure => [
          measure.id,
          {
            elements: [
              {
                type: 'dropdown',
                key: 'chartType',
                label: 'Tipo de Gráfico',
                defaultValue: 'bar',
                values: ['bar', 'line'],
              },
              {
                type: 'colorpicker',
                key: 'color',
                label: 'Cor',
                defaultValue: defaultColor,
              },
              // ... outras configurações específicas da medida
            ]
          }
        ])
      )
    }
  ]
};
```

---

## ⚠️ Considerações Importantes

1. **Não é obrigatório**: O `columnsVizPropDefinition` é completamente opcional
2. **Ambos podem coexistir**: Você pode usar `elements` (Settings) e `columnsVizPropDefinition` (Configure) simultaneamente
3. **Contexto dinâmico**: O ThoughtSpot passa `activeColumnId` para identificar qual coluna está sendo configurada
4. **Tipos de coluna**: Você pode definir configurações diferentes para `ColumnType.MEASURE` e `ColumnType.ATTRIBUTE`

---

## 🔍 Estrutura de Dados

### Configurações Globais (elements)
Armazenadas em: `visualProps.chart_options`, `visualProps.text_sizes`, `visualProps.dimension_formatting`

### Configurações por Coluna (columnsVizPropDefinition)
Armazenadas em: `visualProps[measureId]` (não mais em `visualProps[measure_${measureId}]`)

---

## 📝 Arquivos Modificados

- `src/index.ts`:
  - ✅ Adicionado import de `ColumnProp`
  - ✅ Configurações de medidas movidas para `columnsVizPropDefinition`
  - ✅ Leitura ajustada para compatibilidade com ambos formatos
  - ✅ Todas as customizações mantidas

---

## ⚠️ Notas Importantes

1. **Compatibilidade Retroativa**: O código lê ambos os formatos, então gráficos já configurados continuam funcionando
2. **Migração Automática**: Quando o usuário salvar novamente, as configurações serão migradas automaticamente para o novo formato
3. **Sem Perda de Dados**: Todas as configurações existentes são preservadas

---

## 📚 Referências

- TypeScript Types: `node_modules/@thoughtspot/ts-chart-sdk/src/types/visual-prop.types.ts`
- Interface: `VisualPropEditorDefinition` e `ColumnProp`
- Exemplos de Testes: `node_modules/@thoughtspot/ts-chart-sdk/src/main/custom-chart-context.spec.ts`
- [Guia da Aba Configure](./ABA_CONFIGURE.md)

