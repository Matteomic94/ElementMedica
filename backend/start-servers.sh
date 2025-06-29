#!/bin/bash

# Script per avviare i server in background secondo l'architettura multi-server
echo "🚀 Avvio API Server..."
nohup node api-server.js > api-server.log 2>&1 &
API_PID=$!
echo "📝 API Server PID: $API_PID"

# Attendi che l'API server si avvii
sleep 3

echo "🚀 Avvio Documents Server..."
nohup node documents-server.js > documents-server.log 2>&1 &
DOCS_PID=$!
echo "📝 Documents Server PID: $DOCS_PID"

# Attendi che il Documents server si avvii
sleep 2

echo "🚀 Avvio Proxy Server..."
nohup node proxy-server.js > proxy-server.log 2>&1 &
PROXY_PID=$!
echo "📝 Proxy Server PID: $PROXY_PID"

echo "✅ Server avviati:"
echo "   API Server (PID: $API_PID) - http://localhost:4001"
echo "   Documents Server (PID: $DOCS_PID) - http://localhost:4002"
echo "   Proxy Server (PID: $PROXY_PID) - http://localhost:4003"
echo ""
echo "📋 Per fermare i server:"
echo "   kill $API_PID $DOCS_PID $PROXY_PID"
echo ""
echo "📊 Log files:"
echo "   API Server: api-server.log"
echo "   Documents Server: documents-server.log"
echo "   Proxy Server: proxy-server.log"