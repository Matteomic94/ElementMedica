import axios from 'axios';

async function testLogin() {
  try {
    console.log('🔄 Testing login via proxy server...');
    
    const response = await axios.post('http://127.0.0.1:4003/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Login successful!');
    console.log('📊 Status:', response.status);
    console.log('📊 Data:', response.data);
    
  } catch (error) {
    console.log('❌ Login failed!');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📊 Data:', error.response.data);
    } else if (error.request) {
      console.log('📊 No response received:', error.message);
    } else {
      console.log('📊 Error:', error.message);
    }
  }
}

testLogin();