#!/bin/bash

# Script per build completa Docker del Project 2.0
# Versione: 1.0
# Data: $(date +%Y-%m-%d)

set -e  # Exit on any error

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzioni di utilità
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

# Verifica prerequisiti
check_prerequisites() {
    log_info "Verifica prerequisiti..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker non è installato"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose non è installato"
        exit 1
    fi
    
    log_success "Prerequisiti verificati"
}

# Pulizia immagini precedenti
clean_previous_builds() {
    log_info "Pulizia immagini precedenti..."
    
    # Rimuovi container esistenti
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Rimuovi immagini del progetto
    docker images | grep -E "project-(frontend|api|proxy)" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    
    log_success "Pulizia completata"
}

# Build delle immagini
build_images() {
    log_info "Avvio build delle immagini Docker..."
    
    # Build API Server
    log_info "Building API Server..."
    docker build -f backend/Dockerfile.api -t project-api:latest --target production ./backend
    
    # Build Proxy Server
    log_info "Building Proxy Server..."
    docker build -f backend/Dockerfile.proxy -t project-proxy:latest --target production ./backend
    
    # Build Frontend
    log_info "Building Frontend..."
    docker build -f Dockerfile.frontend -t project-frontend:latest --target production-server .
    
    log_success "Tutte le immagini sono state create con successo"
}

# Verifica immagini create
verify_images() {
    log_info "Verifica immagini create..."
    
    local images=("project-api:latest" "project-proxy:latest" "project-frontend:latest")
    
    for image in "${images[@]}"; do
        if docker images | grep -q "${image%:*}"; then
            log_success "Immagine $image creata correttamente"
        else
            log_error "Immagine $image non trovata"
            exit 1
        fi
    done
}

# Avvio servizi
start_services() {
    log_info "Avvio servizi con Docker Compose..."
    
    # Copia file di ambiente
    cp .env.docker .env
    
    # Avvia i servizi
    docker-compose up -d
    
    log_success "Servizi avviati"
}

# Test health check
test_health_checks() {
    log_info "Test health check dei servizi..."
    
    # Attendi che i servizi si avviino
    sleep 30
    
    # Test API Server
    if curl -f http://localhost:4001/health &>/dev/null; then
        log_success "API Server (4001) - Health check OK"
    else
        log_warning "API Server (4001) - Health check fallito"
    fi
    
    # Test Proxy Server
    if curl -f http://localhost:4003/health &>/dev/null; then
        log_success "Proxy Server (4003) - Health check OK"
    else
        log_warning "Proxy Server (4003) - Health check fallito"
    fi
    
    # Test Frontend
    if curl -f http://localhost:5173/ &>/dev/null; then
        log_success "Frontend (5173) - Health check OK"
    else
        log_warning "Frontend (5173) - Health check fallito"
    fi
}

# Mostra status finale
show_status() {
    log_info "Status finale dei servizi:"
    docker-compose ps
    
    echo ""
    log_info "URLs disponibili:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Proxy Server: http://localhost:4003"
    echo "  - API Server: http://localhost:4001"
    echo "  - Database: localhost:5432"
    
    echo ""
    log_info "Comandi utili:"
    echo "  - Logs: docker-compose logs -f [service]"
    echo "  - Stop: docker-compose down"
    echo "  - Restart: docker-compose restart [service]"
}

# Funzione principale
main() {
    log_info "=== Docker Build Script per Project 2.0 ==="
    
    check_prerequisites
    clean_previous_builds
    build_images
    verify_images
    start_services
    test_health_checks
    show_status
    
    log_success "Build e deploy completati con successo!"
}

# Gestione parametri
case "${1:-}" in
    "clean")
        clean_previous_builds
        ;;
    "build")
        build_images
        ;;
    "start")
        start_services
        ;;
    "test")
        test_health_checks
        ;;
    "status")
        show_status
        ;;
    "")
        main
        ;;
    *)
        echo "Uso: $0 [clean|build|start|test|status]"
        echo "  clean  - Pulisce immagini precedenti"
        echo "  build  - Build delle immagini"
        echo "  start  - Avvia i servizi"
        echo "  test   - Test health check"
        echo "  status - Mostra status servizi"
        echo "  (nessun parametro) - Esegue tutto"
        exit 1
        ;;
esac