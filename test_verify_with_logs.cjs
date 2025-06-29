#!/usr/bin/env node

/**
 * Test verify con monitoraggio log in tempo reale
 */

const axios = require('axios');
const { spawn } = require('child_process');

const API_BASE_URL = 'http://127.0.0.1:4001';
const CREDENTIALS = {
    identifier: 'mario.rossi@acme-corp.com',
    password: 'Password123!'
};

async function testVerifyWithLogs() {
    console.log('🔍 [LOG TEST] Test verify con monitoraggio log...');
    
    // Avvia tail sui log
    console.log('📝 [LOG TEST] Avvio monitoraggio log...');
    const tailProcess = spawn('tail', ['-f', '/Users/matteo.michielon/project 2.0/backend/api-server.log']);
    
    let logOutput = '';
    tailProcess.stdout.on('data', (data) => {
        const logLine = data.toString();
        logOutput += logLine;
        if (logLine.includes('MIDDLEWARE DEBUG')) {
            console.log('🔍 [LOG TEST] DEBUG TROVATO:', logLine.trim());
        }
    });
    
    tailProcess.stderr.on('data', (data) => {
        console.log('❌ [LOG TEST] Errore tail:', data.toString());
    });
    
    try {
        // Aspetta un momento per avviare il tail
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 1: Login
        console.log('\n📝 [LOG TEST] Step 1: Login...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, CREDENTIALS, {
            timeout: 10000
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ [LOG TEST] Login fallito');
            return;
        }
        
        const accessToken = loginResponse.data.data.accessToken;
        console.log('✅ [LOG TEST] Token ottenuto');
        
        // Aspetta un momento per vedere se ci sono log dal login
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 2: Verify
        console.log('\n📝 [LOG TEST] Step 2: Chiamata verify...');
        console.log('🔍 [LOG TEST] Aspetto log di debug dal middleware...');
        
        const startTime = Date.now();
        
        // Fai la richiesta verify in background
        const verifyPromise = axios.get(`${API_BASE_URL}/api/v1/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            timeout: 10000
        });
        
        // Aspetta 5 secondi per vedere se arrivano log
        const timeoutPromise = new Promise(resolve => {
            setTimeout(() => {
                resolve({ timeout: true });
            }, 5000);
        });
        
        const result = await Promise.race([verifyPromise, timeoutPromise]);
        
        const duration = Date.now() - startTime;
        
        if (result.timeout) {
            console.log(`⏰ [LOG TEST] Timeout dopo ${duration}ms`);
            console.log('🔍 [LOG TEST] Verifico se ci sono stati log di debug...');
            
            if (logOutput.includes('MIDDLEWARE DEBUG')) {
                console.log('✅ [LOG TEST] Log di debug trovati!');
            } else {
                console.log('❌ [LOG TEST] Nessun log di debug trovato');
                console.log('🔍 [LOG TEST] Il middleware non viene chiamato o il debug non funziona');
            }
        } else {
            console.log(`✅ [LOG TEST] Verify completato in ${duration}ms`);
            console.log('📄 [LOG TEST] Response:', result.data);
        }
        
    } catch (error) {
        console.log('❌ [LOG TEST] Errore:', error.message);
    } finally {
        // Termina il processo tail
        console.log('\n📝 [LOG TEST] Terminazione monitoraggio log...');
        tailProcess.kill();
        
        // Aspetta un momento per la terminazione
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

testVerifyWithLogs();