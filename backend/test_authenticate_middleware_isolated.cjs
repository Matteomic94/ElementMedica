#!/usr/bin/env node

/**
 * Test isolato del middleware authenticate per identificare il punto di blocco
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:4001';

async function testAuthenticateMiddleware() {
  console.log('🔍 TEST ISOLATO MIDDLEWARE AUTHENTICATE');
  console.log('=====================================\n');

  try {
    // Step 1: Ottieni token valido dal login
    console.log('📋 Step 1: Ottenimento token dal login...');
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'test-authenticate-middleware/1.0'
      }
    });

    console.log('   📋 Login response structure:', Object.keys(loginResponse.data));
    
    // La risposta ha struttura: { success, message, data: { accessToken, ... } }
    const accessToken = loginResponse.data.data?.accessToken || loginResponse.data.accessToken;
    
    if (!accessToken) {
      console.log('   📋 Full login response:', JSON.stringify(loginResponse.data, null, 2));
      throw new Error('Login non ha restituito accessToken');
    }

    const token = accessToken;
    console.log('   ✅ Token ottenuto:', token.substring(0, 50) + '...');

    // Step 2: Test diretto del middleware authenticate
    console.log('\n📋 Step 2: Test middleware authenticate con timeout breve...');
    console.log('   ⏰ Timeout: 3 secondi per identificare rapidamente il blocco');
    
    const startTime = Date.now();
    
    try {
      const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'test-authenticate-middleware/1.0'
        },
        timeout: 3000 // 3 secondi per test rapido
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`   ✅ Middleware authenticate funziona! Tempo: ${responseTime}ms`);
      console.log(`   📊 Status: ${verifyResponse.status}`);
      console.log(`   👤 User ID: ${verifyResponse.data.user?.id}`);
      
    } catch (verifyError) {
      const responseTime = Date.now() - startTime;
      
      if (verifyError.code === 'ECONNABORTED') {
        console.log(`   ❌ TIMEOUT dopo ${responseTime}ms`);
        console.log('   🔍 Il middleware authenticate si sta bloccando!');
        console.log('   📋 AZIONI RICHIESTE:');
        console.log('      1. Controllare i log del server API in tempo reale');
        console.log('      2. Identificare quale parte del middleware causa il blocco');
        console.log('      3. Verificare query database nel middleware');
        
      } else {
        console.log(`   ❌ Errore dopo ${responseTime}ms:`, verifyError.response?.status || verifyError.message);
        if (verifyError.response?.data) {
          console.log('   📋 Response data:', verifyError.response.data);
        }
      }
    }

    // Step 3: Test con timeout più lungo per conferma
    console.log('\n📋 Step 3: Test con timeout lungo per conferma...');
    console.log('   ⏰ Timeout: 30 secondi');
    
    const startTime2 = Date.now();
    
    try {
      const verifyResponse2 = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'test-authenticate-middleware/1.0'
        },
        timeout: 30000 // 30 secondi
      });
      
      const responseTime2 = Date.now() - startTime2;
      console.log(`   ✅ Middleware authenticate funziona con timeout lungo! Tempo: ${responseTime2}ms`);
      
    } catch (verifyError2) {
      const responseTime2 = Date.now() - startTime2;
      console.log(`   ❌ TIMEOUT CONFERMATO dopo ${responseTime2}ms`);
      console.log('   🚨 Il middleware authenticate ha un problema serio!');
    }

  } catch (error) {
    console.error('❌ Errore nel test:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Data:', error.response.data);
    }
  }
}

// Esegui il test
testAuthenticateMiddleware().catch(console.error);