# Aba Configure - Guia Completo

## ⚠️ IMPORTANTE: A Aba Configure Não Aparece Automaticamente!

A aba **"Configure"** só aparece quando você **clica em uma coluna específica** (medida) no painel lateral do ThoughtSpot. Ela **não aparece automaticamente** quando você abre as configurações do gráfico.

---

## 📋 Como Acessar a Aba Configure

### Passo-a-Passo Detalhado

#### 1. Abra o Painel de Propriedades
- Clique no ícone de configurações (⚙️) do gráfico no ThoughtSpot
- Ou clique com o botão direito no gráfico e selecione "Properties"

#### 2. Localize a Lista de Colunas
- No painel lateral, você verá uma lista de todas as colunas usadas no gráfico
- Procure pelas **medidas** (colunas numéricas)

#### 3. Clique em uma Medida
- Clique diretamente no nome de uma medida (ex: "% Atraso > 10 min")
- **Não é no gráfico**, é na lista de colunas do painel lateral

#### 4. A Aba Configure Aparecerá
- Quando você clicar na medida, uma nova aba chamada **"Configure"** aparecerá ao lado da aba "Settings"
- Essa aba mostrará as configurações específicas dessa medida

---

## 🎯 O que Aparece na Aba Configure

Quando você clica em uma medida, a aba "Configure" mostrará:

- ✅ **Tipo de Gráfico** (bar/line)
- ✅ **Cor**
- ✅ **Formato do Número**
- ✅ **Casas Decimais**

---

## 🔍 Como Usar a Aba Configure

### Configurações Disponíveis

1. **Tipo de Gráfico**
   - Escolha entre `bar` (barras) ou `line` (linhas)
   - Cada medida pode ter seu próprio tipo de gráfico

2. **Cor**
   - Selecione uma cor personalizada para a medida
   - Use o color picker para escolher a cor desejada

3. **Formato do Número**
   - Configure como os números devem ser formatados
   - Opções: decimal, percentual, moeda, etc.

4. **Casas Decimais**
   - Defina quantas casas decimais devem ser exibidas
   - Útil para controlar a precisão dos valores

### Como Aplicar as Configurações

1. Clique em uma medida no painel lateral
2. A aba "Configure" aparecerá automaticamente
3. Ajuste as configurações desejadas
4. As mudanças são aplicadas automaticamente ao gráfico

---

## 🔍 Troubleshooting

### A aba Configure não aparece?

**Verifique:**

1. ✅ Você clicou em uma **coluna (medida)** no painel lateral?
   - Não é no gráfico, é na lista de colunas do painel lateral
   
2. ✅ A coluna é uma **medida** (não uma dimensão)?
   - Configure só aparece para medidas configuradas em `columnsVizPropDefinition`

3. ✅ Verifique os logs do console:
   - Abra o console do navegador (F12)
   - Procure por `🎨 [DEBUG] columnsVizPropDefinition`
   - Deve mostrar "SIM - X colunas"
   - Deve listar os IDs das medidas processadas

4. ✅ Verifique se o build foi feito corretamente:
   ```bash
   npm run build
   ```

5. ✅ Verifique se o deploy foi realizado no Railway

### Logs de Debug Esperados

Abra o console do navegador (F12) e procure por:

```
🎨 [DEBUG] columnsVizPropDefinition: SIM - X colunas
🎨 [DEBUG] Medidas processadas: [...]
🎨 [DEBUG] IDs das colunas nas configurações: [...]
```

Se você ver essas mensagens, significa que o `columnsVizPropDefinition` está sendo retornado corretamente.

---

## 📝 Notas Técnicas

### Como Funciona

- A aba Configure usa o parâmetro `activeColumnId` que o ThoughtSpot passa quando você clica em uma coluna
- O `columnsVizPropDefinition` define quais configurações estarão disponíveis para cada coluna
- A estrutura está correta no código - o problema pode ser que você precisa clicar na coluna primeiro

### Estrutura de Dados

```typescript
{
  columnsVizPropDefinition: [
    {
      type: ColumnType.MEASURE,
      columnSettingsDefinition: {
        [measureId]: {
          elements: [
            // Configurações específicas desta medida
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
            // ... outras configurações
          ]
        }
      }
    }
  ]
}
```

---

## 💡 Dicas

1. **Se a aba Configure ainda não aparecer:**
   - Abra o console do navegador (F12)
   - Procure pelos logs de debug que começam com `🎨`
   - Verifique se `columnsVizPropDefinition` está sendo retornado
   - Verifique se os IDs das colunas correspondem às medidas do seu gráfico

2. **Para verificar se está funcionando:**
   - Clique em diferentes medidas e veja se a aba Configure aparece
   - As configurações devem ser específicas para cada medida
   - Mudanças devem ser aplicadas imediatamente ao gráfico

---

## 🎯 Resumo

**Para ver a aba Configure:**
1. Abra o painel de propriedades do gráfico
2. Clique em uma **medida** na lista de colunas do painel lateral
3. A aba "Configure" aparecerá com as configurações dessa medida

**A aba Configure NÃO aparece automaticamente** - você precisa clicar na coluna primeiro!

---

## 📚 Referências Relacionadas

- [Impacto e Migração para columnsVizPropDefinition](./COLUMNS_VIZ_PROP_DEFINITION.md)
- [Aprendizados e Achados](./APRENDIZADOS_E_ACHADOS.md)

