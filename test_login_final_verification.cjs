const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test finale per verificare se il fix di authService ha risolto completamente il problema
async function testLoginFinalVerification() {
    console.log('🔍 TEST FINALE - VERIFICA COMPLETA LOGIN E VERIFY');
    console.log('========================================');
    
    const apiURL = 'http://localhost:4001'; // API server diretto
    const proxyURL = 'http://localhost:4003'; // Proxy server
    const credentials = {
        identifier: 'mario.rossi@acme-corp.com',
        password: 'Password123!'
    };
    
    try {
        // Step 1: Test diretto API server
        console.log('\n📝 Step 1: Login diretto API server (4001)...');
        const apiLoginResponse = await axios.post(`${apiURL}/api/v1/auth/login`, credentials, {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login API server successful!');
        console.log(`📋 Status: ${apiLoginResponse.status}`);
        
        const { accessToken, refreshToken, user } = apiLoginResponse.data.data;
        console.log(`🎫 Access token ricevuto: ${accessToken.substring(0, 50)}...`);
        console.log(`👤 User ID: ${user?.id}`);
        console.log(`📧 Email: ${user?.email}`);
        console.log(`🔍 Response structure: success=${apiLoginResponse.data.success}, message=${apiLoginResponse.data.message}`);
        
        // Step 2: Analisi token per verificare audience e issuer
        console.log('\n📝 Step 2: Analisi token generato...');
        const decoded = jwt.decode(accessToken, { complete: true });
        console.log(`🔍 Token audience (aud): ${decoded.payload.aud}`);
        console.log(`🔍 Token issuer (iss): ${decoded.payload.iss}`);
        console.log(`⏰ Token expires: ${new Date(decoded.payload.exp * 1000).toISOString()}`);
        
        // Verifica che audience e issuer siano corretti
        const expectedAudience = 'training-platform-users';
        const expectedIssuer = 'training-platform';
        
        if (decoded.payload.aud === expectedAudience && decoded.payload.iss === expectedIssuer) {
            console.log('✅ Token ha audience e issuer corretti!');
        } else {
            console.log('❌ Token ha audience/issuer non corretti:');
            console.log(`   Expected aud: ${expectedAudience}, got: ${decoded.payload.aud}`);
            console.log(`   Expected iss: ${expectedIssuer}, got: ${decoded.payload.iss}`);
            return { success: false, error: 'Token audience/issuer mismatch' };
        }
        
        // Step 3: Test verify endpoint API server
        console.log('\n📝 Step 3: Test verify endpoint API server...');
        const apiVerifyResponse = await axios.get(`${apiURL}/api/v1/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        
        console.log('✅ Verify API server successful!');
        console.log(`📋 Status: ${apiVerifyResponse.status}`);
        console.log(`👤 Verified User ID: ${apiVerifyResponse.data.user?.id}`);
        console.log(`📧 Verified Email: ${apiVerifyResponse.data.user?.email}`);
        console.log(`🔐 Roles: ${JSON.stringify(apiVerifyResponse.data.user?.roles)}`);
        
        // Step 4: Test proxy server login
        console.log('\n📝 Step 4: Test login tramite proxy server (4003)...');
        try {
            const proxyLoginResponse = await axios.post(`${proxyURL}/api/v1/auth/login`, credentials, {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Login proxy server successful!');
            console.log(`📋 Status: ${proxyLoginResponse.status}`);
            
            // Step 5: Test verify endpoint tramite proxy
            console.log('\n📝 Step 5: Test verify endpoint tramite proxy...');
            const proxyVerifyResponse = await axios.get(`${proxyURL}/api/v1/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            
            console.log('✅ Verify proxy server successful!');
            console.log(`📋 Status: ${proxyVerifyResponse.status}`);
            
        } catch (proxyError) {
            console.log('❌ Proxy server error:');
            if (proxyError.response) {
                console.log(`📋 Status: ${proxyError.response.status}`);
                console.log(`💬 Message: ${proxyError.response.data?.message || proxyError.response.data?.error}`);
                console.log(`🔍 Path: ${proxyError.response.data?.path}`);
            } else {
                console.log(`💬 Error: ${proxyError.message}`);
            }
            console.log('⚠️ Proxy ha problemi ma API server funziona');
        }
        
        console.log('\n🎉 SUCCESS: Login e verify API server funzionano correttamente!');
        console.log('✅ Il fix di authService.js ha risolto il problema principale');
        
        return {
            success: true,
            tokenValid: true,
            apiServerWorking: true,
            proxyWorking: false // Da verificare separatamente
        };
        
    } catch (error) {
        console.log('\n❌ ERROR occurred:');
        if (error.code === 'ECONNABORTED') {
            console.log('🕐 Request timeout - verify endpoint ancora problematico');
            console.log('🔍 Possibili cause:');
            console.log('   - Server non riavviato dopo il fix');
            console.log('   - Problema nel middleware authenticate');
            console.log('   - Database query lenta');
        } else if (error.response) {
            console.log(`📋 Status: ${error.response.status}`);
            console.log(`💬 Message: ${error.response.data?.message || error.response.data?.error}`);
            console.log(`🔍 Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else if (error.code === 'ECONNREFUSED') {
            console.log('🔌 Connection refused - server non raggiungibile');
            console.log('🔍 Verificare che i server siano in esecuzione su porte 4001 e 4003');
        } else {
            console.log(`💬 Error: ${error.message}`);
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

testLoginFinalVerification().then(result => {
    console.log('\n📊 RISULTATO FINALE:');
    console.log('========================================');
    if (result.success) {
        console.log('✅ PROBLEMA PRINCIPALE RISOLTO');
        console.log('✅ Login API server funziona correttamente');
        console.log('✅ Token ha audience/issuer corretti');
        console.log('✅ Verify endpoint API server risponde senza timeout');
        console.log('\n🚀 PRONTO PER AGGIORNARE PLANNING_SISTEMATICO.md');
        console.log('⚠️ Proxy server potrebbe richiedere configurazione aggiuntiva');
    } else {
        console.log('❌ TEST FALLITI');
        console.log('🔧 Richiede ulteriori interventi');
    }
}).catch(console.error);