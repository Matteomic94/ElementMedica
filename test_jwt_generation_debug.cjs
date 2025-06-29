const { JWTService } = require('./backend/auth/jwt.js');
const jwt = require('jsonwebtoken');

// Test per verificare se JWTService.generateAccessToken include audience e issuer
async function testJWTGeneration() {
  console.log('🔍 ATTEMPT 107 - TEST JWT GENERATION DEBUG');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Test diretto del generateAccessToken
    console.log('\n📝 Step 1: Testing JWTService.generateAccessToken directly...');
    
    const testPayload = {
      userId: 'test-user-001',
      email: 'test@example.com',
      companyId: 'test-company-001',
      roles: ['USER'],
      permissions: []
    };
    
    console.log('🔍 Test payload:', JSON.stringify(testPayload, null, 2));
    
    const directToken = JWTService.generateAccessToken(testPayload);
    console.log('✅ Direct token generated:', directToken.substring(0, 20) + '...');
    console.log('✅ Direct token length:', directToken.length);
    
    // Step 2: Decodifica il token diretto
    console.log('\n📝 Step 2: Decoding direct token...');
    
    const directDecoded = jwt.decode(directToken, { complete: true });
    console.log('✅ Direct token payload:', JSON.stringify(directDecoded.payload, null, 2));
    
    const directPayload = directDecoded.payload;
    console.log('🔍 Direct token audience:', directPayload.aud);
    console.log('🔍 Direct token issuer:', directPayload.iss);
    
    // Step 3: Test del generateTokenPair
    console.log('\n📝 Step 3: Testing JWTService.generateTokenPair...');
    
    const testUser = {
      id: 'test-user-001',
      email: 'test@example.com',
      company_id: 'test-company-001',
      roles: ['USER'],
      permissions: []
    };
    
    const testDeviceInfo = {
      ip: '127.0.0.1',
      userAgent: 'test-agent'
    };
    
    console.log('🔍 Test user:', JSON.stringify(testUser, null, 2));
    
    try {
      const tokenPair = await JWTService.generateTokenPair(testUser, testDeviceInfo);
      console.log('✅ Token pair generated successfully');
      console.log('✅ Access token from pair:', tokenPair.accessToken.substring(0, 20) + '...');
      
      // Step 4: Decodifica il token dal pair
      console.log('\n📝 Step 4: Decoding token from pair...');
      
      const pairDecoded = jwt.decode(tokenPair.accessToken, { complete: true });
      console.log('✅ Pair token payload:', JSON.stringify(pairDecoded.payload, null, 2));
      
      const pairPayload = pairDecoded.payload;
      console.log('🔍 Pair token audience:', pairPayload.aud);
      console.log('🔍 Pair token issuer:', pairPayload.iss);
      
      // Step 5: Confronto
      console.log('\n📝 Step 5: Comparison...');
      
      const directHasAudience = directPayload.aud === 'training-platform-users';
      const directHasIssuer = directPayload.iss === 'training-platform';
      const pairHasAudience = pairPayload.aud === 'training-platform-users';
      const pairHasIssuer = pairPayload.iss === 'training-platform';
      
      console.log('✅ Direct token has correct audience:', directHasAudience ? 'YES' : 'NO');
      console.log('✅ Direct token has correct issuer:', directHasIssuer ? 'YES' : 'NO');
      console.log('✅ Pair token has correct audience:', pairHasAudience ? 'YES' : 'NO');
      console.log('✅ Pair token has correct issuer:', pairHasIssuer ? 'YES' : 'NO');
      
      if (directHasAudience && directHasIssuer && pairHasAudience && pairHasIssuer) {
        console.log('🎉 JWT GENERATION IS WORKING CORRECTLY!');
        console.log('🔍 The problem must be elsewhere (server using different code?)');
      } else {
        console.log('🚨 JWT GENERATION HAS PROBLEMS!');
      }
      
    } catch (pairError) {
      console.log('❌ generateTokenPair failed:', pairError.message);
      console.log('❌ This might be due to database connection issues');
    }
    
  } catch (error) {
    console.log('\n❌ TEST FAILED!');
    console.log('❌ Error:', error.message);
    console.log('❌ Stack:', error.stack);
  }
}

// Esegui il test
testJWTGeneration().catch(console.error);