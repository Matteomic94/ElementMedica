const axios = require('axios');

// Test isolato per verificare il problema del middleware authenticate
async function testVerifyIsolated() {
  console.log('🔍 TEST VERIFY ISOLATO');
  console.log('====================');
  
  const API_BASE = 'http://127.0.0.1:4001';
  
  try {
    // Step 1: Login per ottenere token
    console.log('\n📋 Step 1: Login per ottenere token...');
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   ✅ Login: Status ${loginResponse.status}`);
    console.log(`   📋 Response data:`, JSON.stringify(loginResponse.data, null, 2));
    
    // Prova diversi modi per accedere al token
    let accessToken = null;
    if (loginResponse.data && loginResponse.data.accessToken) {
      accessToken = loginResponse.data.accessToken;
    } else if (loginResponse.data && loginResponse.data.token) {
      accessToken = loginResponse.data.token;
    } else {
      // Cerca nel testo della risposta
      const responseText = JSON.stringify(loginResponse.data);
      const tokenMatch = responseText.match(/"accessToken":\s*"([^"]+)"/);
      if (tokenMatch) {
        accessToken = tokenMatch[1];
      }
    }
    
    if (!accessToken) {
      console.log('   ❌ Nessun token trovato nella risposta');
      return;
    }
    console.log(`   📋 Token: ${accessToken.substring(0, 50)}...`);
    
    // Step 2: Test verify con timeout molto lungo per vedere dove si blocca
    console.log('\n📋 Step 2: Test Verify con timeout lungo (30s)...');
    const startTime = Date.now();
    
    try {
      const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 secondi
      });
      
      const endTime = Date.now();
      console.log(`   ✅ Verify: Status ${verifyResponse.status} in ${endTime - startTime}ms`);
      console.log(`   📋 User: ${verifyResponse.data.user.email}`);
      
    } catch (verifyError) {
      const endTime = Date.now();
      console.log(`   ❌ Verify Error dopo ${endTime - startTime}ms: ${verifyError.message}`);
      if (verifyError.code === 'ECONNABORTED') {
        console.log('   🚨 TIMEOUT: Il middleware authenticate si è bloccato');
      }
    }
    
  } catch (error) {
    console.log('❌ Errore nel test:', error.message);
    if (error.response) {
      console.log(`   📊 Status: ${error.response.status}`);
      console.log(`   📋 Data:`, error.response.data);
    }
  }
}

console.log('🚀 Avvio test verify isolato...');
testVerifyIsolated();