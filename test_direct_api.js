import axios from 'axios';

console.log('Testing direct API server with POST method...');

axios.post('http://localhost:4001/api/login', {
  email: 'test@example.com',
  password: 'testpassword'
})
  .then(response => {
    console.log('✅ Success:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  })
  .catch(error => {
    console.log('❌ Failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  });