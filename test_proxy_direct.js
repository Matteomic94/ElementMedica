import fetch from 'node-fetch';

async function testProxyDirect() {
  try {
    console.log('🔍 Testing direct proxy server on port 4003...');
    
    const response = await fetch('http://localhost:4003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Admin123!'
      })
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('📊 Response Body:', responseText);
    
    if (response.ok) {
      console.log('✅ Direct proxy test successful!');
    } else {
      console.log('❌ Direct proxy test failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing direct proxy:', error.message);
  }
}

testProxyDirect();