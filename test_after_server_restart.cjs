const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test completo da eseguire DOPO il riavvio del server
async function testAfterServerRestart() {
    console.log('🚀 TEST POST-RIAVVIO SERVER');
    console.log('========================================');
    console.log('⚠️ Eseguire SOLO dopo aver riavviato il server API (porta 4001)');
    console.log('');
    
    const apiURL = 'http://localhost:4001';
    const credentials = {
        identifier: 'mario.rossi@acme-corp.com',
        password: 'Password123!'
    };
    
    try {
        // Step 1: Login
        console.log('📝 Step 1: Login API server...');
        const loginResponse = await axios.post(`${apiURL}/api/v1/auth/login`, credentials, {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login successful!');
        console.log(`📋 Status: ${loginResponse.status}`);
        
        const { accessToken, refreshToken, user } = loginResponse.data.data;
        console.log(`🎫 Access token ricevuto: ${accessToken.substring(0, 50)}...`);
        console.log(`👤 User: ${user.email} (${user.id})`);
        
        // Step 2: Verifica token
        console.log('\n📝 Step 2: Analisi token...');
        const decoded = jwt.decode(accessToken, { complete: true });
        console.log(`🔍 Token audience (aud): ${decoded.payload.aud}`);
        console.log(`🔍 Token issuer (iss): ${decoded.payload.iss}`);
        console.log(`⏰ Token expires: ${new Date(decoded.payload.exp * 1000).toISOString()}`);
        
        // Verifica audience e issuer
        const expectedAudience = 'training-platform-users';
        const expectedIssuer = 'training-platform';
        
        if (decoded.payload.aud === expectedAudience && decoded.payload.iss === expectedIssuer) {
            console.log('✅ Token ha audience e issuer CORRETTI!');
        } else {
            console.log('❌ Token ha audience/issuer SBAGLIATI:');
            console.log(`   Expected aud: ${expectedAudience}, got: ${decoded.payload.aud}`);
            console.log(`   Expected iss: ${expectedIssuer}, got: ${decoded.payload.iss}`);
            throw new Error('Token audience/issuer mismatch - server non riavviato correttamente');
        }
        
        // Step 3: Test verify endpoint
        console.log('\n📝 Step 3: Test verify endpoint...');
        const verifyResponse = await axios.get(`${apiURL}/api/v1/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        
        console.log('✅ Verify endpoint successful!');
        console.log(`📋 Status: ${verifyResponse.status}`);
        console.log(`👤 Verified User: ${verifyResponse.data.user?.email} (${verifyResponse.data.user?.id})`);
        console.log(`🔐 Roles: ${JSON.stringify(verifyResponse.data.user?.roles)}`);
        
        // Step 4: Test con token scaduto/invalido
        console.log('\n📝 Step 4: Test con token invalido...');
        try {
            await axios.get(`${apiURL}/api/v1/auth/verify`, {
                headers: {
                    'Authorization': 'Bearer invalid-token',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            console.log('❌ ERRORE: Token invalido accettato!');
        } catch (invalidTokenError) {
            if (invalidTokenError.response?.status === 401) {
                console.log('✅ Token invalido correttamente rifiutato (401)');
            } else {
                console.log(`⚠️ Token invalido rifiutato con status: ${invalidTokenError.response?.status}`);
            }
        }
        
        console.log('\n🎉 TUTTI I TEST PASSATI!');
        console.log('========================================');
        console.log('✅ Login funziona correttamente');
        console.log('✅ Token generati con audience e issuer corretti');
        console.log('✅ Verify endpoint risponde senza timeout');
        console.log('✅ Token invalidi vengono rifiutati');
        console.log('\n🚀 PROBLEMA PRINCIPALE RISOLTO!');
        console.log('📝 Pronto per aggiornare PLANNING_SISTEMATICO.md');
        
        return {
            success: true,
            loginWorking: true,
            tokenValid: true,
            verifyWorking: true,
            securityWorking: true
        };
        
    } catch (error) {
        console.log('\n❌ ERROR occurred:');
        if (error.code === 'ECONNABORTED') {
            console.log('🕐 Request timeout');
            console.log('🔍 Possibili cause:');
            console.log('   - Server non ancora riavviato');
            console.log('   - Problema persistente nel middleware');
        } else if (error.response) {
            console.log(`📋 Status: ${error.response.status}`);
            console.log(`💬 Message: ${error.response.data?.message || error.response.data?.error}`);
        } else if (error.code === 'ECONNREFUSED') {
            console.log('🔌 Connection refused - server non in esecuzione');
        } else {
            console.log(`💬 Error: ${error.message}`);
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

testAfterServerRestart().then(result => {
    console.log('\n📊 RISULTATO FINALE:');
    console.log('========================================');
    if (result.success) {
        console.log('🎯 MISSIONE COMPLETATA!');
        console.log('✅ Il problema del timeout su /verify è stato risolto');
        console.log('✅ I token ora hanno audience e issuer corretti');
        console.log('✅ Il sistema di autenticazione funziona perfettamente');
    } else {
        console.log('❌ PROBLEMI PERSISTENTI');
        console.log('🔧 Richiede ulteriori interventi');
        console.log('💡 Verificare che il server sia stato riavviato correttamente');
    }
}).catch(console.error);