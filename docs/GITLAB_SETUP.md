# Configuração do GitLab

## Status Atual

✅ **Repositório Git inicializado**
- Commit inicial realizado
- 82 arquivos adicionados
- Estrutura organizada e pronta
- ✅ Remote configurado: `https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts.git`
- ⚠️ **Aguardando autenticação** para fazer push

## Próximos Passos para Conectar ao GitLab

### 1. Repositório no GitLab

✅ **Repositório já existe**: `https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts`

### 2. Adicionar Remote do GitLab

**URL do Repositório:** `https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts.git`

```bash
# Remote já configurado:
git remote -v

# Se precisar reconfigurar:
git remote set-url origin https://code.ifoodcorp.com.br/ifood/data/viz/custom-charts.git
```

### 3. Autenticação

⚠️ **Importante**: O acesso ao GitLab do iFood requer **SSO authentication** em vez de senha via HTTPS.

#### Opção A: Usar SSH (Recomendado) ⭐

1. ✅ **Chave SSH já existe**: `~/.ssh/id_ed25519.pub`

2. **Adicionar chave SSH ao GitLab**:
   - Acesse: https://code.ifoodcorp.com.br/-/profile/keys
   - Ou: Settings → SSH Keys
   - Cole sua chave pública (veja abaixo como obter)

3. **Converter remote para SSH**:
   ```bash
   git remote set-url origin git@code.ifoodcorp.com.br:ifood/data/viz/custom-charts.git
   ```

4. **Testar conexão SSH**:
   ```bash
   ssh -T git@code.ifoodcorp.com.br
   ```

5. **Fazer push**:
   ```bash
   git push -u origin main
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

