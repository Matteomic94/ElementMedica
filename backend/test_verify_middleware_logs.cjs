/**
 * Test per monitorare i log del middleware durante /verify
 * Verifica se il middleware viene chiamato e dove si blocca
 */

const axios = require('axios');
const { spawn } = require('child_process');

async function testVerifyWithLogs() {
    console.log('🧪 Test Verify con Monitoraggio Log Middleware');
    console.log('==============================================\n');
    
    const API_BASE = 'http://localhost:4001';
    
    try {
        // Step 1: Ottieni token valido
        console.log('1️⃣ Ottengo token valido...');
        const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
            identifier: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!loginResponse.data.data || !loginResponse.data.data.accessToken) {
            throw new Error('Login fallito - nessun token ricevuto');
        }
        
        const token = loginResponse.data.data.accessToken;
        console.log(`   ✅ Token ottenuto (lunghezza: ${token.length})`);
        
        // Step 2: Test /verify con monitoraggio dettagliato
        console.log('\n2️⃣ Test /verify con monitoraggio...');
        console.log('   🔍 Chiamando /verify...');
        console.log('   ⏱️ Timeout impostato a 20 secondi');
        console.log('   📋 Monitora i log del middleware nel terminale del server API...');
        
        const startTime = Date.now();
        
        try {
            const verifyResponse = await axios.get(`${API_BASE}/api/v1/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                timeout: 20000 // 20 secondi
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`   ✅ Verify completato in ${duration}ms`);
            console.log(`   ✅ Status: ${verifyResponse.status}`);
            console.log(`   ✅ Response:`, JSON.stringify(verifyResponse.data, null, 2));
            
            console.log('\n🎯 CONCLUSIONE: Il middleware authenticate funziona correttamente!');
            return { success: true };
            
        } catch (verifyError) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`   ❌ Verify fallito dopo ${duration}ms`);
            
            if (verifyError.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT dopo 20 secondi');
                console.log('\n🔍 ANALISI TIMEOUT:');
                console.log('   • Il middleware authenticate si blocca durante l\'esecuzione');
                console.log('   • Possibili cause:');
                console.log('     - Query database che si blocca');
                console.log('     - Deadlock nel database');
                console.log('     - Problema con JWTService.verifyAccessToken');
                console.log('     - Loop infinito nel middleware');
                
                console.log('\n💡 SUGGERIMENTI:');
                console.log('   1. Controlla i log del server API per vedere dove si ferma');
                console.log('   2. Verifica se ci sono query database bloccate');
                console.log('   3. Controlla la connessione al database');
                
            } else if (verifyError.response) {
                console.log(`   ❌ Status: ${verifyError.response.status}`);
                console.log(`   ❌ Response:`, JSON.stringify(verifyError.response.data, null, 2));
            } else {
                console.log(`   ❌ Network Error: ${verifyError.message}`);
            }
            
            return { success: false, error: verifyError.message };
        }
        
    } catch (error) {
        console.error('❌ Errore generale:', error.message);
        return { success: false, error: error.message };
    }
}

// Funzione per testare la connessione al database
async function testDatabaseConnection() {
    console.log('\n3️⃣ Test connessione database...');
    
    try {
        // Test semplice query al database
        const testResponse = await axios.get('http://localhost:4001/health', {
            timeout: 5000
        });
        
        console.log(`   ✅ Health check: ${testResponse.status}`);
        
        // Se health check include info database
        if (testResponse.data.database) {
            console.log(`   ✅ Database status: ${testResponse.data.database}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Health check fallito: ${error.message}`);
    }
}

// Esegui i test
async function runAllTests() {
    const result = await testVerifyWithLogs();
    await testDatabaseConnection();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RISULTATO FINALE:');
    console.log('='.repeat(60));
    
    if (result.success) {
        console.log('✅ PROBLEMA RISOLTO!');
        console.log('✅ Il middleware authenticate funziona correttamente');
        console.log('✅ Login e Verify operativi');
    } else {
        console.log('❌ PROBLEMA PERSISTE');
        console.log('❌ Il middleware authenticate si blocca durante /verify');
        console.log('❌ Necessaria ulteriore investigazione');
        
        console.log('\n🔧 PROSSIMI PASSI:');
        console.log('1. Controlla i log del server API per vedere i log del middleware');
        console.log('2. Verifica se ci sono query database bloccate');
        console.log('3. Considera di riavviare il database se necessario');
    }
}

runAllTests().catch(console.error);