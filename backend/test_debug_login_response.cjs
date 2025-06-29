const axios = require('axios');

async function debugLoginResponse() {
    console.log('🔍 DEBUG LOGIN RESPONSE');
    console.log('========================');
    
    try {
        const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
            identifier: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('📋 Status:', loginResponse.status);
        console.log('📋 Headers:', JSON.stringify(loginResponse.headers, null, 2));
        console.log('📋 Data Structure:', JSON.stringify(loginResponse.data, null, 2));
        console.log('📋 Has token?', !!loginResponse.data.token);
        console.log('📋 Has accessToken?', !!loginResponse.data.accessToken);
        console.log('📋 Data keys:', Object.keys(loginResponse.data));
        
        if (loginResponse.data.token) {
            console.log('✅ Token trovato:', loginResponse.data.token.substring(0, 20) + '...');
        } else if (loginResponse.data.accessToken) {
            console.log('✅ AccessToken trovato:', loginResponse.data.accessToken.substring(0, 20) + '...');
        } else {
            console.log('❌ Nessun token trovato nella risposta');
        }
        
    } catch (error) {
        console.log('❌ Errore:', error.message);
        if (error.response) {
            console.log('📋 Status:', error.response.status);
            console.log('📋 Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

debugLoginResponse();