const axios = require('axios');

console.log('🔍 ANALISI STRUTTURA RISPOSTA LOGIN');
console.log('==================================\n');

const API_BASE = 'http://localhost:4001';
const TEST_USER = {
  email: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

async function analyzeLoginStructure() {
  try {
    console.log('🔐 Eseguo login e analizzo struttura risposta...');
    
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: TEST_USER.email,
      password: TEST_USER.password
    }, { timeout: 10000 });
    
    console.log(`\n📋 Status: ${loginResponse.status}`);
    console.log('📋 Struttura completa risposta:');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    
    // Analisi dettagliata della struttura
    console.log('\n🔍 ANALISI DETTAGLIATA:');
    console.log(`📋 loginResponse.data: ${typeof loginResponse.data}`);
    console.log(`📋 loginResponse.data.success: ${loginResponse.data.success}`);
    console.log(`📋 loginResponse.data.data: ${typeof loginResponse.data.data}`);
    
    if (loginResponse.data.data) {
      console.log(`📋 loginResponse.data.data.token: ${loginResponse.data.data.token ? 'PRESENTE' : 'ASSENTE'}`);
      console.log(`📋 loginResponse.data.data.user: ${loginResponse.data.data.user ? 'PRESENTE' : 'ASSENTE'}`);
    }
    
    // Test delle varie possibili strutture
    console.log('\n🧪 TEST STRUTTURE POSSIBILI:');
    
    if (loginResponse.data.token) {
      console.log('✅ Struttura: loginResponse.data.token');
    } else {
      console.log('❌ Struttura: loginResponse.data.token');
    }
    
    if (loginResponse.data.data?.token) {
      console.log('✅ Struttura: loginResponse.data.data.token');
    } else {
      console.log('❌ Struttura: loginResponse.data.data.token');
    }
    
    if (loginResponse.data.accessToken) {
      console.log('✅ Struttura: loginResponse.data.accessToken');
    } else {
      console.log('❌ Struttura: loginResponse.data.accessToken');
    }
    
    if (loginResponse.data.data?.accessToken) {
      console.log('✅ Struttura: loginResponse.data.data.accessToken');
    } else {
      console.log('❌ Struttura: loginResponse.data.data.accessToken');
    }
    
  } catch (error) {
    console.log(`\n❌ ERRORE: ${error.message}`);
    if (error.response) {
      console.log(`📋 Status: ${error.response.status}`);
      console.log(`📋 Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

analyzeLoginStructure();