# Configuração Railway - custom_charts-railway

## 🎯 **Objetivo**
Este projeto (`custom_charts-railway`) é dedicado exclusivamente ao **Railway** e serve como:
- ✅ **Ambiente de produção atual** (enquanto GitLab não está 100%)
- ✅ **Ambiente de desenvolvimento/teste** (futuro)
- ✅ **Versão simplificada** sem dependências internas do iFood

## ⚙️ **Configurações Recomendadas no Painel Railway**

### **1. Source Settings**
```
Repository: seu-repo/custom_charts-railway
Branch: main (ou develop, conforme sua preferência)
Auto Deploy: ✅ Enabled
Root Directory: / (raiz do projeto)
```

### **2. Build Settings**
```
Builder: Nixpacks
Build Command: (automático via railway.json)
Start Command: (automático via railway.json)
```

### **3. Environment Variables**
```bash
NODE_ENV=production
PORT=3000
ANALYTICS_ENABLED=true
ANALYTICS_STORAGE_TYPE=file
DEBUG=false
```

### **4. Deploy Settings**
```
Restart Policy: ON_FAILURE
Max Retries: 10
Health Check: /health
```

## 📁 **Estrutura Específica Railway**

```
custom_charts-railway/
├── Dockerfile              # ✅ Versão simplificada (sem golden image)
├── railway.json            # ✅ Configuração Railway
├── nixpacks.toml          # ✅ Build configuration
├── docker-compose.yml     # ✅ Para desenvolvimento local
└── charts-router/
    ├── start.sh           # ✅ Script de entrada
    └── fix-imports.js     # ✅ Fix ES modules
```

## 🔄 **Workflow Recomendado**

### **Desenvolvimento**
1. Desenvolver em branch `develop` ou `feature/*`
2. Push para Railway faz deploy automático
3. Testar no ambiente Railway

### **Produção (Atual)**
1. Merge para `main`
2. Deploy automático no Railway
3. Monitorar logs e analytics

### **Futuro (Quando GitLab estiver 100%)**
1. Railway vira ambiente de desenvolvimento
2. GitLab CI/CD vira produção
3. Manter ambos funcionando para redundância

## 🚀 **Comandos Úteis**

### **Deploy Manual (se necessário)**
```bash
# No painel Railway, ir em Deployments > Deploy Now
```

### **Logs**
```bash
# No painel Railway, ir em Deployments > View Logs
```

### **Rollback**
```bash
# No painel Railway, ir em Deployments > Redeploy versão anterior
```

## 📊 **Monitoramento**

### **Health Check**
- URL: `https://seu-app.railway.app/health`
- Retorna status dos charts e servidor

### **Analytics**
- Endpoint: `https://seu-app.railway.app/api/analytics/stats`
- Logs locais em `/app/logs/analytics-YYYY-MM-DD.jsonl`

## ⚠️ **Limitações Railway vs GitLab**

### **Railway (Atual)**
- ✅ Deploy rápido e simples
- ✅ Sem dependências internas iFood
- ❌ Não usa golden image iFood
- ❌ Registry público

### **GitLab CI/CD (Futuro)**
- ✅ Golden image iFood
- ✅ Registry interno seguro
- ✅ Integração com infraestrutura iFood
- ❌ Mais complexo de configurar

## 🔧 **Troubleshooting**

### **Build Failures**
1. Verificar `railway.json` e `nixpacks.toml`
2. Verificar se todas as dependências estão no `package.json`
3. Verificar logs de build no painel Railway

### **Runtime Errors**
1. Verificar `start.sh` e caminhos de arquivos
2. Verificar variáveis de ambiente
3. Verificar logs de runtime no painel Railway

### **Import Errors**
1. Verificar se `fix-imports.js` está funcionando
2. Verificar configuração ES modules no `tsconfig.json`
3. Verificar se extensões `.js` estão sendo adicionadas