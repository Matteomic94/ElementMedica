const axios = require('axios');

// Test diretto per verificare se il middleware debug funziona
async function testMiddlewareDebugDirect() {
  console.log('🔍 TEST MIDDLEWARE DEBUG DIRETTO');
  console.log('================================');
  
  const API_BASE = 'http://127.0.0.1:4001';
  
  try {
    // Step 1: Login per ottenere token
    console.log('\n📋 Step 1: Login...');
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 5000
    });
    
    console.log(`   ✅ Login: Status ${loginResponse.status}`);
    
    // Estrai token
    const responseText = JSON.stringify(loginResponse.data);
    const tokenMatch = responseText.match(/"accessToken":\s*"([^"]+)"/);
    
    if (!tokenMatch) {
      console.log('   ❌ Token non trovato');
      return;
    }
    
    const accessToken = tokenMatch[1];
    console.log(`   📋 Token: ${accessToken.substring(0, 30)}...`);
    
    // Step 2: Test verify con logging dettagliato
    console.log('\n📋 Step 2: Test Verify con middleware debug...');
    console.log('   📋 Inizio richiesta verify...');
    
    const startTime = Date.now();
    
    try {
      const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 secondi
      });
      
      const endTime = Date.now();
      console.log(`   ✅ Verify: Status ${verifyResponse.status} in ${endTime - startTime}ms`);
      console.log(`   📋 User: ${verifyResponse.data.user?.email || 'N/A'}`);
      
    } catch (verifyError) {
      const endTime = Date.now();
      console.log(`   ❌ Verify Error dopo ${endTime - startTime}ms:`);
      console.log(`      Code: ${verifyError.code}`);
      console.log(`      Message: ${verifyError.message}`);
      
      if (verifyError.response) {
        console.log(`      Status: ${verifyError.response.status}`);
        console.log(`      Data:`, verifyError.response.data);
      }
      
      if (verifyError.code === 'ECONNABORTED') {
        console.log('   🚨 TIMEOUT: Il middleware debug si è bloccato');
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

console.log('🚀 Avvio test middleware debug diretto...');
testMiddlewareDebugDirect();