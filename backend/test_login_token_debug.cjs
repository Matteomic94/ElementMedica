/**
 * Test specifico per debug del problema token nel login
 * ATTEMPT 99 - Analisi token mancante
 */

const axios = require('axios');

// Configurazione
const API_BASE_URL = 'http://localhost:4001';
const PROXY_BASE_URL = 'http://localhost:4003';

// Credenziali di test (corrette dal database)
const TEST_CREDENTIALS = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

async function testLoginTokenGeneration() {
  console.log('\n🔍 ATTEMPT 99 - TEST LOGIN TOKEN GENERATION');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Login diretto al server API
    console.log('\n1️⃣ TEST LOGIN DIRETTO API SERVER (4001)');
    console.log('-'.repeat(40));
    
    const directResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, TEST_CREDENTIALS, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', directResponse.status);
    console.log('✅ Response Data:', JSON.stringify(directResponse.data, null, 2));
    
    // Analisi dettagliata della risposta
    const data = directResponse.data;
    console.log('\n🔍 ANALISI DETTAGLIATA RISPOSTA:');
    console.log('- success:', data.success);
    console.log('- message:', data.message);
    console.log('- data exists:', !!data.data);
    
    if (data.data) {
      console.log('- data.accessToken:', data.data.accessToken);
      console.log('- data.refreshToken:', data.data.refreshToken);
      console.log('- data.expiresIn:', data.data.expiresIn);
      console.log('- data.user exists:', !!data.data.user);
      
      if (data.data.user) {
        console.log('- user.id:', data.data.user.id);
        console.log('- user.email:', data.data.user.email);
        console.log('- user.roles:', data.data.user.roles);
      }
    }
    
    // Test 2: Login tramite proxy
    console.log('\n\n2️⃣ TEST LOGIN TRAMITE PROXY (4003)');
    console.log('-'.repeat(40));
    
    const proxyResponse = await axios.post(`${PROXY_BASE_URL}/api/v1/auth/login`, TEST_CREDENTIALS, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', proxyResponse.status);
    console.log('✅ Response Data:', JSON.stringify(proxyResponse.data, null, 2));
    
    // Confronto risposte
    console.log('\n\n🔍 CONFRONTO RISPOSTE:');
    console.log('-'.repeat(40));
    
    const directToken = directResponse.data?.data?.accessToken;
    const proxyToken = proxyResponse.data?.data?.accessToken;
    
    console.log('Direct API Token:', directToken ? 'PRESENTE' : 'MANCANTE');
    console.log('Proxy Token:', proxyToken ? 'PRESENTE' : 'MANCANTE');
    
    if (directToken && proxyToken) {
      console.log('Token identici:', directToken === proxyToken ? 'SÌ' : 'NO');
    }
    
  } catch (error) {
    console.error('❌ ERRORE:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Server non raggiungibile!');
    }
  }
}

async function testEnvironmentVariables() {
  console.log('\n\n🔍 TEST VARIABILI AMBIENTE JWT');
  console.log('=' .repeat(60));
  
  try {
    // Test endpoint per verificare configurazione JWT
    const response = await axios.get(`${API_BASE_URL}/api/health`, {
      timeout: 5000
    });
    
    console.log('✅ Server API raggiungibile');
    
  } catch (error) {
    console.error('❌ Server API non raggiungibile:', error.message);
  }
}

async function main() {
  console.log('🚀 INIZIO TEST LOGIN TOKEN DEBUG');
  console.log('Timestamp:', new Date().toISOString());
  
  await testEnvironmentVariables();
  await testLoginTokenGeneration();
  
  console.log('\n✅ TEST COMPLETATO');
}

// Esegui il test
main().catch(console.error);