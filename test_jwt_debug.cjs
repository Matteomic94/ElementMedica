const { JWTService } = require('./backend/auth/jwt.js');

async function testJWTGeneration() {
  console.log('🔍 Testing JWT generation and verification...');
  
  try {
    // Test payload similar to what's used in login
    const testPayload = {
      userId: 'person-admin-001',
      email: 'mario.rossi@acme-corp.com',
      companyId: 'company-demo-001',
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
      permissions: []
    };
    
    console.log('\n📝 Step 1: Generating access token...');
    const accessToken = JWTService.generateAccessToken(testPayload);
    console.log(`✅ Access token generated, length: ${accessToken.length}`);
    console.log(`🔑 Token preview: ${accessToken.substring(0, 50)}...`);
    
    console.log('\n📝 Step 2: Verifying access token...');
    const decoded = JWTService.verifyAccessToken(accessToken);
    console.log(`✅ Access token verified successfully`);
    console.log(`👤 User ID: ${decoded.userId}`);
    console.log(`📧 Email: ${decoded.email}`);
    console.log(`🏢 Company ID: ${decoded.companyId}`);
    console.log(`🔑 Roles: ${JSON.stringify(decoded.roles)}`);
    console.log(`🎯 Audience: ${decoded.aud}`);
    console.log(`🏷️ Issuer: ${decoded.iss}`);
    console.log(`⏰ Expires: ${new Date(decoded.exp * 1000)}`);
    
    console.log('\n✅ JWT generation and verification working correctly!');
    
  } catch (error) {
    console.error('❌ JWT test failed:', error.message);
    console.error('📊 Error details:', error);
  }
}

// Run the test
testJWTGeneration();