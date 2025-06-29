const axios = require('axios');

// Test diretto endpoint verify per debug timeout
async function testVerifyTimeout() {
    console.log('🔍 ATTEMPT 106 - TEST VERIFY TIMEOUT DEBUG');
    console.log('=' .repeat(60));
    
    try {
        // Step 1: Login per ottenere token valido
        console.log('\n📝 STEP 1: Login per ottenere token valido');
        const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
            identifier: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login Status:', loginResponse.status);
        console.log('✅ Login Success:', loginResponse.data.success);
        
        const accessToken = loginResponse.data.data.accessToken;
        console.log('✅ AccessToken Length:', accessToken.length);
        console.log('✅ AccessToken Preview:', accessToken.substring(0, 50) + '...');
        
        // Step 2: Test verify con timeout progressivi
        console.log('\n📝 STEP 2: Test verify con timeout progressivi');
        
        const timeouts = [5000, 10000, 15000, 20000, 30000];
        
        for (const timeout of timeouts) {
            console.log(`\n🔍 Testing verify con timeout: ${timeout}ms`);
            const startTime = Date.now();
            
            try {
                const verifyResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
                    timeout: timeout,
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const duration = Date.now() - startTime;
                console.log(`✅ Verify SUCCESS in ${duration}ms`);
                console.log('✅ Verify Status:', verifyResponse.status);
                console.log('✅ Verify Data:', JSON.stringify(verifyResponse.data, null, 2));
                break; // Se funziona, esci dal loop
                
            } catch (error) {
                const duration = Date.now() - startTime;
                
                if (error.code === 'ECONNABORTED') {
                    console.log(`❌ TIMEOUT dopo ${duration}ms (limite: ${timeout}ms)`);
                    console.log('⚠️  Continuando con timeout maggiore...');
                } else {
                    console.log(`❌ ERRORE DIVERSO DA TIMEOUT dopo ${duration}ms:`);
                    console.log('❌ Error Code:', error.code);
                    console.log('❌ Error Message:', error.message);
                    if (error.response) {
                        console.log('❌ Response Status:', error.response.status);
                        console.log('❌ Response Data:', error.response.data);
                    }
                    break; // Se è un errore diverso da timeout, esci
                }
            }
        }
        
        // Step 3: Test verify con curl per confronto
        console.log('\n📝 STEP 3: Informazioni per test manuale con curl');
        console.log('Comando curl per test manuale:');
        console.log(`curl -X GET "http://localhost:4001/api/v1/auth/verify" \\`);
        console.log(`  -H "Authorization: Bearer ${accessToken}" \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -w "Time: %{time_total}s\\n" \\`);
        console.log(`  -v`);
        
    } catch (error) {
        console.log('❌ ERRORE DURANTE LOGIN:');
        console.log('❌ Error Code:', error.code);
        console.log('❌ Error Message:', error.message);
        if (error.response) {
            console.log('❌ Response Status:', error.response.status);
            console.log('❌ Response Data:', error.response.data);
        }
    }
}

// Esegui il test
testVerifyTimeout().catch(console.error);