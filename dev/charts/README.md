# Custom Charts - Desenvolvimento

Esta pasta contém os **Custom Charts em desenvolvimento** desenvolvidos com Muze Studio. Estes são charts de teste e desenvolvimento.

**Para charts de produção, consulte [`../../muze/`](../../muze/).**

## 📊 Charts Disponíveis

### Chart 01 - Encodings Avançados
**Nome no ThoughtSpot:** `ifood-muze-conditional-colors`
- Gráfico de barras com color encoding condicional baseado em benchmark dinâmico
- [Documentação](./chart-01-encodings/)

### Chart 02 - Múltiplas Layers
**Nome no ThoughtSpot:** `ifood-muze-layered-chart`
- Composição complexa com layers de barras, pontos e texto sobrepostos
- [Documentação](./chart-02-layers/)

### Chart 03 - Transformações DataModel
**Nome no ThoughtSpot:** `ifood-muze-ranked-bars`
- Window functions para cálculo de rank e percentual acumulado
- [Documentação](./chart-03-transforms/)

### Chart 04 - Interatividade
**Nome no ThoughtSpot:** `ifood-muze-interactive-dual`
- Dois gráficos interconectados com filtros dinâmicos
- [Documentação](./chart-04-interactivity/)

### Chart 05 - Customização de Layout
**Nome no ThoughtSpot:** `ifood-muze-branded-chart`
- Chart com tema customizado seguindo design system do iFood
- [Documentação](./chart-05-customization/)

### Chart 06 - Box Plot Avançado
**Nome no ThoughtSpot:** `ifood-muze-boxplot`
- Visualização estatística com cálculo de quartis e identificação de outliers
- [Documentação](./chart-06-boxplot/)

### Chart 07 - Multi-Measures
**Nome no ThoughtSpot:** `ifood-muze-multi-measures`
- Chart com suporte a múltiplas medidas
- [Documentação](./chart-06-multi-measures/)

## 🚀 Como Usar

### Empacotar um Chart

Cada chart possui um script `build.sh` que gera o pacote `.zip` pronto para upload no ThoughtSpot:

```bash
cd chart-01-encodings
./build.sh
# O arquivo .zip será gerado em dist/
```

### Testar Localmente

Antes de empacotar, você pode testar localmente:

```bash
cd chart-01-encodings
# Abrir src/index.html em um servidor local
python -m http.server 8000
# Acessar http://localhost:8000/src/index.html
```

### Upload no ThoughtSpot

1. Empacote o chart usando `build.sh`
2. Acesse o ThoughtSpot → Custom Charts → Upload
3. Faça upload do arquivo `.zip` gerado em `dist/`
4. O chart estará disponível para uso em visualizações

## 📚 Documentação

Para aprender como desenvolver novos charts:
- **[Aprendizados Muze](../../docs/muze/aprendizados/aprendizados-completos.md)** - Lições fundamentais
- **[Guia Completo](../../docs/muze/guias/guia-completo.md)** - Guia prático passo-a-passo
- **[Exemplos](../../docs/muze/exemplos/charts/)** - Exemplos e casos de uso

## 🔗 Links Relacionados

- [Documentação Completa](../../docs/)
- [Charts de Produção Muze](../../muze/)
- [Charts SDK de Produção](../../sdk/)

---

**Nota:** Estes são charts de desenvolvimento e teste. Os charts finais de produção estão em [`../../muze/`](../../muze/) e [`../../sdk/`](../../sdk/).

