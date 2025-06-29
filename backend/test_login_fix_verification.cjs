#!/usr/bin/env node

/**
 * Test di verifica del fix per il problema 404 del login endpoint
 * Verifica che l'endpoint /api/v1/auth/login sia ora raggiungibile
 */

const http = require('http');

const API_HOST = '127.0.0.1';
const API_PORT = 4001;

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🔍 Verifica Fix Login Endpoint');
  console.log('================================\n');

  try {
    // Test 1: Health Check (dovrebbe funzionare)
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await makeRequest('GET', '/health');
    console.log(`✅ Health Check: ${healthResponse.statusCode}`);
    if (healthResponse.statusCode !== 200) {
      console.log('❌ Health check failed!');
      return;
    }

    // Test 2: Login GET (dovrebbe restituire 405 Method Not Allowed)
    console.log('\n2️⃣ Testing Login GET (should be 405)...');
    const loginGetResponse = await makeRequest('GET', '/api/v1/auth/login');
    console.log(`✅ Login GET: ${loginGetResponse.statusCode}`);
    
    if (loginGetResponse.statusCode === 404) {
      console.log('❌ PROBLEMA: Ancora 404! Il fix non ha funzionato.');
      return;
    } else if (loginGetResponse.statusCode === 405) {
      console.log('✅ PERFETTO: 405 Method Not Allowed (endpoint raggiungibile!)');
    } else {
      console.log(`ℹ️ Status inaspettato: ${loginGetResponse.statusCode}`);
    }

    // Test 3: Login POST (dovrebbe restituire 400 Bad Request per dati mancanti)
    console.log('\n3️⃣ Testing Login POST (should be 400)...');
    const loginPostResponse = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    console.log(`✅ Login POST: ${loginPostResponse.statusCode}`);
    
    if (loginPostResponse.statusCode === 404) {
      console.log('❌ PROBLEMA: Ancora 404! Il fix non ha funzionato.');
      return;
    } else if (loginPostResponse.statusCode === 400 || loginPostResponse.statusCode === 401) {
      console.log('✅ PERFETTO: 400/401 (endpoint raggiungibile e processa richieste!)');
    } else {
      console.log(`ℹ️ Status inaspettato: ${loginPostResponse.statusCode}`);
    }

    // Test 4: Endpoint inesistente (dovrebbe restituire 404)
    console.log('\n4️⃣ Testing Non-existent Endpoint (should be 404)...');
    const notFoundResponse = await makeRequest('GET', '/api/v1/auth/nonexistent');
    console.log(`✅ Non-existent: ${notFoundResponse.statusCode}`);
    
    if (notFoundResponse.statusCode === 404) {
      console.log('✅ PERFETTO: 404 per endpoint inesistente (notFoundHandler funziona!)');
    }

    console.log('\n🎉 RISULTATO FINALE:');
    console.log('====================');
    
    if (loginGetResponse.statusCode !== 404 && loginPostResponse.statusCode !== 404) {
      console.log('✅ SUCCESS: Il fix ha funzionato!');
      console.log('✅ L\'endpoint /api/v1/auth/login è ora raggiungibile');
      console.log('✅ Il notFoundHandler è posizionato correttamente');
    } else {
      console.log('❌ FAILURE: Il problema 404 persiste');
    }

  } catch (error) {
    console.error('❌ Errore durante i test:', error.message);
  }
}

runTests();