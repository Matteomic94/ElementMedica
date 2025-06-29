import axios from 'axios';

console.log('🔍 Test dettagliato del proxy...');

// Test 1: Endpoint di health check
console.log('\n1. Test health check...');
axios.get('http://localhost:4003/health')
  .then(response => {
    console.log('✅ Health check OK:', response.status);
  })
  .catch(error => {
    console.log('❌ Health check failed:', error.response?.status || error.message);
  })
  .finally(() => {
    // Test 2: Endpoint auth
    console.log('\n2. Test auth endpoint...');
    axios.post('http://localhost:4003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log('✅ Auth OK:', response.status);
        console.log('Data:', response.data);
      })
      .catch(error => {
        console.log('❌ Auth failed:', error.response?.status || error.message);
        if (error.response) {
          console.log('Response data:', error.response.data);
          console.log('Response headers:', error.response.headers);
        }
      });
  });