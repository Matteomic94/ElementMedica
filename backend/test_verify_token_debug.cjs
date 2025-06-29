const axios = require('axios');

// Test verify token direttamente sull'API server
async function testVerifyToken() {
  console.log('🔍 TEST VERIFY TOKEN - API SERVER DIRETTO (porta 4001)');
  console.log('=' .repeat(60));
  
  try {
    // STEP 1: Login per ottenere un token valido
    console.log('\n📝 STEP 1: Login per ottenere token...');
    const loginResponse = await axios.post('http://127.0.0.1:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'test-verify-debug/1.0'
      }
    });
    
    console.log('✅ Login Status:', loginResponse.status);
    console.log('✅ Login Success:', loginResponse.data.success);
    
    const accessToken = loginResponse.data.data.accessToken;
    const tokenLength = accessToken ? accessToken.length : 0;
    console.log('✅ AccessToken presente:', !!accessToken);
    console.log('✅ AccessToken lunghezza:', tokenLength);
    
    if (!accessToken) {
      console.log('❌ ERRORE: Nessun token ricevuto dal login');
      return;
    }
    
    // STEP 2: Test verify token direttamente sull'API server
    console.log('\n📝 STEP 2: Test verify token API server diretto...');
    const startTime = Date.now();
    
    const verifyResponse = await axios.get('http://127.0.0.1:4001/api/v1/auth/verify', {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'test-verify-debug/1.0'
      }
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('✅ Verify Status:', verifyResponse.status);
    console.log('✅ Verify Success:', verifyResponse.data.success);
    console.log('✅ Response Time:', responseTime + 'ms');
    console.log('✅ User ID:', verifyResponse.data.data?.user?.id);
    console.log('✅ User Email:', verifyResponse.data.data?.user?.email);
    
    // STEP 3: Test verify tramite proxy
    console.log('\n📝 STEP 3: Test verify tramite proxy (porta 4003)...');
    try {
      const proxyStartTime = Date.now();
      
      const proxyVerifyResponse = await axios.get('http://127.0.0.1:4003/api/v1/auth/verify', {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'test-verify-debug/1.0'
        }
      });
      
      const proxyEndTime = Date.now();
      const proxyResponseTime = proxyEndTime - proxyStartTime;
      
      console.log('✅ Proxy Verify Status:', proxyVerifyResponse.status);
      console.log('✅ Proxy Verify Success:', proxyVerifyResponse.data.success);
      console.log('✅ Proxy Response Time:', proxyResponseTime + 'ms');
      
    } catch (proxyError) {
      console.log('❌ Proxy Verify Error:', proxyError.message);
      if (proxyError.response) {
        console.log('❌ Proxy Status:', proxyError.response.status);
        console.log('❌ Proxy Data:', proxyError.response.data);
      }
    }
    
    console.log('\n🎯 RISULTATI COMPARATIVI:');
    console.log('- API Server diretto (4001): ✅ Funziona');
    console.log('- Response time API:', responseTime + 'ms');
    
  } catch (error) {
    console.log('❌ ERRORE GENERALE:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.log('🚨 TIMEOUT: La richiesta ha superato il timeout');
    }
    
    if (error.response) {
      console.log('❌ Status:', error.response.status);
      console.log('❌ Data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 CONNESSIONE RIFIUTATA: Server non raggiungibile');
    }
  }
}

// Esegui il test
testVerifyToken();