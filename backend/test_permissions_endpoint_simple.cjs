/**
 * Test semplice dell'endpoint permissions per identificare il timeout
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4001';
const TEST_USER = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

async function testPermissionsEndpoint() {
  console.log('🔍 TEST SEMPLICE ENDPOINT PERMISSIONS');
  console.log('======================================');
  
  try {
    // Step 1: Login
    console.log('\n1. 🔑 Login...');
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: TEST_USER.identifier,
      password: TEST_USER.password
    }, {
      timeout: 10000
    });
    
    const authToken = loginResponse.data.data.accessToken;
    const userId = loginResponse.data.data.user.id;
    console.log(`   ✅ Login riuscito - User ID: ${userId}`);
    console.log(`   📋 Token length: ${authToken.length}`);
    
    // Step 2: Test endpoint verify (dovrebbe funzionare)
    console.log('\n2. 🔍 Test endpoint /verify...');
    try {
      const startTime = Date.now();
      const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      });
      const verifyTime = Date.now() - startTime;
      console.log(`   ✅ Verify funziona! Tempo: ${verifyTime}ms`);
    } catch (error) {
      console.log(`   ❌ Verify fallito: ${error.message}`);
    }
    
    // Step 3: Test endpoint permissions con timeout progressivi
    const timeouts = [2000, 5000, 10000, 20000];
    
    for (const timeout of timeouts) {
      console.log(`\n3. 🔍 Test permissions con timeout ${timeout}ms...`);
      try {
        const startTime = Date.now();
        const permissionsResponse = await axios.get(`${API_BASE}/api/v1/auth/permissions/${userId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
          timeout: timeout
        });
        const endpointTime = Date.now() - startTime;
        console.log(`   ✅ Permissions funziona! Tempo: ${endpointTime}ms`);
        console.log(`   📋 Risposta:`, JSON.stringify(permissionsResponse.data, null, 2));
        break; // Se funziona, esci dal loop
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          console.log(`   ⏰ Timeout ${timeout}ms raggiunto`);
        } else {
          console.log(`   ❌ Errore: ${error.message}`);
          if (error.response) {
            console.log(`   📋 Status: ${error.response.status}`);
            console.log(`   📋 Data:`, error.response.data);
          }
          break; // Se è un errore diverso dal timeout, esci
        }
      }
    }
    
    // Step 4: Test con curl per confronto
    console.log('\n4. 🔍 Suggerimento per test manuale con curl:');
    console.log(`   curl -H "Authorization: Bearer ${authToken}" \\`);
    console.log(`        -X GET "${API_BASE}/api/v1/auth/permissions/${userId}"`);
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response data:', error.response.data);
    }
  }
}

testPermissionsEndpoint().catch(console.error);