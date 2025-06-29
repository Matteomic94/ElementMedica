#!/usr/bin/env node

/**
 * Test rapido per verificare se il middleware con debug è attivo
 */

const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:4001';
const CREDENTIALS = {
    identifier: 'mario.rossi@acme-corp.com',
    password: 'Password123!'
};

async function quickTest() {
    console.log('🔍 [QUICK TEST] Avvio test rapido...');
    
    try {
        // Step 1: Login
        console.log('📝 [QUICK TEST] Login...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, CREDENTIALS, {
            timeout: 10000
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ [QUICK TEST] Login fallito');
            return;
        }
        
        const accessToken = loginResponse.data.data.accessToken;
        console.log('✅ [QUICK TEST] Token ottenuto');
        
        // Step 2: Verify con timeout breve
        console.log('📝 [QUICK TEST] Test verify con timeout 3s...');
        
        const startTime = Date.now();
        
        try {
            const verifyResponse = await axios.get(`${API_BASE_URL}/api/v1/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                timeout: 3000
            });
            
            const duration = Date.now() - startTime;
            console.log(`✅ [QUICK TEST] Verify completato in ${duration}ms`);
            console.log('📄 [QUICK TEST] Response:', verifyResponse.data);
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            if (error.code === 'ECONNABORTED') {
                console.log(`❌ [QUICK TEST] Timeout dopo ${duration}ms`);
                console.log('🔍 [QUICK TEST] Il middleware non risponde entro 3s');
            } else {
                console.log(`❌ [QUICK TEST] Errore dopo ${duration}ms:`, error.message);
            }
        }
        
    } catch (error) {
        console.log('❌ [QUICK TEST] Errore generale:', error.message);
    }
}

quickTest();