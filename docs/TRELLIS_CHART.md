 quando # Trellis Chart - Documentação Completa

O **Trellis Chart** é um gráfico customizado desenvolvido para o ThoughtSpot que permite visualizar múltiplas medidas simultaneamente em formato "crosschart" (trellis), onde cada medida é exibida em sua própria seção com eixos compartilhados.

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

O Trellis Chart permite:

- **Múltiplas medidas**: Visualizar várias medidas no mesmo gráfico, cada uma em sua própria seção
- **Dimensões primárias e secundárias**: Suporte para uma dimensão primária e múltiplas dimensões secundárias
- **Visualização comparativa**: Comparar facilmente múltiplas medidas lado a lado
- **Customização completa**: Amplo controle sobre aparência, formatação e comportamento

### Quando usar

- Comparar múltiplas métricas (receita, custos, margem, etc.) para as mesmas dimensões
- Analisar tendências de diferentes medidas ao longo do tempo
- Visualizar KPIs múltiplos de forma organizada
- Criar dashboards com comparações visuais claras

---

## 📊 Requisitos de Dados

### Colunas Obrigatórias

- **Pelo menos 1 medida** (MEASURE): Valor numérico a ser visualizado
- **1 dimensão primária** (ATTRIBUTE): Dimensão principal para o eixo X

### Colunas Opcionais

- **Dimensões secundárias** (ATTRIBUTE): Para agrupamento adicional ou trellis múltiplo
- **Múltiplas medidas**: Podem ser adicionadas para comparação

### Estrutura de Dados Recomendada

```
Dimensão Primária | Dimensão Secundária (opcional) | Medida 1 | Medida 2 | Medida 3
------------------|--------------------------------|----------|----------|----------
2024-01          | Região A                       | 1000     | 500      | 750
2024-01          | Região B                       | 1200     | 600      | 900
2024-02          | Região A                       | 1100     | 550      | 825
...
```

---

## ⚙️ Configurações Básicas

### 1. Visualização Geral

#### Eixo Y (Y-Axis)

- **Mostrar Eixo Y** (`showYAxis`): Exibe/oculta o eixo Y
  - **Padrão**: `true`
  - **Recomendação**: Mantenha habilitado para facilitar leitura de valores

#### Linhas de Grade (Grid Lines)

- **Mostrar Linhas de Grade** (`showGridLines`): Exibe linhas horizontais de referência
  - **Padrão**: `true`
  - **Uso**: Facilita leitura de valores exatos no gráfico

#### Labels Forçados (Force Labels)

- **Forçar Exibição de Labels** (`forceLabels`): Força exibição de todos os labels mesmo que sobreponham
  - **Padrão**: `false`
  - **Uso**: Útil quando há poucos pontos de dados

### 2. Dimensões

#### Fit Width / Fit Height

- **Ajustar Largura** (`fitWidth`): Ajusta automaticamente a largura das barras para ocupar todo o espaço disponível
  - **Padrão**: `true`
  - **Recomendação**: Use `true` para melhor uso do espaço

- **Ajustar Altura** (`fitHeight`): Ajusta automaticamente a altura do gráfico
  - **Padrão**: `false`
  - **Uso**: Habilitar quando precisar de mais espaço vertical

#### Espaçamento e Tamanho

- **Espaço para Label da Medida** (`measureLabelSpace`): Espaço reservado para o nome da medida (em pixels)
  - **Padrão**: Automático baseado em `showYAxis`
  - **Ajuste**: Aumentar se labels de medidas são cortados

- **Altura da Linha da Medida** (`measureRowHeight`): Altura de cada seção de medida (em pixels)
  - **Padrão**: 200px
  - **Uso**: Ajustar para acomodar mais ou menos dados

- **Largura da Barra** (`barWidth`): Largura fixa das barras quando `fitWidth = false` (em pixels)
  - **Padrão**: 40px
  - **Uso**: Útil para controle preciso de largura

- **Espaçamento entre Barras** (`barSpacing`): Espaço entre barras quando `fitWidth = false` (em pixels)
  - **Padrão**: Automático
  - **Uso**: Ajustar para melhor legibilidade

### 3. Rotação de Labels

- **Rotação do Nome da Medida** (`measureNameRotation`): Ângulo de rotação dos nomes das medidas
  - **Valores**: `0`, `45`, `90`, `-45`, `-90`
  - **Padrão**: `0` (horizontal)
  - **Uso**: `90` ou `-90` para labels verticais quando há pouco espaço horizontal

---

## 🎨 Configurações Avançadas

### 1. Linhas Divisórias

As linhas divisórias ajudam a separar visualmente diferentes seções do gráfico.

#### Entre Medidas (`dividerLinesBetweenMeasures`)

- **Mostrar Linhas entre Medidas**: Linha horizontal separando cada seção de medida
  - **Padrão**: `true`
  - **Recomendação**: Mantenha habilitado para melhor organização visual

- **Cor**: Customizável (padrão: `#e5e7eb`)
- **Espessura**: Customizável (padrão: `1px`)

#### Entre Grupos (`dividerLinesBetweenGroups`)

- **Mostrar Linhas entre Grupos**: Linhas verticais separando grupos de dados
  - **Padrão**: `false`
  - **Uso**: Útil quando há múltiplas dimensões secundárias

- **Cor**: Customizável
- **Espessura**: Customizável

#### Entre Barras (`dividerLinesBetweenBars`)

- **Mostrar Linhas entre Barras**: Linhas verticais entre cada barra
  - **Padrão**: `false`
  - **Uso**: Geralmente não recomendado (pode ficar poluído)

- **Cor**: Customizável
- **Espessura**: Customizável

### 2. Configurações por Medida

Cada medida pode ter configurações individuais de cor, formatação e estilo.

#### Cores

- **Cor da Barra**: Cor de preenchimento das barras
- **Cor da Borda**: Cor da borda das barras
- **Espessura da Borda**: Largura da borda (em pixels)

#### Formatação de Valores

- **Formato de Valor**: Como os valores são exibidos
  - `decimal`: Número decimal (ex: 1234.56)
  - `integer`: Número inteiro (ex: 1234)
  - `currency`: Moeda (ex: R$ 1.234,56)
  - `percentage`: Percentual (ex: 45.67%)
  - `thousands`: Separador de milhares (ex: 1.234,56)

- **Casas Decimais**: Número de casas decimais a exibir
- **Mostrar Separador de Milhares**: Habilita separador (1.000 vs 1000)

#### Formatação de Porcentagem do Total

- **Mostrar Porcentagem do Total**: Exibe porcentagem que cada barra representa do total
  - **Padrão**: `false`
  - **Uso**: Útil para análise de composição

- **Formato de Porcentagem**: Como a porcentagem é exibida
- **Posição do Label**: Onde o label de porcentagem aparece (acima, dentro, abaixo da barra)

### 3. Formatação de Datas

Quando a dimensão primária é uma data:

- **Formato da Dimensão Primária**: Formato de exibição da data
  - Exemplos: `YYYY-MM-DD`, `DD/MM/YYYY`, `MMM YYYY`, etc.
  
- **Formato da Dimensão Secundária**: Formato de exibição da data secundária (se aplicável)

---

## 🎨 Formatação e Estilo

### Cores e Estilo

#### Eixos

- **Cor do Eixo Y**: Cor do eixo Y e seus labels
  - **Padrão**: `#374151` (cinza escuro)

- **Cor do Eixo X**: Cor do eixo X e seus labels
  - **Padrão**: `#374151` (cinza escuro)

- **Espessura do Eixo**: Largura das linhas dos eixos (em pixels)
  - **Padrão**: `1.5px`

#### Fundo

- **Cor de Fundo**: Cor de fundo do gráfico
  - **Padrão**: `transparent`
  - **Uso**: `white` ou cores claras para melhor contraste

### Tipografia

#### Tamanhos de Fonte

- **Tamanho da Fonte do Label** (`labelFontSize`): Tamanho dos labels do eixo X (em pixels)
  - **Padrão**: `12px`
  - **Ajuste**: Reduzir para mais informações, aumentar para melhor legibilidade

- **Tamanho da Fonte do Título da Medida** (`measureTitleFontSize`): Tamanho do nome da medida (em pixels)
  - **Padrão**: `14px`
  - **Uso**: Ajustar baseado no número de medidas

- **Tamanho da Fonte do Label de Valor** (`valueLabelFontSize`): Tamanho dos valores exibidos nas barras (em pixels)
  - **Padrão**: `10px`
  - **Recomendação**: Manter pequeno para não sobrepor barras

---

## 📈 Casos de Uso

### 1. Análise de Vendas por Região

**Dados:**
- Dimensão Primária: Mês
- Dimensão Secundária: Região
- Medidas: Receita, Custo, Margem

**Configuração Recomendada:**
- Habilitar linhas divisórias entre medidas
- Usar cores diferentes para cada medida
- Formato de valores: Currency
- Mostrar eixo Y em todas as medidas

### 2. Comparação de KPIs

**Dados:**
- Dimensão Primária: Trimestre
- Medidas: Taxa de Conversão, Taxa de Rejeição, Tempo Médio de Sessão

**Configuração Recomendada:**
- Formato de valores apropriado para cada medida (percentage, decimal)
- Altura da linha de medida ajustada para melhor visualização
- Linhas de grade habilitadas

### 3. Análise Temporal com Múltiplas Métricas

**Dados:**
- Dimensão Primária: Data
- Medidas: Pedidos, Clientes Ativos, Receita

**Configuração Recomendada:**
- Fit Width habilitado
- Formato de data apropriado
- Espaçamento otimizado para muitos pontos de dados

---

## 💡 Exemplos

### Exemplo 1: Gráfico Básico

**Setup:**
```
Dimensão Primária: Mês
Medidas: Vendas, Marketing
```

**Configurações:**
- Show Y Axis: `true`
- Show Grid Lines: `true`
- Fit Width: `true`
- Divider Lines Between Measures: `true`

### Exemplo 2: Gráfico com Múltiplas Dimensões

**Setup:**
```
Dimensão Primária: Data
Dimensão Secundária: Região
Medidas: Receita, Custo, Margem
```

**Configurações:**
- Show Y Axis: `true`
- Show Grid Lines: `true`
- Divider Lines Between Measures: `true`
- Divider Lines Between Groups: `true`
- Cores diferentes para cada medida

### Exemplo 3: Gráfico com Porcentagens

**Setup:**
```
Dimensão Primária: Produto
Medidas: Vendas
```

**Configurações:**
- Show Percentage of Total: `true`
- Format: `percentage`
- Position: `inside` ou `above`

---

## 🎯 Dicas e Boas Práticas

### Performance

1. **Limite o número de medidas**: Muitas medidas (>5) podem tornar o gráfico difícil de ler
2. **Controle a quantidade de dados**: Para muitas linhas de dados, considere filtrar ou agregar
3. **Use fitWidth**: Geralmente proporciona melhor uso do espaço

### Legibilidade

1. **Cores contrastantes**: Use cores bem diferenciadas para cada medida
2. **Labels claros**: Nomes de medidas devem ser descritivos e curtos
3. **Grid lines**: Habilitar facilita leitura de valores exatos
4. **Espaçamento adequado**: Ajuste `measureRowHeight` baseado no número de pontos

### Formatação

1. **Formato apropriado**: Use currency para valores monetários, percentage para percentuais
2. **Casas decimais**: Evite muitas casas decimais (2-3 geralmente é suficiente)
3. **Formato de data**: Escolha formato apropriado ao contexto (curto vs longo)

### Organização

1. **Ordem das medidas**: Organize medidas em ordem lógica (ex: Receita → Custo → Margem)
2. **Linhas divisórias**: Use para separar claramente diferentes seções
3. **Consistência**: Mantenha configurações consistentes entre medidas quando apropriado

---

## 🔧 Troubleshooting

### Problema: Gráfico não renderiza

**Possíveis causas:**
- Falta de medida ou dimensão primária
- Dados vazios ou inválidos
- Configurações incompatíveis

**Solução:**
- Verifique se há pelo menos 1 medida e 1 dimensão primária
- Confirme que os dados estão corretos
- Verifique mensagens de erro no console

### Problema: Labels sobrepostos

**Possíveis causas:**
- Muitos pontos de dados
- Labels muito longos
- Espaço insuficiente

**Solução:**
- Habilite `forceLabels: false` (padrão)
- Rotacione labels (`measureNameRotation: 90`)
- Reduza `labelFontSize`
- Considere filtrar ou agregar dados

### Problema: Barras muito largas ou muito estreitas

**Possíveis causas:**
- `fitWidth` desabilitado com `barWidth` inadequado
- Espaço disponível inadequado

**Solução:**
- Habilite `fitWidth: true` (recomendado)
- Ajuste `barWidth` se `fitWidth = false`
- Ajuste `barSpacing` para melhor distribuição

### Problema: Valores não formatados corretamente

**Possíveis causas:**
- Formato de valor incorreto
- Configuração de casas decimais inadequada

**Solução:**
- Verifique o formato de valor selecionado
- Ajuste número de casas decimais
- Confirme configuração de separador de milhares

### Problema: Cores não aparecem como esperado

**Possíveis causas:**
- Configuração de cor inválida
- Conflito com tema do ThoughtSpot

**Solução:**
- Use códigos de cor hex válidos (ex: `#3b82f6`)
- Verifique se a cor tem contraste suficiente
- Teste cores diferentes

### Problema: Gráfico muito alto ou muito baixo

**Possíveis causas:**
- `measureRowHeight` inadequado
- Número de medidas muito grande

**Solução:**
- Ajuste `measureRowHeight` (padrão: 200px)
- Reduza número de medidas se necessário
- Habilite `fitHeight` se apropriado

---

## 📚 Recursos Adicionais

### Estrutura de Arquivos

O código do Trellis Chart está organizado em:

```
trellis-chart/
├── src/
│   ├── config/          # Configurações e definições do editor visual
│   ├── handlers/        # Handlers de eventos (resize, etc.)
│   ├── rendering/       # Lógica de renderização SVG
│   ├── types/           # Definições TypeScript
│   └── utils/           # Utilitários (cálculos, formatação, opções)
```

### Integração com ThoughtSpot

O Trellis Chart é integrado como um chart customizado no ThoughtSpot usando o Chart SDK. Para mais informações sobre customização no ThoughtSpot, consulte a documentação do ThoughtSpot Chart SDK.

### Analytics

O Trellis Chart rastreia automaticamente:
- Uso do gráfico (configurações utilizadas)
- Performance de renderização
- Interações do usuário (hover, clicks, tooltips)
- Erros

Consulte a documentação de Analytics (`docs/ANALYTICS_API.md`) para mais informações.

---

## ❓ Suporte

Para questões, problemas ou sugestões relacionadas ao Trellis Chart, entre em contato com a equipe de desenvolvimento ou consulte a documentação do ThoughtSpot Chart SDK.

---

**Última atualização**: Janeiro 2024
