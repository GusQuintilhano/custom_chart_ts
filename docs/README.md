# Documentação - Projeto de Gráficos Customizados

Esta pasta contém toda a documentação do projeto de gráficos customizados para ThoughtSpot, servindo como **base de conhecimento** para desenvolvimento de novos charts usando **Muze Studio** ou **ThoughtSpot Chart SDK**.

## 🎯 Visão Geral

Este projeto suporta duas abordagens principais para criar gráficos customizados:

1. **Muze Studio** - Charts desenvolvidos diretamente no ThoughtSpot usando a biblioteca Muze
2. **Chart SDK** - Charts desenvolvidos externamente e hospedados (ex: Railway, Vercel)

## 📁 Estrutura

```
docs/
├── muze/                    # 📚 Documentação Muze Studio
│   ├── guias/              # Guias práticos de uso
│   ├── aprendizados/       # Lições aprendidas
│   ├── referencia/         # Documentação oficial
│   └── exemplos/           # Charts desenvolvidos
│
├── sdk/                     # 🎨 Documentação Chart SDK
│   ├── guias/              # Guias práticos de implementação
│   ├── aprendizados/       # Lições aprendidas
│   ├── referencia/         # Documentação técnica oficial
│   └── exemplos/           # Charts desenvolvidos
│
├── testes/                  # 🧪 Testes de Integração
│   ├── DEPLOY.md
│   ├── EMPACOTAMENTO.md
│   └── A3.X/               # Fases de teste
│
└── _meta/                   # 📋 Documentação Meta
    ├── ESTRUTURA_FINAL.md
    ├── ORGANIZACAO_COMPLETA.md
    ├── HISTORICO_OTIMIZACOES.md
    ├── GITLAB_PUSH_STATUS.md
    └── GITLAB_SETUP.md
```

## 🚀 Início Rápido

### Para Criar um Chart com Muze Studio

1. **Aprenda**: [`muze/aprendizados/aprendizados-completos.md`](./muze/aprendizados/aprendizados-completos.md)
2. **Use**: [`muze/guias/guia-completo.md`](./muze/guias/guia-completo.md)
3. **Veja exemplos**: [`muze/exemplos/charts/`](./muze/exemplos/charts/)

### Para Criar um Chart com Chart SDK

1. **Aprenda**: [`sdk/aprendizados/aprendizados-completos.md`](./sdk/aprendizados/aprendizados-completos.md)
2. **Veja exemplo**: [`sdk/exemplos/trellis-chart/`](./sdk/exemplos/trellis-chart/)
3. **Referência**: [`sdk/referencia/documentacao-tecnica-oficial.md`](./sdk/referencia/documentacao-tecnica-oficial.md)

## 📚 Documentos Principais

### ⭐ Muze Studio

- **`muze/aprendizados/aprendizados-completos.md`** - Todas as lições sobre Muze
- **`muze/guias/guia-completo.md`** - Guia prático de uso e implantação

### ⭐ Chart SDK

- **`sdk/aprendizados/aprendizados-completos.md`** - Todas as lições sobre Chart SDK
- **`sdk/referencia/documentacao-tecnica-oficial.md`** - Referência técnica consolidada

### 🧪 Testes

- **`testes/EMPACOTAMENTO.md`** - Processo de empacotamento
- **`testes/DEPLOY.md`** - Processo de implantação

## 🎯 Quando Usar Cada Abordagem

### Use Muze Studio quando:
- ✅ Você quer desenvolver rapidamente dentro do ThoughtSpot
- ✅ Não precisa de hospedagem externa
- ✅ Quer atualizar facilmente (re-upload do .zip)
- ✅ Charts mais simples

### Use Chart SDK quando:
- ✅ Você precisa de mais flexibilidade na renderização
- ✅ Quer deploy automático e versionamento
- ✅ Precisa de configurações visuais dinâmicas avançadas
- ✅ Charts mais complexos

## 📊 Estatísticas

- **Total de documentos**: 30+ arquivos
- **Documentos consolidados**: 3 principais
- **Estrutura**: 2 categorias principais (muze, sdk) + testes

## 🔗 Links Rápidos

- [Aprendizados Muze](./muze/aprendizados/aprendizados-completos.md)
- [Guia Muze](./muze/guias/guia-completo.md)
- [Aprendizados SDK](./sdk/aprendizados/aprendizados-completos.md)
- [Exemplo SDK](./sdk/exemplos/trellis-chart/)
- [Testes de Integração](./testes/)

## 📝 Convenções

- **Documentos principais** são marcados com ⭐
- **Guias** são documentos práticos passo-a-passo
- **Aprendizados** são lições consolidadas e templates
- **Referência** são documentações oficiais
- **Exemplos** são implementações práticas funcionais

---

**Última atualização:** 2025-01-03  
**Estrutura:** ✅ Estrutura final organizada e consolidada
