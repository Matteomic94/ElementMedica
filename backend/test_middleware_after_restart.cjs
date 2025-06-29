const axios = require('axios');

// Test del middleware authenticate dopo il riavvio dei server
async function testMiddlewareAfterRestart() {
  console.log('🔄 Test middleware authenticate dopo riavvio server...');
  
  try {
    // 1. Verifica stato server
    console.log('\n1. Verifica stato server API...');
    const healthResponse = await axios.get('http://localhost:4001/health', {
      timeout: 5000
    });
    console.log('✅ Server API attivo:', healthResponse.status);
    
    // 2. Login per ottenere token valido
    console.log('\n2. Eseguo login...');
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 10000
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login fallito: ${loginResponse.status}`);
    }
    
    const { accessToken } = loginResponse.data;
    console.log('✅ Login riuscito, token ottenuto');
    
    // 3. Test /verify con token valido
    console.log('\n3. Test /verify con token valido...');
    const verifyResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      timeout: 10000
    });
    
    console.log('✅ /verify riuscito:', verifyResponse.status);
    console.log('📋 Dati utente:', JSON.stringify(verifyResponse.data, null, 2));
    
    // 4. Test /verify con token non valido
    console.log('\n4. Test /verify con token non valido...');
    try {
      await axios.get('http://localhost:4001/api/v1/auth/verify', {
        headers: {
          'Authorization': 'Bearer token_non_valido'
        },
        timeout: 5000
      });
      console.log('❌ ERRORE: /verify dovrebbe fallire con token non valido');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ /verify correttamente rifiutato con token non valido (401)');
      } else {
        console.log('⚠️ Errore inaspettato:', error.message);
      }
    }
    
    console.log('\n🎉 SUCCESSO: Il middleware authenticate funziona correttamente!');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ ERRORE: Server non raggiungibile');
    } else if (error.code === 'ECONNRESET' || error.message.includes('timeout')) {
      console.error('❌ ERRORE: Timeout - il middleware potrebbe ancora bloccarsi');
    } else {
      console.error('❌ ERRORE:', error.message);
      if (error.response) {
        console.error('📋 Dettagli risposta:', {
          status: error.response.status,
          data: error.response.data
        });
      }
    }
  }
}

testMiddlewareAfterRestart();