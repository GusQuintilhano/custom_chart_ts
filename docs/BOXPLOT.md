# Boxplot - Documentação Completa

O **Boxplot** é um gráfico customizado desenvolvido para o ThoughtSpot que permite visualizar distribuições estatísticas com quartis, mediana, outliers e medidas de tendência central.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Requisitos de Dados](#requisitos-de-dados)
3. [Configurações Básicas](#configurações-básicas)
4. [Configurações Avançadas](#configurações-avançadas)
5. [Formatação e Estilo](#formatação-e-estilo)
6. [Casos de Uso](#casos-de-uso)
7. [Exemplos](#exemplos)
8. [Dicas e Boas Práticas](#dicas-e-boas-práticas)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O Boxplot permite:

- **Visualização de distribuições**: Mostra quartis (Q1, Q2, Q3), mediana, mínimos, máximos e outliers
- **Análise estatística**: Compara distribuições entre diferentes grupos ou categorias
- **Detecção de outliers**: Identifica valores atípicos visualmente
- **Customização completa**: Amplo controle sobre aparência, formatação e elementos estatísticos

### Quando usar

- Comparar distribuições de uma métrica entre diferentes grupos (regiões, períodos, categorias)
- Identificar outliers e valores atípicos em seus dados
- Analisar variabilidade e dispersão de dados
- Visualizar diferenças estatísticas entre grupos
- Criar dashboards com análises estatísticas avançadas

### Elementos do Boxplot

Um boxplot típico inclui:

- **Caixa (Box)**: Representa o intervalo interquartil (IQR) entre Q1 e Q3
- **Mediana**: Linha dentro da caixa mostrando o valor mediano
- **Bigodes (Whiskers)**: Linhas que se estendem além da caixa (geralmente 1.5x IQR)
- **Outliers**: Pontos que estão além dos bigodes
- **Média (opcional)**: Indicador adicional mostrando a média aritmética
- **Notch (opcional)**: Intervalo de confiança da mediana

---

## 📊 Requisitos de Dados

### Colunas Obrigatórias

- **1 medida** (MEASURE): Valor numérico a ser analisado
- **1 dimensão primária** (ATTRIBUTE): Categoria ou grupo para o eixo X

### Colunas Opcionais

- **Dimensão secundária** (ATTRIBUTE): Para granularidade adicional (cada valor da dimensão secundária representa um ponto individual)
- **Múltiplas dimensões**: Podem ser usadas para agrupamento hierárquico

### Estrutura de Dados Recomendada

```
Dimensão Primária | Dimensão Secundária (opcional) | Medida
------------------|--------------------------------|----------
Região A          | Loja 1                        | 150.5
Região A          | Loja 2                        | 165.3
Região A          | Loja 3                        | 142.8
Região B          | Loja 4                        | 178.2
Região B          | Loja 5                        | 195.6
...
```

---

## ⚙️ Configurações Básicas

### 1. Visualização Geral

#### Eixo Y (Y-Axis)

- **Exibir Eixo Y** (`showYAxis`): Exibe/oculta o eixo Y
  - **Padrão**: `true`
  - **Recomendação**: Mantenha habilitado para facilitar leitura de valores

#### Orientação

- **Orientação** (`orientation`): Direção do gráfico
  - **Valores**: `Vertical`, `Horizontal`
  - **Padrão**: `Vertical`
  - **Uso**: `Horizontal` útil quando há muitos grupos ou labels longos

#### Escala do Eixo Y

- **Escala do Eixo Y** (`yScale`): Tipo de escala para o eixo Y
  - **Valores**: `Linear`, `Logarítmica`
  - **Padrão**: `Linear`
  - **Uso**: `Logarítmica` útil para dados com grande variação de magnitude

### 2. Configurações de Dados

#### Método de Cálculo dos Quartis

- **Método de Cálculo** (`calculationMethod`): Como os quartis são calculados
  - **Valores**: `Automático`, `Tukey (Recomendado)`, `Inclusivo`, `Exclusivo`
  - **Padrão**: `Automático`
  - **Recomendação**: `Tukey (Recomendado)` para análise estatística padrão

#### Tipo de Bigode (Whisker)

- **Tipo de Bigode** (`whiskerType`): Como os bigodes são calculados
  - **IQR 1.5x (Padrão)**: Bigodes até 1.5x IQR além dos quartis (padrão estatístico)
  - **IQR 3x (Conservador)**: Bigodes até 3x IQR (menos outliers detectados)
  - **Extremos dos Dados**: Bigodes até os valores mínimos/máximos
  - **Percentis 5-95**: Bigodes até os percentis 5 e 95
  - **Mínimo-Máximo**: Bigodes até os valores absolutos mínimos e máximos
  - **Padrão**: `IQR 1.5x (Padrão)`

### 3. Layout e Espaçamento

#### Fit Width

- **Largura 100% (Ajustar ao Container)** (`fitWidth`): Ajusta automaticamente a largura do gráfico
  - **Padrão**: `false`
  - **Recomendação**: Habilitar quando precisar usar todo o espaço disponível

#### Estilo de Layout

- **Estilo de Layout** (`layoutStyle`): Espaçamento pré-definido entre grupos
  - **Valores**: `Compacto`, `Normal`, `Espaçado`, `Personalizado`
  - **Padrão**: `Normal`
  - **Uso**: `Personalizado` permite controle fino via margens individuais

#### Margens

- **Margem Superior** (`marginTop`): Espaço superior (em pixels)
- **Margem Inferior** (`marginBottom`): Espaço inferior (em pixels)
- **Margem Esquerda** (`marginLeft`): Espaço esquerdo (em pixels)
- **Margem Direita** (`marginRight`): Espaço direito (em pixels)
- **Espaçamento entre Grupos** (`groupSpacing`): Espaço entre grupos de boxplots (em pixels)

---

## 🎨 Configurações Avançadas

### 1. Estilo da Caixa

A caixa representa o intervalo interquartil (IQR).

#### Cores e Borda

- **Cor de Preenchimento** (`fill`): Cor do interior da caixa
  - **Padrão**: Baseado na cor padrão da medida
- **Cor da Borda** (`stroke`): Cor da borda da caixa
  - **Padrão**: `#374151` (cinza escuro)
- **Espessura da Borda** (`strokeWidth`): Largura da borda (em pixels)
  - **Padrão**: `1px`
- **Raio da Borda** (`borderRadius`): Arredondamento das bordas (em pixels)
  - **Padrão**: `0px` (bordas retas)

#### Dimensões

- **Largura da Caixa** (`boxWidth`): Largura da caixa (em pixels)
  - **Padrão**: `60px`
  - **Ajuste**: Aumentar para melhor visibilidade, reduzir para gráficos compactos

#### Opacidade

- **Opacidade** (`opacity`): Transparência da caixa (0-1)
  - **Padrão**: `0.8`
  - **Uso**: Reduzir para visualizar elementos sobrepostos

### 2. Mediana e Bigodes

#### Mediana

- **Cor da Mediana** (`medianColor`): Cor da linha da mediana
  - **Padrão**: `#000000` (preto)
- **Espessura da Mediana** (`medianStrokeWidth`): Largura da linha (em pixels)
  - **Padrão**: `2px`
- **Estilo da Mediana** (`medianStrokeDash`): Estilo da linha
  - **Valores**: `none`, `5,5`, `10,5`, `3,3`
  - **Padrão**: `none` (linha sólida)

#### Média

- **Mostrar Média** (`showMean`): Exibe indicador da média aritmética
  - **Padrão**: `false`
  - **Uso**: Útil para comparar média vs mediana

#### Notch Mode (Intervalo de Confiança)

- **Notch Mode** (`showNotch`): Exibe intervalo de confiança (95% CI) da mediana
  - **Padrão**: `false`
  - **Uso**: Útil para comparar medianas entre grupos estatisticamente

#### Bigodes (Whiskers)

- **Cor dos Bigodes** (`whiskerColor`): Cor das linhas dos bigodes
  - **Padrão**: Baseado na cor da caixa
- **Espessura dos Bigodes** (`whiskerStrokeWidth`): Largura das linhas (em pixels)
  - **Padrão**: `1px`
- **Largura do Cap do Bigode** (`whiskerCapWidth`): Largura do "T" na ponta do bigode (em pixels)
  - **Padrão**: `40px`
  - **Uso**: Ajustar para melhor legibilidade

### 3. Outliers (Valores Atípicos)

Outliers são valores que estão além dos bigodes.

#### Exibição

- **Mostrar Outliers** (`show`): Exibe/oculta outliers
  - **Padrão**: `true`
  - **Recomendação**: Mantenha habilitado para análise completa

#### Estilo

- **Formato do Outlier** (`shape`): Forma dos pontos
  - **Valores**: `circle`, `cross`, `diamond`, `square`, `triangle`
  - **Padrão**: `circle`
- **Tamanho do Outlier** (`size`): Tamanho dos pontos (em pixels)
  - **Padrão**: `4px`
- **Cor de Preenchimento** (`fill`): Cor dos outliers
  - **Padrão**: `#ef4444` (vermelho)
- **Cor da Borda** (`stroke`): Cor da borda dos outliers
  - **Padrão**: `#000000` (preto)
- **Espessura da Borda** (`strokeWidth`): Largura da borda (em pixels)
  - **Padrão**: `1px`

### 4. Linhas de Referência

Linhas de referência ajudam a comparar grupos com valores específicos.

#### Exibição

- **Mostrar Linhas de Referência** (`show`): Exibe/oculta linhas de referência
  - **Padrão**: `false`

#### Tipo

- **Tipo de Linha** (`type`): Como o valor da linha é determinado
  - **Nenhuma**: Desabilita linhas de referência
  - **Valor Fixo**: Linha em um valor numérico específico
  - **Média Global**: Linha na média de todos os grupos
  - **Mediana Global**: Linha na mediana de todos os grupos

#### Estilo

- **Valor Fixo** (`value`): Valor numérico quando tipo = Valor Fixo
- **Cor da Linha** (`color`): Cor da linha de referência
  - **Padrão**: `#ef4444` (vermelho)
- **Espessura da Linha** (`strokeWidth`): Largura da linha (em pixels)
  - **Padrão**: `2px`

### 5. Jitter Plot (Dispersão Total)

O Jitter Plot mostra todos os pontos individuais com deslocamento aleatório horizontal.

#### Exibição

- **Mostrar Jitter Plot** (`showJitter`): Exibe todos os pontos de dados
  - **Padrão**: `false`
  - **Uso**: Útil para visualizar distribuição completa dos dados

#### Opacidade

- **Opacidade dos Pontos** (`jitterOpacity`): Transparência dos pontos (0-1)
  - **Padrão**: `0.5`
  - **Uso**: Ajustar baseado na densidade de pontos

### 6. Valores Plotados (Labels de Quartis)

Exibe valores numéricos dos quartis, mediana e extremos diretamente no gráfico.

#### Exibição

- **Mostrar Valores dos Quartis** (`show`): Exibe/oculta labels de valores
  - **Padrão**: `false`
  - **Uso**: Habilitar para precisão numérica

#### Elementos Visíveis

- **Mostrar Mínimo** (`showMin`): Exibe valor mínimo
  - **Padrão**: `false`
- **Mostrar Q1** (`showQ1`): Exibe primeiro quartil
  - **Padrão**: `false`
- **Mostrar Mediana** (`showMedian`): Exibe mediana
  - **Padrão**: `true` (quando labels habilitados)
- **Mostrar Média** (`showMean`): Exibe média aritmética
  - **Padrão**: `false`
- **Mostrar Q3** (`showQ3`): Exibe terceiro quartil
  - **Padrão**: `false`
- **Mostrar Máximo** (`showMax`): Exibe valor máximo
  - **Padrão**: `false`

#### Posicionamento e Formatação

- **Posição dos Valores** (`position`): Onde os labels aparecem
  - **Valores**: `Dentro da Caixa`, `Fora da Caixa`, `Ambos`
  - **Padrão**: `Fora da Caixa`
- **Cor dos Valores** (`color`): Cor do texto
  - **Padrão**: `#374151` (cinza escuro)
- **Tamanho da Fonte dos Valores** (`fontSize`): Tamanho do texto (em pixels)
  - **Padrão**: `10px`
- **Formato Numérico** (`format`): Como os números são formatados
  - **Valores**: `Decimal`, `Inteiro`, `Automático`
  - **Padrão**: `Decimal`
- **Casas Decimais** (`decimals`): Número de casas decimais
  - **Padrão**: `2`

### 7. Ordenação dos Grupos

Controla como os grupos são ordenados no eixo X.

- **Ordenação dos Grupos** (`sortType`): Tipo de ordenação
  - **Alfabética**: Ordem alfabética dos nomes dos grupos
  - **Média (Crescente)**: Ordena por média do menor para o maior
  - **Média (Decrescente)**: Ordena por média do maior para o menor
  - **Mediana (Crescente)**: Ordena por mediana do menor para o maior
  - **Mediana (Decrescente)**: Ordena por mediana do maior para o menor
  - **Variabilidade (Crescente)**: Ordena por IQR do menor para o maior
  - **Variabilidade (Decrescente)**: Ordena por IQR do maior para o menor
  - **Padrão**: `Alfabética`

### 8. Linhas Divisórias

Separa visualmente diferentes grupos no gráfico.

#### Entre Grupos

- **Mostrar Linhas Divisórias** (`show`): Exibe linhas verticais entre grupos
  - **Padrão**: `false`
  - **Uso**: Útil quando há muitos grupos

#### Estilo

- **Cor das Linhas** (`color`): Cor das linhas divisórias
  - **Padrão**: `#e5e7eb` (cinza claro)
- **Espessura** (`strokeWidth`): Largura das linhas (em pixels)
  - **Padrão**: `1px`

### 9. Linhas de Grade

Linhas de referência horizontais facilitam leitura de valores.

#### Exibição

- **Mostrar Linhas de Grade** (`show`): Exibe/oculta linhas de grade
  - **Padrão**: `false`
  - **Uso**: Habilitar para facilitar leitura de valores exatos

#### Estilo

- **Cor das Linhas de Grade** (`color`): Cor das linhas
  - **Padrão**: `#e5e7eb` (cinza claro)
- **Espessura das Linhas** (`strokeWidth`): Largura das linhas (em pixels)
  - **Padrão**: `1px`
- **Estilo das Linhas** (`strokeDash`): Estilo da linha
  - **Valores**: `none`, `5,5`, `10,5`, `3,3`
  - **Padrão**: `none` (linha sólida)

### 10. Tooltip (Dica de Contexto)

Tooltips mostram informações detalhadas ao passar o mouse sobre elementos.

#### Exibição

- **Habilitar Tooltip** (`enabled`): Exibe tooltips ao hover
  - **Padrão**: `true`
  - **Recomendação**: Mantenha habilitado para melhor experiência

#### Formato

- **Formato do Tooltip** (`format`): Nível de detalhe
  - **Valores**: `simple`, `detailed`, `custom`
  - **Padrão**: `simple`
  - **Uso**: `detailed` mostra estatísticas completas (Q1, Mediana, Q3, Média, Min, Max, n)

---

## 🎨 Formatação e Estilo

### Cores e Estilo

#### Eixos

- **Cor do Eixo Y** (`yAxisColor`): Cor do eixo Y e seus labels
  - **Padrão**: `#374151` (cinza escuro)

- **Cor do Eixo X** (`xAxisColor`): Cor do eixo X e seus labels
  - **Padrão**: `#374151` (cinza escuro)

- **Espessura dos Eixos** (`axisStrokeWidth`): Largura das linhas dos eixos (em pixels)
  - **Padrão**: `1.5px`

#### Fundo

- **Cor de Fundo** (`backgroundColor`): Cor de fundo do gráfico
  - **Padrão**: `#ffffff` (branco)
  - **Uso**: `transparent` ou cores claras para melhor contraste

### Tipografia

#### Tamanhos de Fonte

- **Tamanho das Labels** (`labelFontSize`): Tamanho dos labels do eixo X (em pixels)
  - **Padrão**: `12px`
  - **Ajuste**: Reduzir para mais informações, aumentar para melhor legibilidade

- **Tamanho dos Valores** (`valueLabelFontSize`): Tamanho dos valores plotados (em pixels)
  - **Padrão**: `10px`
  - **Recomendação**: Manter pequeno para não sobrepor elementos

---

## 📈 Casos de Uso

### 1. Análise de Vendas por Região

**Dados:**
- Dimensão Primária: Região
- Dimensão Secundária: Loja (opcional, para pontos individuais)
- Medida: Vendas

**Configuração Recomendada:**
- Habilitar outliers para identificar lojas atípicas
- Mostrar mediana nos labels para comparação rápida
- Ordenação por Mediana (Decrescente) para ver melhores regiões primeiro
- Linhas de grade habilitadas para leitura precisa

### 2. Comparação de Métricas entre Períodos

**Dados:**
- Dimensão Primária: Mês
- Medida: Taxa de Conversão

**Configuração Recomendada:**
- Notch Mode habilitado para comparar medianas estatisticamente
- Mostrar Média para ver tendência central
- Linha de referência: Média Global para benchmark
- Jitter Plot para ver distribuição completa (se houver dimensão secundária)

### 3. Análise de Qualidade

**Dados:**
- Dimensão Primária: Fornecedor
- Medida: Score de Qualidade

**Configuração Recomendada:**
- Tipo de Bigode: IQR 3x (Conservador) para menos outliers
- Ordenação por Variabilidade (Crescente) para identificar fornecedores consistentes
- Valores plotados: Mostrar Q1, Mediana, Q3 para análise detalhada
- Outliers destacados em vermelho para atenção imediata

### 4. Análise com Dados de Grande Variação

**Dados:**
- Dimensão Primária: Categoria
- Medida: Receita (com grande variação entre categorias)

**Configuração Recomendada:**
- Escala Logarítmica do Eixo Y para melhor visualização
- Orientação Horizontal se houver muitos grupos
- Fit Width habilitado para melhor uso do espaço

---

## 💡 Exemplos

### Exemplo 1: Boxplot Básico

**Setup:**
```
Dimensão Primária: Região
Medida: Vendas
```

**Configurações:**
- Show Y Axis: `true`
- Whisker Type: `IQR 1.5x (Padrão)`
- Show Outliers: `true`
- Layout Style: `Normal`

### Exemplo 2: Boxplot com Análise Estatística

**Setup:**
```
Dimensão Primária: Produto
Medida: Score
```

**Configurações:**
- Show Mean: `true`
- Notch Mode: `true`
- Show Median (value labels): `true`
- Reference Lines: Média Global
- Sort Type: Mediana (Decrescente)

### Exemplo 3: Boxplot com Jitter Plot

**Setup:**
```
Dimensão Primária: Categoria
Dimensão Secundária: Item (granularidade)
Medida: Preço
```

**Configurações:**
- Show Jitter: `true`
- Jitter Opacity: `0.5`
- Show Outliers: `true`
- Box Opacity: `0.7` (para ver pontos através da caixa)

### Exemplo 4: Boxplot com Valores Plotados

**Setup:**
```
Dimensão Primária: Trimestre
Medida: Performance
```

**Configurações:**
- Value Labels Show: `true`
- Position: `Fora da Caixa`
- Show Min, Q1, Median, Q3, Max: `true`
- Format: `Decimal`
- Decimals: `1`

---

## 🎯 Dicas e Boas Práticas

### Performance

1. **Limite o número de grupos**: Muitos grupos (>20) podem tornar o gráfico difícil de ler
2. **Dimensão secundária**: Use apenas quando necessário para granularidade - muitos pontos podem impactar performance
3. **Jitter Plot**: Use com moderação - muitos pontos podem sobrecarregar visualmente

### Legibilidade

1. **Cores contrastantes**: Use cores bem diferenciadas se houver múltiplas medidas
2. **Labels claros**: Nomes de grupos devem ser descritivos e curtos
3. **Grid lines**: Habilitar facilita leitura de valores exatos
4. **Espaçamento adequado**: Ajuste `groupSpacing` baseado no número de grupos

### Análise Estatística

1. **Método de cálculo**: Use `Tukey` para análise estatística padrão
2. **Whisker Type**: `IQR 1.5x` é padrão estatístico, `IQR 3x` para análise mais conservadora
3. **Notch Mode**: Use para comparar medianas estatisticamente (notches que não se sobrepõem indicam diferença significativa)
4. **Média vs Mediana**: Compare ambos para detectar assimetria nos dados

### Formatação

1. **Valores plotados**: Use com moderação - muitos labels podem poluir visualmente
2. **Posição dos labels**: `Fora da Caixa` é mais legível, `Dentro` economiza espaço
3. **Casas decimais**: Evite muitas casas (1-2 geralmente é suficiente)
4. **Escala logarítmica**: Use quando houver grande variação de magnitude

### Organização

1. **Ordenação**: Use ordenação por estatística (média/mediana) para destacar grupos interessantes
2. **Linhas divisórias**: Use para separar claramente grupos quando há muitos
3. **Linhas de referência**: Use para benchmarks (média global, meta, etc.)
4. **Consistência**: Mantenha configurações consistentes quando comparando múltiplos gráficos

---

## 🔧 Troubleshooting

### Problema: Gráfico não renderiza

**Possíveis causas:**
- Falta de medida ou dimensão primária
- Dados vazios ou inválidos
- Configurações incompatíveis

**Solução:**
- Verifique se há pelo menos 1 medida e 1 dimensão primária
- Confirme que os dados estão corretos (valores numéricos)
- Verifique mensagens de erro no console

### Problema: Caixas não aparecem ou estão vazias

**Possíveis causas:**
- Dados insuficientes (menos de 3 pontos por grupo)
- Cálculo de quartis falhou
- Opacidade muito baixa

**Solução:**
- Verifique se há dados suficientes para cada grupo
- Confirme que a medida contém valores numéricos válidos
- Ajuste opacidade da caixa (padrão: 0.8)

### Problema: Outliers não aparecem

**Possíveis causas:**
- `showOutliers` desabilitado
- Tipo de whisker muito permissivo (ex: Mínimo-Máximo)
- Não há outliers nos dados (todos dentro dos bigodes)

**Solução:**
- Habilite `showOutliers: true`
- Use `IQR 1.5x` para detecção padrão de outliers
- Verifique se os dados realmente contêm valores atípicos

### Problema: Valores plotados sobrepostos

**Possíveis causas:**
- Muitos valores habilitados simultaneamente
- Posição `Dentro da Caixa` com caixas pequenas
- Fonte muito grande

**Solução:**
- Reduza número de valores exibidos (ex: apenas mediana)
- Use posição `Fora da Caixa`
- Reduza `fontSize` dos valores plotados

### Problema: Bigodes muito longos ou muito curtos

**Possíveis causas:**
- Tipo de whisker inadequado
- Dados com muita variabilidade (bigodes longos)
- Dados muito concentrados (bigodes curtos)

**Solução:**
- Ajuste `whiskerType` (ex: `IQR 3x` para bigodes mais longos)
- Verifique se os dados fazem sentido estatisticamente
- Considere escala logarítmica se houver grande variação

### Problema: Notch Mode não aparece

**Possíveis causas:**
- `showNotch` desabilitado
- Dados insuficientes para calcular intervalo de confiança

**Solução:**
- Habilite `showNotch: true`
- Verifique se há dados suficientes em cada grupo (idealmente >10 pontos)

### Problema: Ordenação não funciona

**Possíveis causas:**
- Tipo de ordenação não aplicável
- Erro no cálculo de estatísticas

**Solução:**
- Verifique se os dados permitem o tipo de ordenação escolhido
- Tente ordenação alfabética primeiro para confirmar que funciona
- Verifique mensagens de erro no console

### Problema: Jitter Plot não aparece

**Possíveis causas:**
- `showJitter` desabilitado
- Não há dimensão secundária (sem pontos individuais)
- Opacidade muito baixa

**Solução:**
- Habilite `showJitter: true`
- Adicione dimensão secundária para ter pontos individuais
- Ajuste `jitterOpacity` (padrão: 0.5)

### Problema: Linhas de referência não aparecem

**Possíveis causas:**
- `show` desabilitado
- Tipo `Nenhuma` selecionado
- Valor fixo não especificado quando tipo = Valor Fixo

**Solução:**
- Habilite `show: true`
- Selecione tipo apropriado (Média Global, Mediana Global, ou Valor Fixo)
- Se Valor Fixo, especifique o valor numérico

---

## 📚 Recursos Adicionais

### Estrutura de Arquivos

O código do Boxplot está organizado em:

```
boxplot-chart/
├── src/
│   ├── config/          # Configurações e definições do editor visual
│   ├── rendering/       # Lógica de renderização SVG
│   │   ├── boxplotBox.ts        # Renderização da caixa
│   │   ├── boxplotMedian.ts     # Renderização da mediana
│   │   ├── boxplotWhiskers.ts   # Renderização dos bigodes
│   │   ├── outliers.ts          # Renderização de outliers
│   │   ├── jitterPlot.ts        # Renderização do jitter plot
│   │   ├── referenceLines.ts    # Renderização de linhas de referência
│   │   ├── dividerLines.ts      # Renderização de linhas divisórias
│   │   └── valueLabels.ts       # Renderização de labels de valores
│   ├── types/           # Definições TypeScript
│   └── utils/           # Utilitários (cálculos, formatação, opções)
│       ├── boxplotCalculations.ts    # Cálculos estatísticos
│       ├── boxplotDimensions.ts      # Cálculos de dimensões
│       ├── notchCalculations.ts      # Cálculos de notch (CI)
│       └── tooltipUtils.ts           # Utilitários de tooltip
```

### Integração com ThoughtSpot

O Boxplot é integrado como um chart customizado no ThoughtSpot usando o Chart SDK. Para mais informações sobre customização no ThoughtSpot, consulte a documentação do ThoughtSpot Chart SDK.

### Conceitos Estatísticos

O Boxplot utiliza os seguintes conceitos estatísticos:

- **Quartis (Q1, Q2, Q3)**: Valores que dividem os dados em 4 partes iguais
- **Mediana (Q2)**: Valor que divide os dados ao meio
- **IQR (Interquartile Range)**: Diferença entre Q3 e Q1
- **Outliers**: Valores que estão além de 1.5x ou 3x IQR dos quartis
- **Intervalo de Confiança (Notch)**: Intervalo de confiança de 95% para a mediana
- **Média**: Soma de todos os valores dividida pela quantidade

### Analytics

O Boxplot rastreia automaticamente:
- Uso do gráfico (configurações utilizadas)
- Performance de renderização
- Interações do usuário (hover, clicks, tooltips)
- Erros

Consulte a documentação de Analytics (`docs/ANALYTICS_API.md`) para mais informações.

---

## ❓ Suporte

Para questões, problemas ou sugestões relacionadas ao Boxplot, entre em contato com a equipe de desenvolvimento ou consulte a documentação do ThoughtSpot Chart SDK.

---

**Última atualização**: Janeiro 2024
