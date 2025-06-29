const { PrismaClient } = require('@prisma/client');

console.log('🔍 TEST PRISMA CONNECTION DEBUG');
console.log('===============================\n');

async function testPrismaConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📋 Step 1: Test connessione database base...');
    await prisma.$connect();
    console.log('   ✅ Connessione Prisma stabilita');
    
    console.log('\n📋 Step 2: Test query semplice...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Query raw funziona:', result);
    
    console.log('\n📋 Step 3: Test query person con timeout...');
    const startTime = Date.now();
    
    // Test con timeout manuale
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_MANUAL')), 5000);
    });
    
    const queryPromise = prisma.person.findFirst({
      where: {
        email: 'mario.rossi@acme-corp.com'
      }
    });
    
    try {
      const person = await Promise.race([queryPromise, timeoutPromise]);
      const endTime = Date.now();
      console.log(`   ✅ Query person completata in ${endTime - startTime}ms`);
      console.log('   📋 Person trovata:', person ? 'SÌ' : 'NO');
      if (person) {
        console.log('   📋 Person ID:', person.id);
        console.log('   📋 Person active:', person.isActive);
      }
    } catch (error) {
      const endTime = Date.now();
      if (error.message === 'TIMEOUT_MANUAL') {
        console.log(`   ⏰ TIMEOUT query person dopo ${endTime - startTime}ms`);
        console.log('   🚨 La query person si blocca - PROBLEMA IDENTIFICATO!');
      } else {
        console.log('   ❌ Errore query person:', error.message);
      }
    }
    
    console.log('\n📋 Step 4: Test query personRole con timeout...');
    const startTime2 = Date.now();
    
    const timeoutPromise2 = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_MANUAL')), 5000);
    });
    
    const queryPromise2 = prisma.personRole.findFirst();
    
    try {
      const personRole = await Promise.race([queryPromise2, timeoutPromise2]);
      const endTime2 = Date.now();
      console.log(`   ✅ Query personRole completata in ${endTime2 - startTime2}ms`);
    } catch (error) {
      const endTime2 = Date.now();
      if (error.message === 'TIMEOUT_MANUAL') {
        console.log(`   ⏰ TIMEOUT query personRole dopo ${endTime2 - startTime2}ms`);
      } else {
        console.log('   ❌ Errore query personRole:', error.message);
      }
    }
    
    console.log('\n📋 Step 5: Test query company con timeout...');
    const startTime3 = Date.now();
    
    const timeoutPromise3 = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_MANUAL')), 5000);
    });
    
    const queryPromise3 = prisma.company.findFirst();
    
    try {
      const company = await Promise.race([queryPromise3, timeoutPromise3]);
      const endTime3 = Date.now();
      console.log(`   ✅ Query company completata in ${endTime3 - startTime3}ms`);
    } catch (error) {
      const endTime3 = Date.now();
      if (error.message === 'TIMEOUT_MANUAL') {
        console.log(`   ⏰ TIMEOUT query company dopo ${endTime3 - startTime3}ms`);
      } else {
        console.log('   ❌ Errore query company:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Errore connessione Prisma:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n📋 Connessione Prisma chiusa');
  }
}

testPrismaConnection();