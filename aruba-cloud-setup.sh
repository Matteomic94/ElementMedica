#!/bin/bash

# Script Setup Aruba Cloud
# Project 2.0 - Sistema Medicina del Lavoro
# Versione: 1.0 per Aruba Cloud

echo "🚀 SETUP ARUBA CLOUD - PROJECT 2.0"
echo "==================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verifica directory corrente
log_info "Directory corrente: $(pwd)"
log_info "Contenuto directory:"
ls -la

echo ""
echo "📋 FASE 1: CREAZIONE FILE .ENV"
echo "=============================="

# Crea file .env se non esiste
if [ ! -f "backend/.env" ]; then
    log_info "Creazione file backend/.env..."
    mkdir -p backend
    cat > backend/.env << 'EOF'
# Environment Configuration for Aruba Cloud
# Project 2.0 - Sistema Medicina del Lavoro

# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/elementmedica"
SHADOW_DATABASE_URL="postgresql://postgres:password@localhost:5432/elementmedica_shadow"

# Application Environment
NODE_ENV=production
PORT=4001
PROXY_PORT=4003

# JWT Configuration
JWT_SECRET="aruba-cloud-jwt-secret-2024"
JWT_REFRESH_SECRET="aruba-cloud-refresh-secret-2024"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption Configuration
ENCRYPTION_KEY="aruba-cloud-encryption-key-32char"
ENCRYPTION_ALGORITHM="aes-256-gcm"

# Redis Configuration
REDIS_ENABLED=false

# GDPR Configuration
GDPR_RETENTION_DAYS="2555"
GDPR_ADMIN_EMAIL="admin@elementmedica.com"
GDPR_COMPANY_NAME="Element Medica"
GDPR_COMPANY_ADDRESS="Via Example 123, Milano"
GDPR_DPO_EMAIL="dpo@elementmedica.com"

# Session Management
SESSION_TIMEOUT_MINUTES="30"
MAX_CONCURRENT_SESSIONS="5"
FAILED_LOGIN_ATTEMPTS="5"
LOCKOUT_DURATION_MINUTES="15"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_SKIP_SUCCESSFUL="true"

# Login Rate Limiting
LOGIN_RATE_LIMIT_WINDOW="900000"
LOGIN_RATE_LIMIT_MAX="200"

# API Rate Limiting
API_RATE_LIMIT_WINDOW="900000"
API_RATE_LIMIT_MAX="1000"

# CORS Configuration
CORS_ORIGIN="http://env-4956838.it1.eur.aruba.jenv-aruba.cloud"
FRONTEND_URL="http://env-4956838.it1.eur.aruba.jenv-aruba.cloud"

# Health Check
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# Logging
LOG_LEVEL=info
LOG_FILE="./logs/app.log"
EOF
    log_success "File .env creato"
else
    log_info "File .env già esistente"
    log_info "Contenuto DATABASE_URL:"
    grep "DATABASE_URL" backend/.env || log_warning "DATABASE_URL non trovato"
fi

echo ""
echo "📦 FASE 2: INSTALLAZIONE DIPENDENZE"
echo "===================================="

# Installazione dipendenze backend
if [ -f "backend/package.json" ]; then
    log_info "Installazione dipendenze backend..."
    cd backend
    npm install --production
    if [ $? -eq 0 ]; then
        log_success "Dipendenze backend installate"
    else
        log_error "Errore installazione dipendenze backend"
        exit 1
    fi
    cd ..
else
    log_warning "File backend/package.json non trovato"
fi

# Installazione dipendenze frontend
if [ -f "package.json" ]; then
    log_info "Installazione dipendenze frontend..."
    npm install --production
    if [ $? -eq 0 ]; then
        log_success "Dipendenze frontend installate"
    else
        log_error "Errore installazione dipendenze frontend"
        exit 1
    fi
else
    log_warning "File package.json non trovato"
fi

echo ""
echo "🗄️ FASE 3: CONFIGURAZIONE DATABASE"
echo "==================================="

if [ -f "backend/prisma/schema.prisma" ]; then
    cd backend
    
    # Generazione Prisma Client
    log_info "Generazione Prisma Client..."
    npx prisma generate
    if [ $? -eq 0 ]; then
        log_success "Prisma Client generato"
    else
        log_error "Errore generazione Prisma Client"
        exit 1
    fi
    
    # Deploy migrazioni
    log_info "Deploy migrazioni database..."
    npx prisma migrate deploy
    if [ $? -eq 0 ]; then
        log_success "Migrazioni applicate"
    else
        log_warning "Errore migrazioni - continuando..."
    fi
    
    cd ..
else
    log_warning "Schema Prisma non trovato"
fi

echo ""
echo "🏗️ FASE 4: BUILD FRONTEND"
echo "========================="

if [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
    log_info "Build frontend con Vite..."
    npm run build
    if [ $? -eq 0 ]; then
        log_success "Frontend compilato"
    else
        log_error "Errore build frontend"
        exit 1
    fi
else
    log_warning "Configurazione Vite non trovata"
fi

echo ""
echo "🔄 FASE 5: AVVIO SERVIZI"
echo "========================"

# Stop processi esistenti
log_info "Stop processi PM2 esistenti..."
pm2 stop all
pm2 delete all

# Avvio API Server
if [ -f "backend/servers/api-server.js" ]; then
    log_info "Avvio API Server (porta 4001)..."
    cd backend
    pm2 start servers/api-server.js --name "api-server" --watch
    if [ $? -eq 0 ]; then
        log_success "API Server avviato"
    else
        log_error "Errore avvio API Server"
        exit 1
    fi
    cd ..
else
    log_warning "API Server non trovato"
fi

# Avvio Proxy Server
if [ -f "backend/servers/proxy-server.js" ]; then
    log_info "Avvio Proxy Server (porta 4003)..."
    cd backend
    pm2 start servers/proxy-server.js --name "proxy-server" --watch
    if [ $? -eq 0 ]; then
        log_success "Proxy Server avviato"
    else
        log_error "Errore avvio Proxy Server"
        exit 1
    fi
    cd ..
else
    log_warning "Proxy Server non trovato"
fi

echo ""
echo "🧪 FASE 6: TEST FUNZIONAMENTO"
echo "============================="

# Attesa per l'avvio dei servizi
log_info "Attesa avvio servizi (15 secondi)..."
sleep 15

# Test API Server
log_info "Test API Server (localhost:4001)..."
api_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/health 2>/dev/null || echo "000")
if [ "$api_response" = "200" ]; then
    log_success "API Server funzionante (HTTP $api_response)"
else
    log_warning "API Server non risponde (HTTP $api_response)"
fi

# Test Proxy Server
log_info "Test Proxy Server (localhost:4003)..."
proxy_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4003/health 2>/dev/null || echo "000")
if [ "$proxy_response" = "200" ]; then
    log_success "Proxy Server funzionante (HTTP $proxy_response)"
else
    log_warning "Proxy Server non risponde (HTTP $proxy_response)"
fi

# Stato finale PM2
log_info "Stato finale PM2:"
pm2 status

echo ""
echo "✅ SETUP COMPLETATO"
echo "=================="
log_success "Setup Aruba Cloud completato!"
log_info "URL applicazione: http://env-4956838.it1.eur.aruba.jenv-aruba.cloud/"
echo ""
log_info "Per monitorare:"
log_info "- pm2 logs"
log_info "- pm2 status"
log_info "- curl http://localhost:4001/health"
log_info "- curl http://localhost:4003/health"
echo ""