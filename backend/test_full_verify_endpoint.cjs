const axios = require('axios');
const fs = require('fs');

// Test completo dell'endpoint /api/v1/auth/verify
async function testFullVerifyEndpoint() {
    console.log('🔍 TEST COMPLETO ENDPOINT /api/v1/auth/verify');
    console.log('=' .repeat(60));
    
    let startTime;
    
    try {
        // Leggi il token valido
        const token = fs.readFileSync('valid_token.txt', 'utf8').trim();
        console.log('✅ Token letto dal file');
        
        console.log('\n📡 Chiamata a /api/v1/auth/verify...');
        startTime = Date.now();
        
        // Test con timeout più lungo per vedere se si risolve
        const response = await axios.get('http://localhost:4001/api/v1/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 60 secondi
        });
        
        const duration = Date.now() - startTime;
        
        console.log(`\n✅ SUCCESSO dopo ${duration}ms`);
        console.log('📊 Status:', response.status);
        console.log('📊 Headers:', JSON.stringify(response.headers, null, 2));
        console.log('📊 Data:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        console.log(`\n❌ ERRORE dopo ${duration}ms`);
        
        if (error.code === 'ECONNABORTED') {
            console.log('🚨 TIMEOUT - La richiesta ha superato il limite di tempo');
        } else if (error.response) {
            console.log('📊 Status:', error.response.status);
            console.log('📊 Headers:', JSON.stringify(error.response.headers, null, 2));
            console.log('📊 Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('📊 Error message:', error.message);
            console.log('📊 Error code:', error.code);
        }
    }
}

// Test anche tramite proxy
async function testViaProxy() {
    console.log('\n\n🔍 TEST TRAMITE PROXY (porta 4003)');
    console.log('=' .repeat(60));
    
    let startTime;
    
    try {
        const token = fs.readFileSync('valid_token.txt', 'utf8').trim();
        console.log('✅ Token letto dal file');
        
        console.log('\n📡 Chiamata tramite proxy a /api/v1/auth/verify...');
        startTime = Date.now();
        
        const response = await axios.get('http://localhost:4003/api/v1/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });
        
        const duration = Date.now() - startTime;
        
        console.log(`\n✅ SUCCESSO tramite proxy dopo ${duration}ms`);
        console.log('📊 Status:', response.status);
        console.log('📊 Data:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        console.log(`\n❌ ERRORE tramite proxy dopo ${duration}ms`);
        
        if (error.code === 'ECONNABORTED') {
            console.log('🚨 TIMEOUT - La richiesta ha superato il limite di tempo');
        } else if (error.response) {
            console.log('📊 Status:', error.response.status);
            console.log('📊 Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('📊 Error message:', error.message);
            console.log('📊 Error code:', error.code);
        }
    }
}

async function main() {
    await testFullVerifyEndpoint();
    await testViaProxy();
}

main().catch(console.error);