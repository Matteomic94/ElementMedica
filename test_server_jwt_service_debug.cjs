const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test per verificare quale servizio JWT usa effettivamente il server
async function testServerJWTService() {
  console.log('🔍 ATTEMPT 108 - TEST SERVER JWT SERVICE DEBUG');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Login al server reale
    console.log('\n📝 Step 1: Login to real server...');
    
    const loginData = {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    };
    
    console.log('🔍 Login data:', { identifier: loginData.identifier, password: '****' });
    
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', loginData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login response status:', loginResponse.status);
    console.log('✅ Login response success:', loginResponse.data.success);
    
    if (!loginResponse.data.success || !loginResponse.data.data.accessToken) {
      throw new Error('Login failed or no access token received');
    }
    
    const serverToken = loginResponse.data.data.accessToken;
    console.log('✅ Server token received:', serverToken.substring(0, 20) + '...');
    console.log('✅ Server token length:', serverToken.length);
    
    // Step 2: Decodifica il token del server
    console.log('\n📝 Step 2: Decoding server token...');
    
    const serverDecoded = jwt.decode(serverToken, { complete: true });
    
    if (!serverDecoded) {
      throw new Error('Failed to decode server token');
    }
    
    console.log('✅ Server token header:', JSON.stringify(serverDecoded.header, null, 2));
    console.log('✅ Server token payload:', JSON.stringify(serverDecoded.payload, null, 2));
    
    const serverPayload = serverDecoded.payload;
    
    // Step 3: Analisi audience e issuer
    console.log('\n📝 Step 3: Analyzing server token audience and issuer...');
    
    console.log('🔍 Server token audience (aud):', serverPayload.aud || 'undefined');
    console.log('🔍 Server token issuer (iss):', serverPayload.iss || 'undefined');
    
    // Step 4: Confronto con servizi JWT conosciuti
    console.log('\n📝 Step 4: Comparing with known JWT services...');
    
    const expectedJWTService = {
      audience: 'training-platform-users',
      issuer: 'training-platform'
    };
    
    const expectedAdvancedJWTService = {
      audience: 'project-api',
      issuer: 'project-auth-system'
    };
    
    const serverAudience = serverPayload.aud;
    const serverIssuer = serverPayload.iss;
    
    console.log('\n🔍 COMPARISON RESULTS:');
    console.log('=' .repeat(40));
    
    // JWTService match
    const jwtServiceMatch = {
      audience: serverAudience === expectedJWTService.audience,
      issuer: serverIssuer === expectedJWTService.issuer
    };
    
    console.log('📋 JWTService (jwt.js) match:');
    console.log('  - Audience match:', jwtServiceMatch.audience ? 'YES' : 'NO');
    console.log('  - Issuer match:', jwtServiceMatch.issuer ? 'YES' : 'NO');
    console.log('  - Overall match:', (jwtServiceMatch.audience && jwtServiceMatch.issuer) ? 'YES' : 'NO');
    
    // AdvancedJWTService match
    const advancedJwtServiceMatch = {
      audience: serverAudience === expectedAdvancedJWTService.audience,
      issuer: serverIssuer === expectedAdvancedJWTService.issuer
    };
    
    console.log('\n📋 AdvancedJWTService (jwt-advanced.js) match:');
    console.log('  - Audience match:', advancedJwtServiceMatch.audience ? 'YES' : 'NO');
    console.log('  - Issuer match:', advancedJwtServiceMatch.issuer ? 'YES' : 'NO');
    console.log('  - Overall match:', (advancedJwtServiceMatch.audience && advancedJwtServiceMatch.issuer) ? 'YES' : 'NO');
    
    // Step 5: Conclusioni
    console.log('\n📝 Step 5: Conclusions...');
    console.log('=' .repeat(40));
    
    if (jwtServiceMatch.audience && jwtServiceMatch.issuer) {
      console.log('🎉 SERVER IS USING JWTService (jwt.js)');
      console.log('✅ This means the audience/issuer should be compatible');
      console.log('🔍 The timeout problem must be elsewhere');
    } else if (advancedJwtServiceMatch.audience && advancedJwtServiceMatch.issuer) {
      console.log('🚨 SERVER IS USING AdvancedJWTService (jwt-advanced.js)');
      console.log('❌ This creates audience/issuer mismatch!');
      console.log('🔧 Need to fix the server to use consistent JWT service');
    } else if (!serverAudience && !serverIssuer) {
      console.log('🚨 SERVER TOKEN HAS NO AUDIENCE OR ISSUER!');
      console.log('❌ This means the server is using a different JWT implementation');
      console.log('🔍 Need to find which JWT service is actually being used');
    } else {
      console.log('🚨 SERVER IS USING UNKNOWN JWT SERVICE!');
      console.log('🔍 Server audience:', serverAudience);
      console.log('🔍 Server issuer:', serverIssuer);
      console.log('❌ This is not matching any known service');
    }
    
    // Step 6: Test verifica token
    console.log('\n📝 Step 6: Testing token verification...');
    
    try {
      const verifyResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
        headers: {
          'Authorization': `Bearer ${serverToken}`
        },
        timeout: 5000
      });
      
      console.log('✅ Verify response status:', verifyResponse.status);
      console.log('✅ Verify successful - no timeout!');
      console.log('🔍 This means the JWT service mismatch is NOT the cause of timeout');
      
    } catch (verifyError) {
      if (verifyError.code === 'ECONNABORTED') {
        console.log('❌ Verify timeout confirmed');
        console.log('🔍 Timeout occurs even with server-generated token');
        console.log('🔍 Problem is in the verify endpoint logic, not JWT mismatch');
      } else {
        console.log('❌ Verify failed with error:', verifyError.response?.status || verifyError.message);
        if (verifyError.response?.data) {
          console.log('❌ Verify error data:', verifyError.response.data);
        }
      }
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
testServerJWTService().catch(console.error);