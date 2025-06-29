#!/usr/bin/env node

/**
 * Test per verificare se il server risponde alle richieste base
 */

const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:4001';

async function testServerResponse() {
    console.log('🔍 [SERVER TEST] Test connessione server...');
    
    try {
        // Test 1: Health check
        console.log('📝 [SERVER TEST] Test 1: Health check...');
        try {
            const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
                timeout: 5000
            });
            console.log('✅ [SERVER TEST] Health check OK:', healthResponse.status);
        } catch (error) {
            console.log('❌ [SERVER TEST] Health check failed:', error.message);
        }
        
        // Test 2: Root endpoint
        console.log('\n📝 [SERVER TEST] Test 2: Root endpoint...');
        try {
            const rootResponse = await axios.get(`${API_BASE_URL}/`, {
                timeout: 5000
            });
            console.log('✅ [SERVER TEST] Root endpoint OK:', rootResponse.status);
        } catch (error) {
            console.log('❌ [SERVER TEST] Root endpoint failed:', error.message);
        }
        
        // Test 3: API base path
        console.log('\n📝 [SERVER TEST] Test 3: API base path...');
        try {
            const apiResponse = await axios.get(`${API_BASE_URL}/api`, {
                timeout: 5000
            });
            console.log('✅ [SERVER TEST] API base path OK:', apiResponse.status);
        } catch (error) {
            console.log('❌ [SERVER TEST] API base path failed:', error.message);
        }
        
        // Test 4: Login endpoint (senza credenziali)
        console.log('\n📝 [SERVER TEST] Test 4: Login endpoint...');
        try {
            const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {}, {
                timeout: 5000
            });
            console.log('✅ [SERVER TEST] Login endpoint responded:', loginResponse.status);
        } catch (error) {
            if (error.response) {
                console.log(`✅ [SERVER TEST] Login endpoint responded with error: ${error.response.status}`);
            } else {
                console.log('❌ [SERVER TEST] Login endpoint failed:', error.message);
            }
        }
        
        // Test 5: Verify endpoint (senza token)
        console.log('\n📝 [SERVER TEST] Test 5: Verify endpoint...');
        try {
            const verifyResponse = await axios.get(`${API_BASE_URL}/api/v1/auth/verify`, {
                timeout: 5000
            });
            console.log('✅ [SERVER TEST] Verify endpoint responded:', verifyResponse.status);
        } catch (error) {
            if (error.response) {
                console.log(`✅ [SERVER TEST] Verify endpoint responded with error: ${error.response.status}`);
            } else {
                console.log('❌ [SERVER TEST] Verify endpoint failed:', error.message);
            }
        }
        
    } catch (error) {
        console.log('❌ [SERVER TEST] Errore generale:', error.message);
    }
}

testServerResponse();