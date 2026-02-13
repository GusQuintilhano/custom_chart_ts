# Guia de Contribuição

Obrigado por considerar contribuir para este projeto! Este documento fornece diretrizes para contribuições.

## Como Contribuir

### 1. Estrutura do Projeto

- **`dev/charts/`**: Charts em desenvolvimento/teste
- **`muze/`**: Charts Muze de produção
- **`sdk/`**: Charts SDK de produção
- **`docs/`**: Documentação completa do projeto

### 2. Processo de Desenvolvimento

1. **Desenvolva em `dev/charts/`**
   - Crie ou modifique charts na pasta `dev/charts/`
   - Teste localmente antes de commitar

2. **Documente suas mudanças**
   - Atualize a documentação em `docs/` se necessário
   - Adicione comentários no código quando apropriado

3. **Empacote e teste**
   ```bash
   cd dev/charts/seu-chart
   ./build.sh
   ```

4. **Quando pronto para produção**
   - Mova o chart de `dev/charts/` para `muze/` ou `sdk/`
   - Atualize a documentação

### 3. Padrões de Código

- Use JavaScript/TypeScript seguindo as convenções do projeto
- Mantenha código limpo e bem comentado
- Siga os padrões estabelecidos nos charts existentes

### 4. Commits

- Use mensagens de commit descritivas
- Referencie issues quando aplicável
- Commits pequenos e focados são preferíveis

### 5. Pull Requests

- Crie uma branch descritiva para sua feature
- Inclua descrição clara das mudanças
- Referencie issues relacionadas
- Certifique-se de que os builds passam

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

