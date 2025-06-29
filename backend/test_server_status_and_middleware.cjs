/**
 * Test per verificare lo stato del server e se il middleware viene chiamato
 */

const axios = require('axios');

async function testServerAndMiddleware() {
    console.log('🔍 Test Status Server e Middleware');
    console.log('=====================================\n');
    
    const API_BASE = 'http://localhost:4001';
    
    try {
        // Step 1: Verifica che il server sia attivo
        console.log('1️⃣ Verifica server attivo...');
        const healthResponse = await axios.get(`${API_BASE}/health`, {
            timeout: 5000
        });
        console.log(`   ✅ Server attivo - Status: ${healthResponse.status}`);
        
        // Step 2: Test login per ottenere token
        console.log('\n2️⃣ Test login...');
        const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
            identifier: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (loginResponse.status === 200 && loginResponse.data.data?.accessToken) {
            console.log(`   ✅ Login riuscito - Token ottenuto`);
            const token = loginResponse.data.data.accessToken;
            
            // Step 3: Test /verify con timeout molto breve per vedere se il middleware risponde
            console.log('\n3️⃣ Test /verify con timeout breve...');
            console.log('   🔍 Timeout: 3 secondi');
            console.log('   📋 Se il middleware funziona, dovrebbe rispondere entro 3 secondi');
            
            try {
                const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 3000 // Solo 3 secondi
                });
                
                console.log(`   ✅ Verify riuscito - Status: ${verifyResponse.status}`);
                console.log('   ✅ Il middleware authenticate funziona correttamente!');
                return { success: true, issue: 'none' };
                
            } catch (verifyError) {
                if (verifyError.code === 'ECONNABORTED') {
                    console.log('   ❌ TIMEOUT dopo 3 secondi');
                    console.log('   🔍 Il middleware si blocca durante l\'esecuzione');
                    
                    // Step 4: Test con token invalido per vedere se il middleware risponde
                    console.log('\n4️⃣ Test /verify con token invalido...');
                    console.log('   🔍 Se il middleware funziona, dovrebbe restituire 401 rapidamente');
                    
                    try {
                        const invalidResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
                            headers: {
                                'Authorization': 'Bearer invalid-token'
                            },
                            timeout: 3000
                        });
                        
                        console.log(`   ⚠️ Risposta inaspettata: ${invalidResponse.status}`);
                        
                    } catch (invalidError) {
                        if (invalidError.response && invalidError.response.status === 401) {
                            console.log('   ✅ Token invalido restituisce 401 rapidamente');
                            console.log('   🔍 Il middleware funziona per token invalidi ma si blocca per token validi');
                            return { success: false, issue: 'valid_token_blocks' };
                        } else if (invalidError.code === 'ECONNABORTED') {
                            console.log('   ❌ TIMEOUT anche con token invalido');
                            console.log('   🔍 Il middleware si blocca completamente');
                            return { success: false, issue: 'middleware_completely_blocked' };
                        } else {
                            console.log(`   ❌ Errore inaspettato: ${invalidError.message}`);
                            return { success: false, issue: 'unexpected_error' };
                        }
                    }
                    
                } else if (verifyError.response) {
                    console.log(`   ❌ Errore HTTP: ${verifyError.response.status}`);
                    console.log(`   📋 Response: ${JSON.stringify(verifyError.response.data)}`);
                    return { success: false, issue: 'http_error' };
                } else {
                    console.log(`   ❌ Errore di rete: ${verifyError.message}`);
                    return { success: false, issue: 'network_error' };
                }
            }
            
        } else {
            console.log(`   ❌ Login fallito - Status: ${loginResponse.status}`);
            return { success: false, issue: 'login_failed' };
        }
        
    } catch (error) {
        console.error('❌ Errore generale:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔍 DIAGNOSI: Server non raggiungibile');
            console.log('   • Il server API non è in esecuzione sulla porta 4001');
            console.log('   • Verifica che il server sia stato avviato correttamente');
            return { success: false, issue: 'server_not_running' };
        }
        
        return { success: false, issue: 'general_error' };
    }
}

// Funzione per fornire raccomandazioni basate sui risultati
function provideRecommendations(result) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSI E RACCOMANDAZIONI:');
    console.log('='.repeat(60));
    
    switch (result.issue) {
        case 'none':
            console.log('✅ TUTTO FUNZIONA CORRETTAMENTE!');
            console.log('✅ Login e Verify operativi');
            console.log('✅ Middleware authenticate funziona');
            break;
            
        case 'valid_token_blocks':
            console.log('🔍 PROBLEMA IDENTIFICATO: Middleware si blocca con token validi');
            console.log('\n🔧 POSSIBILI CAUSE:');
            console.log('   • Query database che si blocca durante la verifica del token');
            console.log('   • Problema con JWTService.verifyAccessToken per token validi');
            console.log('   • Deadlock nelle query person/company/tenant');
            console.log('\n💡 PROSSIMI PASSI:');
            console.log('   1. Controllare le query database nel middleware');
            console.log('   2. Verificare la connessione al database');
            console.log('   3. Aggiungere timeout alle query database');
            break;
            
        case 'middleware_completely_blocked':
            console.log('🔍 PROBLEMA GRAVE: Middleware completamente bloccato');
            console.log('\n🔧 POSSIBILI CAUSE:');
            console.log('   • Problema con l\'inizializzazione del middleware');
            console.log('   • Errore nel routing verso il middleware');
            console.log('   • Problema con Express o il server');
            console.log('\n💡 PROSSIMI PASSI:');
            console.log('   1. Riavviare il server API');
            console.log('   2. Controllare i log di errore del server');
            console.log('   3. Verificare la configurazione del routing');
            break;
            
        case 'server_not_running':
            console.log('🔍 PROBLEMA: Server non in esecuzione');
            console.log('\n💡 SOLUZIONE:');
            console.log('   • Avviare il server API sulla porta 4001');
            break;
            
        default:
            console.log('🔍 PROBLEMA NON IDENTIFICATO');
            console.log('\n💡 RACCOMANDAZIONI GENERALI:');
            console.log('   1. Verificare che il server sia in esecuzione');
            console.log('   2. Controllare i log del server');
            console.log('   3. Verificare la connessione di rete');
    }
}

// Esegui il test
testServerAndMiddleware()
    .then(result => {
        provideRecommendations(result);
    })
    .catch(console.error);