#!/usr/bin/env node

/**
 * Test per debuggare l'estrazione e verifica del token
 * Simula esattamente quello che fa il middleware authenticate
 */

const axios = require('axios');

// Configurazione
const API_BASE_URL = 'http://127.0.0.1:4001';
const CREDENTIALS = {
    identifier: 'mario.rossi@acme-corp.com',
    password: 'Password123!'
};

// Simula la funzione extractToken del middleware
function extractToken(headers) {
    const authHeader = headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    return null;
}

async function testTokenExtraction() {
    console.log('🔍 TEST ESTRAZIONE E VERIFICA TOKEN');
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
        console.log('✅ Token ottenuto dal login:');
        console.log(`🔍 Lunghezza: ${accessToken.length}`);
        console.log(`🔍 Primi 50 caratteri: ${accessToken.substring(0, 50)}...`);
        console.log(`🔍 Ultimi 50 caratteri: ...${accessToken.substring(accessToken.length - 50)}`);
        
        // Step 2: Simula estrazione token come nel middleware
        console.log('\n📝 Step 2: Simula estrazione token...');
        const headers = {
            authorization: `Bearer ${accessToken}`
        };
        
        const extractedToken = extractToken(headers);
        console.log('✅ Token estratto dal header:');
        console.log(`🔍 Lunghezza: ${extractedToken.length}`);
        console.log(`🔍 Primi 50 caratteri: ${extractedToken.substring(0, 50)}...`);
        console.log(`🔍 Ultimi 50 caratteri: ...${extractedToken.substring(extractedToken.length - 50)}`);
        
        // Step 3: Verifica che i token siano identici
        console.log('\n📝 Step 3: Verifica identità token...');
        if (accessToken === extractedToken) {
            console.log('✅ Token identici - estrazione corretta');
        } else {
            console.log('❌ Token diversi - problema nell\'estrazione!');
            console.log(`🔍 Originale: ${accessToken}`);
            console.log(`🔍 Estratto:  ${extractedToken}`);
            return;
        }
        
        // Step 4: Test manuale della chiamata verify con debug headers
        console.log('\n📝 Step 4: Test chiamata verify con debug headers...');
        
        // Intercetta la richiesta per vedere esattamente cosa viene inviato
        const axiosInstance = axios.create({
            timeout: 5000
        });
        
        // Aggiungi interceptor per debug
        axiosInstance.interceptors.request.use(request => {
            console.log('🔍 REQUEST DEBUG:');
            console.log(`   URL: ${request.url}`);
            console.log(`   Method: ${request.method}`);
            console.log(`   Headers:`, request.headers);
            console.log(`   Authorization header: ${request.headers.Authorization}`);
            return request;
        });
        
        axiosInstance.interceptors.response.use(
            response => {
                console.log('✅ RESPONSE SUCCESS:');
                console.log(`   Status: ${response.status}`);
                console.log(`   Data:`, response.data);
                return response;
            },
            error => {
                console.log('❌ RESPONSE ERROR:');
                console.log(`   Message: ${error.message}`);
                console.log(`   Code: ${error.code}`);
                if (error.response) {
                    console.log(`   Status: ${error.response.status}`);
                    console.log(`   Data:`, error.response.data);
                }
                return Promise.reject(error);
            }
        );
        
        try {
            const verifyResponse = await axiosInstance.get(`${API_BASE_URL}/api/v1/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            console.log('🎉 VERIFY SUCCESSFUL!');
            
        } catch (error) {
            console.log('❌ VERIFY FAILED - Questo conferma il problema nel middleware');
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
testTokenExtraction();