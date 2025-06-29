const axios = require('axios');

// Test per verificare la struttura della risposta del login
const testCredentials = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

const API_BASE_URL = 'http://localhost:4001';

async function debugLoginResponse() {
  console.log('🔍 Debug struttura risposta login');
  console.log('=' .repeat(40));
  
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, testCredentials, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login riuscito!');
    console.log('Status:', loginResponse.status);
    console.log('\n📋 Struttura completa della risposta:');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    
    console.log('\n🔑 Analisi campi token:');
    console.log('data.token:', loginResponse.data.token ? 'PRESENTE' : 'ASSENTE');
    console.log('data.accessToken:', loginResponse.data.accessToken ? 'PRESENTE' : 'ASSENTE');
    console.log('data.access_token:', loginResponse.data.access_token ? 'PRESENTE' : 'ASSENTE');
    console.log('data.authToken:', loginResponse.data.authToken ? 'PRESENTE' : 'ASSENTE');
    console.log('data.jwt:', loginResponse.data.jwt ? 'PRESENTE' : 'ASSENTE');
    
    // Cerca tutti i campi che potrebbero contenere il token
    console.log('\n🔍 Tutti i campi della risposta:');
    Object.keys(loginResponse.data).forEach(key => {
      const value = loginResponse.data[key];
      console.log(`${key}:`, typeof value, value ? (typeof value === 'string' && value.length > 50 ? `${value.substring(0, 50)}...` : value) : 'null/undefined');
    });
    
  } catch (error) {
    console.error('\n❌ ERRORE durante il test:');
    
    if (error.response) {
      console.error('📡 Risposta HTTP con errore:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('🚨 Errore generico:', error.message);
    }
  }
}

debugLoginResponse();