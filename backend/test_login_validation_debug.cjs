/**
 * Test specifico per debug del login
 * Verifica i problemi di validazione
 */

const axios = require('axios');

async function testLoginValidation() {
    console.log('🧪 Test Login Validation Debug');
    console.log('==============================\n');
    
    const API_BASE = 'http://localhost:4001';
    const credentials = {
        email: 'mario.rossi@acme-corp.com',
        password: 'Password123!'
    };
    
    try {
        // Test 1: Verifica health dell'API server
        console.log('1️⃣ Test health API server...');
        try {
            const healthResponse = await axios.get(`${API_BASE}/health`, {
                timeout: 5000
            });
            console.log(`   ✅ Health Status: ${healthResponse.status}`);
            console.log(`   ✅ Health Data:`, healthResponse.data);
        } catch (error) {
            console.log(`   ❌ Health Error: ${error.message}`);
            if (error.response) {
                console.log(`   ❌ Health Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 2: Login con credenziali corrette
        console.log('2️⃣ Test login con credenziali corrette...');
        console.log(`   📧 Email: ${credentials.email}`);
        console.log(`   🔑 Password: ${credentials.password}`);
        
        try {
            const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, credentials, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`   ✅ Login Status: ${loginResponse.status}`);
            console.log(`   ✅ Login Success!`);
            
            if (loginResponse.data.accessToken) {
                console.log(`   ✅ Access Token ricevuto (lunghezza: ${loginResponse.data.accessToken.length})`);
                
                // Test 3: Verifica token con /verify
                console.log('\n3️⃣ Test /verify con token ottenuto...');
                try {
                    const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
                        headers: {
                            'Authorization': `Bearer ${loginResponse.data.accessToken}`
                        },
                        timeout: 15000
                    });
                    
                    console.log(`   ✅ Verify Status: ${verifyResponse.status}`);
                    console.log(`   ✅ Verify Success!`);
                    console.log(`   ✅ User Data:`, JSON.stringify(verifyResponse.data.user, null, 2));
                    
                    console.log('\n🎯 CONCLUSIONE: Login e Verify funzionano correttamente!');
                    
                } catch (verifyError) {
                    console.log(`   ❌ Verify Error: ${verifyError.message}`);
                    if (verifyError.response) {
                        console.log(`   ❌ Verify Response: ${verifyError.response.status} - ${JSON.stringify(verifyError.response.data)}`);
                    } else if (verifyError.code === 'ECONNABORTED') {
                        console.log('   ❌ Verify TIMEOUT - Il middleware si blocca ancora!');
                    }
                }
                
            } else {
                console.log(`   ❌ Nessun access token nella risposta`);
                console.log(`   ❌ Response data:`, JSON.stringify(loginResponse.data, null, 2));
            }
            
        } catch (loginError) {
            console.log(`   ❌ Login Error: ${loginError.message}`);
            
            if (loginError.response) {
                console.log(`   ❌ Login Status: ${loginError.response.status}`);
                console.log(`   ❌ Login Response:`, JSON.stringify(loginError.response.data, null, 2));
                
                // Analizza errori di validazione
                if (loginError.response.status === 400) {
                    console.log('\n🔍 ANALISI ERRORE VALIDAZIONE:');
                    const errorData = loginError.response.data;
                    
                    if (errorData.errors) {
                        console.log('   📋 Errori di validazione:');
                        errorData.errors.forEach((err, index) => {
                            console.log(`   ${index + 1}. Campo: ${err.field || 'N/A'}`);
                            console.log(`      Messaggio: ${err.message || err}`);
                        });
                    }
                    
                    if (errorData.message) {
                        console.log(`   💬 Messaggio: ${errorData.message}`);
                    }
                    
                    if (errorData.code) {
                        console.log(`   🏷️ Codice: ${errorData.code}`);
                    }
                }
                
            } else if (loginError.code === 'ECONNABORTED') {
                console.log('   ❌ Login TIMEOUT');
            } else if (loginError.code === 'ECONNREFUSED') {
                console.log('   ❌ Connessione rifiutata - Server non raggiungibile');
            }
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 4: Test con dati malformati per vedere la validazione
        console.log('4️⃣ Test validazione con dati malformati...');
        
        const malformedTests = [
            { name: 'Email mancante', data: { password: 'Password123!' } },
            { name: 'Password mancante', data: { email: 'mario.rossi@acme-corp.com' } },
            { name: 'Email non valida', data: { email: 'invalid-email', password: 'Password123!' } },
            { name: 'Password troppo corta', data: { email: 'mario.rossi@acme-corp.com', password: '123' } }
        ];
        
        for (const test of malformedTests) {
            try {
                console.log(`\n   🧪 ${test.name}:`);
                const response = await axios.post(`${API_BASE}/api/v1/auth/login`, test.data, {
                    timeout: 5000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`      ⚠️ Inaspettato: Status ${response.status}`);
            } catch (error) {
                if (error.response) {
                    console.log(`      ✅ Validazione OK: ${error.response.status} - ${error.response.data?.message || 'Errore validazione'}`);
                } else {
                    console.log(`      ❌ Errore: ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Errore generale:', error.message);
    }
}

// Esegui il test
testLoginValidation().catch(console.error);