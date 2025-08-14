# 🐳 Docker Hub - Project 2.0

## 📦 Immagini Disponibili

Le immagini Docker del progetto sono pubblicate su Docker Hub:

- **API Server**: [`elementmedica/project-api`](https://hub.docker.com/r/elementmedica/project-api)
- **Proxy Server**: [`elementmedica/project-proxy`](https://hub.docker.com/r/elementmedica/project-proxy)

## 🚀 Utilizzo Rapido

### Avvio con Docker Compose
```bash
# Scarica e avvia tutti i servizi
docker-compose up -d

# Forza il download delle immagini aggiornate
docker-compose pull && docker-compose up -d
```

### Utilizzo Singole Immagini
```bash
# API Server (porta 4001)
docker run -d -p 4001:4001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="file:./dev.db" \
  --name project-api \
  elementmedica/project-api:latest

# Proxy Server (porta 4003)
docker run -d -p 4003:4003 \
  -e NODE_ENV=production \
  -e API_BASE_URL="http://localhost:4001" \
  --name project-proxy \
  elementmedica/project-proxy:latest
```

## 🔧 Sviluppo e Deployment

### Push Nuove Versioni
```bash
# Utilizza lo script automatizzato
./docker-push-hub.sh

# Oppure manualmente:
docker build -f backend/Dockerfile.api -t elementmedica/project-api:latest --target production backend/
docker build -f backend/Dockerfile.proxy -t elementmedica/project-proxy:latest --target production backend/
docker push elementmedica/project-api:latest
docker push elementmedica/project-proxy:latest
```

### Versioning
```bash
# Crea tag versionati
docker tag elementmedica/project-api:latest elementmedica/project-api:v1.0.0
docker tag elementmedica/project-proxy:latest elementmedica/project-proxy:v1.0.0

# Push versioni specifiche
docker push elementmedica/project-api:v1.0.0
docker push elementmedica/project-proxy:v1.0.0
```

## 🏗️ Architettura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Proxy Server  │    │   API Server    │
│   (Port 5173)   │───▶│   (Port 4003)   │───▶│   (Port 4001)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (SQLite)      │
                       └─────────────────┘
```

## 🔒 Configurazione Sicurezza

### Variabili d'Ambiente Richieste
```bash
# API Server
NODE_ENV=production
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173

# Proxy Server
NODE_ENV=production
API_BASE_URL=http://api:4001
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Porte di Default
- **Frontend**: 5173
- **Proxy**: 4003
- **API**: 4001
- **Database**: Interno (SQLite)

## 🧪 Test e Verifica

### Health Checks
```bash
# Verifica API Server
curl http://localhost:4001/health

# Verifica Proxy Server
curl http://localhost:4003/health

# Test login
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@example.com","password":"Admin123!"}'
```

### Logs
```bash
# Visualizza logs di tutti i servizi
docker-compose logs -f

# Logs specifici
docker-compose logs -f api
docker-compose logs -f proxy
```

## 🚨 Troubleshooting

### Problemi Comuni

1. **Porta già in uso**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. **Immagini non aggiornate**
   ```bash
   docker-compose pull
   docker-compose up -d --force-recreate
   ```

3. **Problemi di rete**
   ```bash
   docker network ls
   docker network prune
   ```

4. **Reset completo**
   ```bash
   docker-compose down -v
   docker system prune -a
   docker-compose up -d
   ```

## 📝 Note

- Le immagini sono ottimizzate per produzione con multi-stage build
- Il database SQLite è persistente tramite volume Docker
- CORS configurato per sviluppo locale (localhost:5173)
- Rate limiting attivo sul proxy (100 req/15min)
- Graceful shutdown implementato su tutti i servizi

---

**Ultimo aggiornamento**: Gennaio 2025  
**Versione**: v1.0.0  
**Maintainer**: elementmedica