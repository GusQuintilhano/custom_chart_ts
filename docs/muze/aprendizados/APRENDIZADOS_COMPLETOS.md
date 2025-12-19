# Aprendizados Completos - Muze Studio

## 📚 Documentação Consolidada

Este documento consolida **todos os aprendizados** obtidos durante o desenvolvimento dos Custom Charts usando Muze no ThoughtSpot. Combina lições gerais aplicáveis a todos os charts com exemplos práticos e soluções específicas.

---

## 🔑 Lições Fundamentais

### 1. **DataModel do ThoughtSpot**

#### ✅ Correto
```javascript
const { muze, getDataFromSearchQuery } = viz;
const dm = getDataFromSearchQuery(); // Retorna DataModel diretamente

// Usar o DataModel diretamente
muze
  .canvas()
  .data(dm)  // DataModel, não array
  .rows([measureCol])
  .columns([dimensionCol])
  .mount("#chart");
```

#### ❌ Incorreto
```javascript
// NÃO fazer:
const data = getDataFromSearchQuery();
const dataArray = data; // Errado! data já é DataModel
muze.canvas().data(dataArray); // Errado!
```

#### Aprendizado
- `getDataFromSearchQuery()` retorna um **DataModel**, não um array
- Sempre passar o DataModel diretamente para `.data(dm)`
- O DataModel fornece métodos como `.getData()`, `.calculateVariable()`, `.groupBy()`

---

### 2. **Acesso aos Dados do DataModel**

#### Problema Comum
Acessar dados usando `dataArray[0][columnName]` retorna `undefined` porque os dados podem estar em formato diferente.

#### Solução Completa
```javascript
const dataResult = dm.getData();
const dataArray = dataResult.data || [];
const schema = dataResult.schema || [];

// Verificar formato dos dados
if (Array.isArray(dataArray[0])) {
  // Array de arrays - usar índices do schema
  const measureIndex = schema.findIndex(f => f.name === measureCol && f.type === 'measure');
  const values = dataArray.map(row => parseFloat(row[measureIndex]) || 0);
} else {
  // Array de objetos - encontrar key correta (pode ter espaços ou variações)
  const firstRow = dataArray[0] || {};
  const availableKeys = Object.keys(firstRow);
  const measureKey = availableKeys.find(k => 
    k === measureCol || 
    k.toLowerCase() === measureCol.toLowerCase() ||
    k.toLowerCase().replace(/\s+/g, '_') === measureCol.toLowerCase().replace(/\s+/g, '_')
  );
  const values = dataArray.map(row => parseFloat(row[measureKey]) || 0);
}
```

#### Aprendizado
- **Sempre verificar** se os dados são array de arrays ou array de objetos
- Os nomes das colunas podem ter espaços, variações ou case diferente
- Usar o schema para encontrar os índices corretos quando for array de arrays
- Tratar variações de nomes (espaços, underscores, case)

---

### 3. **Campos Calculados com `calculateVariable`**

#### Padrão Correto
```javascript
const dmWithCalculated = dm.calculateVariable(
  {
    name: 'campo_calculado',
    type: 'dimension', // ou 'measure'
  },
  [campoOriginal], // Array de campos usados no cálculo
  (valorDoCampo) => { // Função recebe valores diretamente
    // Lógica de cálculo
    return resultado;
  }
);
```

#### Exemplo Real - Color Encoding Condicional
```javascript
const colorCategoryField = '_color_category';

const dmWithColor = dm.calculateVariable(
  {
    name: colorCategoryField,
    type: 'dimension',
  },
  [measureCol],  // Campo usado para calcular
  (measureValue) => {
    const value = parseFloat(measureValue) || 0;
    const distance = value - mean;
    const percentDistance = mean > 0 ? Math.abs(distance / mean) : 0;
    
    if (percentDistance <= CHART_CONFIG.threshold && percentDistance >= 0) {
      return 'near';   // Próximo da média (±5%)
    } else if (value > mean) {
      return 'above';  // Acima da média
    } else {
      return 'below';  // Abaixo da média
    }
  }
);
```

#### Aprendizado
- **Função recebe valores diretamente**, não objetos
- A ordem dos parâmetros corresponde à ordem dos campos no array
- Campos de tipo `'dimension'` podem ser usados em color encoding
- Campos de tipo `'measure'` podem ser usados em cálculos
- O campo calculado deve ser do tipo `'dimension'` para usar em color encoding

---

### 4. **Color Encoding**

#### Padrão Correto
```javascript
// Opção 1: Campo de dimensão com range
.color({
  field: 'nome_campo',
  range: ['#cor1', '#cor2', '#cor3']
})

// Opção 2: Campo direto (string)
.color('nome_campo')

// Opção 3: Objeto com configurações
.color({
  field: 'nome_campo',
  range: {
    'valor1': '#cor1',
    'valor2': '#cor2'
  }
})
```

#### Exemplo Real - Color Encoding Condicional
```javascript
.color({
  field: colorCategoryField,
  range: [
    CHART_CONFIG.colors.belowBenchmark,  // 'below'
    CHART_CONFIG.colors.nearBenchmark,   // 'near'
    CHART_CONFIG.colors.aboveBenchmark   // 'above'
  ]
})
```

#### ❌ Não Funciona
```javascript
// NÃO fazer:
.color((d) => getColor(d)) // Função direta não funciona bem
```

#### Aprendizado
- Color encoding funciona melhor com **campos de dimensão**
- O `range` é um array de cores mapeado automaticamente aos valores únicos do campo
- Para cores condicionais, criar um campo calculado primeiro
- Os valores devem ser strings categóricas ('above', 'below', 'near')

---

### 5. **Layers**

#### Padrão Correto
```javascript
.layers([
  {
    mark: 'bar'
  },
  {
    mark: 'point'
  },
  {
    mark: 'text',
    encoding: {
      text: 'campo_texto'
    }
  }
])
```

#### Aprendizado
- Layers é um **array de objetos** com propriedade `mark`
- Cada layer pode ter seu próprio `mark`, `encoding`, `transform`
- Múltiplas layers são renderizadas sobrepostas

---

### 6. **Schema Detection**

#### Padrão Correto
```javascript
const schema = dm.getData().schema || [];

// Identificar campos automaticamente
const dimensionField = schema.find(f => f.type === 'dimension');
const measureField = schema.find(f => f.type === 'measure');

if (!dimensionField || !measureField) {
  throw new Error('Dimension ou measure não encontrada');
}

const dimensionCol = dimensionField.name;
const measureCol = measureField.name;
```

#### Aprendizado
- **Sempre usar o schema** para identificar campos
- O schema fornece tipo (`dimension`/`measure`), nome e outras propriedades
- Não assumir nomes de colunas fixos

---

### 7. **Cálculo de Agregações**

#### Problema Comum
Tentamos usar `getFieldData()` e `groupBy()` com AVG, mas não funcionaram porque os dados não estavam acessíveis dessa forma.

#### Solução
Calcular agregações manualmente dos valores extraídos:

```javascript
// Extrair valores corretamente
let measureValues = [];
if (Array.isArray(dataArray[0])) {
  const measureIndex = schema.findIndex(f => f.name === measureCol && f.type === 'measure');
  measureValues = dataArray.map(row => parseFloat(row[measureIndex]) || 0);
} else {
  const measureKey = availableKeys.find(k => 
    k === measureCol || 
    k.toLowerCase() === measureCol.toLowerCase()
  );
  measureValues = dataArray.map(row => parseFloat(row[measureKey]) || 0);
}

// Calcular média manualmente
const sum = measureValues.reduce((acc, val) => acc + val, 0);
const mean = sum / measureValues.length;
```

#### Aprendizado
- **Calcular agregações manualmente** quando métodos do DataModel não estão disponíveis
- Sempre validar se a agregação foi calculada corretamente (não deve ser 0)
- Usar `parseFloat()` para garantir valores numéricos

---

## 📝 Código Completo de Referência

### Template Base para Custom Charts

```javascript
// 1. Obter DataModel
const { muze, getDataFromSearchQuery } = viz;
const dm = getDataFromSearchQuery();

// 2. Obter dados e schema
const dataResult = dm.getData();
const dataArray = dataResult.data || [];
const schema = dataResult.schema || [];

// 3. Identificar colunas automaticamente
const dimensionField = schema.find(f => f.type === 'dimension');
const measureField = schema.find(f => f.type === 'measure');

if (!dimensionField || !measureField) {
  throw new Error('Dimension ou measure não encontrada');
}

const dimensionCol = dimensionField.name;
const measureCol = measureField.name;

// 4. Extrair valores da medida (tratando ambos os formatos)
let measureValues = [];
if (Array.isArray(dataArray[0])) {
  // Array de arrays
  const measureIndex = schema.findIndex(f => f.name === measureCol && f.type === 'measure');
  measureValues = dataArray.map(row => parseFloat(row[measureIndex]) || 0);
} else {
  // Array de objetos
  const firstRow = dataArray[0] || {};
  const availableKeys = Object.keys(firstRow);
  const measureKey = availableKeys.find(k => 
    k === measureCol || 
    k.toLowerCase() === measureCol.toLowerCase() ||
    k.toLowerCase().replace(/\s+/g, '_') === measureCol.toLowerCase().replace(/\s+/g, '_')
  );
  measureValues = dataArray.map(row => parseFloat(row[measureKey]) || 0);
}

// 5. Calcular agregações necessárias (ex: média)
const mean = measureValues.reduce((acc, val) => acc + val, 0) / measureValues.length;

// 6. Criar campos calculados (se necessário)
const dmWithCalculated = dm.calculateVariable(
  { name: '_color_category', type: 'dimension' },
  [measureCol],
  (measureValue) => {
    const value = parseFloat(measureValue) || 0;
    // Lógica de cálculo
    return resultado;
  }
);

// 7. Renderizar gráfico
muze
  .canvas()
  .data(dmWithCalculated)
  .rows([measureCol])
  .columns([dimensionCol])
  .color({
    field: '_color_category',
    range: ['#ef4444', '#eab308', '#22c55e']
  })
  .layers([{ mark: 'bar' }])
  .mount("#chart");
```

---

## 🐛 Debugging Útil

### Logs Essenciais
```javascript
// Verificar estrutura dos dados
console.log('🔍 Primeiro item:', dataArray[0]);
console.log('🔍 Tipo:', Array.isArray(dataArray[0]) ? 'array' : 'object');
console.log('🔍 Keys:', Object.keys(dataArray[0] || {}));
console.log('📋 Schema:', schema.map(f => ({name: f.name, type: f.type})));

// Verificar valores extraídos
console.log('📊 Valores extraídos:', values.slice(0, 10));
console.log('📊 Média calculada:', mean);

// Verificar campos calculados
const result = dmWithCalculated.getData().data;
console.log('📊 Primeiro registro com campo calculado:', result[0]);
console.log('📊 Distribuição de valores:', colorCounts);
```

---

## ✅ Checklist para Novos Charts

Ao criar um novo chart, verificar:

- [ ] `getDataFromSearchQuery()` retorna DataModel
- [ ] `.data(dm)` recebe DataModel, não array
- [ ] Schema é usado para identificar campos
- [ ] Estrutura dos dados é verificada (array de arrays vs objetos)
- [ ] Campos calculados usam `calculateVariable` corretamente
- [ ] Color encoding usa campo de dimensão, não função
- [ ] Layers é array de objetos com propriedade `mark`
- [ ] Logs de debug estão presentes para troubleshooting
- [ ] Agregações são validadas (não devem ser 0)
- [ ] Tratamento de erros está implementado

---

## 📚 Referências

- **Documentação Oficial Muze**: https://developers.thoughtspot.com/charts/muze/Documentation/
- **Documentação Completa**: [muze_documentation_complete.md](./muze_documentation_complete.md)
- **Exemplos Práticos**: [../sdk/charts/](../sdk/charts/)

---

## 🔄 Histórico de Aprendizados

### 2025-01-XX - Chart 01 - Conditional Color Encoding
- ✅ Descoberta sobre acesso aos dados do DataModel
- ✅ Solução para cálculo de média manual
- ✅ Implementação de campos calculados com `calculateVariable`
- ✅ Color encoding com campos calculados
- ✅ Tratamento de diferentes formatos de dados (array de arrays vs objetos)
- ✅ Tratamento de variações de nomes de colunas

---

## 👥 Contribuições

- Documentado pela equipe iFood Data Team
- Baseado em desenvolvimento real dos Custom Charts
- Consolidado de múltiplas fontes para máxima completude

