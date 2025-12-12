# Documentação do Projeto Muze

Esta pasta contém toda a documentação do projeto, organizada em duas categorias principais: **Muze Studio** e **Custom Charts**.

## 📁 Estrutura

### 📚 Muze Studio (`muze/`)
Documentação sobre a biblioteca Muze Studio e como usá-la:

- **APRENDIZADOS_COMPLETOS.md** ⭐ - **Documento principal consolidado**
  - Todas as lições fundamentais sobre Muze
  - Como usar o DataModel do ThoughtSpot
  - Como acessar dados corretamente
  - Como criar campos calculados
  - Como aplicar color encoding
  - Template completo de código
  - Checklist para novos charts

- **muze_documentation_complete.md** - Referência à documentação oficial

### 🎨 Custom Charts (`custom-charts/`)
Documentação sobre os Custom Charts desenvolvidos:

- **GUIA_COMPLETO.md** ⭐ - **Guia principal consolidado**
  - Como usar no Muze Studio (editor interativo)
  - Como fazer upload como Custom Chart tradicional
  - Processo de empacotamento
  - Troubleshooting completo

- **charts/**: Documentação dos Custom Charts tradicionais
  - Chart 01 - Encodings: Achados e aprendizados
  - Chart 06 - Multi-Measures: Análise de problemas

- **trellis-chart/**: Documentação do Trellis Chart SDK
  - **APRENDIZADOS_COMPLETOS.md** ⭐ - **Documento principal consolidado**
    - Todas as lições fundamentais sobre Chart SDK
    - Como inicializar o Chart Context
    - Como processar dados do ThoughtSpot
    - Template completo de código
  - Guia completo da aba Configure
  - Guia completo sobre columnsVizPropDefinition
  - Soluções para forçar atualização

### 🧪 Testes de Integração (`integration-tests/`)
Documentação dos testes de integração:

- A3.1 - Empacotamento (✅ Documentado)
- A3.2 - Implantação (✅ Documentado)
- A3.3 - Teste de Acesso (⏳ A implementar)
- A3.4 - Persistência (⏳ A implementar)
- A3.5 - Filtros Globais (⏳ A implementar)
- A3.6 - Manutenção (⏳ A implementar)

### 📋 Meta (`_meta/`)
Documentação sobre organização e histórico do projeto:

- Histórico de otimizações
- Organização completa
- Status do GitLab

## 📚 Como Navegar

### Para Aprender Muze Studio
1. **Comece por**: `muze/APRENDIZADOS_COMPLETOS.md`
   - Documento consolidado com todas as informações
   - Exemplos práticos e código completo

### Para Criar Custom Charts
1. **Para charts tradicionais**: `custom-charts/GUIA_COMPLETO.md`
   - Guia passo a passo completo
   - Duas formas de usar (Muze Studio e Upload)

2. **Para Chart SDK (Trellis Chart)**: `custom-charts/trellis-chart/APRENDIZADOS_COMPLETOS.md`
   - Todas as lições sobre ThoughtSpot Chart SDK
   - Template completo de código
   - Guia de implementação

### Para Processos de Integração
1. **Consulte**: `integration-tests/`
   - Documentação de cada fase de teste

## 🎯 Documentos Principais

### ⭐ Documentos Consolidados (Mais Completos)

1. **`muze/APRENDIZADOS_COMPLETOS.md`**
   - Todas as lições sobre Muze Studio
   - Template completo de código
   - Soluções para problemas comuns

2. **`custom-charts/GUIA_COMPLETO.md`**
   - Guia completo de uso e implantação
   - Muze Studio + Upload tradicional
   - Empacotamento e troubleshooting

3. **`custom-charts/trellis-chart/APRENDIZADOS_COMPLETOS.md`**
   - Todas as lições sobre ThoughtSpot Chart SDK
   - Como inicializar Chart Context
   - Como processar dados do ThoughtSpot
   - Template completo de código
   - Deploy e configuração

## 📊 Estatísticas

- **Total de documentos**: 30+ arquivos
- **Documentos consolidados**: 2 principais
- **Estrutura**: 3 categorias principais (muze, custom-charts, integration-tests)

## 🔗 Links Rápidos

- [Aprendizados Muze](./muze/APRENDIZADOS_COMPLETOS.md)
- [Guia Custom Charts](./custom-charts/GUIA_COMPLETO.md)
- [Trellis Chart](./custom-charts/trellis-chart/)
- [Testes de Integração](./integration-tests/)
