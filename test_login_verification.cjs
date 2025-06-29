const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing Login System...');
  
  try {
    // Test 1: Direct API Server Login
    console.log('\n1. Testing direct API server login...');
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    });
    
    console.log('✅ Login successful:', {
      status: loginResponse.status,
      hasToken: !!loginResponse.data?.data?.accessToken,
      tokenLength: loginResponse.data?.data?.accessToken?.length || 0,
      responseStructure: Object.keys(loginResponse.data || {})
    });
    
    const token = loginResponse.data?.data?.accessToken;
    
    // Test 2: Token Verification
    if (token) {
      console.log('\n2. Testing token verification...');
      const verifyResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Token verification successful:', {
        status: verifyResponse.status,
        hasUser: !!verifyResponse.data?.user,
        userEmail: verifyResponse.data?.user?.email
      });
    }
    
    // Test 3: Skip proxy server test (not running)
    console.log('\n3. Skipping proxy server test (not running on port 4003)...');
    
    // Test 4: Check problematic endpoints
    console.log('\n4. Testing problematic endpoints...');
    
    const endpoints = [
      '/api/v1/auth/permissions',
      '/courses',
      '/api/persons/trainers',
      '/companies',
      '/employees',
      '/schedules'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:4001${endpoint}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          timeout: 5000
        });
        console.log(`✅ ${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status || error.code} - ${error.message}`);
        if (error.response?.status === 500) {
          console.log(`   Error details: ${error.response?.data?.error || error.response?.data?.message || 'Unknown error'}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
  }
}

testLogin();