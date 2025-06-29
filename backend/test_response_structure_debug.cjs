const axios = require('axios');

console.log('🔍 DEBUG: Struttura risposta login');
console.log('===================================');

const debugLoginResponse = async () => {
  try {
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!',
      remember_me: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'debug-response-structure/1.0'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', loginResponse.status);
    console.log('\n📋 Response completa:');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    
    console.log('\n🔍 Analisi struttura:');
    console.log('- Chiavi root:', Object.keys(loginResponse.data));
    
    if (loginResponse.data.data) {
      console.log('- Chiavi in data:', Object.keys(loginResponse.data.data));
      
      // Verifica se i token sono in data
      if (loginResponse.data.data.accessToken) {
        console.log('✅ accessToken trovato in data:', loginResponse.data.data.accessToken.length, 'caratteri');
      }
      
      if (loginResponse.data.data.refreshToken) {
        console.log('✅ refreshToken trovato in data:', loginResponse.data.data.refreshToken.length, 'caratteri');
      }
      
      // Verifica se ci sono token con nomi diversi
      const dataKeys = Object.keys(loginResponse.data.data);
      const tokenKeys = dataKeys.filter(key => 
        key.toLowerCase().includes('token') || 
        key.toLowerCase().includes('access') || 
        key.toLowerCase().includes('refresh')
      );
      
      if (tokenKeys.length > 0) {
        console.log('🔑 Chiavi che contengono token:', tokenKeys);
        tokenKeys.forEach(key => {
          console.log(`   - ${key}:`, typeof loginResponse.data.data[key], 
                     typeof loginResponse.data.data[key] === 'string' ? loginResponse.data.data[key].length + ' caratteri' : '');
        });
      }
    }
    
    // Verifica se i token sono a livello root
    if (loginResponse.data.accessToken) {
      console.log('✅ accessToken trovato a livello root:', loginResponse.data.accessToken.length, 'caratteri');
    }
    
    if (loginResponse.data.refreshToken) {
      console.log('✅ refreshToken trovato a livello root:', loginResponse.data.refreshToken.length, 'caratteri');
    }
    
  } catch (error) {
    console.log('❌ ERRORE:', error.message);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

debugLoginResponse();