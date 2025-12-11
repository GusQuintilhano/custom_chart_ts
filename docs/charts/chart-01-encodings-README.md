# Chart 01 - Encodings Avançados

## Descrição

Gráfico de barras com color encoding condicional baseado em benchmark dinâmico.

**Nome no ThoughtSpot:** `ifood-muze-conditional-colors`

## Funcionalidade

O gráfico calcula automaticamente a média dos valores (benchmark) e aplica cores diferentes com base na proximidade em relação a este benchmark:

- 🟢 **Verde** (`#22c55e`): Valores acima da média
- 🔴 **Vermelho** (`#ef4444`): Valores abaixo da média  
- 🟡 **Amarelo** (`#eab308`): Valores próximos à média (±5%)

## Estrutura de Dados Esperada

```json
{
  "dimension": "string",  // Categoria ou rótulo
  "measure": "number"     // Valor numérico
}
```

## Instalação Local

### Pré-requisitos
- Node.js >= 14.x
- Navegador moderno

### Teste Local

```bash
# Instalar dependências
npm install

# Executar servidor local
npm run dev
```

Acesse: http://localhost:8081

## Empacotamento

```bash
# Gerar arquivo .zip para ThoughtSpot
./build.sh
```

O arquivo será gerado em: `dist/ifood-muze-conditional-colors-v1.0.0.zip`

## Configuração no ThoughtSpot

### Input Columns
- `dimension` (string): Dimensão/categoria
- `measure` (number): Valor numérico

### Configurações Disponíveis
- `benchmarkThreshold`: Threshold para considerar "próximo" à média (padrão: 0.05 = 5%)
- Cores customizadas via `chart-config.json`

## Critérios de Sucesso

### Teste Local
- [ ] Gráfico renderiza corretamente com mock data
- [ ] Benchmark (média) é calculado corretamente
- [ ] Cores são aplicadas conforme a lógica (verde/vermelho/amarelo)
- [ ] Console log mostra o benchmark calculado

### ThoughtSpot
- [ ] Chart visível na lista de Custom Charts
- [ ] Renderização funcional com dados reais
- [ ] Cores ajustam dinamicamente conforme mudança nos dados
- [ ] Sem erros no console

## Screenshots

Adicionar screenshots em: `screenshots/`
- `local-desenvolvimento.png`
- `local-funcionando.png`
- `ts-upload.png`
- `ts-configurado.png`
- `ts-resultado-final.png`

## Changelog

### v1.1.0 (2025-01-XX)
- ✅ **Corrigido**: Acesso aos dados do DataModel (suporte para arrays de arrays e objetos)
- ✅ **Corrigido**: Cálculo da média usando extração direta dos valores
- ✅ **Corrigido**: Criação de campo calculado usando `calculateVariable` corretamente
- ✅ **Corrigido**: Color encoding com campo de dimensão e range de cores
- ✅ Funcionando: Cores condicionais aplicadas corretamente (verde/vermelho/amarelo)

### v1.0.0 (2025-01-XX)
- Implementação inicial
- Conditional color encoding baseado em benchmark dinâmico
- Suporte a três níveis de cor (acima/abaixo/próximo)

## 📚 Documentação Adicional

- **[GUIA_MUZE_STUDIO.md](./GUIA_MUZE_STUDIO.md)** - Guia passo a passo para usar no Muze Studio
- **[COMO_USAR.md](./COMO_USAR.md)** - Instruções de uso no ThoughtSpot
- **[ACHADOS_E_APRENDIZADOS.md](./ACHADOS_E_APRENDIZADOS.md)** - Problemas encontrados e soluções aplicadas ⭐

## 🔑 Principais Aprendizados

Para desenvolvedores futuros, consulte **[ACHADOS_E_APRENDIZADOS.md](./ACHADOS_E_APRENDIZADOS.md)** que documenta:
- Como acessar corretamente os dados do DataModel do ThoughtSpot
- Como calcular a média dos valores
- Como criar campos calculados usando `calculateVariable`
- Como aplicar color encoding condicional

## Evidências

As evidências dos testes devem ser documentadas conforme o processo de validação de cada chart.




