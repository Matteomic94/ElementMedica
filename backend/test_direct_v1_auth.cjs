#!/usr/bin/env node

/**
 * Test diretto del middleware /api/v1/auth
 * Bypassa il middleware generico /api per verificare se il problema è lì
 */

const http = require('http');

const testEndpoint = async (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Direct-V1-Auth/1.0'
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
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
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

console.log('🔍 Test Diretto Middleware /api/v1/auth');
console.log('=====================================\n');

(async () => {
  try {
    // Test 1: Health check generale
    console.log('1️⃣ Testing General Health Check...');
    const healthResult = await testEndpoint('GET', '/health');
    console.log(`📊 Health Check: ${healthResult.status}`);
    if (healthResult.status !== 200) {
      console.log(`❌ Unexpected health status: ${healthResult.status}`);
      console.log(`📄 Response:`, healthResult.body);
    }
    console.log('');

    // Test 2: GET /api/v1/auth/login (dovrebbe essere 405)
    console.log('2️⃣ Testing GET /api/v1/auth/login (should be 405)...');
    const getLoginResult = await testEndpoint('GET', '/api/v1/auth/login');
    console.log(`📊 GET Login: ${getLoginResult.status}`);
    if (getLoginResult.status === 405) {
      console.log('✅ CORRETTO: 405 Method Not Allowed');
    } else if (getLoginResult.status === 404) {
      console.log('❌ PROBLEMA: 404 - Middleware non raggiunto');
      console.log('📄 Response:', getLoginResult.body);
    } else {
      console.log(`⚠️  Status inaspettato: ${getLoginResult.status}`);
      console.log('📄 Response:', getLoginResult.body);
    }
    console.log('');

    // Test 3: POST /api/v1/auth/login con credenziali
    console.log('3️⃣ Testing POST /api/v1/auth/login...');
    const postLoginResult = await testEndpoint('POST', '/api/v1/auth/login', {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    });
    console.log(`📊 POST Login: ${postLoginResult.status}`);
    if (postLoginResult.status === 200) {
      console.log('✅ LOGIN RIUSCITO!');
    } else if (postLoginResult.status === 401) {
      console.log('✅ MIDDLEWARE RAGGIUNTO: 401 Unauthorized (credenziali errate)');
    } else if (postLoginResult.status === 400) {
      console.log('✅ MIDDLEWARE RAGGIUNTO: 400 Bad Request (validazione)');
    } else if (postLoginResult.status === 429) {
      console.log('⚠️  Rate limiting attivo: 429 Too Many Requests');
    } else if (postLoginResult.status === 404) {
      console.log('❌ PROBLEMA: 404 - Middleware non raggiunto');
    } else {
      console.log(`⚠️  Status inaspettato: ${postLoginResult.status}`);
    }
    console.log('📄 Response:', postLoginResult.body);
    console.log('');

    // Test 4: GET /api/v1/auth/health (se esiste)
    console.log('4️⃣ Testing GET /api/v1/auth/health...');
    const authHealthResult = await testEndpoint('GET', '/api/v1/auth/health');
    console.log(`📊 Auth Health: ${authHealthResult.status}`);
    if (authHealthResult.status === 200) {
      console.log('✅ Auth health endpoint funziona');
    } else if (authHealthResult.status === 404) {
      console.log('ℹ️  Auth health endpoint non esiste (normale)');
    } else {
      console.log(`⚠️  Status inaspettato: ${authHealthResult.status}`);
      console.log('📄 Response:', authHealthResult.body);
    }
    console.log('');

    // Test 5: Endpoint inesistente in /api/v1/auth
    console.log('5️⃣ Testing Non-existent /api/v1/auth/nonexistent...');
    const nonExistentResult = await testEndpoint('GET', '/api/v1/auth/nonexistent');
    console.log(`📊 Non-existent: ${nonExistentResult.status}`);
    if (nonExistentResult.status === 404) {
      console.log('✅ Corretto: 404 per endpoint inesistente');
    } else {
      console.log(`⚠️  Status inaspettato: ${nonExistentResult.status}`);
      console.log('📄 Response:', nonExistentResult.body);
    }
    console.log('');

    // Riepilogo
    console.log('📋 RIEPILOGO TEST DIRETTO:');
    console.log('==========================');
    console.log(`Health Check: ${healthResult.status === 200 ? '✅' : '❌'} ${healthResult.status}`);
    console.log(`GET Login: ${getLoginResult.status === 405 ? '✅' : '❌'} ${getLoginResult.status}`);
    console.log(`POST Login: ${[200, 401, 400].includes(postLoginResult.status) ? '✅' : '❌'} ${postLoginResult.status}`);
    console.log(`Auth Health: ${[200, 404].includes(authHealthResult.status) ? '✅' : '❌'} ${authHealthResult.status}`);
    console.log(`Not Found: ${nonExistentResult.status === 404 ? '✅' : '❌'} ${nonExistentResult.status}`);
    console.log('');

    if (getLoginResult.status === 405 && [200, 401, 400].includes(postLoginResult.status)) {
      console.log('🎉 MIDDLEWARE /api/v1/auth FUNZIONA CORRETTAMENTE!');
      console.log('🔍 Il problema deve essere nel middleware generico /api');
    } else {
      console.log('❌ PROBLEMA NEL MIDDLEWARE /api/v1/auth');
    }

  } catch (error) {
    console.error('❌ Errore durante i test:', error.message);
    process.exit(1);
  }
})();