const axios = require('axios');

// Test per debuggare la struttura della risposta del login
async function debugLoginResponse() {
    console.log('🔍 DEBUG - STRUTTURA RISPOSTA LOGIN');
    console.log('========================================');
    
    const apiURL = 'http://localhost:4001';
    const credentials = {
        identifier: 'mario.rossi@acme-corp.com',
        password: 'Password123!'
    };
    
    try {
        console.log('📝 Tentativo login API server...');
        const response = await axios.post(`${apiURL}/api/v1/auth/login`, credentials, {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login successful!');
        console.log(`📋 Status: ${response.status}`);
        console.log('\n🔍 STRUTTURA COMPLETA RISPOSTA:');
        console.log('========================================');
        console.log(JSON.stringify(response.data, null, 2));
        
        console.log('\n🔍 CHIAVI DISPONIBILI:');
        console.log('========================================');
        console.log('Keys in response.data:', Object.keys(response.data));
        
        // Verifica presenza token
        if (response.data.accessToken) {
            console.log('✅ accessToken trovato');
            console.log(`🎫 Token: ${response.data.accessToken.substring(0, 50)}...`);
        } else if (response.data.access_token) {
            console.log('✅ access_token trovato');
            console.log(`🎫 Token: ${response.data.access_token.substring(0, 50)}...`);
        } else if (response.data.token) {
            console.log('✅ token trovato');
            console.log(`🎫 Token: ${response.data.token.substring(0, 50)}...`);
        } else {
            console.log('❌ Nessun token trovato nella risposta');
            console.log('🔍 Possibili campi token:', Object.keys(response.data).filter(key => 
                key.toLowerCase().includes('token') || key.toLowerCase().includes('access')
            ));
        }
        
        return { success: true, data: response.data };
        
    } catch (error) {
        console.log('❌ ERROR occurred:');
        if (error.response) {
            console.log(`📋 Status: ${error.response.status}`);
            console.log(`💬 Message: ${error.response.data?.message || error.response.data?.error}`);
            console.log(`🔍 Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(`💬 Error: ${error.message}`);
        }
        
        return { success: false, error: error.message };
    }
}

debugLoginResponse().then(result => {
    if (result.success) {
        console.log('\n✅ DEBUG COMPLETATO - Struttura risposta identificata');
    } else {
        console.log('\n❌ DEBUG FALLITO');
    }
}).catch(console.error);