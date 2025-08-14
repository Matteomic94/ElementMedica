#!/bin/bash

# Script di Risoluzione Deployment Aruba Cloud
# Project 2.0 - Sistema Medicina del Lavoro
# Versione: 1.1 - CORRETTA
# Data: $(date '+%Y-%m-%d %H:%M:%S')

echo "🚀 AVVIO SCRIPT RISOLUZIONE DEPLOYMENT ARUBA CLOUD"
echo "================================================="
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

# Verifica directory di lavoro
if [ ! -d "/var/www/webroot/ROOT" ]; then
    if [ ! -d "/home/jelastic/ROOT" ]; then
        log_error "Directory di progetto non trovata!"
        log_info "Tentativo di individuazione directory..."
        if [ -d "$(pwd)/backend" ]; then
            log_info "Trovata directory backend in $(pwd)"
        else
            log_error "Impossibile trovare la directory del progetto"
            exit 1
        fi
    else
        cd /home/jelastic/ROOT
        log_info "Directory di lavoro: $(pwd)"
    fi
else
    cd /var/www/webroot/ROOT
    log_info "Directory di lavoro: $(pwd)"
fi

echo ""
echo "📋 FASE 1: DIAGNOSI STATO ATTUALE"
echo "================================"

# Verifica stato PM2
log_info "Controllo stato PM2..."
pm2 status

# Verifica processi Node.js
log_info "Controllo processi Node.js..."
ps aux | grep node | grep -v grep

# Verifica porte in uso
log_info "Controllo porte 4001 e 4003..."
netstat -tlnp | grep -E ':(4001|4003)' || log_warning "Nessuna porta 4001/4003 in ascolto"

echo ""
echo "🔧 FASE 2: CORREZIONE DATABASE_URL"
echo "=================================="

# Backup del file schema.prisma
if [ -f "backend/prisma/schema.prisma" ]; then
    log_info "Backup schema.prisma..."
    cp backend/prisma/schema.prisma backend/prisma/schema.prisma.backup.$(date +%Y%m%d_%H%M%S)
    log_success "Backup creato"
else
    log_error "File schema.prisma non trovato!"
    exit 1
fi

# Verifica file .env
log_info "Controllo configurazione DATABASE_URL..."
if [ -f "backend/.env" ]; then
    log_info "File .env trovato"
    if grep -q "DATABASE_URL" backend/.env; then
        current_url=$(grep "DATABASE_URL" backend/.env | cut -d'=' -f2- | tr -d '"')
        log_info "DATABASE_URL attuale: $current_url"
        
        # Verifica se l'URL inizia con postgresql:// o postgres://
        if [[ $current_url == postgresql://* ]] || [[ $current_url == postgres://* ]]; then
            log_success "DATABASE_URL ha il formato corretto"
        else
            log_warning "DATABASE_URL non ha il formato corretto"
            
            # Prova a correggere automaticamente
            if [[ $current_url == *"@"* ]]; then
                # Se contiene @, probabilmente è un URL senza protocollo
                new_url="postgresql://$current_url"
                log_info "Correzione automatica: $new_url"
                sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$new_url\"|" backend/.env
                log_success "DATABASE_URL corretto"
            else
                log_error "Impossibile correggere automaticamente DATABASE_URL"
                log_error "Formato attuale: $current_url"
                log_error "Formato richiesto: postgresql://user:password@host:port/database"
                exit 1
            fi
        fi
    else
        log_error "DATABASE_URL non trovato in .env"
        exit 1
    fi
else
    log_error "File .env non trovato!"
    exit 1
fi

echo ""
echo "📦 FASE 3: REINSTALLAZIONE DIPENDENZE"
echo "====================================="

# Pulizia e reinstallazione dipendenze backend
log_info "Pulizia dipendenze backend..."
cd backend
rm -rf node_modules package-lock.json
log_info "Reinstallazione dipendenze backend..."
npm install
if [ $? -eq 0 ]; then
    log_success "Dipendenze backend installate"
else
    log_error "Errore installazione dipendenze backend"
    exit 1
fi

# Pulizia e reinstallazione dipendenze frontend
log_info "Pulizia dipendenze frontend..."
cd ..
rm -rf node_modules package-lock.json
log_info "Reinstallazione dipendenze frontend..."
npm install
if [ $? -eq 0 ]; then
    log_success "Dipendenze frontend installate"
else
    log_error "Errore installazione dipendenze frontend"
    exit 1
fi

echo ""
echo "🗄️ FASE 4: CONFIGURAZIONE DATABASE"
echo "==================================="

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

# Seed database (opzionale)
log_info "Seed database..."
npx prisma db seed
if [ $? -eq 0 ]; then
    log_success "Database popolato"
else
    log_warning "Errore seed database - continuando..."
fi

echo ""
echo "🏗️ FASE 5: BUILD FRONTEND"
echo "========================="

cd ..
log_info "Build frontend..."
npm run build
if [ $? -eq 0 ]; then
    log_success "Frontend compilato"
else
    log_error "Errore build frontend"
    exit 1
fi

echo ""
echo "🔄 FASE 6: RIAVVIO SERVIZI"
echo "=========================="

# Stop tutti i processi PM2
log_info "Stop processi PM2..."
pm2 stop all
pm2 delete all

# Riavvio Redis (se disponibile)
log_info "Riavvio Redis..."
if command -v systemctl &> /dev/null; then
    sudo systemctl restart redis
    if [ $? -eq 0 ]; then
        log_success "Redis riavviato"
    else
        log_warning "Errore riavvio Redis - continuando..."
    fi
else
    log_warning "systemctl non disponibile - saltando riavvio Redis"
fi

# Avvio API Server
log_info "Avvio API Server (porta 4001)..."
cd backend
pm2 start servers/api-server.js --name "api-server" --watch
if [ $? -eq 0 ]; then
    log_success "API Server avviato"
else
    log_error "Errore avvio API Server"
    exit 1
fi

# Avvio Proxy Server
log_info "Avvio Proxy Server (porta 4003)..."
pm2 start servers/proxy-server.js --name "proxy-server" --watch
if [ $? -eq 0 ]; then
    log_success "Proxy Server avviato"
else
    log_error "Errore avvio Proxy Server"
    exit 1
fi

# Riavvio Nginx (se disponibile)
log_info "Riavvio Nginx..."
if command -v systemctl &> /dev/null; then
    sudo systemctl restart nginx
    if [ $? -eq 0 ]; then
        log_success "Nginx riavviato"
    else
        log_error "Errore riavvio Nginx"
        exit 1
    fi
else
    log_warning "systemctl non disponibile - saltando riavvio Nginx"
fi

echo ""
echo "🧪 FASE 7: TEST FUNZIONAMENTO"
echo "============================="

# Attesa per l'avvio dei servizi
log_info "Attesa avvio servizi (10 secondi)..."
sleep 10

# Test API Server
log_info "Test API Server (localhost:4001)..."
api_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/health)
if [ "$api_response" = "200" ]; then
    log_success "API Server funzionante (HTTP $api_response)"
else
    log_error "API Server non risponde (HTTP $api_response)"
fi

# Test Proxy Server
log_info "Test Proxy Server (localhost:4003)..."
proxy_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4003/health)
if [ "$proxy_response" = "200" ]; then
    log_success "Proxy Server funzionante (HTTP $proxy_response)"
else
    log_error "Proxy Server non risponde (HTTP $proxy_response)"
fi

# Test Nginx
log_info "Test Nginx (porta 80)..."
nginx_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$nginx_response" = "200" ] || [ "$nginx_response" = "302" ]; then
    log_success "Nginx funzionante (HTTP $nginx_response)"
else
    log_warning "Nginx risposta inattesa (HTTP $nginx_response)"
fi

# Stato finale PM2
log_info "Stato finale PM2:"
pm2 status

echo ""
echo "✅ RISOLUZIONE COMPLETATA"
echo "========================"
log_success "Script di risoluzione completato!"
log_info "URL di test:"
log_info "- API Health: http://localhost:4001/health"
log_info "- Proxy Health: http://localhost:4003/health"
log_info "- Applicazione: http://env-4956838.it1.eur.aruba.jenv-aruba.cloud/"
echo ""
log_info "Per monitorare i log:"
log_info "- pm2 logs"
log_info "- pm2 logs api-server"
log_info "- pm2 logs proxy-server"
echo ""
log_warning "Se persistono problemi, controllare:"
log_warning "1. Configurazione DATABASE_URL in backend/.env"
log_warning "2. Log di PM2: pm2 logs"
log_warning "3. Log di Nginx: sudo tail -f /var/log/nginx/error.log"
log_warning "4. Stato Redis: sudo systemctl status redis"
echo ""