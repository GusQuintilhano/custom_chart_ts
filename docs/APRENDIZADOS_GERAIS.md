# Aprendizados Gerais - Projeto Muze

## 📚 Documentação Compartilhada

Este documento registra os principais aprendizados obtidos durante o desenvolvimento dos Custom Charts usando Muze no ThoughtSpot. Esses aprendizados aplicam-se a todos os charts do projeto.

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

#### Solução
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
    k.toLowerCase() === measureCol.toLowerCase()
  );
  const values = dataArray.map(row => parseFloat(row[measureKey]) || 0);
}
```

#### Aprendizado
- **Sempre verificar** se os dados são array de arrays ou array de objetos
- Os nomes das colunas podem ter espaços, variações ou case diferente
- Usar o schema para encontrar os índices corretos quando for array de arrays

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

#### Exemplo Real
```javascript
const dmWithColor = dm.calculateVariable(
  {
    name: '_color_category',
    type: 'dimension',
  },
  [measureCol], // Campo usado
  (measureValue) => {
    const value = parseFloat(measureValue) || 0;
    return value > mean ? 'above' : 'below';
  }
);
```

#### Aprendizado
- **Função recebe valores diretamente**, não objetos
- A ordem dos parâmetros corresponde à ordem dos campos no array
- Campos de tipo `'dimension'` podem ser usados em color encoding
- Campos de tipo `'measure'` podem ser usados em cálculos

---

### 4. **Color Encoding**

#### Padrão Correto
```javascript
// Opção 1: Campo de dimensão
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

#### ❌ Não Funciona
```javascript
// NÃO fazer:
.color((d) => getColor(d)) // Função direta não funciona bem
```

#### Aprendizado
- Color encoding funciona melhor com **campos de dimensão**
- O `range` é um array de cores mapeado aos valores únicos do campo
- Para cores condicionais, criar um campo calculado primeiro

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

---

## 📚 Referências

- **Chart 01 - Aprendizados Detalhados**: [charts/ACHADOS_E_APRENDIZADOS.md](./charts/ACHADOS_E_APRENDIZADOS.md)
- **Documentação Oficial Muze**: https://developers.thoughtspot.com/charts/muze/Documentation/
- **Documentação Completa**: [muze_documentation_complete.md](./muze_documentation_complete.md)

---

## 🔄 Histórico de Aprendizados

### 2025-01-XX - Chart 01
- Descoberta sobre acesso aos dados do DataModel
- Solução para cálculo de média
- Implementação de campos calculados com `calculateVariable`
- Color encoding com campos calculados

---

## 👥 Contribuições

- Documentado pela equipe iFood Data Team
- Baseado em desenvolvimento real do Chart 01 - Conditional Color Encoding


