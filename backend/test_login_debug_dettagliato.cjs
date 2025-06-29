const axios = require('axios');

console.log('🔍 DEBUG LOGIN DETTAGLIATO');
console.log('===========================\n');

const API_BASE = 'http://localhost:4001';
const TEST_USER = {
  email: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

async function debugLogin() {
  try {
    console.log('1. 🌐 Verifica server API...');
    const healthCheck = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    console.log(`✅ Server API attivo: ${healthCheck.status}`);
    
    console.log('\n2. 🔐 Test Login con debug completo...');
    console.log(`📋 URL: ${API_BASE}/api/v1/auth/login`);
    console.log(`📋 Email: ${TEST_USER.email}`);
    console.log(`📋 Password: ${TEST_USER.password.substring(0, 3)}***`);
    
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: TEST_USER.email,
      password: TEST_USER.password
    }, { 
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accetta tutti i codici < 500
      }
    });
    
    console.log(`\n📋 Status Response: ${loginResponse.status}`);
    console.log(`📋 Headers: ${JSON.stringify(loginResponse.headers, null, 2)}`);
    console.log(`📋 Data: ${JSON.stringify(loginResponse.data, null, 2)}`);
    
    if (loginResponse.status === 200) {
      if (loginResponse.data.accessToken) {
        console.log('\n✅ LOGIN RIUSCITO!');
        console.log(`📋 Token ricevuto: ${loginResponse.data.accessToken.substring(0, 20)}...`);
        console.log(`📋 User ID: ${loginResponse.data.user?.id || 'N/A'}`);
        console.log(`📋 Roles: ${JSON.stringify(loginResponse.data.user?.roles || [])}`);
      } else {
        console.log('\n⚠️ Status 200 ma token mancante');
        console.log('📋 Struttura risposta non conforme');
      }
    } else {
      console.log(`\n❌ LOGIN FALLITO - Status: ${loginResponse.status}`);
      if (loginResponse.data.error) {
        console.log(`📋 Errore: ${loginResponse.data.error}`);
      }
      if (loginResponse.data.message) {
        console.log(`📋 Messaggio: ${loginResponse.data.message}`);
      }
    }
    
  } catch (error) {
    console.log(`\n❌ ERRORE DURANTE IL TEST: ${error.message}`);
    
    if (error.response) {
      console.log(`📋 Status: ${error.response.status}`);
      console.log(`📋 Status Text: ${error.response.statusText}`);
      console.log(`📋 Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
      console.log(`📋 Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.log('📋 Nessuna risposta ricevuta dal server');
      console.log(`📋 Request: ${error.request}`);
    } else {
      console.log(`📋 Errore configurazione: ${error.message}`);
    }
    
    console.log('\n🔧 POSSIBILI CAUSE:');
    console.log('1. Server non completamente avviato');
    console.log('2. Credenziali non valide');
    console.log('3. Endpoint non configurato correttamente');
    console.log('4. Database non accessibile');
    console.log('5. Middleware di autenticazione problematico');
  }
}

debugLogin();