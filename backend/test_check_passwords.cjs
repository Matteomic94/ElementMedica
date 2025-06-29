/**
 * Test per verificare le password degli utenti
 * ATTEMPT 100 - Verifica password utenti
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkUserPasswords() {
  console.log('\n🔍 ATTEMPT 100 - VERIFICA PASSWORD UTENTI');
  console.log('=' .repeat(60));
  
  try {
    // Recupera utenti con password
    const users = await prisma.person.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        password: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        password: true,
        personRoles: {
          where: { isActive: true },
          select: {
            roleType: true
          }
        }
      }
    });
    
    console.log(`\n✅ Trovati ${users.length} utenti con password:`);
    console.log('-'.repeat(40));
    
    // Test password comuni
    const commonPasswords = [
      'Admin123!',
      'admin123',
      'password',
      'Password123!',
      'test123',
      'mario123',
      'acme123'
    ];
    
    for (const user of users) {
      console.log(`\n👤 ${user.email || user.username}`);
      console.log(`   Nome: ${user.firstName} ${user.lastName}`);
      console.log(`   Ruoli: ${user.personRoles.map(r => r.roleType).join(', ')}`);
      console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
      
      // Testa password comuni
      console.log('   Test password:');
      for (const testPassword of commonPasswords) {
        try {
          const isValid = await bcrypt.compare(testPassword, user.password);
          if (isValid) {
            console.log(`   ✅ PASSWORD TROVATA: "${testPassword}"`);
            break;
          } else {
            console.log(`   ❌ ${testPassword}`);
          }
        } catch (error) {
          console.log(`   ⚠️  ${testPassword} (errore: ${error.message})`);
        }
      }
    }
    
    // Focus su mario.rossi
    console.log('\n\n🎯 FOCUS SU MARIO ROSSI:');
    console.log('-'.repeat(40));
    
    const mario = users.find(u => u.email === 'mario.rossi@acme-corp.com');
    if (mario) {
      console.log('✅ Mario Rossi trovato!');
      console.log(`ID: ${mario.id}`);
      console.log(`Email: ${mario.email}`);
      console.log(`Username: ${mario.username}`);
      console.log(`Password hash: ${mario.password}`);
      console.log(`Ruoli: ${mario.personRoles.map(r => r.roleType).join(', ')}`);
      
      // Test password specifiche per Mario
      const marioPasswords = [
        'Admin123!',
        'mario123',
        'Mario123!',
        'password',
        'acme123',
        'test123'
      ];
      
      console.log('\n🔍 Test password specifiche per Mario:');
      for (const testPassword of marioPasswords) {
        try {
          const isValid = await bcrypt.compare(testPassword, mario.password);
          console.log(`   ${isValid ? '✅' : '❌'} "${testPassword}"`);
          if (isValid) {
            console.log(`\n🎉 PASSWORD CORRETTA PER MARIO: "${testPassword}"`);
          }
        } catch (error) {
          console.log(`   ⚠️  "${testPassword}" (errore: ${error.message})`);
        }
      }
    } else {
      console.log('❌ Mario Rossi non trovato!');
    }
    
  } catch (error) {
    console.error('❌ ERRORE:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 INIZIO VERIFICA PASSWORD UTENTI');
  console.log('Timestamp:', new Date().toISOString());
  
  await checkUserPasswords();
  
  console.log('\n✅ VERIFICA COMPLETATA');
}

// Esegui il test
main().catch(console.error);