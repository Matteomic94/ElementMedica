import fetch from 'node-fetch';

async function testWithDebugLogs() {
  console.log('🔍 Testing login with debug logs after server restart...');
  console.log('📋 This test will help identify which middleware is called and how the path is modified.');
  console.log('');
  
  try {
    console.log('🚀 Sending POST request to http://localhost:4003/api/auth/login');
    console.log('📊 Expected to see debug logs in proxy server console:');
    console.log('   - 🔍 [PATH TRACE] Original: {...}');
    console.log('   - 🔍 [PATH TRACE] Before /api/auth middleware: {...}');
    console.log('   - 🔍 [PATH TRACE] Before generic /api middleware: {...}');
    console.log('');
    
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
    
    const responseText = await response.text();
    console.log('📊 Response Body:', responseText);
    
    if (response.ok) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed with status:', response.status);
      console.log('🔍 Check the proxy server console for debug logs to see:');
      console.log('   1. Which middleware is being called');
      console.log('   2. How the path is being modified');
      console.log('   3. Why the path becomes "/" instead of "/api/auth/login"');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
  
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Check the proxy server console for debug logs');
  console.log('2. Look for the 🔍 [PATH TRACE] messages');
  console.log('3. Identify which middleware is called and how path changes');
  console.log('4. Update the planning document with findings');
}

testWithDebugLogs();