#!/usr/bin/env node

/**
 * Test per bypassare completamente il middleware generico /api
 * Questo test verifica se il problema è nel middleware generico
 * testando direttamente il middleware /api/v1/auth
 */

const http = require('http');

const testDirectV1Auth = async (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Bypass-Generic/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            method,
            path,
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            method,
            path,
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

console.log('🔍 Test Bypass Middleware Generico');
console.log('==================================\n');

(async () => {
  try {
    const testData = {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    };

    console.log('📋 Test 1: Verifica che /api/v1/auth/login funzioni per POST\n');
    
    const postResult = await testDirectV1Auth('POST', '/api/v1/auth/login', testData);
    console.log(`POST /api/v1/auth/login: ${postResult.status}`);
    if (postResult.status === 401) {
      console.log('✅ POST raggiunge correttamente il middleware (401 = credenziali non valide)');
    } else if (postResult.status === 404) {
      console.log('❌ POST non raggiunge il middleware (404 = endpoint non trovato)');
    } else {
      console.log(`⚠️  Status inaspettato: ${postResult.status}`);
      if (postResult.body.error) {
        console.log(`📄 Error: ${postResult.body.error}`);
      }
    }
    console.log('');

    console.log('📋 Test 2: Verifica che /api/v1/auth/login NON funzioni per GET\n');
    
    const getResult = await testDirectV1Auth('GET', '/api/v1/auth/login');
    console.log(`GET /api/v1/auth/login: ${getResult.status}`);
    if (getResult.status === 405) {
      console.log('✅ GET raggiunge il middleware e restituisce 405 Method Not Allowed (CORRETTO)');
    } else if (getResult.status === 404) {
      console.log('❌ GET non raggiunge il middleware (404 = endpoint non trovato)');
      console.log('🔍 PROBLEMA CONFERMATO: Il middleware /api/v1/auth non riceve richieste GET');
    } else {
      console.log(`⚠️  Status inaspettato: ${getResult.status}`);
      if (getResult.body.error) {
        console.log(`📄 Error: ${getResult.body.error}`);
      }
    }
    console.log('');

    console.log('📋 Test 3: Verifica altri path per escludere problemi di routing\n');
    
    // Test health check
    const healthResult = await testDirectV1Auth('GET', '/api/v1/auth/health');
    console.log(`GET /api/v1/auth/health: ${healthResult.status}`);
    if (healthResult.status === 404) {
      console.log('✅ Corretto - questo endpoint non esiste');
    } else {
      console.log(`⚠️  Status inaspettato: ${healthResult.status}`);
    }
    console.log('');

    // Test path inesistente
    const nonExistentResult = await testDirectV1Auth('GET', '/api/v1/auth/nonexistent');
    console.log(`GET /api/v1/auth/nonexistent: ${nonExistentResult.status}`);
    if (nonExistentResult.status === 404) {
      console.log('✅ Corretto - endpoint inesistente');
    } else {
      console.log(`⚠️  Status inaspettato: ${nonExistentResult.status}`);
    }
    console.log('');

    console.log('\n📋 ANALISI RISULTATI:');
    console.log('=====================');
    
    if (postResult.status === 401 && getResult.status === 404) {
      console.log('🔍 PROBLEMA IDENTIFICATO:');
      console.log('- POST /api/v1/auth/login raggiunge il middleware (401)');
      console.log('- GET /api/v1/auth/login NON raggiunge il middleware (404)');
      console.log('');
      console.log('🎯 CONCLUSIONE:');
      console.log('Il middleware /api/v1/auth è montato correttamente ma');
      console.log('qualcosa intercetta le richieste GET prima che arrivino al middleware.');
      console.log('');
      console.log('🔍 PROSSIMI PASSI:');
      console.log('1. Verificare se c\'è un middleware che filtra per metodo HTTP');
      console.log('2. Controllare l\'ordine di mounting dei middleware in api-server.js');
      console.log('3. Verificare se il middleware generico /api interferisce');
    } else if (postResult.status === 401 && getResult.status === 405) {
      console.log('✅ TUTTO FUNZIONA CORRETTAMENTE:');
      console.log('- POST raggiunge il middleware e restituisce 401 (credenziali non valide)');
      console.log('- GET raggiunge il middleware e restituisce 405 (Method Not Allowed)');
      console.log('');
      console.log('Il problema potrebbe essere risolto o era temporaneo.');
    } else {
      console.log('⚠️  RISULTATI INASPETTATI:');
      console.log(`- POST: ${postResult.status}`);
      console.log(`- GET: ${getResult.status}`);
      console.log('');
      console.log('Necessaria ulteriore investigazione.');
    }

  } catch (error) {
    console.error('❌ Errore durante i test:', error.message);
    process.exit(1);
  }
})();