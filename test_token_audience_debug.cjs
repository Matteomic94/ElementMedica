const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test per verificare l'audience del token generato dal login
async function testTokenAudience() {
  console.log('🔍 ATTEMPT 107 - TEST TOKEN AUDIENCE DEBUG');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Ottieni token dal login
    console.log('\n📝 Step 1: Getting token from login...');
    
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const accessToken = loginResponse.data.data?.accessToken;
    console.log('✅ Token obtained:', accessToken.substring(0, 20) + '...');
    console.log('✅ Token length:', accessToken.length);
    
    // Step 2: Decodifica il token senza verificarlo per vedere il contenuto
    console.log('\n📝 Step 2: Decoding token without verification...');
    
    const decoded = jwt.decode(accessToken, { complete: true });
    console.log('✅ Token header:', JSON.stringify(decoded.header, null, 2));
    console.log('✅ Token payload:', JSON.stringify(decoded.payload, null, 2));
    
    // Step 3: Verifica audience e issuer
    console.log('\n📝 Step 3: Checking audience and issuer...');
    
    const payload = decoded.payload;
    console.log('🔍 Audience in token:', payload.aud);
    console.log('🔍 Issuer in token:', payload.iss);
    console.log('🔍 Expected audience: training-platform-users');
    console.log('🔍 Expected issuer: training-platform');
    
    // Step 4: Confronto con quello che si aspetta il JWTService
    console.log('\n📝 Step 4: Audience/Issuer comparison...');
    
    const audienceMatch = payload.aud === 'training-platform-users';
    const issuerMatch = payload.iss === 'training-platform';
    
    console.log('✅ Audience match:', audienceMatch ? 'YES' : 'NO');
    console.log('✅ Issuer match:', issuerMatch ? 'YES' : 'NO');
    
    if (!audienceMatch) {
      console.log('🚨 AUDIENCE MISMATCH DETECTED!');
      console.log('🚨 Token has audience:', payload.aud);
      console.log('🚨 Expected audience: training-platform-users');
    }
    
    if (!issuerMatch) {
      console.log('🚨 ISSUER MISMATCH DETECTED!');
      console.log('🚨 Token has issuer:', payload.iss);
      console.log('🚨 Expected issuer: training-platform');
    }
    
    // Step 5: Test verifica manuale con parametri corretti
    console.log('\n📝 Step 5: Manual verification test...');
    
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
      
      // Prova a verificare con i parametri che ha il token
      const verifiedWithTokenParams = jwt.verify(accessToken, JWT_SECRET, {
        issuer: payload.iss,
        audience: payload.aud
      });
      
      console.log('✅ Verification with token params: SUCCESS');
      
      // Prova a verificare con i parametri che si aspetta il JWTService
      try {
        const verifiedWithExpectedParams = jwt.verify(accessToken, JWT_SECRET, {
          issuer: 'training-platform',
          audience: 'training-platform-users'
        });
        console.log('✅ Verification with expected params: SUCCESS');
      } catch (expectedError) {
        console.log('❌ Verification with expected params: FAILED');
        console.log('❌ Error:', expectedError.message);
      }
      
    } catch (manualError) {
      console.log('❌ Manual verification failed:', manualError.message);
    }
    
  } catch (error) {
    console.log('\n❌ TEST FAILED!');
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('❌ Response status:', error.response.status);
      console.log('❌ Response data:', error.response.data);
    }
  }
}

// Esegui il test
testTokenAudience().catch(console.error);