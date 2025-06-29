const axios = require('axios');

// Test diretto dell'endpoint /verify senza middleware
async function testDirectRoute() {
    console.log('🔍 Test Diretto Route /verify');
    console.log('===============================\n');
    
    try {
        // Test 1: Chiamata diretta senza token (dovrebbe fallire con 401)
        console.log('1️⃣ Test senza token (dovrebbe essere 401)...');
        try {
            const response = await axios.get('http://localhost:4001/api/v1/auth/verify', {
                timeout: 5000
            });
            console.log(`   ❌ Inaspettato: Status ${response.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ Atteso: Status ${error.response.status} - ${error.response.data?.error || 'No error message'}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ Timeout - Il server non risponde');
            } else {
                console.log(`   ❌ Errore: ${error.message}`);
            }
        }
        
        console.log('');
        
        // Test 2: Chiamata con token invalido (dovrebbe fallire con 401)
        console.log('2️⃣ Test con token invalido (dovrebbe essere 401)...');
        try {
            const response = await axios.get('http://localhost:4001/api/v1/auth/verify', {
                headers: {
                    'Authorization': 'Bearer invalid-token-123'
                },
                timeout: 5000
            });
            console.log(`   ❌ Inaspettato: Status ${response.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ Atteso: Status ${error.response.status} - ${error.response.data?.error || 'No error message'}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ Timeout - Il server non risponde');
            } else {
                console.log(`   ❌ Errore: ${error.message}`);
            }
        }
        
        console.log('');
        
        // Test 3: Verifica che il route esista testando altri endpoint
        console.log('3️⃣ Test endpoint /health per confronto...');
        try {
            const healthResponse = await axios.get('http://localhost:4001/health', {
                timeout: 5000
            });
            console.log(`   ✅ Health endpoint: Status ${healthResponse.status}`);
        } catch (error) {
            console.log(`   ❌ Health endpoint fallito: ${error.message}`);
        }
        
        console.log('');
        
        // Test 4: Test endpoint login per confronto
        console.log('4️⃣ Test endpoint /login per confronto...');
        try {
            const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
                identifier: 'test@invalid.com',
                password: 'invalid'
            }, {
                timeout: 5000
            });
            console.log(`   Status: ${loginResponse.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ Login endpoint risponde: Status ${error.response.status}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ Login timeout - Problema generale del server');
            } else {
                console.log(`   ❌ Login errore: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Errore generale:', error.message);
    }
}

// Esegui il test
testDirectRoute();