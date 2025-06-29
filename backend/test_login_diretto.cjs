const axios = require('axios');

console.log('🔍 TEST LOGIN DIRETTO');
console.log('====================\n');

const API_BASE = 'http://localhost:4001';
const TEST_USER = {
  email: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

async function testLoginDirect() {
  try {
    console.log('📋 Tentativo login con identifier...');
    const response = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: TEST_USER.email,
      password: TEST_USER.password
    }, { 
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accetta anche errori 4xx per debug
      }
    });
    
    console.log(`📋 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.accessToken) {
      console.log('✅ Login riuscito!');
      console.log(`📋 Token ricevuto: ${response.data.accessToken.substring(0, 20)}...`);
      return response.data.accessToken;
    } else {
      console.log('❌ Login fallito');
      return null;
    }
    
  } catch (error) {
    console.log(`❌ Errore durante login: ${error.message}`);
    if (error.response) {
      console.log(`📋 Status: ${error.response.status}`);
      console.log(`📋 Data:`, JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Test alternativo con email
async function testLoginWithEmail() {
  try {
    console.log('\n📋 Tentativo login con email (vecchio formato)...');
    const response = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    }, { 
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    console.log(`📋 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log(`❌ Errore con email: ${error.message}`);
    if (error.response) {
      console.log(`📋 Status: ${error.response.status}`);
      console.log(`📋 Data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function runTests() {
  // Test con identifier
  const token = await testLoginDirect();
  
  // Test con email
  await testLoginWithEmail();
  
  if (token) {
    console.log('\n🎯 PROSSIMO PASSO: Test courses endpoint...');
    try {
      const coursesResponse = await axios.get(`${API_BASE}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      console.log(`📋 Courses Status: ${coursesResponse.status}`);
      if (coursesResponse.status === 200) {
        console.log('✅ Courses endpoint funziona!');
        console.log(`📋 Numero corsi: ${coursesResponse.data.length}`);
      } else {
        console.log('❌ Courses endpoint errore');
        console.log(`📋 Response:`, JSON.stringify(coursesResponse.data, null, 2));
      }
    } catch (coursesError) {
      console.log(`❌ Errore courses: ${coursesError.message}`);
      if (coursesError.response) {
        console.log(`📋 Status: ${coursesError.response.status}`);
        console.log(`📋 Data:`, JSON.stringify(coursesError.response.data, null, 2));
      }
    }
  }
}

runTests();