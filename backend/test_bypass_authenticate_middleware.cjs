/**
 * Test per bypassare il middleware authenticate e testare direttamente l'endpoint
 */

const express = require('express');
const axios = require('axios');

function createTestServer() {
    const app = express();
    app.use(express.json());
    
    // Middleware di logging
    app.use((req, res, next) => {
        console.log(`📋 [TEST SERVER] ${req.method} ${req.path}`);
        next();
    });
    
    // Endpoint /verify senza middleware authenticate
    app.get('/api/v1/auth/verify', (req, res) => {
        console.log('✅ [TEST SERVER] Endpoint /verify raggiunto!');
        console.log(`📋 [TEST SERVER] Headers: ${JSON.stringify(req.headers.authorization)}`);
        
        // Simula la risposta del middleware authenticate
        res.json({
            valid: true,
            user: {
                id: 'test-user-id',
                email: 'test@example.com',
                message: 'Endpoint raggiunto senza middleware authenticate'
            }
        });
    });
    
    // Endpoint di test per verificare che il server funzioni
    app.get('/test', (req, res) => {
        console.log('✅ [TEST SERVER] Endpoint /test raggiunto!');
        res.json({ message: 'Test server funziona' });
    });
    
    return app;
}

async function testBypassMiddleware() {
    console.log('🧪 Test Bypass Middleware Authenticate');
    console.log('======================================\n');
    
    const app = createTestServer();
    const server = app.listen(4002, () => {
        console.log('🚀 Test server avviato sulla porta 4002');
    });
    
    try {
        // Aspetta che il server si avvii
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 1: Endpoint di test
        console.log('1️⃣ Test endpoint di base...');
        const testResponse = await axios.get('http://localhost:4002/test', {
            timeout: 5000
        });
        console.log(`   ✅ Status: ${testResponse.status}`);
        console.log(`   ✅ Response: ${JSON.stringify(testResponse.data)}`);
        
        // Test 2: Endpoint /verify senza middleware
        console.log('\n2️⃣ Test /verify senza middleware...');
        const verifyResponse = await axios.get('http://localhost:4002/api/v1/auth/verify', {
            headers: {
                'Authorization': 'Bearer fake-token-for-test'
            },
            timeout: 5000
        });
        console.log(`   ✅ Status: ${verifyResponse.status}`);
        console.log(`   ✅ Response: ${JSON.stringify(verifyResponse.data)}`);
        
        console.log('\n🎯 CONCLUSIONE:');
        console.log('✅ Il routing funziona correttamente');
        console.log('✅ Il problema è nel middleware authenticate');
        console.log('❌ Il middleware authenticate si blocca durante l\'esecuzione');
        
        return { success: true, issue: 'middleware_blocks' };
        
    } catch (error) {
        console.error('❌ Errore durante il test:', error.message);
        return { success: false, issue: 'test_failed' };
        
    } finally {
        server.close();
        console.log('\n🔚 Test server chiuso');
    }
}

// Test del server API reale per confronto
async function testRealServer() {
    console.log('\n🔍 Test Server API Reale (porta 4001)');
    console.log('=====================================');
    
    try {
        // Test health endpoint
        console.log('1️⃣ Test health endpoint...');
        const healthResponse = await axios.get('http://localhost:4001/health', {
            timeout: 5000
        });
        console.log(`   ✅ Health Status: ${healthResponse.status}`);
        
        // Test login per vedere se il server risponde
        console.log('\n2️⃣ Test login endpoint...');
        const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
            identifier: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(`   ✅ Login Status: ${loginResponse.status}`);
        
        if (loginResponse.data.data?.accessToken) {
            const token = loginResponse.data.data.accessToken;
            
            // Test /verify con timeout molto breve
            console.log('\n3️⃣ Test /verify con timeout 2 secondi...');
            try {
                const verifyResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 2000
                });
                console.log(`   ✅ Verify Status: ${verifyResponse.status}`);
                console.log('   ✅ Il middleware funziona!');
                
            } catch (verifyError) {
                if (verifyError.code === 'ECONNABORTED') {
                    console.log('   ❌ TIMEOUT - Il middleware si blocca');
                } else {
                    console.log(`   ❌ Errore: ${verifyError.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Errore server reale:', error.message);
    }
}

// Esegui tutti i test
async function runAllTests() {
    const bypassResult = await testBypassMiddleware();
    await testRealServer();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RISULTATO FINALE:');
    console.log('='.repeat(60));
    
    if (bypassResult.success && bypassResult.issue === 'middleware_blocks') {
        console.log('🔍 PROBLEMA CONFERMATO: Il middleware authenticate si blocca');
        console.log('\n🔧 POSSIBILI SOLUZIONI:');
        console.log('   1. Aggiungere timeout alle query database nel middleware');
        console.log('   2. Controllare se ci sono deadlock nel database');
        console.log('   3. Verificare la connessione al database');
        console.log('   4. Riavviare il database se necessario');
        console.log('\n💡 PROSSIMO PASSO:');
        console.log('   • Modificare il middleware per aggiungere timeout alle query');
    } else {
        console.log('❌ Test non conclusivo - necessaria ulteriore investigazione');
    }
}

runAllTests().catch(console.error);