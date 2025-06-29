/**
 * Test comparativo tra proxy e API diretta
 * Per identificare dove si perde la richiesta
 */

import axios from 'axios';

const PROXY_URL = 'http://localhost:4003';
const API_URL = 'http://localhost:4001';

const loginData = {
  email: 'admin@example.com',
  password: 'Admin123!'
};

async function testProxyVsAPI() {
  console.log('🔍 Comparing Proxy vs Direct API...');
  console.log('📍 Proxy URL:', PROXY_URL);
  console.log('📍 API URL:', API_URL);
  console.log('\n' + '='.repeat(50));
  
  // Test 1: Direct API (we know this works)
  console.log('\n🎯 Testing DIRECT API /api/auth/login...');
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, loginData, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ DIRECT API SUCCESS!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response has token:', !!response.data.accessToken);
    
  } catch (error) {
    console.log('❌ DIRECT API FAILED!');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  // Test 2: Proxy to API
  console.log('\n🔄 Testing PROXY /api/auth/login...');
  try {
    const response = await axios.post(`${PROXY_URL}/api/auth/login`, loginData, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ PROXY SUCCESS!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response has token:', !!response.data.accessToken);
    
  } catch (error) {
    console.log('❌ PROXY FAILED!');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.log('🚨 404 = Proxy pathRewrite not working!');
        console.log('🔍 Proxy is probably sending wrong path to API');
      }
    } else {
      console.log('🔍 Error:', error.message);
      if (error.message.includes('socket hang up')) {
        console.log('🚨 Socket hang up = Proxy not responding');
      }
    }
  }
  
  // Test 3: Test what path proxy actually sends
  console.log('\n🔍 Testing what path proxy sends...');
  console.log('📋 If proxy pathRewrite works:');
  console.log('   - Request: /api/auth/login');
  console.log('   - Middleware removes: /api/auth → /login');
  console.log('   - PathRewrite adds: /login → /api/auth/login');
  console.log('   - API receives: /api/auth/login ✅');
  console.log('');
  console.log('📋 If proxy pathRewrite fails:');
  console.log('   - Request: /api/auth/login');
  console.log('   - Middleware removes: /api/auth → /login');
  console.log('   - No pathRewrite: /login → /login');
  console.log('   - API receives: /login ❌ (404)');
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 CONCLUSION:');
  console.log('- If DIRECT API works but PROXY fails → pathRewrite issue');
  console.log('- If both fail → API server issue');
  console.log('- If both work → problem solved!');
}

// Run the test
testProxyVsAPI().catch(console.error);