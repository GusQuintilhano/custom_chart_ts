# SDK Charts - Produção

Esta pasta contém os **Chart SDK finais de produção**, hospedados externamente e prontos para uso no ThoughtSpot.

## 📊 Charts Disponíveis

### Trellis Chart

- **Localização:** [`trellis-chart/`](./trellis-chart/)
- **Tipo:** Chart SDK hospedado no Railway
- **URL:** https://ts-custom-charts-production.up.railway.app
- **Descrição:** Chart que permite visualizar múltiplas medidas simultaneamente em formato "crosschart"

## 🚀 Como Usar

### Deploy de um Chart SDK

1. Desenvolva o chart em [`../dev/`](../dev/) ou diretamente nesta pasta
2. Configure o deploy (Railway, Vercel, etc.)
3. Configure o CSP no ThoughtSpot para permitir o domínio
4. O chart estará disponível para uso em visualizações

### Atualizar um Chart SDK

Para charts hospedados externamente, basta fazer deploy da nova versão:

```bash
cd trellis-chart
./deploy.sh
```

## 📚 Documentação

Para aprender como desenvolver novos charts SDK:
- **[Aprendizados SDK](../docs/sdk/aprendizados/aprendizados-completos.md)** - Lições fundamentais
- **[Guia Completo](../docs/sdk/guias/guia-completo.md)** - Guia prático passo-a-passo
- **[Exemplos](../docs/sdk/exemplos/trellis-chart/)** - Exemplo completo: Trellis Chart

## 🔗 Links Relacionados

- [Documentação Completa](../docs/)
- [Charts Muze de Produção](../muze/)
- [Charts de Desenvolvimento](../dev/charts/)

---

**Nota:** Esta pasta contém apenas charts SDK de produção. Para desenvolvimento e testes, consulte [`../dev/`](../dev/).

