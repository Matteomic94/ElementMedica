const axios = require('axios');

// Test per verificare il problema del pathRewrite nel proxy
async function testProxyPathRewrite() {
  console.log('🔍 ATTEMPT 102 - TEST PROXY PATHREWRITE DEBUG');
  console.log('=' .repeat(60));
  
  const credentials = {
    identifier: 'mario.rossi@acme-corp.com',
    password: 'Password123!'
  };
  
  console.log('📋 Credenziali test:', credentials.identifier);
  console.log('');
  
  // Test 1: Richiesta diretta al server API (dovrebbe funzionare)
  console.log('🎯 TEST 1: Richiesta diretta al server API (porta 4001)');
  try {
    const directResponse = await axios.post('http://localhost:4001/api/v1/auth/login', credentials, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', directResponse.status);
    console.log('✅ AccessToken presente:', !!directResponse.data.accessToken);
    console.log('✅ RefreshToken presente:', !!directResponse.data.refreshToken);
    console.log('✅ ExpiresIn:', directResponse.data.expiresIn);
    console.log('✅ User ID:', directResponse.data.user?.id);
    
  } catch (error) {
    console.log('❌ Errore diretto:', error.response?.status, error.response?.data?.message || error.message);
  }
  
  console.log('');
  
  // Test 2: Richiesta tramite proxy (dovrebbe fallire con 404)
  console.log('🎯 TEST 2: Richiesta tramite proxy (porta 4003)');
  try {
    const proxyResponse = await axios.post('http://localhost:4003/api/v1/auth/login', credentials, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', proxyResponse.status);
    console.log('✅ AccessToken presente:', !!proxyResponse.data.accessToken);
    console.log('✅ RefreshToken presente:', !!proxyResponse.data.refreshToken);
    console.log('✅ ExpiresIn:', proxyResponse.data.expiresIn);
    console.log('✅ User ID:', proxyResponse.data.user?.id);
    
  } catch (error) {
    console.log('❌ Errore proxy:', error.response?.status, error.response?.data?.message || error.message);
    if (error.response?.status === 404) {
      console.log('🎯 CONFERMATO: Il proxy restituisce 404 per /api/v1/auth/login');
      console.log('🔍 Questo conferma il problema del pathRewrite!');
    }
  }
  
  console.log('');
  
  // Test 3: Verifica altri endpoint per confronto
  console.log('🎯 TEST 3: Test endpoint /health tramite proxy (dovrebbe funzionare)');
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
  console.log('🎯 CONCLUSIONI:');
  console.log('- Se il server API (4001) funziona ma il proxy (4003) restituisce 404,');
  console.log('  allora il problema è nella configurazione del pathRewrite del proxy.');
  console.log('- Il middleware /api/auth non matcha /api/v1/auth/login');
  console.log('- Il middleware generico /api rimuove /api e invia /v1/auth/login al server');
  console.log('- Il server API non ha endpoint /v1/auth/login (solo /api/v1/auth/login)');
  console.log('- Risultato: 404 Not Found');
}

testProxyPathRewrite().catch(console.error);