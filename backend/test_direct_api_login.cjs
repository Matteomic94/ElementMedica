const axios = require('axios');
require('dotenv').config();

async function testDirectApiLogin() {
    console.log('🔐 TEST DIRETTO API SERVER (4001)');
    console.log('==================================');
    
    try {
        console.log('\n📝 STEP 1: Login diretto su API server');
        
        const loginData = {
            identifier: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        };
        
        console.log('🌐 Chiamata diretta a: http://localhost:4001/api/v1/auth/login');
        
        const response = await axios.post('http://localhost:4001/api/v1/auth/login', loginData, {
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
            
            // Test immediato del verify
            console.log('\n📝 STEP 2: Test verify con token appena ottenuto');
            console.log('🌐 Chiamata a: http://localhost:4001/api/v1/auth/verify');
            
            const verifyResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
                timeout: 25000, // 25 secondi per vedere se va in timeout
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Verify response status:', verifyResponse.status);
            console.log('✅ Verify response data:', JSON.stringify(verifyResponse.data, null, 2));
            
            return accessToken;
        } else {
            console.log('❌ Struttura response non valida');
            console.log('Response data:', response.data);
        }
        
    } catch (error) {
        console.error('❌ ERRORE:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ TIMEOUT - La richiesta ha superato il limite di tempo');
        }
    }
}

testDirectApiLogin();