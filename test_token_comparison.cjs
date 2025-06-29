const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test configuration
const API_BASE_URL = 'http://localhost:4001';
const TEST_CREDENTIALS = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

async function compareTokens() {
  console.log('🔍 Comparing tokens from login vs local generation...');
  
  try {
    // Step 1: Get token from login
    console.log('\n📝 Step 1: Getting token from login endpoint...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, TEST_CREDENTIALS, {
      timeout: 10000
    });
    
    if (!loginResponse.data.success || !loginResponse.data.data.accessToken) {
      console.error('❌ Login failed or no access token received');
      return;
    }
    
    const loginToken = loginResponse.data.data.accessToken;
    console.log(`✅ Login token received, length: ${loginToken.length}`);
    
    // Step 2: Decode the login token (without verification)
    console.log('\n📝 Step 2: Decoding login token (without verification)...');
    const loginDecoded = jwt.decode(loginToken, { complete: true });
    console.log('🔍 Login token header:', JSON.stringify(loginDecoded.header, null, 2));
    console.log('🔍 Login token payload:', JSON.stringify(loginDecoded.payload, null, 2));
    
    // Step 3: Generate local token with same payload
    console.log('\n📝 Step 3: Generating local token with same payload...');
    const { JWTService } = await import('./backend/auth/jwt.js');
    
    const localPayload = {
      userId: loginDecoded.payload.userId,
      email: loginDecoded.payload.email,
      companyId: loginDecoded.payload.companyId,
      roles: loginDecoded.payload.roles || [],
      permissions: loginDecoded.payload.permissions || []
    };
    
    const localToken = JWTService.generateAccessToken(localPayload);
    console.log(`✅ Local token generated, length: ${localToken.length}`);
    
    // Step 4: Decode the local token
    console.log('\n📝 Step 4: Decoding local token...');
    const localDecoded = jwt.decode(localToken, { complete: true });
    console.log('🔍 Local token header:', JSON.stringify(localDecoded.header, null, 2));
    console.log('🔍 Local token payload:', JSON.stringify(localDecoded.payload, null, 2));
    
    // Step 5: Compare audiences
    console.log('\n📝 Step 5: Comparing token properties...');
    console.log(`🎯 Login token audience: ${loginDecoded.payload.aud}`);
    console.log(`🎯 Local token audience: ${localDecoded.payload.aud}`);
    console.log(`🏷️ Login token issuer: ${loginDecoded.payload.iss}`);
    console.log(`🏷️ Local token issuer: ${localDecoded.payload.iss}`);
    
    if (loginDecoded.payload.aud !== localDecoded.payload.aud) {
      console.error('❌ AUDIENCE MISMATCH FOUND!');
      console.error(`   Login token audience: ${loginDecoded.payload.aud}`);
      console.error(`   Expected audience: ${localDecoded.payload.aud}`);
    } else {
      console.log('✅ Audiences match');
    }
    
    // Step 6: Try to verify the login token
    console.log('\n📝 Step 6: Trying to verify login token...');
    try {
      const verified = JWTService.verifyAccessToken(loginToken);
      console.log('✅ Login token verification successful!');
      console.log(`👤 Verified user ID: ${verified.userId}`);
    } catch (verifyError) {
      console.error('❌ Login token verification failed:', verifyError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
compareTokens();