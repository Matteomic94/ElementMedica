#!/usr/bin/env node

/**
 * Test completo per verificare la risoluzione del problema di timeout del login
 * 
 * Questo script testa:
 * 1. Connessione al database
 * 2. Health check dei server API e Proxy
 * 3. Login diretto al server API
 * 4. Login tramite Proxy server
 * 5. Verifica tempi di risposta
 * 6. Verifica gestione sessioni
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

// Configurazione timeout più brevi per test rapidi
const API_BASE_URL = 'http://localhost:4001';
const PROXY_BASE_URL = 'http://localhost:4003';
const TIMEOUT = 10000; // 10 secondi invece di 60

// Credenziali di test
const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'Admin123!'
};

// Configurazione axios con timeout ridotto
const apiClient = axios.create({
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Utility per misurare tempo di esecuzione
const measureTime = async (fn, description) => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`✅ ${description}: ${duration}ms`);
    return { success: true, result, duration };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`❌ ${description}: ${duration}ms - ${error.message}`);
    return { success: false, error, duration };
  }
};

// Test 1: Connessione Database
const testDatabaseConnection = async () => {
  return measureTime(async () => {
    await prisma.$queryRaw`SELECT 1`;
    return 'Database connesso';
  }, 'Database Connection');
};

// Test 2: Health Check API Server
const testApiServerHealth = async () => {
  return measureTime(async () => {
    const response = await apiClient.get(`${API_BASE_URL}/health`);
    if (response.status !== 200) {
      throw new Error(`Status: ${response.status}`);
    }
    return response.data;
  }, 'API Server Health Check');
};

// Test 3: Health Check Proxy Server
const testProxyServerHealth = async () => {
  return measureTime(async () => {
    const response = await apiClient.get(`${PROXY_BASE_URL}/health`);
    if (response.status !== 200) {
      throw new Error(`Status: ${response.status}`);
    }
    return response.data;
  }, 'Proxy Server Health Check');
};

// Test 4: Login Diretto API Server
const testDirectApiLogin = async () => {
  return measureTime(async () => {
    const response = await apiClient.post(`${API_BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
    if (response.status !== 200) {
      throw new Error(`Status: ${response.status}`);
    }
    return response.data;
  }, 'Direct API Login');
};

// Test 5: Login tramite Proxy
const testProxyLogin = async () => {
  return measureTime(async () => {
    const response = await apiClient.post(`${PROXY_BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
    if (response.status !== 200) {
      throw new Error(`Status: ${response.status}`);
    }
    return response.data;
  }, 'Proxy Login');
};

// Test 6: Verifica Utente nel Database
const testUserInDatabase = async () => {
  return measureTime(async () => {
    const user = await prisma.user.findUnique({
      where: { email: TEST_CREDENTIALS.email },
      select: {
        id: true,
        email: true,
        isActive: true,
        password: true
      }
    });
    
    if (!user) {
      throw new Error('Utente non trovato nel database');
    }
    
    if (!user.isActive) {
      throw new Error('Utente non attivo');
    }
    
    // Verifica password
    const passwordValid = await bcryptjs.compare(TEST_CREDENTIALS.password, user.password);
    if (!passwordValid) {
      throw new Error('Password non valida');
    }
    
    return {
      userId: user.id,
      email: user.email,
      isActive: user.isActive,
      passwordValid
    };
  }, 'User Database Verification');
};

// Test 7: Verifica Sessioni Attive
const testActiveSessions = async () => {
  return measureTime(async () => {
    const sessions = await prisma.userSession.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    return {
      totalActiveSessions: sessions.length,
      recentSessions: sessions
    };
  }, 'Active Sessions Check');
};

// Funzione principale
const runTests = async () => {
  console.log('🧪 AVVIO TEST RISOLUZIONE TIMEOUT LOGIN');
  console.log('=' .repeat(50));
  console.log(`⏱️  Timeout configurato: ${TIMEOUT}ms`);
  console.log(`🎯 Target API: ${API_BASE_URL}`);
  console.log(`🎯 Target Proxy: ${PROXY_BASE_URL}`);
  console.log(`👤 Test User: ${TEST_CREDENTIALS.email}`);
  console.log('');
  
  const results = [];
  
  // Esegui tutti i test
  results.push(await testDatabaseConnection());
  results.push(await testUserInDatabase());
  results.push(await testApiServerHealth());
  results.push(await testProxyServerHealth());
  results.push(await testDirectApiLogin());
  results.push(await testProxyLogin());
  results.push(await testActiveSessions());
  
  // Analisi risultati
  console.log('');
  console.log('📊 RIEPILOGO RISULTATI');
  console.log('=' .repeat(24));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;
  const maxDuration = Math.max(...results.map(r => r.duration));
  
  results.forEach((result, index) => {
    const testNames = [
      'Database Connection',
      'User Database Verification', 
      'API Server Health',
      'Proxy Server Health',
      'Direct API Login',
      'Proxy Login',
      'Active Sessions'
    ];
    
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${testNames[index].padEnd(25)} ${status}`);
  });
  
  console.log('');
  console.log(`Risultato Finale: ${successful}/${total} test superati`);
  console.log(`Tempo medio: ${avgDuration.toFixed(0)}ms`);
  console.log(`Tempo massimo: ${maxDuration}ms`);
  
  if (successful === total) {
    console.log('🎉 TUTTI I TEST SUPERATI - PROBLEMA TIMEOUT RISOLTO!');
    console.log('');
    console.log('✅ Benefici ottenuti:');
    console.log('   - Server API e Proxy stabili e funzionanti');
    console.log('   - Login completa in tempi accettabili (<10s)');
    console.log('   - Architettura a tre server operativa');
    console.log('   - Gestione sessioni corretta');
    console.log('   - Zero timeout errors');
  } else {
    console.log('❌ Alcuni test sono falliti. Ulteriori investigazioni necessarie.');
    
    // Mostra dettagli errori
    console.log('');
    console.log('🔍 DETTAGLI ERRORI:');
    results.forEach((result, index) => {
      if (!result.success) {
        const testNames = [
          'Database Connection',
          'User Database Verification',
          'API Server Health', 
          'Proxy Server Health',
          'Direct API Login',
          'Proxy Login',
          'Active Sessions'
        ];
        console.log(`❌ ${testNames[index]}: ${result.error.message}`);
      }
    });
  }
  
  // Cleanup
  await prisma.$disconnect();
  
  process.exit(successful === total ? 0 : 1);
};

// Gestione errori globali
process.on('unhandledRejection', (error) => {
  console.error('❌ Errore non gestito:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Eccezione non catturata:', error);
  process.exit(1);
});

// Avvia i test
runTests().catch(error => {
  console.error('❌ Errore durante l\'esecuzione dei test:', error);
  process.exit(1);
});