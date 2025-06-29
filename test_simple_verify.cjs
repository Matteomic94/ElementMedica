const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:4001';

async function testSimpleEndpoint() {
  console.log('🔍 Testing simple endpoint without authentication...');
  
  try {
    // Test a simple endpoint that doesn't require authentication
    console.log('\n📝 Testing /health endpoint...');
    const startTime = Date.now();
    
    const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Health endpoint successful in ${responseTime}ms`);
    console.log(`📊 Status: ${healthResponse.status}`);
    console.log(`💬 Response: ${JSON.stringify(healthResponse.data)}`);
    
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ TIMEOUT - Even simple endpoints are timing out');
    }
  }
  
  try {
    // Test JWT verification directly
    console.log('\n📝 Testing JWT verification...');
    
    // First get a token
    const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 5000
    });
    
    if (!loginResponse.data.success || !loginResponse.data.data.accessToken) {
      console.error('❌ Login failed');
      return;
    }
    
    const accessToken = loginResponse.data.data.accessToken;
    console.log(`✅ Got access token, length: ${accessToken.length}`);
    
    // Try to verify the token manually using JWT service
    console.log('\n📝 Testing manual JWT verification...');
    
    // Import JWT service and test it directly
    const { JWTService } = await import('./backend/auth/jwt.js');
    
    const decoded = JWTService.verifyAccessToken(accessToken);
    console.log(`✅ JWT verification successful`);
    console.log(`👤 User ID: ${decoded.userId || decoded.personId}`);
    console.log(`⏰ Expires: ${new Date(decoded.exp * 1000)}`);
    
  } catch (error) {
    console.error('❌ JWT test failed:', error.message);
  }
}

// Run the test
testSimpleEndpoint();