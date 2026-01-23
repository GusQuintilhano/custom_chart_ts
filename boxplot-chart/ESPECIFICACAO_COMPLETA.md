# 📋 Especificação Técnica: Custom Boxplot Chart (ThoughtSpot SDK)

## Análise: Estado Atual vs Especificação

### ✅ O QUE JÁ ESTÁ IMPLEMENTADO

#### 1. Modelagem de Dados (Data Buckets)
- ✅ Eixo Y (Measure/Métrica) - Obrigatório, Max 1
- ✅ Eixo X (Category/Atributo) - Múltiplos dimensões
- ⚠️ Granularidade/Detalhe (Attribute) - **PARCIAL**: O ThoughtSpot já faz agregação, mas não há campo específico para forçar desagregação
- ⚠️ Tooltip Info (Extra Data) - **BÁSICO**: Tooltip existe mas não mostra dados extras detalhados

#### 2. Motor Estatístico (Frontend Calculation)
- ✅ Quartis (Q1, Q2, Q3) e IQR - Implementado via `@shared/utils/statistical`
- ✅ Whiskers (Bigodes) - Implementado com tipos: iqr_1_5, data_extremes, min_max, iqr_3, percentile_5_95
- ✅ Média (Mean) - Implementado com toggle showMean
- ✅ Outliers - Implementado com configurações de estilo

#### 3. Painel de Configurações (Settings & Customization)

**A. Análise Estatística (Analytical Features)**
- ✅ Indicador de Média (Mean Marker) - Implementado como círculo
- ❌ Notch Mode (Intervalo de Confiança) - **FALTANDO**
- ✅ Definição dos Bigodes (Whisker Type) - Implementado: iqr_1_5 (padrão), min_max, data_extremes, iqr_3, percentile_5_95
- ❌ Largura Variável (Variable Width) - **FALTANDO**

**B. Visualização de Dados (Data Points)**
- ✅ Mostrar Outliers - Implementado com toggle e configurações de cor/formato
- ❌ Jitter Plot (Dispersão Total) - **FALTANDO**
- ❌ Violin Plot Overlay - **FALTANDO**

**C. Estilo e Eixos (Cosmetic & Layout)**
- ✅ Orientação: Vertical/Horizontal - Implementado
- ✅ Cores: Box Fill, Stroke - Implementado
- ❌ Escala do Eixo Y: Linear/Logarítmica - **FALTANDO**
- ❌ Ordenação (Sorting): Alfabética, Por Média, Por Mediana, Por Variabilidade - **FALTANDO**
- ❌ Linhas de Referência (Reference Lines) - **FALTANDO**

#### 4. Interatividade e UX
- ⚠️ Tooltip Inteligente - **PARCIAL**: Tooltip básico implementado, mas não mostra tabela completa (Max, Q3, Mediana, Média, Q1, Min, n=count)
- ❌ Outlier Hover com nome da granularidade - **FALTANDO**
- ❌ Context Menu (Drill down, Exclude values) - **FALTANDO**: Depende do ThoughtSpot SDK
- ⚠️ Responsividade - **PARCIAL**: Layout responsivo básico, mas pode melhorar

#### 5. Tratamento de Exceções (Edge Cases)
- ✅ Dados Nulos - Filtrados no cálculo
- ⚠️ Amostra Insuficiente (< 3 pontos) - **PARCIAL**: Não há aviso visual específico ou dot plot alternativo

---

### ❌ O QUE FALTA IMPLEMENTAR

#### Prioridade ALTA (Funcionalidades Core)

1. **Notch Mode (Intervalo de Confiança)**
   - Toggle no visualPropEditor
   - Cálculo do intervalo de confiança (95% CI)
   - Renderização da "cintura" na caixa ao redor da mediana

2. **Tooltip Inteligente Completo**
   - Tabela com: Max, Q3, Mediana, Média, Q1, Min
   - Contagem de registros (n=150)
   - Formatação de valores numéricos

3. **Escala Logarítmica do Eixo Y**
   - Toggle Linear/Log
   - Cálculo correto de coordenadas em escala log
   - Labels formatados adequadamente

4. **Ordenação de Grupos**
   - Alfabética
   - Por Média (Asc/Desc)
   - Por Mediana (Asc/Desc)
   - Por Variabilidade/IQR (Asc/Desc)

5. **Linhas de Referência**
   - Valor fixo (input numérico)
   - Valor dinâmico (Média Global, Mediana Global)

#### Prioridade MÉDIA (Melhorias Visuais)

6. **Jitter Plot (Dispersão Total)**
   - Toggle On/Off
   - Plotar todos os pontos com jitter (deslocamento aleatório horizontal)
   - Transparência configurável

7. **Largura Variável (Variable Width)**
   - Toggle On/Off
   - Largura proporcional ao count de dados
   - Cálculo: boxWidth = baseWidth * sqrt(count / maxCount)

8. **Estilo de Média**
   - Opção: Círculo/Estrela (atualmente só círculo)

9. **Tratamento de Amostra Insuficiente**
   - Detectar quando count < 3
   - Exibir dot plot alternativo
   - Aviso visual discreto

#### Prioridade BAIXA (Features Avançadas)

10. **Violin Plot Overlay**
    - Toggle On/Off
    - Cálculo de densidade de probabilidade (KDE)
    - Renderização da curva ao redor da caixa

11. **Outlier Hover com Detalhes**
    - Mostrar nome da granularidade ao hover
    - Depende de ter acesso aos dados desagregados

12. **Context Menu Nativo**
    - Drill down
    - Exclude values
    - (Depende de APIs do ThoughtSpot SDK)

---

## 📝 Documento Original da Especificação

[O briefing completo fornecido pelo usuário foi analisado acima]
