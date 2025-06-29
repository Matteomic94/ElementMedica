#!/usr/bin/env node

/**
 * Test Confronto Diretto con Server Principale
 * Questo test confronta il comportamento del server principale (porta 4001)
 * con i nostri test per identificare la differenza critica
 */

const http = require('http');

// Funzione per testare un server specifico
const testServer = async (method, path, port, data = null, description = '') => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Direct-Comparison/1.0'
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
            server: description,
            method,
            path,
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            server: description,
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
      reject({
        server: description,
        error: err.message,
        code: err.code
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Funzione per confrontare due risultati
const compareResults = (result1, result2, testName) => {
  console.log(`\n📊 CONFRONTO: ${testName}`);
  console.log('='.repeat(60));
  
  console.log(`🔵 ${result1.server}:`);
  console.log(`   Status: ${result1.status}`);
  if (result1.error) {
    console.log(`   ❌ Error: ${result1.error} (${result1.code})`);
  } else {
    if (result1.body && typeof result1.body === 'object' && result1.body.error) {
      console.log(`   Error: ${result1.body.error}`);
    }
    if (result1.headers && result1.headers['content-type']) {
      console.log(`   Content-Type: ${result1.headers['content-type']}`);
    }
  }
  
  console.log(`🟢 ${result2.server}:`);
  console.log(`   Status: ${result2.status}`);
  if (result2.error) {
    console.log(`   ❌ Error: ${result2.error} (${result2.code})`);
  } else {
    if (result2.body && typeof result2.body === 'object' && result2.body.error) {
      console.log(`   Error: ${result2.body.error}`);
    }
    if (result2.headers && result2.headers['content-type']) {
      console.log(`   Content-Type: ${result2.headers['content-type']}`);
    }
  }
  
  // Analisi differenze
  if (result1.error || result2.error) {
    if (result1.error && !result2.error) {
      console.log(`   🔍 DIFFERENZA: ${result1.server} ha errore di connessione!`);
    } else if (!result1.error && result2.error) {
      console.log(`   🔍 DIFFERENZA: ${result2.server} ha errore di connessione!`);
    } else if (result1.error && result2.error) {
      console.log(`   🔍 ENTRAMBI hanno errori di connessione`);
    }
  } else if (result1.status !== result2.status) {
    console.log(`   🎯 DIFFERENZA CRITICA: Status diversi! (${result1.status} vs ${result2.status})`);
    
    if (result1.status === 404 && result2.status === 405) {
      console.log(`   🔍 ${result1.server} intercetta la richiesta (404)`);
      console.log(`   🔍 ${result2.server} gestisce correttamente (405)`);
    } else if (result1.status === 405 && result2.status === 404) {
      console.log(`   🔍 ${result2.server} intercetta la richiesta (404)`);
      console.log(`   🔍 ${result1.server} gestisce correttamente (405)`);
    }
  } else {
    console.log(`   ✅ Status identici: ${result1.status}`);
  }
};

console.log('🔍 Test Confronto Diretto con Server Principale');
console.log('===============================================\n');

const testData = {
  identifier: 'admin@example.com',
  password: 'Admin123!'
};

(async () => {
  try {
    console.log('🎯 OBIETTIVO: Confrontare il server principale (4001) con i nostri test');
    console.log('per identificare perché il server principale si comporta diversamente.\n');
    
    // Prima verifichiamo se il server principale è raggiungibile
    console.log('🔍 Test 0: Verifica connettività server principale');
    console.log('='.repeat(50));
    
    try {
      const healthCheck = await testServer('GET', '/health', 4001, null, 'Server Principale (4001)');
      console.log(`✅ Server principale raggiungibile: ${healthCheck.status}`);
      if (healthCheck.body && healthCheck.body.status) {
        console.log(`   Status: ${healthCheck.body.status}`);
        console.log(`   Uptime: ${healthCheck.body.uptime}s`);
      }
    } catch (error) {
      console.log(`❌ Server principale NON raggiungibile: ${error.error || error.message}`);
      console.log('\n🚨 PROBLEMA CRITICO: Il server principale non è in esecuzione!');
      console.log('Per favore, avvia il server principale sulla porta 4001 e riprova.');
      process.exit(1);
    }
    
    // Ora creiamo un server di test per il confronto
    console.log('\n🚀 Creazione server di test per confronto...');
    
    const express = require('express');
    const cors = require('cors');
    const bodyParser = require('body-parser');
    
    const app = express();
    
    // Replica esatta della configurazione di api-server.js
    app.use(cors({
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4173'
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      optionsSuccessStatus: 204,
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));
    
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
    
    // Importa i middleware
    const { default: authV1Routes } = await import('./routes/v1/auth.js');
    const { createAuthRouter } = await import('./auth/index.js');
    
    // Mount v1 routes FIRST
    app.use('/api/v1/auth', authV1Routes);
    
    // Mount authentication routes AFTER
    const authRoutes = createAuthRouter();
    app.use('/api', authRoutes);
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'test-comparison-server'
      });
    });
    
    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
    
    const comparisonServer = app.listen(4020, '127.0.0.1', () => {
      console.log('✅ Server di test avviato su porta 4020');
    });
    
    // Aspetta che il server sia pronto
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // CONFRONTI DIRETTI
    console.log('\n🔍 INIZIO CONFRONTI DIRETTI');
    console.log('='.repeat(50));
    
    // Test 1: GET /api/v1/auth/login
    const [mainGet, testGet] = await Promise.allSettled([
      testServer('GET', '/api/v1/auth/login', 4001, null, 'Server Principale (4001)'),
      testServer('GET', '/api/v1/auth/login', 4020, null, 'Server Test (4020)')
    ]);
    
    if (mainGet.status === 'fulfilled' && testGet.status === 'fulfilled') {
      compareResults(mainGet.value, testGet.value, 'GET /api/v1/auth/login');
    } else {
      console.log('\n❌ Errore nei test GET:');
      if (mainGet.status === 'rejected') console.log(`   Server Principale: ${mainGet.reason.error}`);
      if (testGet.status === 'rejected') console.log(`   Server Test: ${testGet.reason.error}`);
    }
    
    // Test 2: POST /api/v1/auth/login
    const [mainPost, testPost] = await Promise.allSettled([
      testServer('POST', '/api/v1/auth/login', 4001, testData, 'Server Principale (4001)'),
      testServer('POST', '/api/v1/auth/login', 4020, testData, 'Server Test (4020)')
    ]);
    
    if (mainPost.status === 'fulfilled' && testPost.status === 'fulfilled') {
      compareResults(mainPost.value, testPost.value, 'POST /api/v1/auth/login');
    } else {
      console.log('\n❌ Errore nei test POST:');
      if (mainPost.status === 'rejected') console.log(`   Server Principale: ${mainPost.reason.error}`);
      if (testPost.status === 'rejected') console.log(`   Server Test: ${testPost.reason.error}`);
    }
    
    // Test 3: PUT /api/v1/auth/login
    const [mainPut, testPut] = await Promise.allSettled([
      testServer('PUT', '/api/v1/auth/login', 4001, testData, 'Server Principale (4001)'),
      testServer('PUT', '/api/v1/auth/login', 4020, testData, 'Server Test (4020)')
    ]);
    
    if (mainPut.status === 'fulfilled' && testPut.status === 'fulfilled') {
      compareResults(mainPut.value, testPut.value, 'PUT /api/v1/auth/login');
    } else {
      console.log('\n❌ Errore nei test PUT:');
      if (mainPut.status === 'rejected') console.log(`   Server Principale: ${mainPut.reason.error}`);
      if (testPut.status === 'rejected') console.log(`   Server Test: ${testPut.reason.error}`);
    }
    
    // Test 4: Health check
    const [mainHealth, testHealth] = await Promise.allSettled([
      testServer('GET', '/health', 4001, null, 'Server Principale (4001)'),
      testServer('GET', '/health', 4020, null, 'Server Test (4020)')
    ]);
    
    if (mainHealth.status === 'fulfilled' && testHealth.status === 'fulfilled') {
      compareResults(mainHealth.value, testHealth.value, 'GET /health');
    }
    
    console.log('\n\n📋 ANALISI FINALE CONFRONTO:');
    console.log('============================');
    
    if (mainGet.status === 'fulfilled' && testGet.status === 'fulfilled') {
      if (mainGet.value.status === 404 && testGet.value.status === 405) {
        console.log('🎯 PROBLEMA CONFERMATO:');
        console.log('Il server principale (4001) restituisce 404 per GET /api/v1/auth/login');
        console.log('Il server test (4020) restituisce 405 (corretto)');
        console.log('');
        console.log('🔍 POSSIBILI CAUSE:');
        console.log('1. Il server principale ha configurazioni aggiuntive non replicate');
        console.log('2. Il server principale ha middleware aggiuntivi');
        console.log('3. Il server principale ha variabili d\'ambiente diverse');
        console.log('4. Il server principale ha dipendenze diverse caricate');
        console.log('');
        console.log('🎯 PROSSIMO PASSO:');
        console.log('Analizzare le differenze specifiche nel codice del server principale');
      } else if (mainGet.value.status === testGet.value.status) {
        console.log('⚠️  RISULTATO INASPETTATO:');
        console.log('Entrambi i server hanno lo stesso comportamento!');
        console.log('Il problema potrebbe essere intermittente o dipendente da altri fattori.');
      }
    }
    
    // Chiudi il server di test
    comparisonServer.close();
    console.log('\n✅ Server di test chiuso');
    
  } catch (error) {
    console.error('❌ Errore durante il confronto:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
})();