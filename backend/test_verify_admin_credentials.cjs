/**
 * Test per verificare l'esistenza dell'utente admin@example.com
 * e controllare tutte le credenziali disponibili nel database
 * 
 * OBIETTIVO: Trovare le credenziali corrette per il login
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

console.log('🔍 VERIFICA CREDENZIALI ADMIN - Test Database');
console.log('=' .repeat(60));

async function verifyAdminCredentials() {
  try {
    console.log('\n1. 🔍 Ricerca utente admin@example.com...');
    
    // Cerca specificamente admin@example.com
    const adminUser = await prisma.person.findFirst({
      where: {
        OR: [
          { email: 'admin@example.com' },
          { username: 'admin@example.com' }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        password: true,
        globalRole: true,
        isActive: true
      }
    });
    
    if (adminUser) {
      console.log('   ✅ Utente admin@example.com TROVATO:');
      console.log(`   📧 Email: ${adminUser.email}`);
      console.log(`   👤 Username: ${adminUser.username}`);
      console.log(`   🏷️  Nome: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`   🔑 Ruolo: ${adminUser.globalRole}`);
      console.log(`   ✅ Attivo: ${adminUser.isActive}`);
      console.log(`   🔒 Password hash presente: ${adminUser.password ? 'SÌ' : 'NO'}`);
      
      if (adminUser.password) {
        console.log('\n   🧪 Test password Admin123!...');
        const isValidPassword = await bcrypt.compare('Admin123!', adminUser.password);
        console.log(`   🔐 Password Admin123! valida: ${isValidPassword ? '✅ SÌ' : '❌ NO'}`);
        
        // Test altre password comuni
        const commonPasswords = ['admin', 'password', 'Password123', 'admin123', 'Admin123'];
        console.log('\n   🔍 Test password comuni...');
        for (const pwd of commonPasswords) {
          const isValid = await bcrypt.compare(pwd, adminUser.password);
          if (isValid) {
            console.log(`   ✅ Password trovata: ${pwd}`);
          }
        }
      }
    } else {
      console.log('   ❌ Utente admin@example.com NON TROVATO');
    }
    
    console.log('\n2. 📋 Lista di TUTTI gli utenti nel database:');
    
    const allUsers = await prisma.person.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        globalRole: true,
        isActive: true,
        password: true
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    console.log(`   📊 Totale utenti: ${allUsers.length}`);
    
    allUsers.forEach((user, index) => {
      console.log(`\n   👤 Utente ${index + 1}:`);
      console.log(`      📧 Email: ${user.email}`);
      console.log(`      👤 Username: ${user.username}`);
      console.log(`      🏷️  Nome: ${user.firstName} ${user.lastName}`);
      console.log(`      🔑 Ruolo: ${user.globalRole}`);
      console.log(`      ✅ Attivo: ${user.isActive}`);
      console.log(`      🔒 Password: ${user.password ? 'Presente' : 'Mancante'}`);
    });
    
    console.log('\n3. 🔍 Ricerca utenti con ruolo ADMIN...');
    
    const adminUsers = allUsers.filter(user => 
      user.globalRole && user.globalRole.toLowerCase().includes('admin')
    );
    
    if (adminUsers.length > 0) {
      console.log(`   ✅ Trovati ${adminUsers.length} utenti admin:`);
      adminUsers.forEach((admin, index) => {
        console.log(`\n   🔑 Admin ${index + 1}:`);
        console.log(`      📧 Email: ${admin.email}`);
        console.log(`      👤 Username: ${admin.username}`);
        console.log(`      🔑 Ruolo: ${admin.globalRole}`);
        console.log(`      ✅ Attivo: ${admin.isActive}`);
      });
    } else {
      console.log('   ❌ Nessun utente con ruolo admin trovato');
    }
    
    console.log('\n4. 🧪 Test password Admin123! su TUTTI gli utenti...');
    
    for (const user of allUsers) {
      if (user.password) {
        try {
          const isValid = await bcrypt.compare('Admin123!', user.password);
          if (isValid) {
            console.log(`   ✅ Password Admin123! valida per: ${user.email} (${user.username})`);
          }
        } catch (error) {
          console.log(`   ⚠️  Errore test password per ${user.email}: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Errore durante la verifica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('\n🎯 OBIETTIVI DEL TEST:');
console.log('- Verificare se admin@example.com esiste nel database');
console.log('- Controllare se la password Admin123! è corretta');
console.log('- Trovare tutti gli utenti disponibili');
console.log('- Identificare utenti con privilegi admin');

console.log('\n🚀 Avvio verifica credenziali...');
verifyAdminCredentials();