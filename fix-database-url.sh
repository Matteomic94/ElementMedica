#!/bin/bash

# Script per diagnosticare e correggere problemi DATABASE_URL
# Risolve specificamente l'errore Prisma P1012

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

echo "🔧 DIAGNOSTICA E CORREZIONE DATABASE_URL"
echo "==========================================="
echo ""

# Verifica directory di lavoro
if [ ! -d "backend" ]; then
    log_error "Directory 'backend' non trovata"
    log_info "Assicurati di essere nella directory root del progetto"
    exit 1
fi

# Verifica esistenza file .env
if [ ! -f "backend/.env" ]; then
    log_error "File backend/.env non trovato"
    log_info "Creazione file .env con configurazione di default..."
    
    cat > backend/.env << 'EOF'
# Environment variables for Prisma
NODE_ENV=production
DATABASE_URL="postgresql://postgres:password@localhost:5432/projectdb"
SHADOW_DATABASE_URL="postgresql://postgres:password@localhost:5432/projectdb_shadow"
REDIS_ENABLED=false

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption Configuration
ENCRYPTION_KEY="your-32-character-encryption-key-change-this"
ENCRYPTION_ALGORITHM="aes-256-gcm"
EOF
    
    log_success "File .env creato"
fi

# Backup del file .env
cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
log_info "Backup .env creato"

# Analisi DATABASE_URL attuale
log_info "Analisi DATABASE_URL attuale..."
cd backend

if grep -q "^DATABASE_URL=" .env; then
    current_url=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    log_info "DATABASE_URL trovato: $current_url"
    
    # Verifica formato
    if [[ "$current_url" =~ ^postgresql://.*$ ]]; then
        log_success "Formato postgresql:// corretto"
    elif [[ "$current_url" =~ ^postgres://.*$ ]]; then
        log_success "Formato postgres:// corretto"
    else
        log_error "Formato DATABASE_URL non valido: $current_url"
        log_info "Formato richiesto: postgresql://user:password@host:port/database"
        
        # Correzione automatica
        log_info "Tentativo correzione automatica..."
        
        # Estrae componenti se possibile
        if [[ "$current_url" =~ @.*: ]]; then
            # Sembra un URL malformato, tenta di correggerlo
            corrected_url="postgresql://$current_url"
            log_info "URL corretto: $corrected_url"
        else
            # Usa un URL di default
            corrected_url="postgresql://postgres:password@localhost:5432/projectdb"
            log_warning "Impossibile correggere automaticamente, uso URL di default"
        fi
        
        # Sostituisce nel file
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$corrected_url\"|" .env
        log_success "DATABASE_URL corretto nel file .env"
    fi
else
    log_error "DATABASE_URL non trovato nel file .env"
    log_info "Aggiunta DATABASE_URL di default..."
    echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/projectdb"' >> .env
    log_success "DATABASE_URL aggiunto"
fi

# Verifica SHADOW_DATABASE_URL
if ! grep -q "^SHADOW_DATABASE_URL=" .env; then
    log_info "Aggiunta SHADOW_DATABASE_URL..."
    echo 'SHADOW_DATABASE_URL="postgresql://postgres:password@localhost:5432/projectdb_shadow"' >> .env
    log_success "SHADOW_DATABASE_URL aggiunto"
fi

# Test validazione Prisma
log_info "Test validazione schema Prisma..."
if command -v npx >/dev/null 2>&1; then
    npx prisma validate
    if [ $? -eq 0 ]; then
        log_success "Schema Prisma valido"
    else
        log_error "Schema Prisma non valido"
        log_info "Verifica il contenuto del file prisma/schema.prisma"
    fi
else
    log_warning "npx non disponibile, impossibile testare schema Prisma"
fi

# Mostra configurazione finale
echo ""
log_info "Configurazione finale DATABASE_URL:"
grep "^DATABASE_URL=" .env
grep "^SHADOW_DATABASE_URL=" .env 2>/dev/null || log_info "SHADOW_DATABASE_URL non configurato"

echo ""
log_success "Diagnostica completata"
log_info "Se il problema persiste:"
log_info "1. Verifica che PostgreSQL sia in esecuzione"
log_info "2. Controlla le credenziali nel DATABASE_URL"
log_info "3. Assicurati che il database 'projectdb' esista"
log_info "4. Testa la connessione: npx prisma db pull"

cd ..