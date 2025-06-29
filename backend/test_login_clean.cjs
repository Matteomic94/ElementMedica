/**
 * Test pulito per verificare il login dopo la pulizia dei file duplicati
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:4001';

const testData = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

async function testLogin() {
  try {
    console.log('🧪 Testing login after cleanup...');
    console.log('📧 Using credentials:', testData.identifier);
    
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, testData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'test-login-clean/1.0'
      },
      timeout: 10000
    });

    console.log('✅ Login successful!');
    console.log('📊 Status:', response.status);
    console.log('📄 Response headers:', response.headers);
    
    const responseText = JSON.stringify(response.data, null, 2);
    console.log('📋 Response body:');
    console.log(responseText);
    
    // Check for JSON duplication
    const responseStr = JSON.stringify(response.data);
    const accessTokenMatches = (responseStr.match(/"accessToken"/g) || []).length;
    const refreshTokenMatches = (responseStr.match(/"refreshToken"/g) || []).length;
    const userMatches = (responseStr.match(/"user"/g) || []).length;
    
    console.log('\n🔍 Duplication check:');
    console.log(`- accessToken appears: ${accessTokenMatches} times`);
    console.log(`- refreshToken appears: ${refreshTokenMatches} times`);
    console.log(`- user appears: ${userMatches} times`);
    
    if (accessTokenMatches > 1 || refreshTokenMatches > 1 || userMatches > 1) {
      console.log('❌ JSON DUPLICATION DETECTED!');
    } else {
      console.log('✅ No JSON duplication found');
    }
    
    // Verify token structure
    if (response.data.accessToken && response.data.refreshToken && response.data.user) {
      console.log('✅ All required fields present');
    } else {
      console.log('❌ Missing required fields');
    }
    
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();