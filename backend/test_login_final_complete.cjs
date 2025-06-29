const axios = require('axios');
const fs = require('fs');

console.log('🔍 TEST FINALE COMPLETO LOGIN E VERIFY');
console.log('====================================\n');

const API_BASE = 'http://localhost:4001';
const PROXY_BASE = 'http://localhost:4003';

async function testLoginComplete() {
  try {
    console.log('📋 Step 1: Test Login diretto API server...');
    const startLogin = Date.now();
    
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const endLogin = Date.now();
    console.log(`   ✅ Login completato in ${endLogin - startLogin}ms`);
    console.log(`   📊 Status: ${loginResponse.status}`);
    
    // Estrai il token
    let accessToken;
    if (loginResponse.data.data && loginResponse.data.data.accessToken) {
      accessToken = loginResponse.data.data.accessToken;
    } else if (loginResponse.data.accessToken) {
      accessToken = loginResponse.data.accessToken;
    } else {
      console.log('   ❌ Token non trovato nella risposta');
      console.log('   📋 Struttura risposta:', Object.keys(loginResponse.data));
      return;
    }
    
    console.log(`   📋 Token ottenuto: ${accessToken.substring(0, 50)}...`);
    
    console.log('\n📋 Step 2: Test Verify con timeout breve (5s)...');
    const startVerify = Date.now();
    
    try {
      const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      const endVerify = Date.now();
      console.log(`   ✅ Verify completato in ${endVerify - startVerify}ms`);
      console.log(`   📊 Status: ${verifyResponse.status}`);
      console.log('   📋 User verificato:', {
        valid: verifyResponse.data.valid,
        email: verifyResponse.data.user?.email,
        roles: verifyResponse.data.user?.roles?.length || 0
      });
      
      console.log('\n🎉 SUCCESSO COMPLETO!');
      console.log('   ✅ Login: Funziona correttamente');
      console.log('   ✅ Verify: Funziona correttamente');
      console.log('   ✅ Sistema di autenticazione: OPERATIVO');
      
    } catch (verifyError) {
      const endVerify = Date.now();
      if (verifyError.code === 'ECONNABORTED') {
        console.log(`   ⏰ TIMEOUT Verify dopo ${endVerify - startVerify}ms`);
        console.log('   🚨 PROBLEMA: Middleware authenticate si blocca');
      } else {
        console.log(`   ❌ Errore Verify: ${verifyError.message}`);
        console.log(`   📊 Status: ${verifyError.response?.status || 'N/A'}`);
      }
    }
    
    console.log('\n📋 Step 3: Test Login tramite Proxy...');
    try {
      const proxyLoginResponse = await axios.post(`${PROXY_BASE}/api/v1/auth/login`, {
        identifier: 'mario.rossi@acme-corp.com',
        password: 'Password123!'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✅ Login Proxy: Status ${proxyLoginResponse.status}`);
      
      // Test verify tramite proxy
      console.log('\n📋 Step 4: Test Verify tramite Proxy...');
      const proxyVerifyResponse = await axios.get(`${PROXY_BASE}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log(`   ✅ Verify Proxy: Status ${proxyVerifyResponse.status}`);
      
    } catch (proxyError) {
      console.log(`   ❌ Errore Proxy: ${proxyError.message}`);
    }
    
  } catch (error) {
    console.log('❌ Errore nel test:', error.message);
    if (error.response) {
      console.log(`   📊 Status: ${error.response.status}`);
      console.log(`   📋 Data:`, error.response.data);
    }
  }
}

console.log('🚀 Avvio test completo del sistema di autenticazione...');
testLoginComplete();