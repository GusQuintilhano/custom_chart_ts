# Trellis Chart - Exemplo Prático

Este é o **Trellis Chart** - um exemplo completo de chart desenvolvido usando o **ThoughtSpot Chart SDK**.

## 🎯 Visão Geral

Este projeto implementa um chart customizado que permite visualizar múltiplas medidas simultaneamente em formato "crosschart" (uma medida abaixo da outra), onde cada medida tem seu próprio eixo Y individualizado, suportando múltiplas dimensões no eixo X.

## 🏗️ Estrutura do Projeto

```
trellis-chart/
├── src/                    # Código fonte TypeScript
│   ├── index.ts           # Implementação principal do Chart SDK
│   └── test-local.ts      # Código para testes locais
├── dist/                   # Build de produção (gerado automaticamente)
├── deploy.sh              # Script de deploy para Railway
└── docs/                   # Documentação técnica (movida para docs/sdk/)
```

## 🛠️ Tecnologias

- **ThoughtSpot Chart SDK**: Framework para criação de charts customizados
- **TypeScript**: Linguagem de programação
- **Vite**: Build tool
- **Railway**: Plataforma de hospedagem
- **SVG nativo**: Renderização (sem bibliotecas externas)

## 🚀 Deploy

O chart está hospedado no Railway. Para fazer deploy:

```bash
./deploy.sh
```

## 📚 Documentação

Toda a documentação técnica está organizada em [`../../`](../../):

### Documentação Principal

- **[Aprendizados Completos](../../aprendizados/aprendizados-completos.md)** ⭐
  - Todas as lições fundamentais sobre Chart SDK
  - Como inicializar o Chart Context
  - Como processar dados do ThoughtSpot
  - Template completo de código
  - 9 problemas encontrados e soluções

- **[Aprendizados e Achados](../../aprendizados/aprendizados-e-achados.md)**
  - Histórico detalhado de desenvolvimento
  - Evolução completa do código
  - Limitações conhecidas

- **[columnsVizPropDefinition](../../aprendizados/columns-viz-prop-definition.md)**
  - Guia detalhado sobre configurações por coluna
  - Impacto prático e migração

- **[Documentação Técnica Oficial](../../referencia/documentacao-tecnica-oficial.md)**
  - Referência técnica consolidada
  - API Reference

## ✅ Status

- ✅ Implementação completa e funcional
- ✅ Suporte a múltiplas dimensões e medidas
- ✅ Eixos Y individualizados
- ✅ Configurações visuais por medida
- ⚠️ Limitação conhecida: nova medida não aparece imediatamente

## 🔗 Links Úteis

- [Documentação SDK Completa](../../)
- [Aprendizados Completos](../../aprendizados/aprendizados-completos.md)
- [Testes de Integração](../../../testes/)

---

**Nota:** Este é um exemplo prático. Para desenvolver seu próprio chart SDK, consulte a documentação em [`../../`](../../).
