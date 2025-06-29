/**
 * Test semplice per verificare connessione database
 * ATTEMPT 100 - Verifica credenziali database (versione semplificata)
 */

console.log('🚀 INIZIO TEST DATABASE SEMPLICE');
console.log('Timestamp:', new Date().toISOString());

try {
  console.log('\n1. Importazione Prisma...');
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma importato correttamente');
  
  console.log('\n2. Creazione client Prisma...');
  const prisma = new PrismaClient();
  console.log('✅ Client Prisma creato');
  
  console.log('\n3. Test connessione database...');
  
  async function testConnection() {
    try {
      // Test semplice di connessione
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Connessione database OK:', result);
      
      // Conta utenti
      const userCount = await prisma.person.count();
      console.log(`✅ Numero totale utenti: ${userCount}`);
      
      // Prendi primi 3 utenti
      const users = await prisma.person.findMany({
        take: 3,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true
        }
      });
      
      console.log('\n✅ Primi 3 utenti:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email || user.username} (${user.firstName} ${user.lastName})`);
      });
      
    } catch (error) {
      console.error('❌ Errore database:', error.message);
    } finally {
      await prisma.$disconnect();
      console.log('\n✅ Disconnessione database completata');
    }
  }
  
  testConnection();
  
} catch (error) {
  console.error('❌ Errore generale:', error.message);
  console.error('Stack:', error.stack);
}