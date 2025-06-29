const axios = require('axios');
require('dotenv').config();

async function getValidToken() {
    console.log('🔐 OTTENIMENTO TOKEN VALIDO');
    console.log('============================');
    
    try {
        console.log('\n📝 STEP 1: Login con credenziali mario.rossi@acme-corp.com');
        
        const loginData = {
            email: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        };
        
        console.log('🌐 Chiamata a: http://localhost:4003/api/v1/auth/login');
        
        const response = await axios.post('http://localhost:4003/api/v1/auth/login', loginData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login response status:', response.status);
        console.log('✅ Login response data:', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.data && response.data.data.accessToken) {
            const accessToken = response.data.data.accessToken;
            console.log('\n🎯 TOKEN OTTENUTO:');
            console.log('==================');
            console.log('Token length:', accessToken.length);
            console.log('Token preview:', accessToken.substring(0, 50) + '...');
            
            // Salva il token in un file per il test successivo
            const fs = require('fs');
            fs.writeFileSync('./valid_token.txt', accessToken);
            console.log('\n💾 Token salvato in valid_token.txt');
            
            return accessToken;
        } else {
            console.log('❌ Struttura response non valida');
            console.log('Response data:', response.data);
        }
        
    } catch (error) {
        console.error('❌ ERRORE LOGIN:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

getValidToken();