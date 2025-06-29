/**
 * Test per verificare lo stato del proxy server
 * Controlla se il server risponde e se le modifiche sono attive
 */

import axios from 'axios';

const PROXY_URL = 'http://localhost:4003';

async function testProxyStatus() {
  console.log('🔍 Testing proxy server status...');
  console.log('📍 Proxy URL:', PROXY_URL);
  console.log('\n' + '='.repeat(50));
  
  // Test 1: Health check del proxy
  try {
    console.log('\n🏥 Testing proxy health...');
    const healthResponse = await axios.get(`${PROXY_URL}/health`, {
      timeout: 5000
    });
    
    console.log('✅ Proxy health check SUCCESS!');
    console.log('📊 Status:', healthResponse.status);
    console.log('📋 Data:', JSON.stringify(healthResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Proxy health check FAILED!');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  // Test 2: Test endpoint /api/auth (senza login)
  try {
    console.log('\n🔐 Testing /api/auth endpoint...');
    const authResponse = await axios.get(`${PROXY_URL}/api/auth/health`, {
      timeout: 5000
    });
    
    console.log('✅ /api/auth endpoint SUCCESS!');
    console.log('📊 Status:', authResponse.status);
    console.log('📋 Data:', JSON.stringify(authResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ /api/auth endpoint response:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Error:', JSON.stringify(error.response.data, null, 2));
      
      // Se riceve 404, significa che il path non è gestito correttamente
      if (error.response.status === 404) {
        console.log('🚨 404 indicates pathRewrite might not be working!');
      }
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  // Test 3: Test diretto al server API
  try {
    console.log('\n🎯 Testing direct API server...');
    const apiResponse = await axios.get('http://localhost:4001/api/auth/health', {
      timeout: 5000
    });
    
    console.log('✅ Direct API server SUCCESS!');
    console.log('📊 Status:', apiResponse.status);
    console.log('📋 Data:', JSON.stringify(apiResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Direct API server FAILED!');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('🔍 Error:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Analysis:');
  console.log('- If proxy health works but /api/auth fails → pathRewrite issue');
  console.log('- If direct API works but proxy fails → proxy configuration issue');
  console.log('- If all fail → servers not running properly');
}

// Run the test
testProxyStatus().catch(console.error);