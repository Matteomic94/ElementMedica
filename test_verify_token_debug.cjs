const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:4001';
const PROXY_BASE_URL = 'http://localhost:4003';
const TEST_CREDENTIALS = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

async function testVerifyEndpoint() {
  console.log('🔍 Testing /api/v1/auth/verify endpoint after middleware fix...');
  
  try {
    // Step 1: Login to get access token
    console.log('\n📝 Step 1: Performing login to get access token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, TEST_CREDENTIALS, {
      timeout: 10000
    });
    
    if (!loginResponse.data.success || !loginResponse.data.data.accessToken) {
      console.error('❌ Login failed or no access token received');
      return;
    }
    
    const accessToken = loginResponse.data.data.accessToken;
    console.log(`✅ Login successful, access token length: ${accessToken.length}`);
    
    // Step 2: Test verify endpoint on direct API server
    console.log('\n📝 Step 2: Testing verify endpoint on direct API server (port 4001)...');
    const startTime = Date.now();
    
    try {
      const verifyResponse = await axios.get(`${API_BASE_URL}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ Direct API verify successful in ${responseTime}ms`);
      console.log(`📊 Status: ${verifyResponse.status}`);
      console.log(`👤 User ID: ${verifyResponse.data.user?.id}`);
      console.log(`📧 Email: ${verifyResponse.data.user?.email}`);
      console.log(`🔑 Roles: ${JSON.stringify(verifyResponse.data.user?.roles)}`);
      
    } catch (verifyError) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ Direct API verify failed after ${responseTime}ms:`);
      if (verifyError.code === 'ECONNABORTED') {
        console.error('⏰ TIMEOUT - The verify endpoint is still timing out');
      } else {
        console.error(`📊 Status: ${verifyError.response?.status}`);
        console.error(`💬 Message: ${verifyError.response?.data?.error || verifyError.message}`);
      }
      return;
    }
    
    // Step 3: Test verify endpoint via proxy
    console.log('\n📝 Step 3: Testing verify endpoint via proxy (port 4003)...');
    const proxyStartTime = Date.now();
    
    try {
      const proxyVerifyResponse = await axios.get(`${PROXY_BASE_URL}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 10000
      });
      
      const proxyResponseTime = Date.now() - proxyStartTime;
      console.log(`✅ Proxy verify successful in ${proxyResponseTime}ms`);
      console.log(`📊 Status: ${proxyVerifyResponse.status}`);
      console.log(`👤 User ID: ${proxyVerifyResponse.data.user?.id}`);
      
    } catch (proxyVerifyError) {
      const proxyResponseTime = Date.now() - proxyStartTime;
      console.error(`❌ Proxy verify failed after ${proxyResponseTime}ms:`);
      if (proxyVerifyError.code === 'ECONNABORTED') {
        console.error('⏰ TIMEOUT - The proxy verify endpoint is timing out');
      } else {
        console.error(`📊 Status: ${proxyVerifyError.response?.status}`);
        console.error(`💬 Message: ${proxyVerifyError.response?.data?.error || proxyVerifyError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVerifyEndpoint();