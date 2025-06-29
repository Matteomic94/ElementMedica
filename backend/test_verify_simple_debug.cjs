const axios = require('axios');

// Configurazione
const API_BASE = 'http://localhost:4001';
const TEST_CREDENTIALS = {
    identifier: 'mario.rossi@acme-corp.com',
    password: 'Password123!'
};

async function testVerifyWithDebug() {
    console.log('🔍 Test Semplice Debug /verify');
    console.log('=====================================\n');
    
    try {
        // Step 1: Login
        console.log('1️⃣ Effettuando login...');
        const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, TEST_CREDENTIALS, {
            timeout: 10000
        });
        
        console.log(`   Status: ${loginResponse.status}`);
        
        // Estrai il token
        const token = loginResponse.data?.accessToken || loginResponse.data?.data?.accessToken;
        if (!token) {
            console.error('❌ Token non trovato nella risposta');
            console.log('Risposta completa:', JSON.stringify(loginResponse.data, null, 2));
            return;
        }
        
        console.log(`✅ Token ottenuto: ${token.substring(0, 20)}...\n`);
        
        // Step 2: Test /verify con timeout breve
        console.log('2️⃣ Testando endpoint /verify...');
        console.log('⏰ Timeout: 10 secondi');
        console.log('📋 Guardando output console per debug middleware\n');
        
        const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        });
        
        console.log('✅ Risposta /verify ricevuta:');
        console.log(`   Status: ${verifyResponse.status}`);
        console.log(`   Data:`, JSON.stringify(verifyResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Errore durante il test:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        } else if (error.code === 'ECONNABORTED') {
            console.error('   Timeout - Il server non ha risposto in tempo');
        } else {
            console.error(`   Errore: ${error.message}`);
        }
    }
}

// Esegui il test
testVerifyWithDebug();