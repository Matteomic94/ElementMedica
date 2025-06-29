#!/usr/bin/env node

/**
 * Test per debug endpoint /api/v1/auth/verify
 * Obiettivo: Identificare dove si blocca il middleware authenticate
 */

const axios = require('axios');

console.log('🎯 TENTATIVO 70 - DEBUG ENDPOINT VERIFY');
console.log('==========================================');

async function testVerifyEndpoint() {
    try {
        console.log('\n📋 Step 1: Test login per ottenere token fresco');
        
        const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
            identifier: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        }, {
            timeout: 10000
        });
        
        if (loginResponse.data.success) {
            console.log('   ✅ Login riuscito!');
            const token = loginResponse.data.data.accessToken;
            console.log(`   🔑 Token ottenuto: ${token.substring(0, 50)}...`);
            
            console.log('\n📋 Step 2: Test endpoint verify con token fresco');
            console.log('   ⏰ Timeout impostato a 5 secondi per test rapido');
            console.log('   📊 Monitorare i log del server API per vedere dove si blocca il middleware');
            
            const startTime = Date.now();
            
            try {
                const verifyResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 5000
                });
                
                const endTime = Date.now();
                console.log(`   ✅ Verify riuscito in ${endTime - startTime}ms!`);
                console.log(`   📊 Response: ${JSON.stringify(verifyResponse.data, null, 2)}`);
                
            } catch (verifyError) {
                const endTime = Date.now();
                
                if (verifyError.code === 'ECONNABORTED') {
                    console.log(`   ❌ TIMEOUT dopo ${endTime - startTime}ms`);
                    console.log('   🔍 Il middleware authenticate si è bloccato!');
                    console.log('   📋 AZIONI RICHIESTE:');
                    console.log('      1. Controllare i log del server API');
                    console.log('      2. Identificare l\'ultimo log del middleware prima del blocco');
                    console.log('      3. Analizzare la query/operazione che causa il timeout');
                } else {
                    console.log(`   ❌ Errore verify: ${verifyError.message}`);
                    if (verifyError.response) {
                        console.log(`   📊 Status: ${verifyError.response.status}`);
                        console.log(`   📊 Data: ${JSON.stringify(verifyError.response.data, null, 2)}`);
                    }
                }
            }
            
        } else {
            console.log('   ❌ Login fallito!');
            console.log(`   📊 Response: ${JSON.stringify(loginResponse.data, null, 2)}`);
        }
        
    } catch (loginError) {
        console.log(`   ❌ Errore login: ${loginError.message}`);
        if (loginError.response) {
            console.log(`   📊 Status: ${loginError.response.status}`);
            console.log(`   📊 Data: ${JSON.stringify(loginError.response.data, null, 2)}`);
        }
    }
}

console.log('\n🚀 Avvio test verify endpoint...');
console.log('📋 ISTRUZIONI:');
console.log('   1. Assicurarsi che il server API sia in esecuzione su porta 4001');
console.log('   2. Monitorare i log del server API durante il test');
console.log('   3. Identificare l\'ultimo log del middleware prima del timeout');
console.log('');

testVerifyEndpoint().catch(console.error);