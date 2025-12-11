# Configuração do GitLab

## Status Atual

✅ **Repositório Git inicializado**
- Commit inicial realizado
- 82 arquivos adicionados
- Estrutura organizada e pronta

## Próximos Passos para Conectar ao GitLab

### 1. Criar o Repositório no GitLab

1. Acesse o GitLab do iFood
2. Crie um novo projeto/repositório
3. **NÃO** inicialize com README, .gitignore ou licença (já temos)
4. Copie a URL do repositório (ex: `https://gitlab.ifood.com/...`)

### 2. Adicionar Remote do GitLab

```bash
# Adicionar o remote (substitua pela URL do seu repositório)
git remote add origin <URL_DO_REPOSITORIO_GITLAB>

# Verificar se foi adicionado corretamente
git remote -v
```

### 3. Autenticação

⚠️ **Importante**: O acesso ao GitLab do iFood requer **SSO authentication** em vez de senha via HTTPS.

#### Opção A: Usar SSH (Recomendado)

1. **Gerar chave SSH** (se ainda não tiver):
   ```bash
   ssh-keygen -t ed25519 -C "seu-email@ifood.com"
   ```

2. **Adicionar chave SSH ao GitLab**:
   - Copie a chave pública: `cat ~/.ssh/id_ed25519.pub`
   - No GitLab: Settings → SSH Keys → Adicionar chave

3. **Usar URL SSH** ao adicionar o remote:
   ```bash
   git remote add origin git@gitlab.ifood.com:grupo/projeto.git
   ```

#### Opção B: Usar HTTPS com Personal Access Token

1. **Criar Personal Access Token** no GitLab:
   - Settings → Access Tokens
   - Criar token com permissões `write_repository`

2. **Usar token como senha** ao fazer push:
   ```bash
   git remote add origin https://gitlab.ifood.com/grupo/projeto.git
   # Quando pedir senha, use o token
   ```

### 4. Fazer Push para o GitLab

```bash
# Renomear branch para main (se necessário)
git branch -M main

# Fazer push do código
git push -u origin main
```

### 5. Verificar

Acesse o repositório no GitLab e verifique se todos os arquivos foram enviados corretamente.

---

## Comandos Úteis

### Verificar Status
```bash
git status
git remote -v
```

### Verificar Branch
```bash
git branch
```

### Fazer Push de Mudanças Futuras
```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

### Atualizar do GitLab
```bash
git pull origin main
```

---

## Estrutura Enviada

O repositório contém:
- ✅ Documentação completa em `docs/`
- ✅ Código dos Custom Charts em `muze-tests/`
- ✅ Trellis Chart SDK em `trellis-chart/`
- ✅ Scripts e configurações
- ✅ `.gitignore` configurado (node_modules, dist, etc. não serão enviados)

---

## Notas Importantes

1. **Arquivos ignorados**: `node_modules/`, `dist/`, `*.zip`, `TASK.md` e outros conforme `.gitignore`
2. **SSO Authentication**: Use SSH ou Personal Access Token para autenticação
3. **Branch padrão**: O repositório usa `main` como branch padrão

---

## Troubleshooting

### Erro de autenticação
- Verifique se está usando SSH ou Personal Access Token
- Confirme que a chave SSH está adicionada ao GitLab

### Erro ao fazer push
- Verifique se o repositório foi criado no GitLab
- Confirme que você tem permissões de escrita
- Verifique a URL do remote: `git remote -v`

### Arquivos não aparecem no GitLab
- Verifique se foram adicionados: `git status`
- Confirme que foram commitados: `git log`
- Verifique se o push foi feito: `git push -u origin main`

