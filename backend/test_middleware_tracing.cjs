const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Trace': 'middleware-tracing'
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

async function runTracingTests() {
  console.log('🔍 Test Tracing Middleware (porta 4001)');
  console.log('======================================\n');

  try {
    // Test 1: Percorso che dovrebbe funzionare - /api/auth/login (POST)
    console.log('1️⃣ Testing POST /api/auth/login (dovrebbe funzionare)...');
    const apiAuthLogin = await makeRequest('POST', '/api/auth/login', {
      identifier: 'test@example.com',
      password: 'test123'
    });
    console.log(`📊 POST /api/auth/login: ${apiAuthLogin.status}`);
    console.log(`   Body: ${apiAuthLogin.body.substring(0, 100)}...\n`);

    // Test 2: Percorso problematico - /api/v1/auth/login (GET)
    console.log('2️⃣ Testing GET /api/v1/auth/login (problematico)...');
    const apiV1AuthLoginGet = await makeRequest('GET', '/api/v1/auth/login');
    console.log(`📊 GET /api/v1/auth/login: ${apiV1AuthLoginGet.status}`);
    console.log(`   Body: ${apiV1AuthLoginGet.body}\n`);

    // Test 3: Percorso problematico - /api/v1/auth/login (POST)
    console.log('3️⃣ Testing POST /api/v1/auth/login (problematico)...');
    const apiV1AuthLoginPost = await makeRequest('POST', '/api/v1/auth/login', {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    });
    console.log(`📊 POST /api/v1/auth/login: ${apiV1AuthLoginPost.status}`);
    console.log(`   Body: ${apiV1AuthLoginPost.body}\n`);

    // Test 4: Test di un altro endpoint v1 per vedere se il problema è generale
    console.log('4️⃣ Testing GET /api/v1/auth/health (se esiste)...');
    const apiV1AuthHealth = await makeRequest('GET', '/api/v1/auth/health');
    console.log(`📊 GET /api/v1/auth/health: ${apiV1AuthHealth.status}`);
    console.log(`   Body: ${apiV1AuthHealth.body}\n`);

    // Test 5: Test di un endpoint completamente diverso
    console.log('5️⃣ Testing GET /api/persons (endpoint diverso)...');
    const apiPersons = await makeRequest('GET', '/api/persons');
    console.log(`📊 GET /api/persons: ${apiPersons.status}`);
    console.log(`   Body: ${apiPersons.body.substring(0, 100)}...\n`);

    // Analisi risultati
    console.log('📋 ANALISI RISULTATI:');
    console.log('====================');
    console.log(`/api/auth/login (POST): ${apiAuthLogin.status}`);
    console.log(`/api/v1/auth/login (GET): ${apiV1AuthLoginGet.status}`);
    console.log(`/api/v1/auth/login (POST): ${apiV1AuthLoginPost.status}`);
    console.log(`/api/v1/auth/health: ${apiV1AuthHealth.status}`);
    console.log(`/api/persons: ${apiPersons.status}`);

    if (apiV1AuthLoginGet.status === 404 && apiV1AuthLoginPost.status === 404) {
      console.log('\n❌ PROBLEMA CONFERMATO: Tutti gli endpoint /api/v1/auth/* restituiscono 404');
      console.log('   Questo suggerisce che il middleware /api/v1/auth non è montato correttamente');
    } else if (apiV1AuthLoginGet.status === 404 && apiV1AuthLoginPost.status !== 404) {
      console.log('\n⚠️  PROBLEMA PARZIALE: Solo GET restituisce 404, POST funziona');
      console.log('   Questo suggerisce un problema con gli handler specifici per metodo');
    } else {
      console.log('\n✅ MIDDLEWARE FUNZIONA: Gli endpoint /api/v1/auth/* sono raggiungibili');
    }

  } catch (error) {
    console.error('❌ Errore durante i test:', error.message);
  }
}

runTracingTests();