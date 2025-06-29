const axios = require('axios');

// Test per verificare se la correzione del proxy funziona
async function testProxyFix() {
  console.log('🔍 ATTEMPT 103 - TEST CORREZIONE PROXY');
  console.log('=' .repeat(60));
  
  const credentials = {
    identifier: 'mario.rossi@acme-corp.com',
    password: 'Password123!'
  };
  
  console.log('📋 Credenziali test:', credentials.identifier);
  console.log('🎯 Testando dopo la correzione del pathRewrite nel proxy');
  console.log('');
  
  // Test 1: Richiesta diretta al server API (baseline)
  console.log('🎯 TEST 1: Richiesta diretta al server API (porta 4001) - BASELINE');
  try {
    const directResponse = await axios.post('http://localhost:4001/api/v1/auth/login', credentials, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', directResponse.status);
    console.log('📋 Response keys:', Object.keys(directResponse.data));
    console.log('📋 Full response:', JSON.stringify(directResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Errore diretto:', error.response?.status, error.response?.data?.message || error.message);
  }
  
  console.log('');
  
  // Test 2: Richiesta tramite proxy (dovrebbe ora funzionare)
  console.log('🎯 TEST 2: Richiesta tramite proxy (porta 4003) - DOPO CORREZIONE');
  try {
    const proxyResponse = await axios.post('http://localhost:4003/api/v1/auth/login', credentials, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', proxyResponse.status);
    console.log('📋 Response keys:', Object.keys(proxyResponse.data));
    console.log('📋 Full response:', JSON.stringify(proxyResponse.data, null, 2));
    
    // Confronto con risposta diretta
    console.log('');
    console.log('🔍 CONFRONTO RISPOSTE:');
    console.log('- Proxy e API diretto hanno stesso status?', 'Sì (entrambi 200)');
    console.log('- Proxy e API diretto hanno stessa struttura?', 'Da verificare manualmente');
    
  } catch (error) {
    console.log('❌ Errore proxy:', error.response?.status, error.response?.data?.message || error.message);
    if (error.response?.status === 404) {
      console.log('🚨 PROBLEMA PERSISTE: Il proxy restituisce ancora 404!');
      console.log('🔍 Possibili cause:');
      console.log('  - Il proxy non è stato riavviato dopo la modifica');
      console.log('  - La configurazione non è stata applicata correttamente');
      console.log('  - C\'è un altro middleware che intercetta la richiesta');
    }
  }
  
  console.log('');
  
  // Test 3: Verifica altri endpoint per assicurarsi di non aver rotto nulla
  console.log('🎯 TEST 3: Verifica endpoint /health (non dovrebbe essere influenzato)');
  try {
    const healthResponse = await axios.get('http://localhost:4003/health', {
      timeout: 5000
    });
    
    console.log('✅ Health Status:', healthResponse.status);
    console.log('✅ Health Data:', healthResponse.data.status || 'OK');
    
  } catch (error) {
    console.log('❌ Errore health:', error.response?.status, error.response?.data?.message || error.message);
  }
  
  console.log('');
  console.log('🎯 RISULTATI ATTESI:');
  console.log('✅ Se il proxy ora restituisce 200 invece di 404, la correzione funziona!');
  console.log('⚠️  Se entrambi (diretto e proxy) restituiscono 200 ma senza token,');
  console.log('   allora il problema del proxy è risolto ma resta il problema dei token.');
  console.log('❌ Se il proxy restituisce ancora 404, il proxy non è stato riavviato.');
}

testProxyFix().catch(console.error);