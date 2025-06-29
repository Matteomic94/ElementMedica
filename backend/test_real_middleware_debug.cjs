/**
 * Test del middleware authenticate REALE con debug
 * Questo test usa il middleware originale per vedere dove si blocca
 */

const express = require('express');
const axios = require('axios');
const path = require('path');

// Import del middleware reale
const { authenticate } = require('./auth/middleware.js');

const TEST_PORT = 4002;

async function createRealMiddlewareServer() {
    const app = express();
    
    app.use(express.json());
    
    // Logging per debug
    app.use((req, res, next) => {
        console.log(`🔍 [SERVER] ${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
    });
    
    // Endpoint /verify con middleware REALE
    app.get('/api/v1/auth/verify', authenticate(), async (req, res) => {
        console.log('🔍 [VERIFY HANDLER] Handler chiamato');
        try {
            const user = req.user;
            
            res.json({
                valid: true,
                user: {
                    id: user.id,
                    personId: user.personId,
                    email: user.email,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    companyId: user.companyId,
                    tenantId: user.tenantId,
                    roles: user.roles,
                    company: user.company,
                    tenant: user.tenant,
                    isVerified: user.isVerified
                },
                permissions: user.roles,
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ [VERIFY HANDLER] Risposta inviata');
        } catch (error) {
            console.error('❌ [VERIFY HANDLER] Errore:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    
    return app;
}

async function testRealMiddleware() {
    console.log('🧪 Test Middleware Authenticate REALE');
    console.log('====================================\n');
    
    const app = await createRealMiddlewareServer();
    const server = app.listen(TEST_PORT, () => {
        console.log(`🚀 Server test avviato su porta ${TEST_PORT}\n`);
    });
    
    try {
        // Test 1: Senza token (dovrebbe essere veloce)
        console.log('1️⃣ Test /verify senza token...');
        try {
            const response = await axios.get(`http://localhost:${TEST_PORT}/api/v1/auth/verify`, {
                timeout: 5000
            });
            console.log(`   Status: ${response.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ Status: ${error.response.status} - ${error.response.data?.error}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT - Problema anche senza token!');
            } else {
                console.log(`   ❌ Errore: ${error.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 2: Con token fake (dovrebbe fallire ma velocemente)
        console.log('2️⃣ Test /verify con token fake...');
        try {
            const response = await axios.get(`http://localhost:${TEST_PORT}/api/v1/auth/verify`, {
                headers: {
                    'Authorization': 'Bearer fake-token-for-testing'
                },
                timeout: 5000
            });
            console.log(`   Status: ${response.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ Status: ${error.response.status} - ${error.response.data?.error}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT - Problema con token fake!');
                console.log('   🎯 Il middleware si blocca durante la verifica JWT!');
            } else {
                console.log(`   ❌ Errore: ${error.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 3: Login e poi verify (test completo)
        console.log('3️⃣ Test completo: Login + Verify...');
        
        try {
            // Prima faccio login per ottenere un token valido
            console.log('   🔐 Facendo login...');
            const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
                email: 'mario.rossi@acme-corp.com',
                password: 'Password123!'
            }, {
                timeout: 10000
            });
            
            if (loginResponse.status === 200 && loginResponse.data.accessToken) {
                const token = loginResponse.data.accessToken;
                console.log('   ✅ Login riuscito, token ottenuto');
                
                // Ora testo /verify con token valido
                console.log('   🔍 Testando /verify con token valido...');
                const verifyResponse = await axios.get(`http://localhost:${TEST_PORT}/api/v1/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 15000 // Timeout più lungo per il test completo
                });
                
                console.log(`   ✅ Status: ${verifyResponse.status}`);
                console.log('   ✅ Verify riuscito con token valido!');
                console.log('\n🎯 CONCLUSIONE: Il middleware funziona con token validi!');
                
            } else {
                console.log('   ❌ Login fallito');
            }
            
        } catch (error) {
            if (error.response) {
                console.log(`   Status: ${error.response.status} - ${error.response.data?.error}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT - Il middleware si blocca anche con token valido!');
                console.log('\n🎯 CONCLUSIONE: Il problema è nel middleware authenticate!');
                console.log('🎯 Probabilmente nelle query al database!');
            } else {
                console.log(`   ❌ Errore: ${error.message}`);
            }
        }
        
    } finally {
        server.close();
        console.log('\n🔚 Server test chiuso');
    }
}

// Esegui il test
testRealMiddleware().catch(console.error);