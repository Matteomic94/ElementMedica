#!/usr/bin/env node

/**
 * Test con logging dettagliato per tracciare le richieste
 * Verifica se le richieste GET arrivano al middleware di logging
 */

const http = require('http');

const testWithLogging = async (method, path, data = null) => {
  console.log(`\n🔍 [TEST] Sending ${method} ${path}`);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Logging-Trace/1.0'
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
        console.log(`📊 [RESPONSE] ${method} ${path} → ${res.statusCode}`);
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          console.log(`📄 [BODY] ${JSON.stringify(jsonBody, null, 2)}`);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          console.log(`📄 [BODY] ${body}`);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ [ERROR] ${method} ${path} → ${err.message}`);
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log('🔍 Test Logging Trace per /api/v1/auth');
console.log('=====================================');
console.log('⚠️  IMPORTANTE: Controlla i logs del server per vedere se le richieste arrivano al middleware!');
console.log('');

(async () => {
  try {
    // Test 1: GET /api/v1/auth/login
    console.log('\n1️⃣ Testing GET /api/v1/auth/login...');
    await testWithLogging('GET', '/api/v1/auth/login');
    
    await sleep(1000); // Pausa per vedere i logs
    
    // Test 2: POST /api/v1/auth/login
    console.log('\n2️⃣ Testing POST /api/v1/auth/login...');
    await testWithLogging('POST', '/api/v1/auth/login', {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    });
    
    await sleep(1000); // Pausa per vedere i logs
    
    // Test 3: GET /api/v1/auth/nonexistent
    console.log('\n3️⃣ Testing GET /api/v1/auth/nonexistent...');
    await testWithLogging('GET', '/api/v1/auth/nonexistent');
    
    console.log('\n📋 ANALISI LOGS:');
    console.log('================');
    console.log('Se vedi logs del tipo "🔍 [AUTH V1] GET /login" nel terminale del server,');
    console.log('significa che le richieste GET arrivano al middleware /api/v1/auth.');
    console.log('');
    console.log('Se NON vedi questi logs, significa che le richieste GET non arrivano');
    console.log('al middleware /api/v1/auth e vengono intercettate prima.');
    console.log('');
    console.log('Controlla il terminale dove hai avviato il server API!');

  } catch (error) {
    console.error('❌ Errore durante i test:', error.message);
    process.exit(1);
  }
})();