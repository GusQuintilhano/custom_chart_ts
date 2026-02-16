# Guia de Contribuição

Obrigado por considerar contribuir para este projeto! Este documento fornece diretrizes para contribuições.

## Como Contribuir

### 1. Estrutura do Projeto

- **`trellis-chart/`**: Chart Trellis (ThoughtSpot Chart SDK)
- **`boxplot-chart/`**: Chart Boxplot (ThoughtSpot Chart SDK)
- **`charts-router/`**: Servidor Express que roteia `/trellis` e `/boxplot` e expõe APIs de analytics e observabilidade
- **`shared/`**: Utilitários e tipos compartilhados entre os charts
- **`docs/`**: Documentação do projeto (deploy, observabilidade, SDK)

### 2. Processo de Desenvolvimento

1. **Desenvolva no chart correspondente**
   - Edite em `trellis-chart/` ou `boxplot-chart/` conforme o gráfico
   - Use `shared/` para código comum
   - Teste localmente com o charts-router antes de commitar

2. **Documente suas mudanças**
   - Atualize a documentação em `docs/` se necessário
   - Adicione comentários no código quando apropriado

3. **Build e teste**
   ```bash
   cd trellis-chart && npm run build
   cd ../boxplot-chart && npm run build
   cd ../charts-router && npm run build && npm start
   ```

4. **Quando pronto**
   - Abra MR e garanta que o build e os testes passem
   - Atualize o CHANGELOG.md na seção [Unreleased] se for mudança relevante

### 3. Padrões de Código

- Use JavaScript/TypeScript seguindo as convenções do projeto
- Mantenha código limpo e bem comentado
- Siga os padrões estabelecidos nos charts existentes

### 4. Commits

- Use mensagens de commit descritivas
- Referencie issues quando aplicável
- Commits pequenos e focados são preferíveis

### 5. Merge Requests (MR)

- Crie uma branch descritiva para sua feature.
- Sempre inclua uma descrição curta da MR (o assistente pode gerar quando pedido).
- Referencie issues relacionadas quando houver.
- Certifique-se de que os builds passam.

### 6. Versionamento

O projeto segue [Semantic Versioning](https://semver.org/) e [Keep a Changelog](https://keepachangelog.com/). A versão é única no repositório (arquivo `VERSION` e `package.json` na raiz).

**Para dar release (bump + tag + push):**

```bash
# Bump patch (0.1.1 -> 0.1.2), commit + tag v0.1.2 + push
python scripts/bump_version.py patch

# Bump minor (0.1.2 -> 0.2.0)
python scripts/bump_version.py minor

# Só atualizar arquivos, sem commit/tag/push
python scripts/bump_version.py patch --no-commit --no-tag --no-push
```

O script atualiza `VERSION`, `package.json` e `CHANGELOG.md` (seção da nova versão e links de compare). Antes de rodar, preencha a seção `[Unreleased]` do `CHANGELOG.md` com as mudanças. Tag criada: `vX.Y.Z` (ex.: `v0.1.2`). A pipeline do GitLab usa a tag para build e publicação da imagem.

## Dúvidas?

Entre em contato com o time de Data Visualization do iFood.

