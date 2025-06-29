/**
 * Test login con formato corretto
 * Usa 'identifier' invece di 'email'
 */

const axios = require('axios');

async function testLoginCorrectFormat() {
    console.log('🧪 Test Login con Formato Corretto');
    console.log('==================================\n');
    
    const API_BASE = 'http://localhost:4001';
    const credentials = {
        identifier: 'mario.rossi@acme-corp.com',  // Usa 'identifier' invece di 'email'
        password: 'Password123!'
    };
    
    try {
        console.log('1️⃣ Test login con formato corretto...');
        console.log(`   📧 Identifier: ${credentials.identifier}`);
        console.log(`   🔑 Password: ${credentials.password}`);
        
        const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, credentials, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`   ✅ Login Status: ${loginResponse.status}`);
        console.log(`   ✅ Login Success!`);
        
        if (loginResponse.data.data && loginResponse.data.data.accessToken) {
            const token = loginResponse.data.data.accessToken;
            console.log(`   ✅ Access Token ricevuto (lunghezza: ${token.length})`);
            console.log(`   ✅ User Data:`, JSON.stringify(loginResponse.data.data.user, null, 2));
            
            // Test 2: Verifica token con /verify
            console.log('\n2️⃣ Test /verify con token ottenuto...');
            try {
                const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 15000
                });
                
                console.log(`   ✅ Verify Status: ${verifyResponse.status}`);
                console.log(`   ✅ Verify Success!`);
                console.log(`   ✅ Verify Data:`, JSON.stringify(verifyResponse.data, null, 2));
                
                console.log('\n🎯 CONCLUSIONE: Login e Verify funzionano perfettamente!');
                console.log('🎯 Il problema del timeout del middleware è RISOLTO!');
                
                return { success: true, token, userData: verifyResponse.data };
                
            } catch (verifyError) {
                console.log(`   ❌ Verify Error: ${verifyError.message}`);
                
                if (verifyError.response) {
                    console.log(`   ❌ Verify Status: ${verifyError.response.status}`);
                    console.log(`   ❌ Verify Response:`, JSON.stringify(verifyError.response.data, null, 2));
                } else if (verifyError.code === 'ECONNABORTED') {
                    console.log('   ❌ Verify TIMEOUT - Il middleware si blocca ancora!');
                    console.log('\n🎯 CONCLUSIONE: Login funziona ma Verify ha ancora problemi!');
                } else {
                    console.log(`   ❌ Verify Network Error: ${verifyError.code}`);
                }
                
                return { success: false, loginWorking: true, verifyWorking: false };
            }
            
        } else {
            console.log(`   ❌ Struttura risposta inaspettata`);
            console.log(`   ❌ Response data:`, JSON.stringify(loginResponse.data, null, 2));
            return { success: false, loginWorking: false };
        }
        
    } catch (loginError) {
        console.log(`   ❌ Login Error: ${loginError.message}`);
        
        if (loginError.response) {
            console.log(`   ❌ Login Status: ${loginError.response.status}`);
            console.log(`   ❌ Login Response:`, JSON.stringify(loginError.response.data, null, 2));
        } else if (loginError.code === 'ECONNABORTED') {
            console.log('   ❌ Login TIMEOUT');
        } else if (loginError.code === 'ECONNREFUSED') {
            console.log('   ❌ Server non raggiungibile');
        }
        
        return { success: false, loginWorking: false };
    }
}

// Esegui il test
testLoginCorrectFormat()
    .then(result => {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RISULTATO FINALE:');
        console.log('='.repeat(60));
        
        if (result.success) {
            console.log('✅ TUTTO FUNZIONA CORRETTAMENTE!');
            console.log('✅ Login: OK');
            console.log('✅ Verify: OK');
            console.log('✅ Middleware authenticate: OK');
        } else if (result.loginWorking && !result.verifyWorking) {
            console.log('⚠️ LOGIN FUNZIONA, VERIFY HA PROBLEMI');
            console.log('✅ Login: OK');
            console.log('❌ Verify: TIMEOUT');
            console.log('❌ Middleware authenticate: PROBLEMI');
        } else {
            console.log('❌ PROBLEMI CON IL LOGIN');
            console.log('❌ Login: ERRORE');
        }
    })
    .catch(console.error);