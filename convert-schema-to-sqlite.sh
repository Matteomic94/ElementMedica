#!/bin/bash

# 🔄 CONVERSIONE SCHEMA PRISMA: PostgreSQL → SQLite
# ================================================
# Converte automaticamente lo schema Prisma da PostgreSQL a SQLite
# per deployment su Aruba Cloud con risorse limitate

set -e

echo "🔄 CONVERSIONE SCHEMA PRISMA: PostgreSQL → SQLite"
echo "================================================"
echo "Conversione per deployment Aruba Cloud"
echo ""

# Verifica esistenza schema
if [ ! -f "backend/prisma/schema.prisma" ]; then
    echo "[ERROR] ❌ File schema.prisma non trovato in backend/prisma/"
    exit 1
fi

# Backup dello schema originale
echo "[INFO] Backup schema PostgreSQL..."
cp backend/prisma/schema.prisma backend/prisma/schema.prisma.postgresql.backup
echo "[SUCCESS] ✅ Backup creato: schema.prisma.postgresql.backup"

# Conversione schema
echo "[INFO] Conversione schema da PostgreSQL a SQLite..."

# 1. Cambia provider da postgresql a sqlite
sed -i '' 's/provider = "postgresql"/provider = "sqlite"/' backend/prisma/schema.prisma

# 2. Rimuovi tutti i @db.Decimal specifici di PostgreSQL
sed -i '' 's/@db\.Decimal([^)]*)//g' backend/prisma/schema.prisma

# 3. Converti Decimal in Float per SQLite
sed -i '' 's/Decimal/Float/g' backend/prisma/schema.prisma

# 4. Rimuovi attributi specifici PostgreSQL non supportati da SQLite
# Rimuovi @db.Text, @db.VarChar, etc.
sed -i '' 's/@db\.[A-Za-z]*([^)]*)//g' backend/prisma/schema.prisma
sed -i '' 's/@db\.[A-Za-z]*//g' backend/prisma/schema.prisma

# 5. Pulisci spazi extra lasciati dalle sostituzioni
sed -i '' 's/[[:space:]]*$//' backend/prisma/schema.prisma

echo "[SUCCESS] ✅ Schema convertito per SQLite"

# Verifica conversione
echo "[INFO] Verifica conversione..."
if grep -q 'provider = "sqlite"' backend/prisma/schema.prisma; then
    echo "[SUCCESS] ✅ Provider SQLite configurato"
else
    echo "[ERROR] ❌ Errore nella conversione del provider"
    exit 1
fi

if ! grep -q 'provider = "postgresql"' backend/prisma/schema.prisma; then
    echo "[SUCCESS] ✅ Provider PostgreSQL rimosso"
else
    echo "[ERROR] ❌ Provider PostgreSQL ancora presente"
    exit 1
fi

if ! grep -q '@db\.Decimal' backend/prisma/schema.prisma; then
    echo "[SUCCESS] ✅ Attributi @db.Decimal rimossi"
else
    echo "[WARNING] ⚠️ Alcuni attributi @db.Decimal potrebbero essere rimasti"
fi

echo ""
echo "[SUCCESS] 🎉 CONVERSIONE COMPLETATA"
echo "Schema convertito da PostgreSQL a SQLite"
echo "Backup originale: backend/prisma/schema.prisma.postgresql.backup"
echo ""
echo "📋 PROSSIMI PASSI:"
echo "1. Rigenerare Prisma Client: npx prisma generate"
echo "2. Creare database SQLite: npx prisma db push"
echo "3. Verificare schema: npx prisma validate"
echo ""