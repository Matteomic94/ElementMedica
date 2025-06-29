#!/usr/bin/env node

/**
 * Test per verificare la correzione del conflitto middleware
 * Testa l'ordine corretto dei middleware /api/v1/auth vs /api
 */

const http = require('http');

const API_BASE = 'http://127.0.0.1:4001';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
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
}

async function runTests() {
  console.log('🔍 Test Correzione Middleware Order');
  console.log('===================================\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await makeRequest('GET', '/health');
    console.log(`✅ Health Check: ${healthResponse.status}`);
    
    if (healthResponse.status !== 200) {
      console.log('❌ Server non healthy, interrompo i test');
      return;
    }
    console.log('');

    // Test 2: Login GET (dovrebbe essere 405 Method Not Allowed)
    console.log('2️⃣ Testing Login GET (should be 405 Method Not Allowed)...');
    const loginGetResponse = await makeRequest('GET', '/api/v1/auth/login');
    console.log(`📊 Login GET: ${loginGetResponse.status}`);
    
    if (loginGetResponse.status === 404) {
      console.log('❌ PROBLEMA: Ancora 404! Middleware non corretto.');
      console.log('   Il middleware /api sta ancora intercettando prima di /api/v1/auth');
    } else if (loginGetResponse.status === 405) {
      console.log('✅ SUCCESSO: 405 Method Not Allowed - Middleware corretto!');
    } else {
      console.log(`⚠️  Status inaspettato: ${loginGetResponse.status}`);
    }
    console.log('');

    // Test 3: Login POST con payload corretto
    console.log('3️⃣ Testing Login POST (should be 400/401, not 404)...');
    const loginData = {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    };
    
    const loginPostResponse = await makeRequest('POST', '/api/v1/auth/login', loginData);
    console.log(`📊 Login POST: ${loginPostResponse.status}`);
    
    if (loginPostResponse.status === 404) {
      console.log('❌ PROBLEMA: Ancora 404! Endpoint non raggiungibile.');
    } else if (loginPostResponse.status === 400 || loginPostResponse.status === 401) {
      console.log('✅ SUCCESSO: Endpoint raggiungibile (400/401 = validazione/auth error)');
    } else if (loginPostResponse.status === 200) {
      console.log('✅ SUCCESSO: Login riuscito!');
      try {
        const responseData = JSON.parse(loginPostResponse.body);
        console.log('📄 Response:', responseData);
      } catch (e) {
        console.log('📄 Response body:', loginPostResponse.body);
      }
    } else {
      console.log(`⚠️  Status inaspettato: ${loginPostResponse.status}`);
      console.log('📄 Response body:', loginPostResponse.body);
    }
    console.log('');

    // Test 4: Test endpoint non esistente (dovrebbe essere 404)
    console.log('4️⃣ Testing Non-existent Endpoint (should be 404)...');
    const notFoundResponse = await makeRequest('GET', '/api/v1/auth/nonexistent');
    console.log(`📊 Non-existent: ${notFoundResponse.status}`);
    
    if (notFoundResponse.status === 404) {
      console.log('✅ Corretto: 404 per endpoint inesistente');
    } else {
      console.log(`⚠️  Status inaspettato per endpoint inesistente: ${notFoundResponse.status}`);
    }
    console.log('');

    // Riepilogo
    console.log('📋 RIEPILOGO TEST:');
    console.log('==================');
    console.log(`Health Check: ${healthResponse.status === 200 ? '✅' : '❌'} ${healthResponse.status}`);
    console.log(`Login GET: ${loginGetResponse.status === 405 ? '✅' : '❌'} ${loginGetResponse.status}`);
    console.log(`Login POST: ${[200, 400, 401].includes(loginPostResponse.status) ? '✅' : '❌'} ${loginPostResponse.status}`);
    console.log(`Not Found: ${notFoundResponse.status === 404 ? '✅' : '❌'} ${notFoundResponse.status}`);
    
    const allPassed = healthResponse.status === 200 && 
                     loginGetResponse.status === 405 && 
                     [200, 400, 401].includes(loginPostResponse.status) && 
                     notFoundResponse.status === 404;
    
    console.log('');
    if (allPassed) {
      console.log('🎉 TUTTI I TEST PASSATI! Correzione middleware riuscita.');
    } else {
      console.log('❌ ALCUNI TEST FALLITI. Problema middleware persiste.');
    }

  } catch (error) {
    console.error('❌ Errore durante i test:', error.message);
  }
}

runTests();