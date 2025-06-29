/**
 * Test specifico per verificare login con mario.rossi@acme-corp.com / Password123!
 * Basato sui risultati del database che mostrano che queste sono le credenziali corrette
 */

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

console.log('🧪 TEST LOGIN MARIO ROSSI');
console.log('============================================================');
console.log('');
console.log('🎯 OBIETTIVI:');
console.log('- Verificare password Password123! per mario.rossi@acme-corp.com');
console.log('- Testare login API con queste credenziali');
console.log('- Identificare causa errore 500');
console.log('');

async function testMarioLogin() {
  try {
    console.log('1. 🔍 Verifica utente mario.rossi nel database...');
    
    const user = await prisma.person.findUnique({
      where: { email: 'mario.rossi@acme-corp.com' }
    });
    
    if (!user) {
      console.log('   ❌ Utente mario.rossi@acme-corp.com non trovato');
      return;
    }
    
    console.log('   ✅ Utente trovato:');
    console.log(`      📧 Email: ${user.email}`);
    console.log(`      👤 Username: ${user.username}`);
    console.log(`      🏷️  Nome: ${user.name}`);
    console.log(`      🔑 Ruolo: ${user.role}`);
    console.log(`      ✅ Attivo: ${user.isActive}`);
    console.log(`      🔒 Password Hash: ${user.password ? 'Presente' : 'Mancante'}`);
    console.log('');
    
    if (!user.password) {
      console.log('   ❌ Password mancante per questo utente');
      return;
    }
    
    console.log('2. 🔐 Test password Password123!...');
    const passwordMatch = await bcrypt.compare('Password123!', user.password);
    
    if (passwordMatch) {
      console.log('   ✅ Password Password123! è CORRETTA!');
    } else {
      console.log('   ❌ Password Password123! NON corrisponde');
      
      // Test altre password comuni
      const commonPasswords = ['password', 'admin', 'mario123', 'Password123', 'admin123'];
      console.log('   🔍 Test password alternative...');
      
      for (const pwd of commonPasswords) {
        const match = await bcrypt.compare(pwd, user.password);
        if (match) {
          console.log(`   ✅ Password corretta trovata: ${pwd}`);
          break;
        }
      }
    }
    
    console.log('');
    console.log('3. 🌐 Test login API con mario.rossi / Password123!...');
    
    try {
      const response = await axios.post('http://localhost:4001/api/v1/auth/login', {
        identifier: 'mario.rossi@acme-corp.com',
        password: 'Password123!'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('   ✅ Login API riuscito!');
      console.log(`   📊 Status: ${response.status}`);
      console.log(`   🎫 Token ricevuto: ${response.data.accessToken ? 'Sì' : 'No'}`);
      // console.log(`   📋 Risposta completa:`, JSON.stringify(response.data, null, 2));
      
      // Test anche la route verify se abbiamo il token
      if (response.data.accessToken) {
        try {
          const verifyResponse = await axios.get('http://localhost:4001/api/v1/auth/verify', {
             headers: {
               'Authorization': `Bearer ${response.data.accessToken}`
             }
           });
          console.log('   ✅ Verify API riuscito!');
          console.log(`   📊 Verify Status: ${verifyResponse.status}`);
          console.log(`   👤 User verificato:`, JSON.stringify(verifyResponse.data.user, null, 2));
        } catch (verifyError) {
          console.log('   ❌ Errore verify API:');
          console.log(`   📊 Verify Status: ${verifyError.response?.status || 'N/A'}`);
          console.log(`   💬 Verify Messaggio: ${verifyError.response?.data?.message || verifyError.message}`);
        }
      }
      
    } catch (apiError) {
      console.log('   ❌ Errore login API:');
      console.log(`   📊 Status: ${apiError.response?.status || 'N/A'}`);
      console.log(`   💬 Messaggio: ${apiError.response?.data?.message || apiError.message}`);
      console.log(`   🔍 Dettagli errore:`, apiError.response?.data || 'Nessun dettaglio');
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMarioLogin();