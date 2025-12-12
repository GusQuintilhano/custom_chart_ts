# Guia Completo - Custom Charts no ThoughtSpot

## 📚 Documentação Consolidada

Este guia consolida **todas as informações** sobre como criar, usar e implantar Custom Charts no ThoughtSpot, incluindo uso no Muze Studio e upload como Custom Chart tradicional.

---

## 🎯 Duas Formas de Usar Custom Charts

### 1. **Muze Studio** (Editor Interativo)
- Editor de código integrado no ThoughtSpot
- Teste rápido e iterativo
- Ideal para prototipagem e desenvolvimento

### 2. **Custom Chart Tradicional** (Upload)
- Upload de arquivo .zip
- Chart disponível na lista de visualizações
- Ideal para produção e distribuição

---

## 📋 Parte 1: Usar no Muze Studio

### Passo a Passo Completo

#### 1. Acessar o Muze Studio no ThoughtSpot

1. Faça login no ThoughtSpot
2. Crie uma **Answer** ou abra uma existente
3. Clique no botão **Change visualization** (ícone de gráfico)
4. Na seção **Custom** (parte inferior), clique em **Muze Studio**

#### 2. Abrir o Editor de Código

1. No canto superior direito do preview do gráfico, clique no botão **Code Editor** (ícone de código)
2. O painel do editor abrirá com 3 abas: **JavaScript**, **CSS** e **HTML**

#### 3. Copiar o Código

**Aba HTML:**
```html
<div id="chart" style="width: 100%; height: 500px;"></div>
```

**Aba CSS:**
Cole o conteúdo completo do arquivo `src/styles.css` do chart desejado.

**Aba JavaScript:**
Cole o conteúdo completo do arquivo `src/index.js` do chart desejado.

#### 4. Testar e Ajustar

- As mudanças são aplicadas automaticamente
- Use o console do navegador (F12) para debug
- Ajuste o código conforme necessário

---

## 📋 Parte 2: Upload como Custom Chart

### Passo a Passo Completo

#### 1. Preparar os Arquivos

Cada chart requer 3 arquivos:
- **HTML** → `src/index.html`
- **CSS** → `src/styles.css`
- **JavaScript** → `src/index.js`

#### 2. Acessar Custom Charts no ThoughtSpot

1. Fazer login no ThoughtSpot
2. Ir para **Admin** > **Custom Charts**
3. Clicar em **"Create Custom Chart"** ou **"Upload"**

#### 3. Preencher os 3 Campos

**Campo 1: HTML**
Copie o conteúdo do arquivo `src/index.html`:
```html
<div id="chart" style="width: 100%; height: 500px;"></div>
```

**Campo 2: CSS**
Copie o conteúdo completo do arquivo `src/styles.css`

**Campo 3: JavaScript**
Copie o conteúdo completo do arquivo `src/index.js`

#### 4. Configurar Metadados

- **Name:** `ifood-muze-[nome-do-chart]`
- **Version:** `1.0.0`
- **Description:** Descrição do chart
- **Author:** `iFood Data Team`

#### 5. Configurar Column Schema

Defina as colunas esperadas:
- **Column 1:** 
  - Type: `Dimension`
  - Name: Nome da dimensão
  - Data Type: `String`
- **Column 2:**
  - Type: `Measure`
  - Name: Nome da medida
  - Data Type: `Number`

#### 6. Salvar e Testar

1. Clicar em **"Save"**
2. Aguardar validação
3. Realizar uma busca no ThoughtSpot
4. Selecionar este Custom Chart na lista de visualizações

---

## 📦 Parte 3: Empacotamento

### Empacotar um Chart Individual

```bash
# Navegar para o chart desejado
cd muze-tests/chart-01-encodings

# Executar o script de build
./build.sh
```

O arquivo `.zip` será gerado em: `dist/ifood-muze-[nome]-v[versao].zip`

### Empacotar Todos os Charts

```bash
# Na raiz do projeto
cd muze-tests/integration-tests/A3.1-empacotamento

# Executar script
./build-all.sh
```

---

## 🎨 Estrutura de um Custom Chart

### Arquivos Necessários

```
chart-XX-nome/
├── src/
│   ├── index.html      # HTML base
│   ├── index.js         # Código Muze
│   └── styles.css       # Estilos customizados
├── manifest.json        # Metadados do chart
├── build.sh             # Script de empacotamento
└── README.md            # Documentação
```

### Estrutura do Código JavaScript

```javascript
// 1. Detectar ambiente (ThoughtSpot ou local)
const isThoughtSpot = typeof viz !== 'undefined';

// 2. Obter DataModel
const { muze, getDataFromSearchQuery } = viz;
const dm = getDataFromSearchQuery();

// 3. Processar dados
// ... (ver APRENDIZADOS_COMPLETOS.md)

// 4. Renderizar gráfico
muze
  .canvas()
  .data(dm)
  .rows([measureCol])
  .columns([dimensionCol])
  .layers([{ mark: 'bar' }])
  .mount("#chart");
```

---

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
- Verifique se o campo calculado foi criado corretamente

### Gráfico não renderiza
- Verifique se o elemento `#chart` existe no HTML
- Confirme que o Muze está carregado
- Verifique erros no console do navegador

---

## 📊 Dataset Esperado

### Formato Básico

O chart espera dados no formato:
```json
[
  { dimension: "Categoria A", measure: 45.90 },
  { dimension: "Categoria B", measure: 8.50 },
  ...
]
```

Onde:
- **dimension**: Coluna do tipo string (Dimension)
- **measure**: Coluna do tipo number (Measure)

**Nota:** O chart detecta automaticamente qual coluna é dimension e qual é measure usando o schema!

---

## ⚙️ Personalização

### Configurar Cores

Edite as constantes no início do `index.js`:

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

### Configurar Tamanhos

```javascript
const CHART_CONFIG = {
  width: '100%',
  height: '500px',
  // ... outras configurações
};
```

---

## 📚 Referências

- **Aprendizados Completos**: [../muze/APRENDIZADOS_COMPLETOS.md](../muze/APRENDIZADOS_COMPLETOS.md)
- **Documentação Oficial Muze**: https://developers.thoughtspot.com/charts/muze/Documentation/
- **Empacotamento**: [integration-tests/EMPACOTAMENTO.md](./integration-tests/EMPACOTAMENTO.md)
- **Deploy**: [integration-tests/DEPLOY.md](./integration-tests/DEPLOY.md)

---

## 🎯 Resumo Rápido

### Muze Studio
1. Abrir Answer no ThoughtSpot
2. Selecionar Muze Studio
3. Abrir Code Editor
4. Colar código HTML, CSS e JavaScript
5. Testar e ajustar

### Custom Chart Tradicional
1. Preparar arquivos (HTML, CSS, JS)
2. Acessar Admin > Custom Charts
3. Criar novo chart
4. Colar código nos 3 campos
5. Configurar metadados e schema
6. Salvar e testar

### Empacotamento
1. Executar `./build.sh` no chart
2. Arquivo .zip gerado em `dist/`
3. Upload no ThoughtSpot

---

## 👥 Contribuições

- Desenvolvido pela equipe iFood Data Team
- Baseado na documentação oficial do Muze Studio
- Consolidado de múltiplas fontes para máxima completude

