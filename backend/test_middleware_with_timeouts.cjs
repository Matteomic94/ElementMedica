/**
 * Test del middleware authenticate con timeout aggiunti
 */

const axios = require('axios');

async function testMiddlewareWithTimeouts() {
    console.log('🧪 Test Middleware con Timeout');
    console.log('==============================\n');
    
    const API_BASE = 'http://localhost:4001';
    
    try {
        // Step 1: Verifica server attivo
        console.log('1️⃣ Verifica server attivo...');
        const healthResponse = await axios.get(`${API_BASE}/health`, {
            timeout: 5000
        });
        console.log(`   ✅ Server attivo - Status: ${healthResponse.status}`);
        
        // Step 2: Login per ottenere token
        console.log('\n2️⃣ Login per ottenere token...');
        const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
            identifier: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (loginResponse.status !== 200 || !loginResponse.data.data?.accessToken) {
            throw new Error('Login fallito');
        }
        
        const token = loginResponse.data.data.accessToken;
        console.log(`   ✅ Token ottenuto (lunghezza: ${token.length})`);
        
        // Step 3: Test /verify con timeout di 10 secondi
        console.log('\n3️⃣ Test /verify con timeout 10 secondi...');
        console.log('   🔍 Con i timeout aggiunti, dovrebbe funzionare o dare errore specifico');
        console.log('   📋 Monitora i log del server per vedere i debug del middleware');
        
        const startTime = Date.now();
        
        try {
            const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                timeout: 10000 // 10 secondi
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`   ✅ Verify riuscito in ${duration}ms`);
            console.log(`   ✅ Status: ${verifyResponse.status}`);
            console.log(`   ✅ User ID: ${verifyResponse.data.user?.id}`);
            console.log(`   ✅ Email: ${verifyResponse.data.user?.email}`);
            
            console.log('\n🎯 SUCCESSO!');
            console.log('✅ Il middleware authenticate ora funziona correttamente!');
            console.log('✅ I timeout hanno risolto il problema!');
            
            return { success: true, issue: 'resolved' };
            
        } catch (verifyError) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`   ❌ Verify fallito dopo ${duration}ms`);
            
            if (verifyError.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT dopo 10 secondi');
                console.log('   🔍 Il middleware si blocca ancora nonostante i timeout');
                console.log('   🔍 Possibile problema più profondo nel database o nel sistema');
                return { success: false, issue: 'still_timeout' };
                
            } else if (verifyError.response) {
                console.log(`   ❌ Status: ${verifyError.response.status}`);
                console.log(`   📋 Response: ${JSON.stringify(verifyError.response.data, null, 2)}`);
                
                if (verifyError.response.status === 500) {
                    console.log('   🔍 Errore interno del server - controlla i log per dettagli');
                    return { success: false, issue: 'internal_error' };
                } else {
                    console.log('   🔍 Errore HTTP specifico');
                    return { success: false, issue: 'http_error' };
                }
                
            } else {
                console.log(`   ❌ Errore di rete: ${verifyError.message}`);
                return { success: false, issue: 'network_error' };
            }
        }
        
        // Step 4: Test con token invalido per verificare che i timeout funzionino
        console.log('\n4️⃣ Test con token invalido...');
        console.log('   🔍 Dovrebbe restituire 401 rapidamente');
        
        try {
            const invalidResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
                headers: {
                    'Authorization': 'Bearer invalid-token'
                },
                timeout: 5000
            });
            
            console.log(`   ⚠️ Risposta inaspettata: ${invalidResponse.status}`);
            
        } catch (invalidError) {
            if (invalidError.response && invalidError.response.status === 401) {
                console.log('   ✅ Token invalido restituisce 401 correttamente');
            } else if (invalidError.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT anche con token invalido - problema grave');
            } else {
                console.log(`   ❌ Errore inaspettato: ${invalidError.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Errore generale:', error.message);
        return { success: false, issue: 'general_error' };
    }
}

// Funzione per fornire raccomandazioni
function provideRecommendations(result) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RISULTATO E RACCOMANDAZIONI:');
    console.log('='.repeat(60));
    
    switch (result.issue) {
        case 'resolved':
            console.log('🎉 PROBLEMA RISOLTO!');
            console.log('✅ Il middleware authenticate funziona correttamente');
            console.log('✅ I timeout hanno risolto il problema di blocco');
            console.log('✅ Login e Verify sono ora operativi');
            console.log('\n📋 PROSSIMI PASSI:');
            console.log('   • Aggiornare il PLANNING_SISTEMATICO.md');
            console.log('   • Rimuovere i file di test temporanei');
            console.log('   • Considerare di ottimizzare le query database');
            break;
            
        case 'still_timeout':
            console.log('❌ PROBLEMA PERSISTE');
            console.log('❌ Il middleware si blocca ancora nonostante i timeout');
            console.log('\n🔧 POSSIBILI CAUSE PROFONDE:');
            console.log('   • Deadlock nel database');
            console.log('   • Connessione database bloccata');
            console.log('   • Problema con il pool di connessioni Prisma');
            console.log('\n💡 SOLUZIONI AVANZATE:');
            console.log('   1. Riavviare il database');
            console.log('   2. Controllare le connessioni attive al database');
            console.log('   3. Verificare i log del database');
            console.log('   4. Ricreare il pool di connessioni Prisma');
            break;
            
        case 'internal_error':
            console.log('🔍 ERRORE INTERNO DEL SERVER');
            console.log('❌ Il middleware genera un errore 500');
            console.log('\n💡 AZIONI:');
            console.log('   • Controllare i log del server per stack trace');
            console.log('   • Verificare che i timeout non causino errori');
            break;
            
        default:
            console.log('❌ PROBLEMA NON RISOLTO');
            console.log('\n💡 RACCOMANDAZIONI:');
            console.log('   • Controllare i log del server');
            console.log('   • Verificare la connessione al database');
            console.log('   • Considerare il riavvio del sistema');
    }
}

// Esegui il test
testMiddlewareWithTimeouts()
    .then(result => {
        if (result) {
            provideRecommendations(result);
        }
    })
    .catch(console.error);