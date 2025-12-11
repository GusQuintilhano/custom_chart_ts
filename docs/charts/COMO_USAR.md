# Como Usar Este Custom Chart no ThoughtSpot

## 📋 Arquivos para ThoughtSpot

Este chart requer 3 arquivos que serão colados nos campos correspondentes do ThoughtSpot:

1. **HTML** → `src/index.html`
2. **CSS** → `src/styles.css`
3. **JavaScript** → `src/index.js`

## 📥 Como Copiar para ThoughtSpot

### Passo 1: Acessar Custom Charts no ThoughtSpot
1. Fazer login no ThoughtSpot
2. Ir para **Admin** > **Custom Charts**
3. Clicar em **"Create Custom Chart"** ou **"Upload"**

### Passo 2: Preencher os 3 Campos

#### Campo 1: HTML
Copie o conteúdo do arquivo `src/index.html`:
```html
<div id="chart" style="width: 100%; height: 500px;"></div>
```

#### Campo 2: CSS
Copie o conteúdo do arquivo `src/styles.css`:
```css
#chart {
  width: 100%;
  height: 500px;
  ...
}
```

#### Campo 3: JavaScript
Copie o conteúdo do arquivo `src/index.js`:
```javascript
// JavaScript para ThoughtSpot Custom Chart...
```

### Passo 3: Configurar Metadados
- **Name:** `ifood-muze-conditional-colors`
- **Version:** `1.0.0`
- **Description:** `Gráfico de barras com color encoding condicional baseado em benchmark dinâmico`
- **Author:** `iFood Data Team`

### Passo 4: Configurar Column Schema
Defina as colunas esperadas:
- **Column 1:** 
  - Type: `Dimension`
  - Name: `merchant_brand` (ou nome da sua dimensão)
  - Data Type: `String`
- **Column 2:**
  - Type: `Measure`
  - Name: `Total_dt30` (ou nome da sua medida)
  - Data Type: `Number`

### Passo 5: Salvar e Testar
1. Clicar em **"Save"**
2. Aguardar validação
3. Realizar uma busca no ThoughtSpot
4. Selecionar este Custom Chart na lista de visualizações

## 🎯 Funcionalidade

O chart automaticamente:
- ✅ Calcula a média de todos os valores (benchmark)
- ✅ Aplica cores condicionais:
  - 🟢 Verde: valores acima da média
  - 🔴 Vermelho: valores abaixo da média
  - 🟡 Amarelo: valores próximos à média (±5%)
- ✅ Detecta colunas automaticamente (dimension e measure)
- ✅ Renderiza gráfico de barras usando Muze

## ⚙️ Personalização

Para mudar as cores, edite as constantes no início do `index.js`:

```javascript
const CHART_CONFIG = {
  colors: {
    aboveBenchmark: '#22c55e',  // Mude aqui
    belowBenchmark: '#ef4444',   // Mude aqui
    nearBenchmark: '#eab308'     // Mude aqui
  },
  threshold: 0.05  // Mude o threshold (0.05 = 5%)
};
```

## 🔍 Troubleshooting

### Erro: "viz is not defined"
- Certifique-se de que está usando o código dentro do ThoughtSpot
- O código detecta automaticamente se está em ambiente TS ou local

### Erro: "Nenhum dado disponível"
- Verifique se a busca retorna dados
- Certifique-se de ter colunas string e number no dataset

### Cores não aparecem corretamente
- Verifique no console do navegador os logs
- Confirme que os valores numéricos são válidos

## 📊 Dataset Esperado

O chart espera dados no formato:
```
[
  { merchant_brand: "Alimentação", Total_dt30: 45.90 },
  { merchant_brand: "Bebidas", Total_dt30: 8.50 },
  ...
]
```

Onde:
- **merchant_brand**: Dimension (string)
- **Total_dt30**: Measure (number)

Obs: O chart detecta automaticamente qual coluna é dimension e qual é measure!




