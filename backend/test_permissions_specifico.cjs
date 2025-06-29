const axios = require('axios');

async function testPermissionsSpecifico() {
  try {
    console.log('🧪 TEST SPECIFICO ENDPOINT PERMISSIONS');
    console.log('=====================================\n');

    const API_BASE = 'http://localhost:4001';
    
    // Step 1: Login per ottenere token valido
    console.log('1. 🔐 Login per ottenere token...');
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    });
    
    if (!loginResponse.data.data.accessToken) {
      throw new Error('Token non ricevuto dal login');
    }
    
    const token = loginResponse.data.data.accessToken;
    const userId = loginResponse.data.data.user.id;
    console.log('✅ Login riuscito');
    console.log(`📋 User ID: ${userId}`);
    console.log(`📋 Token length: ${token.length}`);
    
    // Step 2: Test endpoint permissions con userId
    console.log('\n2. 🔍 Test endpoint /api/v1/auth/permissions/:userId...');
    try {
      const permissionsResponse = await axios.get(`${API_BASE}/api/v1/auth/permissions/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Permissions endpoint funziona!');
      console.log('📋 Status:', permissionsResponse.status);
      console.log('📋 Response:', JSON.stringify(permissionsResponse.data, null, 2));
      
    } catch (permError) {
      console.log('❌ Errore permissions endpoint:');
      console.log('📋 Status:', permError.response?.status);
      console.log('📋 Error:', permError.response?.data || permError.message);
      console.log('📋 URL chiamata:', `${API_BASE}/api/v1/auth/permissions/${userId}`);
    }
    
    // Step 3: Test endpoint permissions senza userId (vecchio formato)
    console.log('\n3. 🔍 Test endpoint /api/v1/auth/permissions (senza userId)...');
    try {
      const oldPermissionsResponse = await axios.get(`${API_BASE}/api/v1/auth/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Old permissions endpoint funziona!');
      console.log('📋 Status:', oldPermissionsResponse.status);
      console.log('📋 Response:', JSON.stringify(oldPermissionsResponse.data, null, 2));
      
    } catch (oldPermError) {
      console.log('❌ Errore old permissions endpoint:');
      console.log('📋 Status:', oldPermError.response?.status);
      console.log('📋 Error:', oldPermError.response?.data || oldPermError.message);
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response data:', error.response.data);
    }
  }
}

testPermissionsSpecifico();