#!/usr/bin/env node

/**
 * Test di tutti i metodi HTTP per verificare quale viene intercettato
 * Questo aiuterà a capire se il problema è specifico per GET o generale
 */

const http = require('http');

const testMethod = async (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-HTTP-Methods/1.0'
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
            status: res.statusCode,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            method,
            status: res.statusCode,
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

console.log('🔍 Test Tutti i Metodi HTTP su /api/v1/auth/login');
console.log('==============================================\n');

(async () => {
  try {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    const testData = {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    };

    console.log('📋 Testing /api/v1/auth/login con tutti i metodi HTTP:\n');

    for (const method of methods) {
      try {
        console.log(`🔍 Testing ${method} /api/v1/auth/login...`);
        
        // Per POST e PUT inviamo dati, per gli altri no
        const data = ['POST', 'PUT', 'PATCH'].includes(method) ? testData : null;
        const result = await testMethod(method, '/api/v1/auth/login', data);
        
        console.log(`📊 ${method}: ${result.status}`);
        
        // Analizza il risultato
        if (result.status === 404 && result.body.error === 'Endpoint not found') {
          console.log(`   ❌ INTERCETTATO: Non arriva al middleware /api/v1/auth`);
        } else if (result.status === 405) {
          console.log(`   ✅ RAGGIUNGE MIDDLEWARE: 405 Method Not Allowed (corretto)`);
        } else if (result.status === 401) {
          console.log(`   ✅ RAGGIUNGE MIDDLEWARE: 401 Unauthorized (corretto)`);
        } else if (result.status === 400) {
          console.log(`   ✅ RAGGIUNGE MIDDLEWARE: 400 Bad Request (corretto)`);
        } else if (result.status === 429) {
          console.log(`   ⚠️  RATE LIMITED: 429 Too Many Requests`);
        } else {
          console.log(`   ⚠️  Status inaspettato: ${result.status}`);
          if (result.body.error) {
            console.log(`   📄 Error: ${result.body.error}`);
          }
        }
        console.log('');
        
      } catch (error) {
        console.log(`❌ Errore con ${method}: ${error.message}\n`);
      }
    }

    console.log('\n📋 RIEPILOGO ANALISI:');
    console.log('=====================');
    console.log('Se TUTTI i metodi restituiscono 404 "Endpoint not found",');
    console.log('il problema è nel routing generale.');
    console.log('');
    console.log('Se SOLO alcuni metodi restituiscono 404,');
    console.log('c\'è un middleware che filtra per metodo HTTP.');
    console.log('');
    console.log('Se NESSUN metodo restituisce 404,');
    console.log('il middleware /api/v1/auth funziona correttamente.');

  } catch (error) {
    console.error('❌ Errore durante i test:', error.message);
    process.exit(1);
  }
})();