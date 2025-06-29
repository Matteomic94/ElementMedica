const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test per verificare se il server è stato riavviato dopo il fix
async function checkServerRestart() {
    console.log('🔄 VERIFICA RIAVVIO SERVER NECESSARIO');
    console.log('========================================');
    
    const apiURL = 'http://localhost:4001';
    const credentials = {
        identifier: 'mario.rossi@acme-corp.com',
        password: 'Password123!'
    };
    
    try {
        console.log('📝 Test login per verificare se il fix è attivo...');
        const response = await axios.post(`${apiURL}/api/v1/auth/login`, credentials, {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const { accessToken } = response.data.data;
        const decoded = jwt.decode(accessToken, { complete: true });
        
        console.log('\n🔍 ANALISI TOKEN CORRENTE:');
        console.log('========================================');
        console.log(`🎫 Token audience (aud): ${decoded.payload.aud}`);
        console.log(`🎫 Token issuer (iss): ${decoded.payload.iss}`);
        
        if (decoded.payload.aud === 'training-platform-users' && decoded.payload.iss === 'training-platform') {
            console.log('\n✅ SERVER RIAVVIATO CORRETTAMENTE!');
            console.log('✅ Il fix di authService.js è attivo');
            console.log('✅ I token ora hanno audience e issuer corretti');
            return { restarted: true, fixActive: true };
        } else {
            console.log('\n⚠️ SERVER NON ANCORA RIAVVIATO');
            console.log('❌ Il fix di authService.js NON è ancora attivo');
            console.log('🔄 È necessario riavviare il server API (porta 4001)');
            console.log('\n📋 STATO ATTUALE:');
            console.log(`   - Audience attuale: ${decoded.payload.aud || 'undefined'}`);
            console.log(`   - Issuer attuale: ${decoded.payload.iss || 'undefined'}`);
            console.log(`   - Audience atteso: training-platform-users`);
            console.log(`   - Issuer atteso: training-platform`);
            return { restarted: false, fixActive: false };
        }
        
    } catch (error) {
        console.log('❌ ERROR durante il test:');
        console.log(`💬 Error: ${error.message}`);
        return { restarted: false, fixActive: false, error: error.message };
    }
}

checkServerRestart().then(result => {
    console.log('\n📊 RISULTATO:');
    console.log('========================================');
    if (result.restarted && result.fixActive) {
        console.log('🎉 TUTTO OK - Server riavviato e fix attivo');
        console.log('🚀 Pronto per test completi di login e verify');
    } else {
        console.log('⏳ RIAVVIO SERVER NECESSARIO');
        console.log('🔧 Il fix è nel codice ma il server deve essere riavviato');
        console.log('👤 L\'utente deve riavviare il server API sulla porta 4001');
    }
}).catch(console.error);