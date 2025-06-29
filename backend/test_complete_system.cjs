const axios = require('axios');

// Test delle credenziali specificate dall'utente
const testCredentials = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

const API_BASE_URL = 'http://localhost:4001';
const PROXY_BASE_URL = 'http://localhost:4003';

async function testCompleteSystem() {
  console.log('🧪 Test Sistema Completo - Login e Verify');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Login diretto API server
    console.log('\n1️⃣ Test Login diretto API server (porta 4001)');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, testCredentials, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login riuscito!');
    console.log('Status:', loginResponse.status);
    
    const token = loginResponse.data?.accessToken;
    console.log('Token ricevuto:', token ? 'SÌ' : 'NO');
    
    if (!token) {
      throw new Error('Token non ricevuto dal login');
    }
    
    // Test 2: Verify diretto API server
    console.log('\n2️⃣ Test Verify diretto API server (porta 4001)');
    const verifyResponse = await axios.get(`${API_BASE_URL}/api/v1/auth/verify`, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Verify riuscito!');
    console.log('Status:', verifyResponse.status);
    console.log('Valid:', verifyResponse.data.valid);
    console.log('User Email:', verifyResponse.data.user?.email);
    
    // Test 3: Login tramite proxy
    console.log('\n3️⃣ Test Login tramite proxy (porta 4003)');
    const proxyLoginResponse = await axios.post(`${PROXY_BASE_URL}/api/v1/auth/login`, testCredentials, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login tramite proxy riuscito!');
    console.log('Status:', proxyLoginResponse.status);
    console.log('Token ricevuto:', !!proxyLoginResponse.data.accessToken);
    
    const proxyToken = proxyLoginResponse.data.accessToken;
    if (!proxyToken) {
      throw new Error('Token non ricevuto dal login tramite proxy');
    }
    
    // Test 4: Verify tramite proxy
    console.log('\n4️⃣ Test Verify tramite proxy (porta 4003)');
    const proxyVerifyResponse = await axios.get(`${PROXY_BASE_URL}/api/v1/auth/verify`, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${proxyToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Verify tramite proxy riuscito!');
    console.log('Status:', proxyVerifyResponse.status);
    console.log('Valid:', proxyVerifyResponse.data.valid);
    console.log('User Email:', proxyVerifyResponse.data.user?.email);
    
    // Test 5: Cross-verify (token da API diretta, verify tramite proxy)
    console.log('\n5️⃣ Test Cross-verify (token API → verify proxy)');
    const crossVerifyResponse = await axios.get(`${PROXY_BASE_URL}/api/v1/auth/verify`, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Cross-verify riuscito!');
    console.log('Status:', crossVerifyResponse.status);
    console.log('Valid:', crossVerifyResponse.data.valid);
    console.log('User Email:', crossVerifyResponse.data.user?.email);
    
    console.log('\n🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!');
    console.log('✅ Login API diretto funziona');
    console.log('✅ Verify API diretto funziona');
    console.log('✅ Login tramite proxy funziona');
    console.log('✅ Verify tramite proxy funziona');
    console.log('✅ Cross-verify funziona');
    console.log('\n🔐 Sistema di autenticazione completamente funzionale!');
    
  } catch (error) {
    console.error('\n❌ ERRORE durante il test:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connessione rifiutata - server non raggiungibile');
      console.error('Porta:', error.port);
    } else if (error.code === 'ECONNRESET') {
      console.error('🔌 Connessione resettata dal server');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ Timeout - server non risponde');
    } else if (error.response) {
      console.error('📡 Risposta HTTP con errore:');
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('🚨 Errore generico:', error.message);
    }
    
    process.exit(1);
  }
}

testCompleteSystem();