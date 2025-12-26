# Guia Docker

Este projeto está configurado para funcionar completamente com Docker.

## 🚀 Início Rápido

### Usando Docker Compose (Recomendado)

```bash
# Subir o ambiente completo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar o ambiente
docker-compose down
```

O servidor estará disponível em: http://localhost:8080

### Usando Docker diretamente

```bash
# Construir a imagem
docker build -t ifood-muze-charts .

# Executar o container
docker run -p 8080:8080 -v $(pwd):/app ifood-muze-charts

# Ou usar os scripts npm
npm run docker:build
npm run docker:run
```

## 📋 Comandos Disponíveis

### NPM Scripts

```bash
npm run docker:build    # Construir imagem Docker
npm run docker:run      # Executar container
npm run docker:up       # Subir com docker-compose
npm run docker:down     # Parar docker-compose
npm run serve           # Servidor de desenvolvimento (no container)
```

### Docker Compose

```bash
docker-compose up -d           # Subir em background
docker-compose up              # Subir e ver logs
docker-compose down            # Parar e remover containers
docker-compose restart         # Reiniciar containers
docker-compose logs -f         # Ver logs em tempo real
docker-compose exec dev-server bash  # Acessar shell do container
```

## 🏗️ Estrutura do Container

- **Base**: Node.js 18 Alpine
- **Porta**: 8080
- **Workdir**: `/app`
- **Volumes**: Código montado para hot-reload

## 🔧 Desenvolvimento

O container está configurado com:
- ✅ Node.js 18
- ✅ Python 3 (para scripts que precisam)
- ✅ Git e Bash
- ✅ Hot-reload com volumes
- ✅ Healthcheck configurado

## 📦 Build de Charts no Docker

```bash
# Acessar o container
docker-compose exec dev-server bash

# Dentro do container, executar builds
cd dev/integration-tests/A3.1-empacotamento
./build-all.sh
```

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Alterar porta no docker-compose.yml
ports:
  - "8081:8080"  # Usar porta 8081 no host
```

### Rebuild da imagem
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Ver logs de erro
```bash
docker-compose logs dev-server
```

## 🔄 CI/CD

O GitLab CI está configurado para:
- ✅ Validar estrutura
- ✅ Build dos charts
- ✅ Build da imagem Docker (manual)
- ✅ Push para registry (quando configurado)

