#!/usr/bin/env node

const http = require('http');

console.log('🔍 Test Diretto API Server - GET /api/v1/auth/login');
console.log('='.repeat(55));

const options = {
  hostname: '127.0.0.1',
  port: 4001,
  path: '/api/v1/auth/login',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`\n📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Status Message: ${res.statusMessage}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📄 Response Body:`);
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log(data);
    }
    
    console.log(`\n🎯 Risultato:`);
    if (res.statusCode === 405) {
      console.log('✅ SUCCESSO: 405 Method Not Allowed - Corretto!');
    } else if (res.statusCode === 404) {
      console.log('❌ PROBLEMA: 404 Not Found - Endpoint non raggiungibile');
    } else {
      console.log(`⚠️  INASPETTATO: ${res.statusCode} - Verifica necessaria`);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Errore nella richiesta:', error.message);
});

req.end();