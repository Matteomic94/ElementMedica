const axios = require('axios');

async function testServerStatus() {
  console.log('🔍 VERIFICA STATO SERVER FINALE');
  console.log('===============================\n');

  const servers = [
    { name: 'API Server', url: 'http://localhost:4001', endpoints: ['/api/v1/auth/status', '/'] },
    { name: 'Proxy Server', url: 'http://localhost:4003', endpoints: ['/health', '/'] }
  ];

  for (const server of servers) {
    console.log(`\n📡 Testing ${server.name} (${server.url})...`);
    
    for (const endpoint of server.endpoints) {
      try {
        const response = await axios.get(`${server.url}${endpoint}`, { timeout: 5000 });
        console.log(`✅ ${endpoint}: Status ${response.status}`);
        if (response.data) {
          console.log(`📋 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
        break; // Se un endpoint funziona, il server è attivo
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.code || error.message}`);
      }
    }
  }

  // Test specifico login
  console.log('\n🔐 Test Login Specifico...');
  try {
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, { timeout: 10000 });
    
    console.log('✅ Login funziona!');
    console.log(`📋 Status: ${loginResponse.status}`);
    console.log(`📋 User ID: ${loginResponse.data.data?.user?.id}`);
    
    // Test permissions con token ottenuto
    if (loginResponse.data.data?.accessToken) {
      const token = loginResponse.data.data.accessToken;
      const userId = loginResponse.data.data.user.id;
      
      console.log('\n🔍 Test Permissions Endpoint...');
      try {
        const permResponse = await axios.get(`http://localhost:4001/api/v1/auth/permissions/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        console.log('✅ Permissions endpoint funziona!');
        console.log(`📋 Response: ${JSON.stringify(permResponse.data, null, 2)}`);
      } catch (permError) {
        console.log(`❌ Permissions endpoint: ${permError.response?.status} - ${permError.response?.data?.error || permError.message}`);
      }
    }
    
  } catch (loginError) {
    console.log(`❌ Login fallito: ${loginError.response?.status} - ${loginError.response?.data?.error || loginError.message}`);
  }
}

testServerStatus();