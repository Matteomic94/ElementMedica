/**
 * Test per verificare il routing dei path nel proxy
 * Testa se i path vengono correttamente instradati
 */

import axios from 'axios';

const PROXY_URL = 'http://localhost:4003';
const API_URL = 'http://localhost:4001';

async function testPathRouting() {
  console.log('🔍 Testing path routing in proxy...');
  console.log('📍 Proxy URL:', PROXY_URL);
  console.log('📍 API URL:', API_URL);
  console.log('\n' + '='.repeat(50));
  
  // Test 1: GET request to /api/auth/login (should return method not allowed, not 404)
  try {
    console.log('\n🔐 Testing GET /api/auth/login via proxy...');
    const response = await axios.get(`${PROXY_URL}/api/auth/login`, {
      timeout: 5000
    });
    
    console.log('✅ GET /api/auth/login SUCCESS!');
    console.log('📊 Status:', response.status);
    console.log('📋 Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ GET /api/auth/login response:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.log('🚨 404 = Path not found - pathRewrite not working!');
      } else if (error.response.status === 405) {
        console.log('✅ 405 = Method not allowed - Path found, pathRewrite working!');
      }
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  // Test 2: GET request directly to API server
  try {
    console.log('\n🎯 Testing GET /api/auth/login direct to API...');
    const response = await axios.get(`${API_URL}/api/auth/login`, {
      timeout: 5000
    });
    
    console.log('✅ Direct API GET SUCCESS!');
    console.log('📊 Status:', response.status);
    
  } catch (error) {
    console.log('❌ Direct API GET response:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      
      if (error.response.status === 404) {
        console.log('🚨 404 = API endpoint not found');
      } else if (error.response.status === 405) {
        console.log('✅ 405 = API endpoint exists, method not allowed');
      }
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  // Test 3: Test generic /api path
  try {
    console.log('\n🌐 Testing GET /api via proxy...');
    const response = await axios.get(`${PROXY_URL}/api`, {
      timeout: 5000
    });
    
    console.log('✅ GET /api SUCCESS!');
    console.log('📊 Status:', response.status);
    
  } catch (error) {
    console.log('❌ GET /api response:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Analysis:');
  console.log('- 404 on proxy but 405 on API = pathRewrite issue');
  console.log('- 405 on both = pathRewrite working, endpoint exists');
  console.log('- 404 on both = endpoint does not exist');
  console.log('- Timeout = server communication issue');
}

// Run the test
testPathRouting().catch(console.error);