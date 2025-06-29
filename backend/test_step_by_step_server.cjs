#!/usr/bin/env node

/**
 * Test Step-by-Step del Server Principale
 * Questo test replica ESATTAMENTE la configurazione di api-server.js
 * montando i middleware uno alla volta per identificare dove le richieste GET vengono intercettate
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');

// Funzione per testare una configurazione specifica
const testConfiguration = async (method, path, port, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Step-By-Step/1.0'
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

// Funzione per creare server con configurazione progressiva
const createProgressiveServer = async (step) => {
  const app = express();
  
  console.log(`\n🔧 STEP ${step}: Configurazione progressiva`);
  
  if (step >= 1) {
    console.log('   ✅ CORS middleware');
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
  }
  
  if (step >= 2) {
    console.log('   ✅ Body Parser middleware');
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
  }
  
  if (step >= 3) {
    console.log('   ✅ /api/v1/auth middleware');
    try {
      const { default: authV1Routes } = await import('./routes/v1/auth.js');
      app.use('/api/v1/auth', authV1Routes);
    } catch (error) {
      console.log('   ❌ Errore caricamento /api/v1/auth:', error.message);
      return null;
    }
  }
  
  if (step >= 4) {
    console.log('   ✅ Middleware generico /api');
    try {
      const { createAuthRouter } = await import('./auth/index.js');
      const authRoutes = createAuthRouter();
      app.use('/api', authRoutes);
    } catch (error) {
      console.log('   ❌ Errore caricamento middleware generico /api:', error.message);
      return null;
    }
  }
  
  if (step >= 5) {
    console.log('   ✅ Altri middleware di route');
    // Simuliamo altri middleware senza importarli realmente
    app.use('/api/persons', (req, res) => res.json({ message: 'persons route' }));
    app.use('/courses', (req, res) => res.json({ message: 'courses route' }));
    app.use('/users', (req, res) => res.json({ message: 'users route' }));
  }
  
  if (step >= 6) {
    console.log('   ✅ Health check endpoint');
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        step: step
      });
    });
  }
  
  if (step >= 7) {
    console.log('   ✅ 404 handler');
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        step: step
      });
    });
  }
  
  return app;
};

// Test principale
console.log('🔍 Test Step-by-Step Configurazione Server Principale');
console.log('====================================================\n');

const testData = {
  identifier: 'admin@example.com',
  password: 'Admin123!'
};

(async () => {
  const servers = [];
  
  try {
    // Test ogni step progressivamente
    for (let step = 1; step <= 7; step++) {
      const port = 4010 + step;
      
      console.log(`\n🚀 TESTING STEP ${step} (porta ${port})`);
      console.log('='.repeat(50));
      
      const app = await createProgressiveServer(step);
      
      if (!app) {
        console.log(`❌ Impossibile creare server per step ${step}`);
        continue;
      }
      
      // Avvia il server
      const server = app.listen(port, '127.0.0.1', () => {
        console.log(`✅ Server step ${step} avviato su porta ${port}`);
      });
      
      servers.push({ server, step, port });
      
      // Aspetta che il server sia pronto
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test GET /api/v1/auth/login
      if (step >= 3) {
        console.log(`\n📋 Test GET /api/v1/auth/login (step ${step})`);
        try {
          const getResult = await testConfiguration('GET', '/api/v1/auth/login', port);
          console.log(`   GET /api/v1/auth/login: ${getResult.status}`);
          
          if (getResult.status === 405) {
            console.log('   ✅ CORRETTO: 405 Method Not Allowed');
          } else if (getResult.status === 404) {
            console.log('   ❌ PROBLEMA: 404 - Richiesta intercettata!');
            console.log(`   🔍 PROBLEMA IDENTIFICATO AL STEP ${step}!`);
            
            if (step === 3) {
              console.log('   🎯 Il problema è nel middleware /api/v1/auth stesso!');
            } else if (step === 4) {
              console.log('   🎯 Il problema è causato dal middleware generico /api!');
            } else {
              console.log(`   🎯 Il problema è causato da middleware aggiunto al step ${step}!`);
            }
          } else {
            console.log(`   ⚠️  Status inaspettato: ${getResult.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Errore test GET: ${error.message}`);
        }
        
        // Test POST /api/v1/auth/login
        console.log(`\n📋 Test POST /api/v1/auth/login (step ${step})`);
        try {
          const postResult = await testConfiguration('POST', '/api/v1/auth/login', port, testData);
          console.log(`   POST /api/v1/auth/login: ${postResult.status}`);
          
          if (postResult.status === 401) {
            console.log('   ✅ CORRETTO: 401 Unauthorized');
          } else if (postResult.status === 404) {
            console.log('   ❌ PROBLEMA: 404 - Richiesta intercettata!');
          } else {
            console.log(`   ⚠️  Status inaspettato: ${postResult.status}`);
            if (postResult.body && postResult.body.error) {
              console.log(`   📄 Error: ${postResult.body.error}`);
            }
          }
        } catch (error) {
          console.log(`   ❌ Errore test POST: ${error.message}`);
        }
      }
      
      // Test health endpoint se disponibile
      if (step >= 6) {
        console.log(`\n📋 Test GET /health (step ${step})`);
        try {
          const healthResult = await testConfiguration('GET', '/health', port);
          console.log(`   GET /health: ${healthResult.status}`);
          
          if (healthResult.status === 200) {
            console.log('   ✅ CORRETTO: Health check funziona');
          } else {
            console.log(`   ⚠️  Status inaspettato: ${healthResult.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Errore test health: ${error.message}`);
        }
      }
    }
    
    console.log('\n\n📋 ANALISI FINALE STEP-BY-STEP:');
    console.log('================================');
    console.log('Se il problema appare a un step specifico, quello è il middleware responsabile!');
    console.log('Se il problema non appare in nessun step, allora è un problema di configurazione');
    console.log('diversa tra questo test e il server principale.');
    
  } catch (error) {
    console.error('❌ Errore durante il test step-by-step:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Chiudi tutti i server
    console.log('\n🔄 Chiusura di tutti i server...');
    for (const { server, step } of servers) {
      server.close();
      console.log(`✅ Server step ${step} chiuso`);
    }
    process.exit(0);
  }
})();