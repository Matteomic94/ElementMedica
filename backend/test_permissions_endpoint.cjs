const axios = require('axios');

async function testPermissionsEndpoint() {
  try {
    console.log('🧪 Test Endpoint Permissions');
    console.log('============================');
    
    // Prima ottieni il token
    console.log('1. 🔐 Ottengo token di accesso...');
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Token ottenuto:', token.substring(0, 50) + '...');
    
    // Ora testa l'endpoint permissions
    console.log('\n2. 🔍 Test endpoint /api/v1/auth/permissions...');
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
    console.error('❌ Errore durante il test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testPermissionsEndpoint();