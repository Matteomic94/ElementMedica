#!/usr/bin/env node

/**
 * Test Script: Verifica Login dopo Correzione Import Express
 * 
 * Questo script testa il flusso completo di login dopo aver risolto
 * il problema critico dell'import di Express mancante nei server.
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configurazione test
const API_BASE_URL = 'http://localhost:4001';
const PROXY_BASE_URL = 'http://localhost:4003';
const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'Admin123!'
};

// Colori per output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bold}[STEP ${step}]${colors.reset} ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testDatabaseConnection() {
  logStep(1, 'Test Connessione Database');
  
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    logSuccess('Database PostgreSQL raggiungibile');
    
    // Verifica utente admin
    const admin = await prisma.user.findUnique({
      where: { email: TEST_CREDENTIALS.email },
      select: { id: true, email: true, isActive: true, password: true }
    });
    
    if (!admin) {
      logError('Utente admin non trovato nel database');
      return false;
    }
    
    if (!admin.isActive) {
      logError('Utente admin non è attivo');
      return false;
    }
    
    logSuccess(`Utente admin trovato: ${admin.email}`);
    
    // Test verifica password
    const passwordMatch = await bcrypt.compare(TEST_CREDENTIALS.password, admin.password);
    if (passwordMatch) {
      logSuccess('Password admin verificata correttamente');
    } else {
      logError('Password admin non corrisponde');
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`Errore connessione database: ${error.message}`);
    return false;
  }
}

async function testServerHealth(url, serverName) {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${url}/health`, {
      timeout: 5000
    });
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200) {
      logSuccess(`${serverName} health check OK (${responseTime}ms)`);
      if (response.data) {
        log(`   Status: ${response.data.status}`);
        if (response.data.services) {
          log(`   Database: ${response.data.services.database}`);
          log(`   Redis: ${response.data.services.redis}`);
        }
      }
      return true;
    } else {
      logError(`${serverName} health check failed: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError(`${serverName} non raggiungibile (server non avviato?)`);
    } else if (error.code === 'ECONNABORTED') {
      logError(`${serverName} timeout (${error.message})`);
    } else {
      logError(`${serverName} errore: ${error.message}`);
    }
    return false;
  }
}

async function testDirectApiLogin() {
  logStep(3, 'Test Login Diretto API Server (porta 4001)');
  
  try {
    const startTime = Date.now();
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_CREDENTIALS, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200 && response.data.accessToken) {
      logSuccess(`Login API diretto riuscito (${responseTime}ms)`);
      log(`   Access Token: ${response.data.accessToken.substring(0, 20)}...`);
      log(`   Refresh Token: ${response.data.refreshToken ? 'Presente' : 'Assente'}`);
      log(`   Session Token: ${response.data.sessionToken ? 'Presente' : 'Assente'}`);
      return { success: true, tokens: response.data, responseTime };
    } else {
      logError(`Login API fallito: HTTP ${response.status}`);
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false, error: 'Invalid response' };
    }
  } catch (error) {
    if (error.response) {
      logError(`Login API fallito: HTTP ${error.response.status}`);
      log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.code === 'ECONNABORTED') {
      logError(`Login API timeout: ${error.message}`);
    } else {
      logError(`Login API errore: ${error.message}`);
    }
    return { success: false, error: error.message };
  }
}

async function testProxyLogin() {
  logStep(4, 'Test Login tramite Proxy Server (porta 4003)');
  
  try {
    const startTime = Date.now();
    const response = await axios.post(`${PROXY_BASE_URL}/api/auth/login`, TEST_CREDENTIALS, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200 && response.data.accessToken) {
      logSuccess(`Login tramite Proxy riuscito (${responseTime}ms)`);
      log(`   Access Token: ${response.data.accessToken.substring(0, 20)}...`);
      log(`   Refresh Token: ${response.data.refreshToken ? 'Presente' : 'Assente'}`);
      log(`   Session Token: ${response.data.sessionToken ? 'Presente' : 'Assente'}`);
      return { success: true, tokens: response.data, responseTime };
    } else {
      logError(`Login Proxy fallito: HTTP ${response.status}`);
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false, error: 'Invalid response' };
    }
  } catch (error) {
    if (error.response) {
      logError(`Login Proxy fallito: HTTP ${error.response.status}`);
      log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.code === 'ECONNABORTED') {
      logError(`Login Proxy timeout: ${error.message}`);
    } else {
      logError(`Login Proxy errore: ${error.message}`);
    }
    return { success: false, error: error.message };
  }
}

async function testSessionsInDatabase() {
  logStep(5, 'Verifica Sessioni nel Database');
  
  try {
    const activeSessions = await prisma.userSession.count({
      where: { isActive: true }
    });
    
    const recentSessions = await prisma.userSession.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Ultimi 5 minuti
        }
      },
      select: {
        id: true,
        userId: true,
        deviceInfo: true,
        lastActivity: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    logSuccess(`Sessioni attive totali: ${activeSessions}`);
    log(`Sessioni recenti (ultimi 5 min): ${recentSessions.length}`);
    
    recentSessions.forEach((session, index) => {
      log(`   ${index + 1}. ID: ${session.id.substring(0, 8)}... | User: ${session.userId.substring(0, 8)}... | Created: ${session.createdAt.toISOString()}`);
    });
    
    return true;
  } catch (error) {
    logError(`Errore verifica sessioni: ${error.message}`);
    return false;
  }
}

async function runCompleteTest() {
  log(`${colors.bold}🧪 TEST COMPLETO LOGIN DOPO CORREZIONE IMPORT EXPRESS${colors.reset}`);
  log(`${colors.bold}================================================================${colors.reset}`);
  
  const results = {
    database: false,
    apiHealth: false,
    proxyHealth: false,
    directLogin: false,
    proxyLogin: false,
    sessions: false
  };
  
  // Test 1: Database
  results.database = await testDatabaseConnection();
  
  // Test 2: Health Checks
  logStep(2, 'Test Health Check Server');
  results.apiHealth = await testServerHealth(API_BASE_URL, 'API Server');
  results.proxyHealth = await testServerHealth(PROXY_BASE_URL, 'Proxy Server');
  
  // Test 3: Login Diretto API
  if (results.apiHealth) {
    const directResult = await testDirectApiLogin();
    results.directLogin = directResult.success;
  } else {
    logWarning('Saltando test login diretto - API Server non disponibile');
  }
  
  // Test 4: Login tramite Proxy
  if (results.proxyHealth) {
    const proxyResult = await testProxyLogin();
    results.proxyLogin = proxyResult.success;
  } else {
    logWarning('Saltando test login proxy - Proxy Server non disponibile');
  }
  
  // Test 5: Sessioni Database
  if (results.database) {
    results.sessions = await testSessionsInDatabase();
  }
  
  // Riepilogo Risultati
  log(`\n${colors.bold}📊 RIEPILOGO RISULTATI${colors.reset}`);
  log(`${colors.bold}========================${colors.reset}`);
  
  const testResults = [
    { name: 'Database Connection', status: results.database },
    { name: 'API Server Health', status: results.apiHealth },
    { name: 'Proxy Server Health', status: results.proxyHealth },
    { name: 'Direct API Login', status: results.directLogin },
    { name: 'Proxy Login', status: results.proxyLogin },
    { name: 'Database Sessions', status: results.sessions }
  ];
  
  testResults.forEach(test => {
    const status = test.status ? '✅ PASS' : '❌ FAIL';
    const color = test.status ? 'green' : 'red';
    log(`${test.name.padEnd(25)} ${status}`, color);
  });
  
  const passedTests = testResults.filter(t => t.status).length;
  const totalTests = testResults.length;
  
  log(`\n${colors.bold}Risultato Finale: ${passedTests}/${totalTests} test superati${colors.reset}`);
  
  if (passedTests === totalTests) {
    logSuccess('🎉 TUTTI I TEST SUPERATI! Il problema del login è stato risolto.');
    log('\n📝 Problema identificato e risolto:');
    log('   - Import di Express mancante in api-server.js e proxy-server.js');
    log('   - Server ora si avviano correttamente');
    log('   - Login funziona sia direttamente che tramite proxy');
  } else {
    logError('❌ Alcuni test sono falliti. Ulteriori investigazioni necessarie.');
  }
  
  await prisma.$disconnect();
}

// Esegui il test
runCompleteTest().catch(error => {
  logError(`Errore durante l'esecuzione del test: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});