const axios = require('axios');

// Test diretto dell'endpoint di login senza middleware
async function testDirectLogin() {
  try {
    console.log('Testing direct login endpoint...');
    
    const response = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Controlla se ci sono duplicazioni
    const data = response.data;
    const keys = Object.keys(data);
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    
    if (duplicates.length > 0) {
      console.log('\n❌ DUPLICATED KEYS FOUND:', duplicates);
    } else {
      console.log('\n✅ NO DUPLICATED KEYS FOUND');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDirectLogin();