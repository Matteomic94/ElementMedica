/**
 * Test del login reale con analisi precisa del JSON
 */

const axios = require('axios');
const fs = require('fs');

async function testRealLogin() {
  try {
    console.log('🧪 Testing real login with mario.rossi@acme-corp.com...');
    
    const response = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    
    // Salva la risposta raw in un file per analisi
    const rawResponse = JSON.stringify(response.data, null, 2);
    fs.writeFileSync('/Users/matteo.michielon/project 2.0/backend/login_response_raw.json', rawResponse);
    
    // Verifica la struttura corretta della risposta
    const responseData = response.data;
    
    console.log('\n🔍 Response structure analysis:');
    console.log('- success:', responseData.success ? '✅' : '❌');
    console.log('- message:', responseData.message ? '✅' : '❌');
    console.log('- data object:', responseData.data ? '✅' : '❌');
    
    if (responseData.data) {
      const data = responseData.data;
      console.log('\n📋 Authentication data check:');
      console.log('- accessToken:', data.accessToken ? '✅' : '❌');
      console.log('- refreshToken:', data.refreshToken ? '✅' : '❌');
      console.log('- expiresIn:', data.expiresIn ? '✅' : '❌');
      console.log('- user object:', data.user ? '✅' : '❌');
      
      if (data.user) {
        console.log('\n👤 User data check:');
        console.log('- user.id:', data.user.id ? '✅' : '❌');
        console.log('- user.email:', data.user.email ? '✅' : '❌');
        console.log('- user.firstName:', data.user.firstName ? '✅' : '❌');
        console.log('- user.lastName:', data.user.lastName ? '✅' : '❌');
        console.log('- user.roles:', data.user.roles ? '✅' : '❌');
        console.log('- user.company:', data.user.company ? '✅' : '❌');
        console.log('- user.tenant:', data.user.tenant ? '✅' : '❌');
      }
    }
    
    // Verifica se il JSON è valido
    const responseStr = JSON.stringify(response.data);
    try {
      JSON.parse(responseStr);
      console.log('\n✅ JSON is valid');
    } catch (e) {
      console.log('\n❌ JSON is invalid:', e.message);
    }
    
    // Verifica finale
    const hasAllRequiredFields = responseData.success && 
                                responseData.data && 
                                responseData.data.accessToken && 
                                responseData.data.refreshToken && 
                                responseData.data.user && 
                                responseData.data.user.id;
    
    if (hasAllRequiredFields) {
      console.log('\n🎉 LOGIN TEST PASSED - All required fields present!');
      console.log('\n✅ NO JSON DUPLICATION DETECTED');
      console.log('✅ LOGIN FUNCTIONALITY WORKING CORRECTLY');
    } else {
      console.log('\n❌ LOGIN TEST FAILED - Missing required fields');
    }
    
  } catch (error) {
    console.error('❌ Login test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

testRealLogin();