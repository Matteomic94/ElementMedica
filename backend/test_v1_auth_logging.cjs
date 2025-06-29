/**
 * Test per verificare se le richieste arrivano al router v1/auth
 * Questo test verifica se il middleware di logging in routes/v1/auth.js viene chiamato
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:4001';

async function testV1AuthLogging() {
  console.log('🧪 Test: Verifica logging middleware v1/auth');
  console.log('=' .repeat(60));
  
  try {
    console.log('\n📋 Test 1: GET /api/v1/auth/login');
    console.log('Aspettativa: Dovrebbe vedere il log "[AUTH V1] GET /login" nel terminale del server');
    
    const response = await axios.get(`${API_BASE_URL}/api/v1/auth/login`, {
      validateStatus: () => true // Accetta tutti i status code
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.data);
    
    if (response.status === 405) {
      console.log('✅ CORRETTO: Status 405 - Il router v1/auth ha gestito la richiesta');
    } else if (response.status === 404) {
      console.log('❌ PROBLEMA: Status 404 - La richiesta NON è arrivata al router v1/auth');
    } else {
      console.log(`⚠️  INASPETTATO: Status ${response.status}`);
    }
    
    console.log('\n📋 Test 2: POST /api/v1/auth/login (senza body)');
    console.log('Aspettativa: Dovrebbe vedere il log "[AUTH V1] POST /login" nel terminale del server');
    
    const postResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {}, {
      validateStatus: () => true
    });
    
    console.log(`Status: ${postResponse.status}`);
    console.log(`Response:`, postResponse.data);
    
    if (postResponse.status === 400 || postResponse.status === 401) {
      console.log('✅ CORRETTO: Il router v1/auth ha gestito la richiesta POST');
    } else if (postResponse.status === 404) {
      console.log('❌ PROBLEMA: La richiesta POST NON è arrivata al router v1/auth');
    } else {
      console.log(`⚠️  Status: ${postResponse.status}`);
    }
    
    console.log('\n📋 Test 3: GET /api/v1/auth/nonexistent');
    console.log('Aspettativa: Dovrebbe vedere il log "[AUTH V1] GET /nonexistent"');
    
    const nonexistentResponse = await axios.get(`${API_BASE_URL}/api/v1/auth/nonexistent`, {
      validateStatus: () => true
    });
    
    console.log(`Status: ${nonexistentResponse.status}`);
    console.log(`Response:`, nonexistentResponse.data);
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Assicurati che il server API sia in esecuzione sulla porta 4001');
    }
  }
}

// Esegui il test
testV1AuthLogging();