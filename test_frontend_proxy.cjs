/**
 * Test per verificare che il proxy Vite funzioni correttamente
 * dopo le correzioni a vite.config.ts
 * 
 * IMPORTANTE: Il dev server frontend deve essere riavviato prima di eseguire questo test
 */

const axios = require('axios');

const FRONTEND_URL = 'http://localhost:5173';
const CREDENTIALS = {
  identifier: 'admin@example.com',
  password: 'Admin123!'
};

console.log('🧪 TEST PROXY FRONTEND - Verifica correzioni vite.config.ts');
console.log('=' .repeat(60));

async function testFrontendProxy() {
  try {
    console.log('\n1. 🔍 Test GET /api/v1/auth/login (deve restituire 405)');
    
    try {
      const getResponse = await axios.get(`${FRONTEND_URL}/api/v1/auth/login`, {
        timeout: 5000
      });
      console.log(`   ❌ GET Status: ${getResponse.status} (dovrebbe essere 405)`);
    } catch (error) {
      if (error.response && error.response.status === 405) {
        console.log(`   ✅ GET Status: 405 - ${error.response.data.message}`);
      } else {
        console.log(`   ❌ GET Error: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
          console.log('   🚨 ERRORE: Server frontend non raggiungibile su porta 5173');
          console.log('   💡 Assicurati che il dev server sia avviato e riavviato dopo le modifiche');
        }
      }
    }

    console.log('\n2. 🔐 Test POST /api/v1/auth/login (login con credenziali)');
    
    try {
      const postResponse = await axios.post(`${FRONTEND_URL}/api/v1/auth/login`, CREDENTIALS, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✅ POST Status: ${postResponse.status}`);
      console.log(`   ✅ Response: ${JSON.stringify(postResponse.data, null, 2)}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`   📊 POST Status: ${error.response.status}`);
        console.log(`   📊 Response: ${JSON.stringify(error.response.data, null, 2)}`);
        
        if (error.response.status === 429) {
          console.log('   ✅ Rate limiting attivo - Sistema funzionante');
        } else if (error.response.status === 401) {
          console.log('   ✅ Autenticazione fallita - Proxy funzionante, verificare credenziali');
        } else if (error.response.status === 400) {
          console.log('   ⚠️  Validazione input - Verificare formato credenziali');
        }
      } else {
        console.log(`   ❌ POST Error: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
          console.log('   🚨 ERRORE: Server non raggiungibile');
        }
      }
    }

    console.log('\n3. 🔍 Test connessione diretta backend (verifica che sia attivo)');
    
    try {
      const backendResponse = await axios.get('http://localhost:4001/api/v1/auth/login', {
        timeout: 5000
      });
      console.log(`   ❌ Backend GET Status: ${backendResponse.status} (dovrebbe essere 405)`);
    } catch (error) {
      if (error.response && error.response.status === 405) {
        console.log(`   ✅ Backend attivo - GET Status: 405`);
      } else {
        console.log(`   ❌ Backend Error: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
          console.log('   🚨 ERRORE: Server backend non raggiungibile su porta 4001');
        }
      }
    }

  } catch (error) {
    console.error('❌ Errore generale nel test:', error.message);
  }
}

console.log('\n🎯 OBIETTIVO DEL TEST:');
console.log('- Verificare che il proxy Vite reindirizzi /api/* a localhost:4001');
console.log('- Confermare che le correzioni a vite.config.ts siano efficaci');
console.log('- Testare il login con credenziali admin@example.com / Admin123!');

console.log('\n⚠️  PREREQUISITI:');
console.log('- Dev server frontend riavviato dopo modifiche vite.config.ts');
console.log('- Server backend attivo su porta 4001');
console.log('- Server frontend attivo su porta 5173');

console.log('\n🚀 Avvio test...');
testFrontendProxy();