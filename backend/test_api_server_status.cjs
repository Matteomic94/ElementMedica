/**
 * Test per verificare lo status dell'API Server
 * Verifica se il server è in esecuzione e risponde correttamente
 */

const axios = require('axios');
const net = require('net');

const API_HOST = '127.0.0.1';
const API_PORT = 4001;
const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;

console.log('🔍 Testing API Server Status...');
console.log(`📍 API Server: ${API_BASE_URL}`);

// Test 1: TCP Connection
async function testTCPConnection() {
  console.log('\n1️⃣ Testing TCP Connection...');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      console.log('❌ TCP Connection: TIMEOUT');
      resolve(false);
    }, 3000);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      console.log('✅ TCP Connection: SUCCESS');
      resolve(true);
    });
    
    socket.on('error', (err) => {
      clearTimeout(timeout);
      console.log('❌ TCP Connection: FAILED -', err.message);
      resolve(false);
    });
    
    socket.connect(API_PORT, API_HOST);
  });
}

// Test 2: Health Check
async function testHealthCheck() {
  console.log('\n2️⃣ Testing Health Check...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`, {
      timeout: 5000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log(`✅ Health Check Response: ${response.status}`);
    console.log('📄 Response Data:', response.data);
    return response.status === 200;
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return false;
  }
}

// Test 3: Root Path
async function testRootPath() {
  console.log('\n3️⃣ Testing Root Path...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`✅ Root Path Response: ${response.status}`);
    console.log('📄 Response Data:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Root Path Failed:', error.message);
    return false;
  }
}

// Test 4: API Base Path
async function testAPIBasePath() {
  console.log('\n4️⃣ Testing API Base Path...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`✅ API Base Path Response: ${response.status}`);
    console.log('📄 Response Data:', response.data);
    return true;
  } catch (error) {
    console.log('❌ API Base Path Failed:', error.message);
    return false;
  }
}

// Test 5: Auth V1 Base Path
async function testAuthV1BasePath() {
  console.log('\n5️⃣ Testing Auth V1 Base Path...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/auth`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`✅ Auth V1 Base Response: ${response.status}`);
    console.log('📄 Response Data:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Auth V1 Base Failed:', error.message);
    return false;
  }
}

// Test 6: Login Endpoint (GET)
async function testLoginEndpointGET() {
  console.log('\n6️⃣ Testing Login Endpoint (GET)...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/auth/login`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`✅ Login GET Response: ${response.status}`);
    console.log('📄 Response Data:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Login GET Failed:', error.message);
    return false;
  }
}

// Test 7: Login Endpoint (POST)
async function testLoginEndpointPOST() {
  console.log('\n7️⃣ Testing Login Endpoint (POST)...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    }, {
      timeout: 5000,
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Login POST Response: ${response.status}`);
    console.log('📄 Response Data:', response.data);
    return response.status < 500; // Accept any non-server-error status
  } catch (error) {
    console.log('❌ Login POST Failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 API Server Status Test Suite');
  console.log('================================');
  
  const results = {
    tcpConnection: await testTCPConnection(),
    healthCheck: await testHealthCheck(),
    rootPath: await testRootPath(),
    apiBasePath: await testAPIBasePath(),
    authV1BasePath: await testAuthV1BasePath(),
    loginGET: await testLoginEndpointGET(),
    loginPOST: await testLoginEndpointPOST()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (!results.tcpConnection) {
    console.log('\n🚨 CRITICAL: API Server is not responding on TCP level');
    console.log('   → Check if the server is running');
    console.log('   → Check if the port 4001 is correct');
  } else if (!results.healthCheck && !results.rootPath) {
    console.log('\n🚨 CRITICAL: Server is running but not responding to HTTP requests');
    console.log('   → Check server logs for errors');
    console.log('   → Check if Express app is properly configured');
  } else if (!results.loginPOST) {
    console.log('\n🚨 ISSUE: Login endpoint is not working');
    console.log('   → Check auth routes configuration');
    console.log('   → Check middleware setup');
  }
}

// Run the tests
runTests().catch(console.error);