const axios = require('axios');

// Test basico per verificare se il server risponde
async function testServerBasic() {
  console.log('🔍 TEST SERVER BASICO');
  console.log('===================');
  
  const API_BASE = 'http://127.0.0.1:4001';
  
  try {
    // Test 1: Health check (nessun middleware)
    console.log('\n📋 Test 1: Health check...');
    const healthResponse = await axios.get(`${API_BASE}/health`, {
      timeout: 5000
    });
    console.log(`   ✅ Health: Status ${healthResponse.status}`);
    
    // Test 2: Login (nessun middleware authenticate)
    console.log('\n📋 Test 2: Login...');
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 5000
    });
    console.log(`   ✅ Login: Status ${loginResponse.status}`);
    
    // Test 3: Endpoint senza middleware (se esiste)
    console.log('\n📋 Test 3: Test endpoint senza middleware...');
    try {
      const testResponse = await axios.get(`${API_BASE}/test`, {
        timeout: 5000
      });
      console.log(`   ✅ Test endpoint: Status ${testResponse.status}`);
    } catch (testError) {
      console.log(`   ⚠️ Test endpoint: ${testError.response?.status || 'ERROR'} - ${testError.message}`);
    }
    
    // Test 4: Verify con timeout molto breve per vedere se si blocca subito
    console.log('\n📋 Test 4: Verify con timeout breve (2s)...');
    const responseText = JSON.stringify(loginResponse.data);
    const tokenMatch = responseText.match(/"accessToken":\s*"([^"]+)"/);
    
    if (tokenMatch) {
      const accessToken = tokenMatch[1];
      console.log(`   📋 Token estratto: ${accessToken.substring(0, 30)}...`);
      
      try {
        const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          timeout: 2000 // Solo 2 secondi
        });
        console.log(`   ✅ Verify: Status ${verifyResponse.status}`);
      } catch (verifyError) {
        console.log(`   ❌ Verify: ${verifyError.code} - ${verifyError.message}`);
        if (verifyError.code === 'ECONNABORTED') {
          console.log('   🚨 TIMEOUT: Il middleware si blocca immediatamente');
        }
      }
    } else {
      console.log('   ❌ Impossibile estrarre token dal login');
    }
    
  } catch (error) {
    console.log('❌ Errore nel test:', error.message);
    if (error.response) {
      console.log(`   📊 Status: ${error.response.status}`);
      console.log(`   📋 Data:`, error.response.data);
    }
  }
}

console.log('🚀 Avvio test server basico...');
testServerBasic();