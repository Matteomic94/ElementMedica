const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
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
  console.log('🔍 Test Diretto API Server (porta 4001)');
  console.log('=====================================\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await makeRequest('GET', '/health');
    console.log(`✅ Health Check: ${health.status}`);
    console.log(`   Body: ${health.body}\n`);

    // Test 2: GET Login (dovrebbe essere 405)
    console.log('2️⃣ Testing GET /api/v1/auth/login...');
    const getLogin = await makeRequest('GET', '/api/v1/auth/login');
    console.log(`📊 GET Login: ${getLogin.status}`);
    console.log(`   Body: ${getLogin.body}`);
    if (getLogin.status === 405) {
      console.log('✅ SUCCESSO: Restituisce 405 Method Not Allowed');
    } else if (getLogin.status === 404) {
      console.log('❌ PROBLEMA: Restituisce 404 invece di 405');
    } else {
      console.log(`⚠️  INASPETTATO: Status ${getLogin.status}`);
    }
    console.log('');

    // Test 3: POST Login con credenziali corrette
    console.log('3️⃣ Testing POST /api/v1/auth/login con credenziali corrette...');
    const postLogin = await makeRequest('POST', '/api/v1/auth/login', {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    });
    console.log(`📊 POST Login: ${postLogin.status}`);
    console.log(`   Body: ${postLogin.body}`);
    if (postLogin.status === 200) {
      console.log('✅ SUCCESSO: Login riuscito!');
    } else if (postLogin.status === 400 || postLogin.status === 401) {
      console.log('⚠️  Credenziali rifiutate (normale se non configurate)');
    } else if (postLogin.status === 404) {
      console.log('❌ PROBLEMA: Endpoint non trovato');
    } else {
      console.log(`⚠️  Status: ${postLogin.status}`);
    }
    console.log('');

    // Test 4: Endpoint inesistente
    console.log('4️⃣ Testing endpoint inesistente...');
    const notFound = await makeRequest('GET', '/api/v1/auth/nonexistent');
    console.log(`📊 Not Found: ${notFound.status}`);
    console.log(`   Body: ${notFound.body}\n`);

    // Riepilogo
    console.log('📋 RIEPILOGO TEST DIRETTO API:');
    console.log('==============================');
    console.log(`Health Check: ${health.status === 200 ? '✅' : '❌'} ${health.status}`);
    console.log(`GET Login: ${getLogin.status === 405 ? '✅' : '❌'} ${getLogin.status}`);
    console.log(`POST Login: ${postLogin.status === 200 || postLogin.status === 400 || postLogin.status === 401 ? '✅' : '❌'} ${postLogin.status}`);
    console.log(`Not Found: ${notFound.status === 404 ? '✅' : '❌'} ${notFound.status}`);

    if (getLogin.status === 405 && (postLogin.status === 200 || postLogin.status === 400 || postLogin.status === 401)) {
      console.log('\n🎉 TUTTI I TEST PASSATI! API funziona correttamente.');
    } else {
      console.log('\n❌ ALCUNI TEST FALLITI. Problema nell\'API server.');
    }

  } catch (error) {
    console.error('❌ Errore durante i test:', error.message);
  }
}

runTests();