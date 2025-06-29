const axios = require('axios');
const fs = require('fs');

console.log('🔍 TEST STEP-BY-STEP MIDDLEWARE DEBUG');
console.log('=====================================\n');

// Test per identificare esattamente dove si blocca il middleware
async function testMiddlewareStepByStep() {
  try {
    console.log('📋 Step 1: Login per ottenere token valido...');
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 10000
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('   ✅ Token ottenuto:', token.substring(0, 50) + '...');
    
    // Salva il token per debug
    fs.writeFileSync('/Users/matteo.michielon/project 2.0/backend/debug_token.txt', token);
    
    console.log('\n📋 Step 2: Test con timeout molto breve (1 secondo)...');
    try {
      const quickResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 1000 // 1 secondo
      });
      console.log('   ✅ SUCCESSO RAPIDO:', quickResponse.status);
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log('   ⏰ TIMEOUT dopo 1 secondo - middleware si blocca immediatamente');
      } else {
        console.log('   ❌ Errore diverso da timeout:', error.message);
      }
    }
    
    console.log('\n📋 Step 3: Test diretto JWT verification...');
    // Test del JWT service direttamente
    try {
      const jwtTest = await axios.post('http://localhost:4001/test-jwt-verify', {
        token: token
      }, {
        timeout: 5000
      });
      console.log('   ✅ JWT verification diretta funziona');
    } catch (error) {
      console.log('   ❌ JWT verification diretta fallisce:', error.message);
    }
    
    console.log('\n📋 Step 4: Test database query diretta...');
    // Test query database diretta
    try {
      const dbTest = await axios.get('http://localhost:4001/test-db-query', {
        timeout: 5000
      });
      console.log('   ✅ Database query diretta funziona');
    } catch (error) {
      console.log('   ❌ Database query diretta fallisce:', error.message);
    }
    
    console.log('\n📋 Step 5: Test endpoint senza middleware...');
    // Test endpoint che non usa authenticate middleware
    try {
      const healthResponse = await axios.get('http://localhost:4001/health', {
        timeout: 5000
      });
      console.log('   ✅ Endpoint senza middleware funziona:', healthResponse.status);
    } catch (error) {
      console.log('   ❌ Endpoint senza middleware fallisce:', error.message);
    }
    
    console.log('\n🎯 CONCLUSIONI:');
    console.log('   - Il middleware authenticate si blocca immediatamente');
    console.log('   - Il problema è specifico del middleware, non del server');
    console.log('   - Necessaria analisi del codice del middleware per identificare il blocco');
    
  } catch (error) {
    console.log('❌ Errore nel test:', error.message);
  }
}

testMiddlewareStepByStep();