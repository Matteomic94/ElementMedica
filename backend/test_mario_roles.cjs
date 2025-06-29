/**
 * Test per verificare i ruoli di mario.rossi e identificare il problema del 500
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('🔍 TEST RUOLI MARIO ROSSI');
console.log('============================================================');
console.log('');

async function testMarioRoles() {
  try {
    console.log('1. 🔍 Ricerca mario.rossi con tutti i dati...');
    
    const person = await prisma.person.findUnique({
      where: { email: 'mario.rossi@acme-corp.com' },
      include: {
        personRoles: true,
        company: true,
        tenant: true
      }
    });
    
    if (!person) {
      console.log('   ❌ Utente mario.rossi@acme-corp.com non trovato');
      return;
    }
    
    console.log('   ✅ Utente trovato:');
    console.log(`      📧 Email: ${person.email}`);
    console.log(`      👤 Username: ${person.username}`);
    console.log(`      🏷️  Nome: ${person.name}`);
    console.log(`      🔑 Ruolo: ${person.role}`);
    console.log(`      ✅ Attivo: ${person.isActive}`);
    console.log(`      🏢 Company: ${person.company ? person.company.name : 'Nessuna'}`);
    console.log(`      🏠 Tenant: ${person.tenant ? person.tenant.name : 'Nessuno'}`);
    console.log('');
    
    console.log('2. 🔍 Analisi PersonRoles...');
    console.log(`   📊 Numero personRoles: ${person.personRoles ? person.personRoles.length : 'NULL/UNDEFINED'}`);
    
    if (!person.personRoles) {
      console.log('   ❌ PROBLEMA IDENTIFICATO: personRoles è NULL/UNDEFINED');
      console.log('   🔧 Questo causa l\'errore 500 in generateTokens()');
    } else if (person.personRoles.length === 0) {
      console.log('   ⚠️  personRoles è un array vuoto');
    } else {
      console.log('   ✅ PersonRoles presenti:');
      person.personRoles.forEach((pr, index) => {
        console.log(`      ${index + 1}. Ruolo: ${pr.roleType || 'N/A'}`);
        console.log(`         Is Active: ${pr.isActive}`);
        console.log(`         Is Primary: ${pr.isPrimary}`);
      });
    }
    
    console.log('');
    console.log('3. 🧪 Simulazione generateTokens...');
    
    try {
      // Simula quello che fa generateTokens
      const roles = person.personRoles.map(pr => pr.roleType);
      console.log(`   ✅ Roles estratti: [${roles.join(', ')}]`);
    } catch (error) {
      console.log(`   ❌ ERRORE in map(): ${error.message}`);
      console.log('   🔧 Questo è il problema che causa il 500!');
    }
    
    console.log('');
    console.log('4. 🔍 Verifica struttura database PersonRole...');
    
    const allPersonRoles = await prisma.personRole.findMany({
      where: { personId: person.id }
    });
    
    console.log(`   📊 PersonRoles trovati per questo utente: ${allPersonRoles.length}`);
    
    if (allPersonRoles.length === 0) {
      console.log('   ❌ Nessun PersonRole trovato per questo utente');
      console.log('   🔧 SOLUZIONE: Creare un PersonRole per questo utente');
    } else {
      allPersonRoles.forEach((pr, index) => {
        console.log(`      ${index + 1}. PersonRole ID: ${pr.id}`);
        console.log(`         Role Type: ${pr.roleType}`);
        console.log(`         Is Active: ${pr.isActive}`);
        console.log(`         Is Primary: ${pr.isPrimary}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testMarioRoles();