/**
 * Test diretto dell'endpoint /api/v1/auth/verify
 * Bypassa il proxy e testa direttamente l'API server
 */

const axios = require('axios');

async function testDirectVerify() {
    console.log('🎯 TEST DIRETTO ENDPOINT VERIFY');
    console.log('================================');
    console.log('');
    
    try {
        // Step 1: Login per ottenere token
        console.log('📋 Step 1: Login diretto su API server (porta 4001)');
        const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
            email: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        }, {
            timeout: 10000
        });
        
        console.log('   ✅ Login riuscito!');
        const token = loginResponse.data.accessToken;
        console.log(`   🔑 Token ottenuto: ${token.substring(0, 50)}...`);
        
        // Step 2: Test verify diretto
        console.log('\n📋 Step 2: Test verify diretto su API server');
        console.log('   ⏰ Timeout impostato a 10 secondi');
        
        const startTime = Date.now();
        const verifyResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        });
        const endTime = Date.now();
        
        console.log(`   ✅ VERIFY RIUSCITO in ${endTime - startTime}ms!`);
        console.log(`   👤 User verificato: ${verifyResponse.data.user.email}`);
        console.log('');
        console.log('🎉 SUCCESSO: Il middleware authenticate funziona correttamente!');
        console.log('   Il problema potrebbe essere nella comunicazione proxy → API');
        
    } catch (error) {
        const endTime = Date.now();
        
        if (error.code === 'ECONNABORTED') {
            console.log(`   ❌ TIMEOUT dopo ${endTime - startTime || 'N/A'}ms`);
            console.log('   🔍 Il middleware authenticate si blocca anche nel test diretto!');
            console.log('   📋 PROBLEMA CONFERMATO: Il bug è nel middleware authenticate');
        } else if (error.response) {
            console.log(`   ❌ Errore HTTP: ${error.response.status}`);
            console.log(`   📄 Messaggio: ${error.response.data?.error || error.response.statusText}`);
        } else {
            console.log(`   ❌ Errore di connessione: ${error.message}`);
            console.log('   🔍 Verificare che il server API sia in esecuzione su porta 4001');
        }
    }
}

console.log('🚀 Avvio test diretto verify endpoint...');
console.log('📋 OBIETTIVO: Verificare se il problema è nel middleware o nella comunicazione');
console.log('');

testDirectVerify().catch(console.error);