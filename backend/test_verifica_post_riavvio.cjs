const axios = require('axios');

async function verificaPostRiavvio() {
  console.log('🔄 VERIFICA POST RIAVVIO SERVER');
  console.log('================================');
  
  try {
    // Test 1: Verifica server attivo
    console.log('\n1. 🌐 Verifica server API attivo...');
    const healthResponse = await axios.get('http://localhost:4001/api/v1/auth/test-debug');
    console.log('✅ Server API attivo:', healthResponse.status);
    
    // Test 2: Login con credenziali Mario
    console.log('\n2. 🔐 Test Login Mario...');
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.data.accessToken) {
      const token = loginResponse.data.data.accessToken;
      console.log('✅ Login riuscito - Token ottenuto');
      console.log('📋 User ID:', loginResponse.data.data.user.id);
      console.log('📋 Roles:', loginResponse.data.data.user.roles);
      
      // Test 3: Endpoint Permissions
      console.log('\n3. 🔍 Test Endpoint Permissions...');
      try {
        const permissionsResponse = await axios.get('http://localhost:4001/api/v1/auth/permissions', {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        console.log('✅ Permissions endpoint funziona:', permissionsResponse.status);
        console.log('📋 Response:', JSON.stringify(permissionsResponse.data, null, 2));
      } catch (permError) {
        console.log('❌ Errore permissions:', permError.response?.status, permError.response?.data || permError.message);
      }
      
      // Test 4: Endpoint Courses (verifica correzione deletedAt)
      console.log('\n4. 📚 Test Endpoint Courses...');
      try {
        const coursesResponse = await axios.get('http://localhost:4001/courses', {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        console.log('✅ Courses endpoint funziona:', coursesResponse.status);
        console.log('📋 Numero corsi trovati:', coursesResponse.data.length);
      } catch (courseError) {
        console.log('❌ Errore courses:', courseError.response?.status, courseError.response?.data?.error || courseError.message);
      }
      
      // Test 5: Endpoint Companies (verifica correzione createdAt)
      console.log('\n5. 🏢 Test Endpoint Companies...');
      try {
        const companiesResponse = await axios.get('http://localhost:4001/companies', {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        console.log('✅ Companies endpoint funziona:', companiesResponse.status);
        console.log('📋 Numero aziende trovate:', companiesResponse.data.length);
      } catch (companyError) {
        console.log('❌ Errore companies:', companyError.response?.status, companyError.response?.data?.error || companyError.message);
      }
      
    } else {
      console.log('❌ Login fallito - Nessun token ricevuto');
      console.log('📋 Response:', JSON.stringify(loginResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Data:', error.response.data);
    }
  }
}

verificaPostRiavvio();