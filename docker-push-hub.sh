#!/bin/bash

# Script per il push delle immagini Docker su Docker Hub
# Progetto: Project 2.0
# Username Docker Hub: elementmedica

set -e

echo "🚀 Script Push Docker Hub - Project 2.0"
echo "==========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per stampare messaggi colorati
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verifica login Docker Hub
print_status "Verificando login Docker Hub..."
if ! docker info | grep -q "Username: elementmedica"; then
    print_warning "Non sei loggato a Docker Hub come elementmedica"
    print_status "Effettuando login..."
    docker login
else
    print_success "Login Docker Hub verificato (elementmedica)"
fi

# Verifica esistenza immagini locali
print_status "Verificando immagini locali..."
if ! docker images | grep -q "elementmedica/project-api"; then
    print_error "Immagine elementmedica/project-api non trovata"
    print_status "Eseguendo build dell'immagine API..."
    docker build -f backend/Dockerfile.api -t elementmedica/project-api:latest --target production backend/
    docker tag elementmedica/project-api:latest elementmedica/project-api:v1.0.0
else
    print_success "Immagine API trovata"
fi

if ! docker images | grep -q "elementmedica/project-proxy"; then
    print_error "Immagine elementmedica/project-proxy non trovata"
    print_status "Eseguendo build dell'immagine Proxy..."
    docker build -f backend/Dockerfile.proxy -t elementmedica/project-proxy:latest --target production backend/
    docker tag elementmedica/project-proxy:latest elementmedica/project-proxy:v1.0.0
else
    print_success "Immagine Proxy trovata"
fi

# Lista immagini disponibili
print_status "Immagini disponibili per il push:"
docker images | grep elementmedica

# Push delle immagini
echo ""
print_status "Iniziando push delle immagini su Docker Hub..."
echo ""

# Push API
print_status "Push immagine API (latest)..."
if docker push elementmedica/project-api:latest; then
    print_success "Push API latest completato"
else
    print_error "Errore nel push API latest"
fi

print_status "Push immagine API (v1.0.0)..."
if docker push elementmedica/project-api:v1.0.0; then
    print_success "Push API v1.0.0 completato"
else
    print_error "Errore nel push API v1.0.0"
fi

# Push Proxy
print_status "Push immagine Proxy (latest)..."
if docker push elementmedica/project-proxy:latest; then
    print_success "Push Proxy latest completato"
else
    print_error "Errore nel push Proxy latest"
fi

print_status "Push immagine Proxy (v1.0.0)..."
if docker push elementmedica/project-proxy:v1.0.0; then
    print_success "Push Proxy v1.0.0 completato"
else
    print_error "Errore nel push Proxy v1.0.0"
fi

echo ""
print_success "🎉 Push completato!"
echo ""
print_status "Le immagini sono ora disponibili su Docker Hub:"
echo "  • https://hub.docker.com/r/elementmedica/project-api"
echo "  • https://hub.docker.com/r/elementmedica/project-proxy"
echo ""
print_status "Per utilizzare le immagini da Docker Hub:"
echo "  docker-compose up -d"
echo ""
print_status "Per forzare il pull delle immagini aggiornate:"
echo "  docker-compose pull && docker-compose up -d"