const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 TEST VERIFICA FIX ENDPOINT /verify CON CURL');
console.log('===============================================\n');

async function testVerifyFix() {
  try {
    // Leggi il token salvato
    const token = fs.readFileSync('/Users/matteo.michielon/project 2.0/backend/debug_token.txt', 'utf8');
    console.log('📋 Token caricato:', token.substring(0, 50) + '...');
    
    console.log('\n📋 Step 1: Test /verify con curl e timeout 5 secondi...');
    const startTime = Date.now();
    
    try {
      const curlCommand = `curl -X GET "http://localhost:4001/api/v1/auth/verify" \\
        -H "Authorization: Bearer ${token}" \\
        -H "Content-Type: application/json" \\
        --max-time 5 \\
        --connect-timeout 5 \\
        -w "\\n%{http_code}|%{time_total}" \\
        -s`;
      
      console.log('   📋 Comando curl:', curlCommand.substring(0, 100) + '...');
      
      const { stdout, stderr } = await execAsync(curlCommand);
      const endTime = Date.now();
      
      console.log(`   ✅ Risposta ricevuta in ${endTime - startTime}ms`);
      console.log('   📋 Output curl:', stdout);
      
      if (stderr) {
        console.log('   ⚠️ Stderr:', stderr);
      }
      
      // Analizza la risposta
      const lines = stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      const [httpCode, timeTotal] = lastLine.split('|');
      
      console.log(`   📊 HTTP Code: ${httpCode}`);
      console.log(`   📊 Time Total: ${timeTotal}s`);
      
      if (httpCode === '200') {
        console.log('   🎉 SUCCESS: Endpoint /verify funziona!');
        console.log('   ✅ La correzione authenticate() ha risolto il problema!');
        
        // Prova a parsare la risposta JSON
        const jsonResponse = lines.slice(0, -1).join('\n');
        try {
          const parsed = JSON.parse(jsonResponse);
          console.log('   📋 User verificato:', {
            valid: parsed.valid,
            email: parsed.user?.email,
            roles: parsed.user?.roles?.length || 0
          });
        } catch (e) {
          console.log('   📋 Risposta JSON:', jsonResponse);
        }
      } else {
        console.log(`   ❌ FAIL: HTTP ${httpCode}`);
        console.log('   🚨 Il problema persiste!');
      }
      
    } catch (error) {
      const endTime = Date.now();
      if (error.message.includes('timeout')) {
        console.log(`   ⏰ TIMEOUT dopo ${endTime - startTime}ms`);
        console.log('   🚨 Il problema del timeout persiste!');
      } else {
        console.log('   ❌ Errore curl:', error.message);
      }
    }
    
    console.log('\n📋 Step 2: Test /verify senza token per confronto...');
    try {
      const curlCommand2 = `curl -X GET "http://localhost:4001/api/v1/auth/verify" \\
        -H "Content-Type: application/json" \\
        --max-time 5 \\
        -w "\\n%{http_code}|%{time_total}" \\
        -s`;
      
      const { stdout: stdout2 } = await execAsync(curlCommand2);
      const lines2 = stdout2.trim().split('\n');
      const lastLine2 = lines2[lines2.length - 1];
      const [httpCode2, timeTotal2] = lastLine2.split('|');
      
      console.log(`   📊 HTTP Code: ${httpCode2} (dovrebbe essere 401)`);
      console.log(`   📊 Time Total: ${timeTotal2}s`);
      
      if (httpCode2 === '401') {
        console.log('   ✅ Endpoint risponde correttamente senza token');
      } else {
        console.log('   ⚠️ Risposta inaspettata senza token');
      }
      
    } catch (error) {
      console.log('   ❌ Errore test senza token:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Errore nel test:', error.message);
  }
}

testVerifyFix();