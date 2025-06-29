import axios from 'axios';

console.log('Testing auth endpoint directly...');

axios.post('http://localhost:4003/api/auth/login', {
  email: 'admin@example.com',
  password: 'admin123'
}, {
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => {
    console.log('✅ Success:', response.status);
    console.log('Data:', response.data);
  })
  .catch(error => {
    console.log('❌ Failed:');
    console.log('Status:', error.response?.status || 'No response');
    console.log('Data:', error.response?.data || error.message);
  });