/**
 * Test da eseguire DOPO aver riavviato il server con debug logging
 * Questo test fa richieste semplici per verificare se arrivano al server
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:4001';

async function testWithDebugLogging() {
  console.log('🧪 Test con Debug Logging Attivo');
  console.log('=' .repeat(50));
  console.log('');
  console.log('⚠️  IMPORTANTE: Assicurati che il server API sia stato riavviato!');
  console.log('⚠️  Osserva il terminale del server per i log di debug');
  console.log('');
  
  try {
    console.log('📋 Test 1: GET /api/v1/auth/login');
    console.log('Aspettativa: Dovresti vedere nel server: "[DEBUG] INCOMING REQUEST: method: GET, url: /api/v1/auth/login"');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa per leggere
    
    const getResponse = await axios.get(`${API_BASE_URL}/api/v1/auth/login`, {
      validateStatus: () => true
    });
    
    console.log(`✅ GET completato - Status: ${getResponse.status}`);
    
    console.log('\n📋 Test 2: POST /api/v1/auth/login');
    console.log('Aspettativa: Dovresti vedere nel server: "[DEBUG] INCOMING REQUEST: method: POST, url: /api/v1/auth/login"');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa per leggere
    
    const postResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    }, {
      validateStatus: () => true
    });
    
    console.log(`✅ POST completato - Status: ${postResponse.status}`);
    
    console.log('\n📋 Test 3: GET /health');
    console.log('Aspettativa: Dovresti vedere nel server: "[DEBUG] INCOMING REQUEST: method: GET, url: /health"');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa per leggere
    
    const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
      validateStatus: () => true
    });
    
    console.log(`✅ GET /health completato - Status: ${healthResponse.status}`);
    
    console.log('\n🔍 ANALISI:');
    console.log('- Se vedi i log di debug per TUTTE le richieste → Il problema è nel routing interno');
    console.log('- Se NON vedi i log per le richieste GET → Il problema è prima che arrivino al server');
    console.log('- Se vedi i log ma le GET restituiscono 404 → Il problema è nel middleware/routing');
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Assicurati che il server API sia in esecuzione sulla porta 4001');
    }
  }
}

// Esegui il test
testWithDebugLogging();