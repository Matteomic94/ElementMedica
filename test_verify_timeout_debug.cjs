const axios = require('axios');

// Test per verificare il problema di timeout sul verify endpoint
async function testVerifyTimeout() {
  console.log('🔍 ATTEMPT 107 - TEST VERIFY TIMEOUT DEBUG');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Login per ottenere un token valido
    console.log('\n📝 Step 1: Performing login to get valid token...');
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login Status:', loginResponse.status);
    console.log('✅ Login Success:', loginResponse.data.success);
    
    const accessToken = loginResponse.data.data?.accessToken;
    if (!accessToken) {
      throw new Error('No access token received from login');
    }
    
    console.log('✅ AccessToken received:', accessToken.substring(0, 20) + '...');
    console.log('✅ Token length:', accessToken.length);
    
    // Step 2: Test verify endpoint direttamente su API server (4001)
    console.log('\n📝 Step 2: Testing verify endpoint directly on API server (4001)...');
    console.log('🔍 Using token:', accessToken.substring(0, 20) + '...');
    console.log('🔍 Endpoint: http://localhost:4001/api/v1/auth/verify');
    console.log('🔍 Timeout: 30 seconds');
    
    const startTime = Date.now();
    
    const verifyResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 secondi
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n🎉 VERIFY SUCCESS!');
    console.log('✅ Verify Status:', verifyResponse.status);
    console.log('✅ Response time:', duration + 'ms');
    console.log('✅ Response data:', JSON.stringify(verifyResponse.data, null, 2));
    
  } catch (error) {
    const endTime = Date.now();
    
    console.log('\n❌ VERIFY FAILED!');
    console.log('❌ Error type:', error.constructor.name);
    console.log('❌ Error code:', error.code);
    console.log('❌ Error message:', error.message);
    
    if (error.response) {
      console.log('❌ Response status:', error.response.status);
      console.log('❌ Response data:', error.response.data);
    }
    
    if (error.code === 'ECONNABORTED') {
      console.log('🚨 TIMEOUT CONFIRMED - Verify endpoint non risponde entro 30 secondi');
    }
    
    // Step 3: Test di connettività base
    console.log('\n📝 Step 3: Testing basic connectivity to API server...');
    try {
      const healthResponse = await axios.get('http://localhost:4001/health', {
        timeout: 5000
      });
      console.log('✅ Health check OK:', healthResponse.status);
    } catch (healthError) {
      console.log('❌ Health check failed:', healthError.message);
    }
  }
}

// Esegui il test
testVerifyTimeout().catch(console.error);