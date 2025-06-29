import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('🔍 Testing login via Vite proxy (localhost:5173)...');
    
    const response = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
      console.log('✅ Login successful!');
      try {
        const data = JSON.parse(responseText);
        console.log('📊 Parsed Response:', data);
      } catch (e) {
        console.log('⚠️ Response is not valid JSON');
      }
    } else {
      console.log('❌ Login failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('💥 Error during login test:', error.message);
    console.error('💥 Full error:', error);
  }
}

testLogin();