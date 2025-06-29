const axios = require('axios');

async function testBypassCircuitBreaker() {
  try {
    console.log('Testing login bypassing circuit breaker...');
    
    // Test diretto all'endpoint senza circuit breaker
    const response = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Status:', response.status);
    console.log('Response data:');
    
    // Controllo specifico per duplicazione
    const data = response.data;
    const keys = Object.keys(data);
    const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
    
    if (duplicateKeys.length > 0) {
      console.log('❌ DUPLICAZIONE RILEVATA!');
      console.log('Chiavi duplicate:', duplicateKeys);
    } else {
      console.log('✅ Nessuna duplicazione a livello di chiavi principali');
    }
    
    // Controllo duplicazione nel JSON stringificato
    const jsonString = JSON.stringify(data, null, 2);
    const lines = jsonString.split('\n');
    const duplicateLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && line !== '{' && line !== '}' && line !== '[' && line !== ']') {
        const duplicateIndex = lines.findIndex((l, idx) => idx > i && l.trim() === line);
        if (duplicateIndex !== -1) {
          duplicateLines.push(line);
        }
      }
    }
    
    if (duplicateLines.length > 0) {
      console.log('❌ DUPLICAZIONE NEL JSON RILEVATA!');
      console.log('Righe duplicate:', duplicateLines.slice(0, 5)); // Mostra solo le prime 5
    } else {
      console.log('✅ Nessuna duplicazione nel JSON');
    }
    
    console.log('\nPrime 20 righe del JSON:');
    console.log(lines.slice(0, 20).join('\n'));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

testBypassCircuitBreaker();