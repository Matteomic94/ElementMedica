import axios from 'axios';

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:4003/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    console.log('Full error:', error.code, error.errno);
    if (error.response) {
      console.log('Response headers:', error.response.headers);
    }
  }
}

testLogin();