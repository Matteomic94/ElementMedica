const axios = require('axios');

async function testDebugRoute() {
  console.log('🔍 Test route di debug...');
  
  try {
    const response = await axios.get('http://127.0.0.1:4001/api/v1/auth/test-debug', {
      timeout: 5000
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📋 Data:`, response.data);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
  }
}

testDebugRoute();