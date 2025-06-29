const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Test Login Diretto');
    console.log('====================');
    
    const response = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', response.status);
    console.log('📊 Response Headers:', response.headers);
    console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.accessToken) {
      console.log('🎫 Token ricevuto:', response.data.data.accessToken.substring(0, 50) + '...');
      return response.data.data.accessToken;
    } else {
      console.log('❌ Nessun token nella risposta');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Errore durante il login:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

testLogin();