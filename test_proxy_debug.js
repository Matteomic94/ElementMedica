import axios from 'axios';

const testProxyDebug = async () => {
  try {
    console.log('🔍 Testing proxy with debug logging...');
    console.log('Sending request to: http://localhost:4003/api/auth/login');
    
    const response = await axios.post('http://localhost:4003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.error('❌ Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    if (error.code) {
      console.error('Code:', error.code);
    }
  }
};

console.log('Starting proxy debug test...');
testProxyDebug();