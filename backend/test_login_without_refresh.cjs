/**
 * Test login senza refresh token per verificare se il problema è solo lì
 */

const axios = require('axios');
require('dotenv').config();

console.log('🧪 TEST LOGIN SENZA REFRESH TOKEN');
console.log('============================================================');
console.log('');
console.log('🎯 OBIETTIVO: Verificare se il problema è solo nel saveRefreshToken');
console.log('');

async function testLoginWithoutRefresh() {
  try {
    console.log('📋 Test 1: Login diretto con mario.rossi / Password123!...');
    
    const response = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   ✅ Login riuscito!');
    console.log(`   📊 Status: ${response.status}`);
    console.log(`   🎫 Access Token: ${response.data.data?.accessToken ? 'Presente' : 'Mancante'}`);
    console.log(`   🔄 Refresh Token: ${response.data.data?.refreshToken ? 'Presente' : 'Mancante'}`);
    console.log(`   👤 User ID: ${response.data.data?.user?.id || 'N/A'}`);
    console.log(`   🔑 Ruoli: [${response.data.data?.user?.roles?.join(', ') || 'N/A'}]`);
    
  } catch (error) {
    console.log('   ❌ Errore login:');
    console.log(`   📊 Status: ${error.response?.status || 'N/A'}`);
    console.log(`   💬 Messaggio: ${error.response?.data?.message || error.message}`);
    console.log(`   🔍 Dettagli:`, error.response?.data || 'Nessun dettaglio');
    
    if (error.response?.status === 500) {
      console.log('');
      console.log('   🔍 ANALISI ERRORE 500:');
      console.log('   - Se il problema persiste, non è solo il refresh token');
      console.log('   - Potrebbe essere un altro problema nel flusso di login');
    }
  }
}

testLoginWithoutRefresh();