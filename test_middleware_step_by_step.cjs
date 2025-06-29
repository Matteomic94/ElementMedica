#!/usr/bin/env node

/**
 * Test per simulare step-by-step il middleware authenticate
 * e identificare esattamente dove si blocca
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configurazione
const API_BASE_URL = 'http://127.0.0.1:4001';
const CREDENTIALS = {
    identifier: 'mario.rossi@acme-corp.com',
    password: 'Password123!'
};

// Simula JWTService.verifyAccessToken
function simulateJWTVerify(token) {
    try {
        console.log('🔍 Simulando JWTService.verifyAccessToken...');
        console.log(`🔍 Token length: ${token.length}`);
        
        // Decodifica senza verifica per vedere il contenuto
        const decoded = jwt.decode(token);
        console.log('✅ Token decodificato (senza verifica):');
        console.log(`   userId: ${decoded.userId}`);
        console.log(`   personId: ${decoded.personId}`);
        console.log(`   email: ${decoded.email}`);
        console.log(`   aud: ${decoded.aud}`);
        console.log(`   iss: ${decoded.iss}`);
        console.log(`   exp: ${new Date(decoded.exp * 1000)}`);
        
        // Verifica se il token è scaduto
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
            console.log('❌ Token scaduto!');
            return null;
        }
        
        console.log('✅ Token valido (non scaduto)');
        return decoded;
        
    } catch (error) {
        console.log('❌ Errore nella decodifica JWT:', error.message);
        return null;
    }
}

async function testMiddlewareSteps() {
    console.log('🔍 TEST MIDDLEWARE STEP-BY-STEP');
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
        console.log('✅ Token ottenuto');
        
        // Step 2: Simula estrazione token (middleware step 1)
        console.log('\n📝 Step 2: Estrazione token...');
        const authHeader = `Bearer ${accessToken}`;
        const extractedToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        
        if (!extractedToken) {
            console.log('❌ Token non estratto correttamente');
            return;
        }
        console.log('✅ Token estratto correttamente');
        
        // Step 3: Simula verifica JWT (middleware step 2)
        console.log('\n📝 Step 3: Verifica JWT...');
        const decoded = simulateJWTVerify(extractedToken);
        
        if (!decoded) {
            console.log('❌ Verifica JWT fallita');
            return;
        }
        console.log('✅ Verifica JWT completata');
        
        // Step 4: Test chiamata diretta al database (simula middleware step 3)
        console.log('\n📝 Step 4: Test query database...');
        console.log('🔍 Questo è dove il middleware potrebbe bloccarsi!');
        
        // Invece di fare query Prisma, testiamo se il server risponde a endpoint semplici
        console.log('\n📝 Step 5: Test endpoint semplice per verificare se il server è bloccato...');
        
        try {
            const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
                timeout: 5000
            });
            console.log('✅ Health endpoint risponde:', healthResponse.status);
        } catch (error) {
            console.log('❌ Health endpoint non risponde:', error.message);
            console.log('🚨 Il server potrebbe essere bloccato!');
        }
        
        // Step 6: Test endpoint che non richiede autenticazione
        console.log('\n📝 Step 6: Test endpoint pubblico...');
        
        try {
            const publicResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
                identifier: 'test@test.com',
                password: 'wrong'
            }, {
                timeout: 5000
            });
            console.log('✅ Login endpoint risponde (anche se credenziali sbagliate)');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Login endpoint risponde con 401 (normale)');
            } else if (error.code === 'ECONNABORTED') {
                console.log('❌ Login endpoint va in timeout - server bloccato!');
            } else {
                console.log('❌ Login endpoint errore:', error.message);
            }
        }
        
        console.log('\n🎯 CONCLUSIONE:');
        console.log('Il problema è nel middleware authenticate, probabilmente:');
        console.log('1. Query Prisma che si blocca');
        console.log('2. Deadlock nel database');
        console.log('3. Connessione Prisma persa');
        console.log('4. Loop infinito nel middleware');
        
    } catch (error) {
        console.log('❌ Errore durante il test:', error.message);
        if (error.response) {
            console.log(`📋 Status: ${error.response.status}`);
            console.log(`📄 Response: ${JSON.stringify(error.response.data)}`);
        }
    }
}

// Esegui il test
testMiddlewareSteps();