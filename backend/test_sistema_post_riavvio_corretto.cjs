const axios = require('axios');

console.log('🔄 TEST SISTEMA POST RIAVVIO - VERSIONE CORRETTA');
console.log('================================================\n');

// Configurazione test
const API_BASE = 'http://localhost:4001';
const PROXY_BASE = 'http://localhost:4003';
const TEST_USER = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

let authToken = null;
let userId = null;

// Test completo del sistema
async function runCompleteSystemTest() {
  try {
    console.log('1. 🌐 Verifica server API attivo...');
    const healthCheck = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    console.log(`✅ Server API attivo: ${healthCheck.status}`);
    
    console.log('\n2. 🔐 Test Login Mario...');
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: TEST_USER.identifier,
      password: TEST_USER.password
    }, { timeout: 10000 });
    
    console.log(`📋 Login Response Status: ${loginResponse.status}`);
    console.log(`📋 Login Response Structure:`, JSON.stringify(loginResponse.data, null, 2));
    
    // Verifica struttura corretta della risposta
    if (loginResponse.status === 200 && loginResponse.data.data?.accessToken) {
      authToken = loginResponse.data.data.accessToken;
      userId = loginResponse.data.data.user?.id;
      console.log('✅ Login riuscito - AccessToken ottenuto');
      console.log(`📋 User ID: ${userId}`);
      console.log(`📋 Email: ${loginResponse.data.data.user?.email}`);
      console.log(`📋 Roles: ${JSON.stringify(loginResponse.data.data.user?.roles || [])}`);
    } else {
      throw new Error('Login fallito - AccessToken non ricevuto nella struttura data.data.accessToken');
    }
    
    console.log('\n3. 🔍 Test Endpoint Permissions con userId...');
    if (userId) {
      try {
        const permissionsResponse = await axios.get(`${API_BASE}/api/v1/auth/permissions/${userId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
          timeout: 10000
        });
        
        if (permissionsResponse.status === 200) {
          console.log('✅ Permissions endpoint con userId funziona correttamente!');
          console.log(`📋 Response:`, JSON.stringify(permissionsResponse.data, null, 2));
        }
      } catch (permError) {
        console.log(`❌ Permissions endpoint errore: ${permError.response?.status} - ${permError.response?.data?.error || permError.message}`);
        if (permError.code === 'ECONNABORTED') {
          console.log('⚠️ Timeout - possibile problema di performance');
        }
      }
    }
    
    console.log('\n4. 📚 Test Endpoint Courses...');
    const coursesResponse = await axios.get(`${API_BASE}/courses`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      timeout: 10000
    });
    
    if (coursesResponse.status === 200) {
      console.log('✅ Courses endpoint funziona correttamente');
      console.log(`📋 Numero corsi trovati: ${coursesResponse.data.length}`);
    } else {
      throw new Error(`Courses endpoint errore: ${coursesResponse.status}`);
    }
    
    console.log('\n5. 🏢 Test Endpoint Companies...');
    const companiesResponse = await axios.get(`${API_BASE}/companies`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      timeout: 10000
    });
    
    if (companiesResponse.status === 200) {
      console.log('✅ Companies endpoint funziona correttamente');
      console.log(`📋 Numero aziende trovate: ${companiesResponse.data.length}`);
    } else {
      throw new Error(`Companies endpoint errore: ${companiesResponse.status}`);
    }
    
    console.log('\n6. 🌐 Test Proxy Server...');
    try {
      const proxyHealthCheck = await axios.get(`${PROXY_BASE}/health`, { timeout: 5000 });
      console.log(`✅ Proxy server attivo: ${proxyHealthCheck.status}`);
      
      // Test login tramite proxy
      const proxyLoginResponse = await axios.post(`${PROXY_BASE}/api/v1/auth/login`, {
        identifier: TEST_USER.identifier,
        password: TEST_USER.password
      }, { timeout: 10000 });
      
      if (proxyLoginResponse.status === 200) {
        console.log('✅ Login tramite proxy funziona correttamente');
        
        // Test permissions tramite proxy
        if (userId && proxyLoginResponse.data.data?.accessToken) {
          try {
            const proxyPermResponse = await axios.get(`${PROXY_BASE}/api/v1/auth/permissions/${userId}`, {
              headers: { 'Authorization': `Bearer ${proxyLoginResponse.data.data.accessToken}` },
              timeout: 10000
            });
            console.log('✅ Permissions tramite proxy funziona!');
          } catch (proxyPermError) {
            console.log(`⚠️ Permissions tramite proxy: ${proxyPermError.response?.status || proxyPermError.message}`);
          }
        }
      }
    } catch (proxyError) {
      console.log(`⚠️ Proxy server problema: ${proxyError.response?.status || proxyError.message}`);
    }
    
    console.log('\n🎉 RISULTATI FINALI:');
    console.log('✅ Server API: ATTIVO');
    console.log('✅ Login: FUNZIONANTE');
    console.log('✅ Token Generation: FUNZIONANTE');
    console.log('✅ Courses Endpoint: FUNZIONANTE');
    console.log('✅ Companies Endpoint: FUNZIONANTE');
    console.log('✅ Sistema: OPERATIVO');
    
  } catch (error) {
    console.log(`\n❌ ERRORE NEL TEST: ${error.message}`);
    if (error.response) {
      console.log(`📋 Status: ${error.response.status}`);
      console.log(`📋 Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    if (error.code) {
      console.log(`📋 Error Code: ${error.code}`);
    }
    console.log('\n🔧 AZIONI SUGGERITE:');
    console.log('1. Verificare che il server API sia stato riavviato correttamente');
    console.log('2. Controllare i log del server per errori specifici');
    console.log('3. Verificare che le modifiche all\'endpoint permissions siano state caricate');
    console.log('4. Controllare la connessione di rete e i timeout');
  }
}

runCompleteSystemTest();