/**
 * Test per verificare utenti esistenti nel database
 * ATTEMPT 100 - Verifica credenziali database
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkExistingUsers() {
  console.log('\n🔍 ATTEMPT 100 - VERIFICA UTENTI DATABASE');
  console.log('=' .repeat(60));
  
  try {
    // Recupera tutti gli utenti attivi
    const users = await prisma.person.findMany({
      where: {
        isActive: true,
        isDeleted: false
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        password: true, // Per verificare se esiste
        personRoles: {
          where: { isActive: true },
          select: {
            roleType: true
          }
        }
      }
    });
    
    console.log(`\n✅ Trovati ${users.length} utenti attivi:`);
    console.log('-'.repeat(40));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Username: ${user.username || 'N/A'}`);
      console.log(`   Nome: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Password: ${user.password ? 'PRESENTE' : 'MANCANTE'}`);
      console.log(`   Ruoli: ${user.personRoles.map(r => r.roleType).join(', ') || 'Nessuno'}`);
    });
    
    // Cerca specificamente admin
    console.log('\n\n🔍 RICERCA UTENTI ADMIN:');
    console.log('-'.repeat(40));
    
    const adminUsers = users.filter(user => 
      user.personRoles.some(role => 
        role.roleType.includes('ADMIN') || 
        role.roleType.includes('SUPER')
      )
    );
    
    if (adminUsers.length > 0) {
      console.log(`\n✅ Trovati ${adminUsers.length} utenti admin:`);
      adminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email || user.username}`);
        console.log(`   Ruoli: ${user.personRoles.map(r => r.roleType).join(', ')}`);
      });
    } else {
      console.log('\n❌ Nessun utente admin trovato!');
    }
    
    // Cerca utenti con email specifica
    console.log('\n\n🔍 RICERCA UTENTI CON EMAIL SPECIFICHE:');
    console.log('-'.repeat(40));
    
    const emailsToCheck = [
      'admin@example.com',
      'mario.rossi@acme-corp.com',
      'admin@acme-corp.com',
      'test@example.com'
    ];
    
    for (const email of emailsToCheck) {
      const user = users.find(u => u.email === email);
      if (user) {
        console.log(`\n✅ ${email}: TROVATO`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Password: ${user.password ? 'PRESENTE' : 'MANCANTE'}`);
        console.log(`   Ruoli: ${user.personRoles.map(r => r.roleType).join(', ')}`);
      } else {
        console.log(`\n❌ ${email}: NON TROVATO`);
      }
    }
    
  } catch (error) {
    console.error('❌ ERRORE:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function testPasswordHashing() {
  console.log('\n\n🔍 TEST HASHING PASSWORD:');
  console.log('-'.repeat(40));
  
  const testPassword = 'Admin123!';
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  
  console.log(`Password originale: ${testPassword}`);
  console.log(`Password hashata: ${hashedPassword}`);
  
  // Test verifica
  const isValid = await bcrypt.compare(testPassword, hashedPassword);
  console.log(`Verifica hash: ${isValid ? 'VALIDA' : 'NON VALIDA'}`);
}

async function main() {
  console.log('🚀 INIZIO VERIFICA UTENTI DATABASE');
  console.log('Timestamp:', new Date().toISOString());
  
  await checkExistingUsers();
  await testPasswordHashing();
  
  console.log('\n✅ VERIFICA COMPLETATA');
}

// Esegui il test
main().catch(console.error);