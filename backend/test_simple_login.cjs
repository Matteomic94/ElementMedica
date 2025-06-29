const axios = require('axios');

// Test delle credenziali specificate dall'utente
const testCredentials = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

const API_BASE_URL = 'http://localhost:4001';

async function testSimpleLogin() {
  console.log('🧪 Test Login Semplice');
  console.log('=' .repeat(30));
  
  try {
    console.log('\n📤 Invio richiesta login...');
    console.log('URL:', `${API_BASE_URL}/api/v1/auth/login`);
    console.log('Credenziali:', testCredentials);
    
    const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, testCredentials, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Risposta ricevuta!');
    console.log('Status:', loginResponse.status);
    console.log('Headers:', loginResponse.headers);
    console.log('\n📋 Dati risposta:');
    console.log('Keys:', Object.keys(loginResponse.data));
    console.log('AccessToken presente:', !!loginResponse.data.accessToken);
    console.log('AccessToken tipo:', typeof loginResponse.data.accessToken);
    console.log('AccessToken lunghezza:', loginResponse.data.accessToken?.length);
    
    if (loginResponse.data.accessToken) {
      console.log('\n🎯 Token estratto con successo!');
      console.log('Token inizio:', loginResponse.data.accessToken.substring(0, 50) + '...');
      
      // Test verify immediato
      console.log('\n🔍 Test verify immediato...');
      const verifyResponse = await axios.get(`${API_BASE_URL}/api/v1/auth/verify`, {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${loginResponse.data.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Verify riuscito!');
      console.log('Status:', verifyResponse.status);
      console.log('Valid:', verifyResponse.data.valid);
      console.log('User:', verifyResponse.data.user?.email);
      
    } else {
      console.log('\n❌ Token non trovato nella risposta!');
      console.log('Risposta completa:', JSON.stringify(loginResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ ERRORE:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Messaggio:', error.message);
      console.error('Codice:', error.code);
    }
    
    process.exit(1);
  }
}

testSimpleLogin();