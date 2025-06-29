#!/usr/bin/env node

/**
 * Test specifico per debuggare il problema del timeout nel middleware authenticate
 * durante la chiamata al verify endpoint
 */

const axios = require('axios');

// Configurazione
const API_BASE_URL = 'http://127.0.0.1:4001';
const CREDENTIALS = {
    identifier: 'mario.rossi@acme-corp.com',
    password: 'Password123!'
};

async function testVerifyMiddleware() {
    console.log('🔍 TEST MIDDLEWARE AUTHENTICATE - DEBUG TIMEOUT');
    console.log('========================================');
    
    try {
        // Step 1: Login per ottenere token
        console.log('📝 Step 1: Login per ottenere token...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, CREDENTIALS, {
            timeout: 10000
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Login fallito:', loginResponse.data.message);
            return;
        }
        
        const accessToken = loginResponse.data.data.accessToken;
        console.log('✅ Token ottenuto:', accessToken.substring(0, 50) + '...');
        
        // Step 2: Test verify con timeout progressivi
        const timeouts = [5000, 10000, 30000, 60000]; // 5s, 10s, 30s, 60s
        
        for (const timeout of timeouts) {
            console.log(`\n📝 Step 2: Test verify con timeout ${timeout/1000}s...`);
            
            const startTime = Date.now();
            
            try {
                const verifyResponse = await axios.get(`${API_BASE_URL}/api/v1/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    timeout: timeout
                });
                
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                console.log(`✅ Verify successful in ${duration}ms`);
                console.log(`📋 Status: ${verifyResponse.status}`);
                console.log(`👤 User: ${verifyResponse.data.user?.email}`);
                
                // Se arriviamo qui, il verify funziona
                break;
                
            } catch (error) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                if (error.code === 'ECONNABORTED') {
                    console.log(`❌ Timeout dopo ${duration}ms (limite: ${timeout}ms)`);
                    console.log(`🔍 Il middleware impiega più di ${timeout/1000}s per rispondere`);
                    
                    if (timeout === timeouts[timeouts.length - 1]) {
                        console.log('\n🚨 PROBLEMA CONFERMATO: Middleware authenticate ha timeout > 60s');
                        console.log('🔍 Possibili cause:');
                        console.log('   - Query database lente o bloccate');
                        console.log('   - Deadlock nel database');
                        console.log('   - Loop infinito nel middleware');
                        console.log('   - Connessione database persa');
                    }
                } else {
                    console.log(`❌ Errore diverso da timeout:`, error.message);
                    console.log(`🔍 Tipo errore: ${error.code}`);
                    if (error.response) {
                        console.log(`📋 Status: ${error.response.status}`);
                        console.log(`📄 Response: ${JSON.stringify(error.response.data)}`);
                    }
                    break;
                }
            }
        }
        
    } catch (error) {
        console.log('❌ Errore durante il test:', error.message);
        if (error.response) {
            console.log(`📋 Status: ${error.response.status}`);
            console.log(`📄 Response: ${JSON.stringify(error.response.data)}`);
        }
    }
}

// Esegui il test
testVerifyMiddleware();