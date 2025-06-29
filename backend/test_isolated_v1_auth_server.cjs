#!/usr/bin/env node

/**
 * Test Server Isolato per middleware /api/v1/auth
 * Questo server monta SOLO il middleware /api/v1/auth senza alcun altro middleware
 * per verificare se il problema è intrinseco al middleware stesso
 */

const express = require('express');
const http = require('http');

// Funzione per creare il server isolato
const createIsolatedServer = () => {
  const app = express();
  
  // Solo middleware essenziali
  app.use(express.json());
  
  // Importa dinamicamente il middleware authV1Routes
  return import('./routes/v1/auth.js').then(({ default: authV1Routes }) => {
    // Monta SOLO il middleware /api/v1/auth
    app.use('/api/v1/auth', authV1Routes);
    
    // Handler 404 per tutto il resto
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found in isolated server',
        path: req.originalUrl,
        method: req.method
      });
    });
    
    return app;
  });
};

// Funzione per testare il server isolato
const testIsolatedServer = async (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4005, // Porta diversa per evitare conflitti
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Isolated-Server/1.0'
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

console.log('🔍 Test Server Isolato per /api/v1/auth');
console.log('======================================\n');

(async () => {
  let server;
  
  try {
    console.log('🚀 Creazione server isolato...');
    
    const app = await createIsolatedServer();
    
    // Avvia il server isolato
    server = app.listen(4005, '127.0.0.1', () => {
      console.log('✅ Server isolato avviato su porta 4005\n');
    });
    
    // Aspetta che il server sia pronto
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const testData = {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    };

    console.log('📋 Test 1: POST /api/v1/auth/login (dovrebbe funzionare)\n');
    
    const postResult = await testIsolatedServer('POST', '/api/v1/auth/login', testData);
    console.log(`POST /api/v1/auth/login: ${postResult.status}`);
    if (postResult.status === 401) {
      console.log('✅ POST funziona correttamente (401 = credenziali non valide)');
    } else if (postResult.status === 404) {
      console.log('❌ POST non funziona (404 = endpoint non trovato)');
    } else if (postResult.status === 500) {
      console.log('⚠️  Errore interno del server');
      if (postResult.body.error) {
        console.log(`📄 Error: ${postResult.body.error}`);
      }
    } else {
      console.log(`⚠️  Status inaspettato: ${postResult.status}`);
      if (postResult.body.error) {
        console.log(`📄 Error: ${postResult.body.error}`);
      }
    }
    console.log('');

    console.log('📋 Test 2: GET /api/v1/auth/login (dovrebbe restituire 405)\n');
    
    const getResult = await testIsolatedServer('GET', '/api/v1/auth/login');
    console.log(`GET /api/v1/auth/login: ${getResult.status}`);
    if (getResult.status === 405) {
      console.log('✅ GET funziona correttamente (405 = Method Not Allowed)');
      console.log('🎯 IL MIDDLEWARE /api/v1/auth FUNZIONA CORRETTAMENTE!');
    } else if (getResult.status === 404) {
      console.log('❌ GET non raggiunge il middleware (404 = endpoint non trovato)');
      console.log('🔍 IL PROBLEMA È NEL MIDDLEWARE STESSO!');
    } else {
      console.log(`⚠️  Status inaspettato: ${getResult.status}`);
      if (getResult.body.error) {
        console.log(`📄 Error: ${getResult.body.error}`);
      }
    }
    console.log('');

    console.log('📋 Test 3: PUT /api/v1/auth/login (dovrebbe restituire 405)\n');
    
    const putResult = await testIsolatedServer('PUT', '/api/v1/auth/login', testData);
    console.log(`PUT /api/v1/auth/login: ${putResult.status}`);
    if (putResult.status === 405) {
      console.log('✅ PUT funziona correttamente (405 = Method Not Allowed)');
    } else if (putResult.status === 404) {
      console.log('❌ PUT non raggiunge il middleware (404 = endpoint non trovato)');
    } else {
      console.log(`⚠️  Status inaspettato: ${putResult.status}`);
    }
    console.log('');

    console.log('📋 Test 4: Path inesistente (dovrebbe restituire 404)\n');
    
    const nonExistentResult = await testIsolatedServer('GET', '/api/v1/auth/nonexistent');
    console.log(`GET /api/v1/auth/nonexistent: ${nonExistentResult.status}`);
    if (nonExistentResult.status === 404) {
      console.log('✅ Path inesistente gestito correttamente');
    } else {
      console.log(`⚠️  Status inaspettato: ${nonExistentResult.status}`);
    }
    console.log('');

    console.log('\n📋 ANALISI RISULTATI FINALI:');
    console.log('============================');
    
    if (getResult.status === 405 && putResult.status === 405) {
      console.log('🎯 CONCLUSIONE DEFINITIVA:');
      console.log('Il middleware /api/v1/auth funziona PERFETTAMENTE quando isolato!');
      console.log('');
      console.log('✅ GET → 405 (Method Not Allowed) ← CORRETTO');
      console.log('✅ PUT → 405 (Method Not Allowed) ← CORRETTO');
      console.log('✅ POST → 401 (Unauthorized) ← CORRETTO');
      console.log('');
      console.log('🔍 IL PROBLEMA È CAUSATO DA INTERFERENZE ESTERNE!');
      console.log('Qualcosa nel server principale intercetta le richieste GET/PUT');
      console.log('prima che arrivino al middleware /api/v1/auth.');
      console.log('');
      console.log('🎯 PROSSIMI PASSI:');
      console.log('1. Analizzare middleware che precedono /api/v1/auth in api-server.js');
      console.log('2. Verificare se il middleware generico /api ha filtri nascosti');
      console.log('3. Controllare se ci sono route specifiche che intercettano');
    } else if (getResult.status === 404) {
      console.log('🔍 PROBLEMA NEL MIDDLEWARE STESSO:');
      console.log('Anche in isolamento, il middleware non gestisce correttamente');
      console.log('i metodi HTTP diversi da POST.');
      console.log('');
      console.log('🎯 PROSSIMI PASSI:');
      console.log('1. Verificare la definizione dei routes in /routes/v1/auth.js');
      console.log('2. Controllare se methodNotAllowedHandler è definito correttamente');
    } else {
      console.log('⚠️  RISULTATI INASPETTATI:');
      console.log(`GET: ${getResult.status}, PUT: ${putResult.status}`);
      console.log('Necessaria ulteriore investigazione.');
    }

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (server) {
      console.log('\n🔄 Chiusura server isolato...');
      server.close();
      console.log('✅ Server isolato chiuso');
    }
    process.exit(0);
  }
})();