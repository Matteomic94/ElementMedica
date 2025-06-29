#!/bin/bash

# Test dell'endpoint /verify con curl
echo "🔍 Test /verify con curl"
echo "============================="

# Step 1: Login e ottieni token
echo "1️⃣ Effettuando login..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"identifier":"mario.rossi@acme-corp.com","password":"Password123!"}' \
  http://localhost:4001/api/v1/auth/login)

echo "Risposta login: $LOGIN_RESPONSE"

# Estrai il token usando jq se disponibile, altrimenti usa grep
if command -v jq &> /dev/null; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken // .data.accessToken // empty')
else
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Token non trovato nella risposta"
    exit 1
fi

echo "✅ Token ottenuto: ${TOKEN:0:20}..."
echo ""

# Step 2: Test /verify
echo "2️⃣ Testando endpoint /verify..."
echo "⏰ Timeout: 10 secondi"
echo ""

VERIFY_RESPONSE=$(curl -v -m 10 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:4001/api/v1/auth/verify 2>&1)

echo "Risposta /verify:"
echo "$VERIFY_RESPONSE"