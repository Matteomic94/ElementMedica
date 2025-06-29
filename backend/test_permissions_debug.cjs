const axios = require('axios');

async function testPermissionsDebug() {
  try {
    console.log('🧪 Test Debug Endpoint Permissions');
    console.log('==================================');
    
    // Test 1: Verifica che il server risponda
    console.log('1. 🔍 Test server status...');
    try {
      const statusResponse = await axios.get('http://localhost:4001/api/v1/auth/test-debug');
      console.log('✅ Server attivo:', statusResponse.status);
      console.log('📋 Response:', statusResponse.data);
    } catch (error) {
      console.log('❌ Server non risponde:', error.message);
      return;
    }
    
    // Test 2: Verifica endpoint permissions senza token
    console.log('\n2. 🔍 Test endpoint permissions senza token...');
    try {
      const noTokenResponse = await axios.get('http://localhost:4001/api/v1/auth/permissions');
      console.log('❌ Dovrebbe fallire ma non è fallito:', noTokenResponse.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correttamente rifiutato senza token (401)');
      } else if (error.response && error.response.status === 404) {
        console.log('❌ Endpoint non trovato (404) - PROBLEMA!');
        console.log('📋 Response:', error.response.data);
      } else {
        console.log('❌ Errore inaspettato:', error.response?.status, error.response?.data);
      }
    }
    
    // Test 3: Ottieni token e testa con token
    console.log('\n3. 🔐 Ottengo token di accesso...');
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Token ottenuto:', token.substring(0, 50) + '...');
    
    // Test 4: Test endpoint permissions con token
    console.log('\n4. 🔍 Test endpoint permissions con token...');
    try {
      const permissionsResponse = await axios.get('http://localhost:4001/api/v1/auth/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Status:', permissionsResponse.status);
      console.log('📋 Response Data:', JSON.stringify(permissionsResponse.data, null, 2));
      
    } catch (error) {
      console.error('❌ Errore con token:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

testPermissionsDebug();