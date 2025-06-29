/**
 * Test diretto al server API per verificare se l'endpoint /api/auth/login esiste
 */

import axios from 'axios';

const API_URL = 'http://localhost:4001';

async function testDirectAPI() {
  console.log('🎯 Testing direct API server endpoints...');
  console.log('📍 API URL:', API_URL);
  console.log('\n' + '='.repeat(50));
  
  // Test 1: POST to /api/auth/login
  try {
    console.log('\n🔐 Testing POST /api/auth/login...');
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!'
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ POST /api/auth/login SUCCESS!');
    console.log('📊 Status:', response.status);
    console.log('📋 Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ POST /api/auth/login response:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.log('🚨 404 = Endpoint does not exist on API server!');
      } else if (error.response.status === 401) {
        console.log('✅ 401 = Endpoint exists, authentication failed (expected)');
      } else if (error.response.status === 400) {
        console.log('✅ 400 = Endpoint exists, bad request (validation error)');
      }
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  // Test 2: GET to /api/auth (to see if auth router is mounted)
  try {
    console.log('\n🔐 Testing GET /api/auth...');
    const response = await axios.get(`${API_URL}/api/auth`, {
      timeout: 5000
    });
    
    console.log('✅ GET /api/auth SUCCESS!');
    console.log('📊 Status:', response.status);
    
  } catch (error) {
    console.log('❌ GET /api/auth response:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      
      if (error.response.status === 404) {
        console.log('🚨 404 = Auth router not mounted on /api/auth');
      } else {
        console.log('✅ Non-404 = Auth router is mounted');
      }
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  // Test 3: GET to /api (to see if main router responds)
  try {
    console.log('\n🌐 Testing GET /api...');
    const response = await axios.get(`${API_URL}/api`, {
      timeout: 5000
    });
    
    console.log('✅ GET /api SUCCESS!');
    console.log('📊 Status:', response.status);
    
  } catch (error) {
    console.log('❌ GET /api response:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Analysis:');
  console.log('- If /api/auth/login returns 401/400 = endpoint exists');
  console.log('- If /api/auth/login returns 404 = endpoint missing');
  console.log('- If /api/auth returns non-404 = auth router mounted');
  console.log('- If /api returns response = main API working');
}

// Run the test
testDirectAPI().catch(console.error);