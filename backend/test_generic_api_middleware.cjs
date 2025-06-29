#!/usr/bin/env node

/**
 * Test per il middleware generico /api
 * Questo test monta SOLO il middleware generico /api (createAuthRouter)
 * per verificare se intercetta le richieste destinate a /api/v1/auth
 */

const express = require('express');
const http = require('http');

// Funzione per creare il server con solo middleware generico
const createGenericApiServer = () => {
  const app = express();
  
  // Solo middleware essenziali
  app.use(express.json());
  
  // Importa dinamicamente il middleware createAuthRouter
  return import('./auth/index.js').then(({ createAuthRouter }) => {
    // Monta SOLO il middleware generico /api
    const authRoutes = createAuthRouter();
    app.use('/api', authRoutes);
    
    // Handler 404 per tutto il resto
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found in generic API server',
        path: req.originalUrl,
        method: req.method
      });
    });
    
    return app;
  });
};

// Funzione per testare il server generico
const testGenericApiServer = async (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4006, // Porta diversa per evitare conflitti
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Generic-API/1.0'
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
            body: jsonBody
          });
        } catch (e) {
          resolve({
            method,
            path,
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

console.log('🔍 Test Middleware Generico /api');
console.log('=================================\n');

(async () => {
  let server;
  
  try {
    console.log('🚀 Creazione server con middleware generico /api...');
    
    const app = await createGenericApiServer();
    
    // Avvia il server generico
    server = app.listen(4006, '127.0.0.1', () => {
      console.log('✅ Server generico /api avviato su porta 4006\n');
    });
    
    // Aspetta che il server sia pronto
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const testData = {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    };

    console.log('📋 Test 1: GET /api/v1/auth/login (cosa fa il middleware generico?)\n');
    
    const getV1Result = await testGenericApiServer('GET', '/api/v1/auth/login');
    console.log(`GET /api/v1/auth/login: ${getV1Result.status}`);
    if (getV1Result.status === 404) {
      console.log('✅ Middleware generico NON intercetta /api/v1/auth/login (404 corretto)');
    } else {
      console.log('❌ Middleware generico INTERCETTA /api/v1/auth/login!');
      console.log(`📄 Response: ${JSON.stringify(getV1Result.body, null, 2)}`);
    }
    console.log('');

    console.log('📋 Test 2: POST /api/v1/auth/login (cosa fa il middleware generico?)\n');
    
    const postV1Result = await testGenericApiServer('POST', '/api/v1/auth/login', testData);
    console.log(`POST /api/v1/auth/login: ${postV1Result.status}`);
    if (postV1Result.status === 404) {
      console.log('✅ Middleware generico NON intercetta /api/v1/auth/login (404 corretto)');
    } else {
      console.log('❌ Middleware generico INTERCETTA /api/v1/auth/login!');
      console.log(`📄 Response: ${JSON.stringify(postV1Result.body, null, 2)}`);
    }
    console.log('');

    console.log('📋 Test 3: GET /api/auth/login (dovrebbe funzionare)\n');
    
    const getAuthResult = await testGenericApiServer('GET', '/api/auth/login');
    console.log(`GET /api/auth/login: ${getAuthResult.status}`);
    if (getAuthResult.status === 405) {
      console.log('✅ Middleware generico gestisce correttamente /api/auth/login (405 = Method Not Allowed)');
    } else if (getAuthResult.status === 404) {
      console.log('⚠️  Middleware generico non trova /api/auth/login (404)');
    } else {
      console.log(`⚠️  Status inaspettato: ${getAuthResult.status}`);
      console.log(`📄 Response: ${JSON.stringify(getAuthResult.body, null, 2)}`);
    }
    console.log('');

    console.log('📋 Test 4: POST /api/auth/login (dovrebbe funzionare)\n');
    
    const postAuthResult = await testGenericApiServer('POST', '/api/auth/login', testData);
    console.log(`POST /api/auth/login: ${postAuthResult.status}`);
    if (postAuthResult.status === 401) {
      console.log('✅ Middleware generico gestisce correttamente /api/auth/login (401 = Unauthorized)');
    } else if (postAuthResult.status === 404) {
      console.log('❌ Middleware generico non trova /api/auth/login (404)');
    } else {
      console.log(`⚠️  Status inaspettato: ${postAuthResult.status}`);
      console.log(`📄 Response: ${JSON.stringify(postAuthResult.body, null, 2)}`);
    }
    console.log('');

    console.log('📋 Test 5: GET /api/health (dovrebbe funzionare)\n');
    
    const healthResult = await testGenericApiServer('GET', '/api/health');
    console.log(`GET /api/health: ${healthResult.status}`);
    if (healthResult.status === 200) {
      console.log('✅ Middleware generico gestisce correttamente /api/health');
    } else {
      console.log(`⚠️  Status inaspettato: ${healthResult.status}`);
      console.log(`📄 Response: ${JSON.stringify(healthResult.body, null, 2)}`);
    }
    console.log('');

    console.log('\n📋 ANALISI RISULTATI:');
    console.log('=====================');
    
    if (getV1Result.status === 404 && postV1Result.status === 404) {
      console.log('🎯 CONCLUSIONE:');
      console.log('Il middleware generico /api NON intercetta le richieste /api/v1/auth/*');
      console.log('Questo è CORRETTO - il middleware generico non dovrebbe gestire /api/v1/auth');
      console.log('');
      console.log('🔍 IL PROBLEMA È ALTROVE!');
      console.log('Dobbiamo cercare altri middleware o configurazioni che intercettano');
      console.log('le richieste GET/PUT prima che arrivino a /api/v1/auth.');
    } else {
      console.log('🔍 PROBLEMA TROVATO:');
      console.log('Il middleware generico /api STA intercettando le richieste /api/v1/auth!');
      console.log('Questo spiega perché solo POST funziona.');
      console.log('');
      console.log('🎯 SOLUZIONE:');
      console.log('Dobbiamo modificare il middleware generico per NON intercettare /api/v1/*');
    }

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (server) {
      console.log('\n🔄 Chiusura server generico...');
      server.close();
      console.log('✅ Server generico chiuso');
    }
    process.exit(0);
  }
})();