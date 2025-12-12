# Achados e Aprendizados - Chart 01: Conditional Color Encoding

## 📋 Resumo

Este documento registra os principais achados, problemas encontrados e soluções aplicadas durante o desenvolvimento do Chart 01 - Conditional Color Encoding usando Muze no ThoughtSpot.

---

## 🎯 Objetivo do Chart

Criar um gráfico de barras com color encoding condicional baseado em benchmark dinâmico (média), onde:
- 🟢 **Verde**: Valores acima da média
- 🔴 **Vermelho**: Valores abaixo da média  
- 🟡 **Amarelo**: Valores próximos da média (±5%)

---

## ⚠️ Problemas Encontrados e Soluções

### 1. **Acesso aos Dados do DataModel**

#### Problema
Inicialmente tentamos acessar os dados usando `dataArray[0][measureCol]`, mas retornava `undefined`, fazendo com que a média fosse calculada como `0.00`.

#### Causa
O ThoughtSpot retorna dados do DataModel em formato diferente do esperado. Os dados podem vir como:
- Array de arrays (onde precisamos usar índices)
- Array de objetos (onde precisamos usar keys que podem ter espaços ou variações)

#### Solução Aplicada
```javascript
// Detectar formato dos dados
if (Array.isArray(dataArray[0])) {
  // Array de arrays - usar índice do schema
  const measureIndex = schema.findIndex(f => f.name === measureCol && f.type === 'measure');
  measureValues = dataArray.map(row => parseFloat(row[measureIndex]) || 0);
} else {
  // Array de objetos - encontrar key correta
  const measureKey = availableKeys.find(k => 
    k === measureCol || 
    k.toLowerCase() === measureCol.toLowerCase() ||
    k.toLowerCase().replace(/\s+/g, '_') === measureCol.toLowerCase().replace(/\s+/g, '_')
  );
  measureValues = dataArray.map(row => parseFloat(row[measureKey]) || 0);
}
```

#### Aprendizado
- **Sempre verificar a estrutura real dos dados** antes de acessá-los
- Os nomes das colunas podem ter espaços ou variações que precisam ser tratados
- O schema do DataModel fornece a ordem correta das colunas

---

### 2. **Cálculo da Média**

#### Problema Inicial
Tentamos usar `getFieldData()` e `groupBy()` com AVG, mas não funcionaram porque os dados não estavam acessíveis dessa forma.

#### Solução Final
Calcular a média diretamente dos valores extraídos do `dataArray`:

```javascript
// Extrair valores corretamente (conforme problema 1)
const measureValues = [...]; // Extraídos do dataArray

// Calcular média manualmente
const sum = measureValues.reduce((acc, val) => acc + val, 0);
const mean = sum / measureValues.length;
```

#### Aprendizado
- **Calcular agregações manualmente** quando métodos do DataModel não estão disponíveis
- Sempre validar se a média foi calculada corretamente (não deve ser 0)

---

### 3. **Criação de Campo Calculado com Categoria de Cor**

#### Problema Inicial
Tentamos usar função diretamente no `.color()`, mas isso não funcionava corretamente.

#### Solução Aplicada
Criar um campo calculado usando `calculateVariable` do DataModel:

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
- **`calculateVariable` recebe valores diretamente** como parâmetros, não objetos
- O campo calculado deve ser do tipo `'dimension'` para usar em color encoding
- A função recebe os valores na ordem especificada no array de campos

---

### 4. **Color Encoding com Campo Calculado**

#### Problema
Todos os valores apareciam com a mesma cor (todos como "above") porque a função de cor não estava funcionando.

#### Solução
Usar o campo calculado diretamente no `.color()` com range de cores:

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

#### Aprendizado
- **Color encoding funciona com campo de dimensão** (não precisa de função)
- O `range` é um array de cores mapeado automaticamente aos valores únicos do campo
- Os valores devem ser strings categóricas ('above', 'below', 'near')

---

## 🔑 Principais Lições Aprendidas

### 1. **DataModel do ThoughtSpot**

- `getDataFromSearchQuery()` retorna um **DataModel diretamente**, não um array
- **NÃO** tentar extrair arrays manualmente - usar o DataModel
- O DataModel fornece métodos como `.getData()`, `.calculateVariable()`, `.groupBy()`

### 2. **Estrutura de Dados**

- O `dataArray` retornado por `dm.getData().data` pode ser:
  - Array de arrays → usar índices do schema
  - Array de objetos → usar keys (que podem ter variações)
- **Sempre verificar** a estrutura real antes de acessar

### 3. **API do Muze**

- **Padrão correto**:
  ```javascript
  muze
    .canvas()
    .data(dm)  // DataModel, não array
    .rows([measureCol])
    .columns([dimensionCol])
    .color({field: 'campo', range: [...]})
    .layers([{mark: 'bar'}])
    .mount("#chart");
  ```

- **NÃO usar**: `muze.canvas().data(array)` ou funções complexas em `.color()`

### 4. **Campos Calculados**

- Usar `calculateVariable` para criar campos dinâmicos
- A função recebe valores diretamente: `(value) => { return ... }`
- Campos de dimensão podem ser usados em color encoding

---

## 📝 Código Final Funcional

```javascript
// 1. Obter DataModel
const dm = getDataFromSearchQuery();

// 2. Obter dados para calcular média
const dataResult = dm.getData();
const dataArray = dataResult.data || [];
const schema = dataResult.schema || [];

// 3. Identificar colunas
const dimensionField = schema.find(f => f.type === 'dimension');
const measureField = schema.find(f => f.type === 'measure');
const dimensionCol = dimensionField.name;
const measureCol = measureField.name;

// 4. Extrair valores da medida
let measureValues = [];
if (Array.isArray(dataArray[0])) {
  const measureIndex = schema.findIndex(f => f.name === measureCol && f.type === 'measure');
  measureValues = dataArray.map(row => parseFloat(row[measureIndex]) || 0);
} else {
  const firstRow = dataArray[0] || {};
  const availableKeys = Object.keys(firstRow);
  const measureKey = availableKeys.find(k => 
    k === measureCol || 
    k.toLowerCase() === measureCol.toLowerCase()
  );
  measureValues = dataArray.map(row => parseFloat(row[measureKey]) || 0);
}

// 5. Calcular média
const mean = measureValues.reduce((acc, val) => acc + val, 0) / measureValues.length;

// 6. Criar campo calculado
const dmWithColor = dm.calculateVariable(
  { name: '_color_category', type: 'dimension' },
  [measureCol],
  (measureValue) => {
    const value = parseFloat(measureValue) || 0;
    const percentDistance = Math.abs((value - mean) / mean);
    if (percentDistance <= 0.05) return 'near';
    return value > mean ? 'above' : 'below';
  }
);

// 7. Renderizar
muze
  .canvas()
  .data(dmWithColor)
  .rows([measureCol])
  .columns([dimensionCol])
  .color({
    field: '_color_category',
    range: ['#ef4444', '#eab308', '#22c55e']  // below, near, above
  })
  .layers([{ mark: 'bar' }])
  .mount("#chart");
```

---

## ✅ Checklist de Validação

Antes de considerar o chart completo, verifique:

- [ ] Média é calculada corretamente (valor > 0)
- [ ] Campo calculado é criado com sucesso
- [ ] Distribuição de cores mostra 'above', 'below' e 'near'
- [ ] Cores são aplicadas visualmente no gráfico
- [ ] Console não mostra erros
- [ ] Gráfico renderiza corretamente

---

## 🐛 Debug Útil

Adicione estes logs para debug:

```javascript
console.log('🔍 Primeiro item:', dataArray[0]);
console.log('🔍 Tipo:', Array.isArray(dataArray[0]) ? 'array' : 'object');
console.log('🔍 Keys disponíveis:', Object.keys(dataArray[0] || {}));
console.log('📊 Média calculada:', mean);
console.log('📊 Distribuição de cores:', colorCounts);
```

---

## 📚 Referências

- [Documentação Muze - DataModel](https://developers.thoughtspot.com/charts/muze/Documentation/)
- [Documentação Muze - calculateVariable](https://developers.thoughtspot.com/charts/muze/Documentation/)
- [Documentação Muze - Color Encoding](https://developers.thoughtspot.com/charts/muze/Documentation/)

---

## 🔄 Versões

- **v1.0.0** (2025-01-XX): Implementação inicial com color encoding condicional
- **v1.1.0** (2025-01-XX): Corrigido acesso aos dados e cálculo da média

---

## 👥 Contribuições

- Desenvolvido pela equipe iFood Data Team
- Baseado na documentação oficial do Muze Studio


