/**
 * Test script per verificare la correzione del pathRewrite nel proxy
 * Testa il login dopo la correzione della configurazione
 */

import axios from 'axios';

const PROXY_URL = 'http://localhost:4003';
const LOGIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'Admin123!'
};

async function testLogin() {
  console.log('🧪 Testing login with corrected proxy configuration...');
  console.log('📍 Target URL:', `${PROXY_URL}/api/auth/login`);
  console.log('🔑 Credentials:', LOGIN_CREDENTIALS);
  console.log('\n' + '='.repeat(50));
  
  try {
    const response = await axios.post(`${PROXY_URL}/api/auth/login`, LOGIN_CREDENTIALS, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ LOGIN SUCCESS!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    console.log('🍪 Headers:', JSON.stringify(response.headers, null, 2));
    
  } catch (error) {
    console.log('❌ LOGIN FAILED!');
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Error data:', JSON.stringify(error.response.data, null, 2));
      console.log('🔍 Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.log('🔍 Request error:', error.message);
      console.log('📡 No response received from server');
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🔍 Check proxy server logs for pathRewrite debug info');
  console.log('📝 Expected: /login should be rewritten to /api/auth/login');
}

// Run the test
testLogin().catch(console.error);