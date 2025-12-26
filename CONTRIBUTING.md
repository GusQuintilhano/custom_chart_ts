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

## Dúvidas?

Entre em contato com o time de Data Visualization do iFood.

