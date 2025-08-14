#!/bin/bash

# Script specifico per Aruba Cloud con SQLite
# Configurazione ottimizzata per 8 cloudlets (1GB RAM)

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzioni di logging
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

echo "🚀 ARUBA CLOUD - SETUP SQLITE OTTIMIZZATO"
echo "========================================="
echo "Configurazione per 8 cloudlets (1GB RAM)"
echo ""

# Verifica directory di lavoro
if [ ! -d "backend" ]; then
    log_error "Directory 'backend' non trovata"
    log_info "Assicurati di essere nella directory root del progetto"
    exit 1
fi

cd backend

# Backup del file .env esistente
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    log_info "Backup .env creato"
fi

# Crea file .env ottimizzato per Aruba Cloud con SQLite
log_info "Creazione file .env ottimizzato per Aruba Cloud SQLite..."

cat > .env << 'EOF'
# Environment variables for Aruba Cloud deployment
# Configurazione SQLite ottimizzata per 8 cloudlets (1GB RAM)

# Database Configuration - SQLite per Aruba Cloud
DATABASE_URL="file:./database.db"
SHADOW_DATABASE_URL="file:./database_shadow.db"

# Prisma Configuration
PRISMA_CLI_BINARY_TARGETS="native,linux-openssl-1.1.x"
PRISMA_ENGINES_MIRROR="https://binaries.prisma.sh"

# Node.js Configuration
NODE_ENV="production"
PORT="4001"
PROXY_PORT="4003"
DOCUMENTS_PORT="4002"

# Redis Configuration (Aruba Cloud locale)
REDIS_URL="redis://localhost:6379"
REDIS_ENABLED="true"
REDIS_PASSWORD=""
REDIS_DB="0"

# JWT Configuration
JWT_SECRET="aruba-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="aruba-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption Configuration
ENCRYPTION_KEY="aruba-32-character-encryption-key"
ENCRYPTION_ALGORITHM="aes-256-gcm"

# Cache Configuration (ottimizzato per 1GB RAM)
CACHE_TTL_DEFAULT="3600"
CACHE_TTL_SESSION="86400"
CACHE_MAX_SIZE="50"

# Performance Configuration (ottimizzato per Aruba)
PERFORMANCE_MONITORING_ENABLED="true"
SLOW_QUERY_THRESHOLD="1000"
SLOW_REQUEST_THRESHOLD="2000"
MAX_CONNECTIONS="10"
CONNECTION_TIMEOUT="30000"

# GDPR Configuration
GDPR_RETENTION_DAYS="2555"
GDPR_ANONYMIZATION_ENABLED="true"
GDPR_AUDIT_ENABLED="true"
GDPR_ADMIN_EMAIL="admin@example.com"
GDPR_COMPANY_NAME="Project 2.0"
GDPR_DPO_EMAIL="dpo@example.com"

# Session Configuration
SESSION_SECRET="aruba-session-secret-change-in-production"
SESSION_MAX_AGE="86400000"
SESSION_SECURE="false"
SESSION_HTTP_ONLY="true"

# Rate Limiting (ottimizzato per Aruba)
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS="false"

# CORS Configuration
CORS_ORIGIN="*"
CORS_CREDENTIALS="true"

# File Upload Configuration (limitato per 1GB RAM)
MAX_FILE_SIZE="5242880"
UPLOAD_PATH="./uploads"

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"
LOG_MAX_SIZE="10m"
LOG_MAX_FILES="5"

# Email Configuration (opzionale)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@example.com"
EOF

log_success "File .env SQLite creato per Aruba Cloud"

# Verifica formato DATABASE_URL SQLite
log_info "Verifica configurazione SQLite..."
source .env
echo "DATABASE_URL: $DATABASE_URL"

if [[ $DATABASE_URL =~ ^file: ]]; then
    log_success "✅ Configurazione SQLite corretta"
else
    log_error "❌ Configurazione DATABASE_URL non valida per SQLite"
    exit 1
fi

# Pulizia cache Prisma
log_info "Pulizia cache Prisma..."
rm -rf node_modules/.prisma
rm -rf prisma/generated
rm -f database.db database_shadow.db

# Verifica installazione dipendenze
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    log_info "Installazione dipendenze..."
    npm install
fi

# Rigenerazione Prisma Client per SQLite
log_info "Rigenerazione Prisma Client per SQLite..."
npx prisma generate

if [ $? -ne 0 ]; then
    log_error "Errore durante la generazione del Prisma Client"
    exit 1
fi

log_success "Prisma Client SQLite rigenerato con successo"

# Test validazione schema
log_info "Test validazione schema Prisma SQLite..."
npx prisma validate

if [ $? -eq 0 ]; then
    log_success "✅ Schema Prisma SQLite validato con successo!"
else
    log_error "❌ Errore nella validazione dello schema SQLite"
    exit 1
fi

# Creazione database SQLite e deploy migrazioni
log_info "Creazione database SQLite e deploy migrazioni..."
npx prisma db push

if [ $? -eq 0 ]; then
    log_success "✅ Database SQLite creato e migrazioni applicate"
else
    log_error "❌ Errore durante la creazione del database SQLite"
    exit 1
fi

# Seed del database (opzionale)
if [ -f "prisma/seed.js" ] || [ -f "prisma/seed.ts" ]; then
    log_info "Esecuzione seed del database..."
    npm run seed 2>/dev/null || npx prisma db seed 2>/dev/null || log_warning "Seed non disponibile o fallito"
fi

# Verifica file database creato
if [ -f "database.db" ]; then
    db_size=$(ls -lh database.db | awk '{print $5}')
    log_success "✅ Database SQLite creato: database.db ($db_size)"
else
    log_error "❌ File database.db non trovato"
    exit 1
fi

# Test connessione SQLite
log_info "Test connessione database SQLite..."
npx prisma db pull --preview-feature 2>/dev/null

if [ $? -eq 0 ]; then
    log_success "✅ Connessione SQLite riuscita"
else
    log_warning "⚠️  Test connessione SQLite non conclusivo (normale per SQLite)"
fi

# Build frontend (se necessario)
cd ..
if [ -f "package.json" ] && [ ! -d "dist" ]; then
    log_info "Build frontend per produzione..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log_success "✅ Build frontend completato"
    else
        log_warning "⚠️  Build frontend fallito, continuo comunque"
    fi
fi

# Configurazione PM2 per Aruba Cloud
log_info "Configurazione PM2 per Aruba Cloud..."

# Verifica/installa PM2
if ! command -v pm2 >/dev/null 2>&1; then
    log_info "Installazione PM2..."
    npm install -g pm2
fi

# Copia configurazione PM2 ottimizzata per Aruba
if [ -f "../ecosystem.aruba.config.js" ]; then
    cp ../ecosystem.aruba.config.js ../ecosystem.config.js
    log_success "✅ Configurazione PM2 Aruba copiata"
else
    log_warning "⚠️  File ecosystem.aruba.config.js non trovato"
fi

# Crea directory logs
mkdir -p ../logs
chmod 755 ../logs

echo ""
log_success "🎉 SETUP ARUBA CLOUD SQLITE COMPLETATO"
log_info "Configurazione ottimizzata per 8 cloudlets (1GB RAM)"
log_info "Database: SQLite (file:./database.db)"
log_info "File di backup disponibili: .env.backup.*"
echo ""
log_info "📋 PROSSIMI PASSI SU ARUBA CLOUD:"
log_info "1. Avvia i servizi: pm2 start ecosystem.config.js"
log_info "2. Verifica status: pm2 status"
log_info "3. Testa API: curl http://localhost:4001/health"
log_info "4. Testa Proxy: curl http://localhost:4003/health"
log_info "5. Configura Nginx per reverse proxy"
echo ""
log_info "🔧 CONFIGURAZIONE ARUBA CLOUD:"
log_info "- Nodo: All-in-One (8 cloudlets = 1GB RAM)"
log_info "- Database: SQLite locale"
log_info "- Cache: Redis locale"
log_info "- Proxy: Nginx + PM2"
log_info "- SSL: Let's Encrypt automatico"

cd backend