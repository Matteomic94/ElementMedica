const axios = require('axios');

console.log('🔍 TESTING PROXY DEBUG');
console.log('====================');

async function testProxyAuth() {
  try {
    console.log('\n📝 Testing /api/v1/auth/login via proxy...');
    const response = await axios.post('http://localhost:4003/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ PROXY SUCCESS:', response.status);
    console.log('User:', response.data.user?.email);
    
  } catch (error) {
    console.log('❌ PROXY ERROR:', error.response?.status || 'NO_RESPONSE');
    console.log('Error data:', error.response?.data || error.message);
    console.log('Request URL:', error.config?.url);
    console.log('Request method:', error.config?.method);
  }
}

async function testDirectAPI() {
  try {
    console.log('\n📝 Testing /api/v1/auth/login direct API...');
    const response = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ DIRECT API SUCCESS:', response.status);
    console.log('User:', response.data.user?.email);
    
  } catch (error) {
    console.log('❌ DIRECT API ERROR:', error.response?.status || 'NO_RESPONSE');
    console.log('Error data:', error.response?.data || error.message);
  }
}

async function main() {
  await testDirectAPI();
  await testProxyAuth();
}

main().catch(console.error);