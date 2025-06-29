/**
 * Test Server Minimale per isolare il problema /verify
 * Questo server monta SOLO il router v1/auth senza altri middleware
 */

const express = require('express');
const axios = require('axios');

const TEST_PORT = 4002;

async function createMinimalServer() {
    const app = express();
    
    // Solo middleware essenziali
    app.use(express.json());
    
    // Logging per debug
    app.use((req, res, next) => {
        console.log(`🔍 [MINIMAL] ${req.method} ${req.path}`);
        next();
    });
    
    try {
        // Importa e monta SOLO il router v1/auth
        const { default: authV1Routes } = await import('./routes/v1/auth.js');
        app.use('/api/v1/auth', authV1Routes);
        console.log('✅ Router v1/auth montato');
    } catch (error) {
        console.error('❌ Errore importazione router:', error.message);
        return null;
    }
    
    // Handler 404
    app.use('*', (req, res) => {
        console.log(`❌ [MINIMAL] 404: ${req.method} ${req.path}`);
        res.status(404).json({ error: 'Not found' });
    });
    
    return app;
}

async function testMinimalServer() {
    console.log('🧪 Test Server Minimale per /verify');
    console.log('====================================\n');
    
    const app = await createMinimalServer();
    if (!app) {
        console.error('❌ Impossibile creare server minimale');
        return;
    }
    
    const server = app.listen(TEST_PORT, () => {
        console.log(`🚀 Server minimale avviato su porta ${TEST_PORT}\n`);
    });
    
    try {
        // Test 1: Endpoint /verify senza token
        console.log('1️⃣ Test /verify senza token...');
        try {
            const response = await axios.get(`http://localhost:${TEST_PORT}/api/v1/auth/verify`, {
                timeout: 5000
            });
            console.log(`   Status: ${response.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ Status: ${error.response.status} - ${error.response.data?.error || 'No error'}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT - Problema confermato anche nel server minimale!');
            } else {
                console.log(`   ❌ Errore: ${error.message}`);
            }
        }
        
        console.log('');
        
        // Test 2: Endpoint /login per confronto
        console.log('2️⃣ Test /login per confronto...');
        try {
            const response = await axios.post(`http://localhost:${TEST_PORT}/api/v1/auth/login`, {
                identifier: 'test@test.com',
                password: 'invalid'
            }, {
                timeout: 5000
            });
            console.log(`   Status: ${response.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ Login Status: ${error.response.status}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ Login TIMEOUT - Problema generale!');
            } else {
                console.log(`   ❌ Login Errore: ${error.message}`);
            }
        }
        
    } finally {
        server.close();
        console.log('\n🔚 Server minimale chiuso');
    }
}

// Esegui il test
testMinimalServer().catch(console.error);