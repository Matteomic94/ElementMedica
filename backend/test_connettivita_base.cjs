const axios = require('axios');

async function testConnettivitaBase() {
    console.log('🔄 TEST CONNETTIVITÀ BASE');
    console.log('========================');
    
    try {
        // Test 1: Health check API server
        console.log('\n1. 🌐 Test connettività API server (porta 4001)...');
        const healthResponse = await axios.get('http://localhost:4001/health', {
            timeout: 5000
        });
        console.log('✅ API Server attivo:', healthResponse.status);
        
        // Test 2: Health check Proxy server
        console.log('\n2. 🌐 Test connettività Proxy server (porta 4003)...');
        const proxyHealthResponse = await axios.get('http://localhost:4003/health', {
            timeout: 5000
        });
        console.log('✅ Proxy Server attivo:', proxyHealthResponse.status);
        
        // Test 3: Test endpoint login diretto
        console.log('\n3. 🔐 Test endpoint login diretto...');
        const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
            identifier: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (loginResponse.status === 200 && loginResponse.data.token) {
            console.log('✅ Login diretto riuscito!');
            console.log('📋 Token ricevuto:', loginResponse.data.token.substring(0, 20) + '...');
            
            // Test 4: Test endpoint courses con token
            console.log('\n4. 📚 Test endpoint courses...');
            const coursesResponse = await axios.get('http://localhost:4001/api/v1/courses', {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            console.log('✅ Endpoint courses funzionante:', coursesResponse.status);
            console.log('📊 Corsi trovati:', coursesResponse.data.length || 0);
            
        } else {
            console.log('❌ Login fallito - Status:', loginResponse.status);
            console.log('📋 Risposta:', JSON.stringify(loginResponse.data, null, 2));
        }
        
        console.log('\n🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!');
        
    } catch (error) {
        console.log('\n❌ ERRORE NEL TEST:');
        if (error.response) {
            console.log('📋 Status:', error.response.status);
            console.log('📋 Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('📋 Nessuna risposta dal server');
            console.log('📋 Request:', error.request);
        } else {
            console.log('📋 Errore:', error.message);
        }
        
        console.log('\n🔧 AZIONE RICHIESTA:');
        console.log('1. Verificare che entrambi i server siano attivi');
        console.log('2. Controllare i log del server per errori');
        console.log('3. Verificare le credenziali di test');
    }
}

testConnettivitaBase();