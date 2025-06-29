/**
 * Test dettagliato per identificare la causa esatta dell'errore 500 nel login
 */

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

console.log('🔍 DEBUG LOGIN MARIO ROSSI - STEP BY STEP');
console.log('============================================================');
console.log('');

async function debugLogin() {
  try {
    console.log('1. 🔍 Verifica variabili ambiente...');
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Presente' : 'MANCANTE'}`);
    console.log(`   JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? 'Presente' : 'MANCANTE'}`);
    console.log('');
    
    console.log('2. 🔍 Ricerca utente nel database...');
    const person = await prisma.person.findUnique({
      where: { email: 'mario.rossi@acme-corp.com' },
      include: {
        personRoles: true,
        company: true,
        tenant: true
      }
    });
    
    if (!person) {
      console.log('   ❌ Utente non trovato');
      return;
    }
    
    console.log('   ✅ Utente trovato');
    console.log('');
    
    console.log('3. 🔐 Verifica password...');
    const passwordMatch = await bcrypt.compare('Password123!', person.password);
    console.log(`   Password corretta: ${passwordMatch ? '✅' : '❌'}`);
    
    if (!passwordMatch) {
      console.log('   ❌ Password non corrisponde');
      return;
    }
    console.log('');
    
    console.log('4. 🎫 Test generateTokens step by step...');
    
    try {
      console.log('   4.1 Estrazione ruoli...');
      const roles = person.personRoles.map(pr => pr.roleType);
      console.log(`       Ruoli: [${roles.join(', ')}]`);
      
      console.log('   4.2 Creazione payload...');
      const tokenPayload = {
        userId: person.id,
        personId: person.id,
        email: person.email,
        username: person.username,
        taxCode: person.taxCode,
        companyId: person.companyId,
        tenantId: person.tenantId,
        roles
      };
      console.log('       Payload creato ✅');
      
      console.log('   4.3 Generazione Access Token...');
      const accessToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      console.log('       Access Token generato ✅');
      
      console.log('   4.4 Generazione Refresh Token...');
      const refreshToken = jwt.sign(
        { personId: person.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      console.log('       Refresh Token generato ✅');
      
      console.log('   ✅ generateTokens simulato con successo!');
      
    } catch (tokenError) {
      console.log(`   ❌ ERRORE in generateTokens: ${tokenError.message}`);
      console.log(`   Stack: ${tokenError.stack}`);
      return;
    }
    
    console.log('');
    console.log('5. 🗄️ Test saveRefreshToken...');
    
    try {
      // Simula saveRefreshToken
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      console.log('   5.1 Tentativo inserimento RefreshToken...');
      const refreshTokenRecord = await prisma.refreshToken.create({
        data: {
          token: 'test-refresh-token-' + Date.now(),
          personId: person.id,
          expiresAt: expiresAt,
          userAgent: 'test-user-agent',
          ipAddress: '127.0.0.1'
        }
      });
      
      console.log('   ✅ RefreshToken salvato con successo!');
      
      // Cleanup
      await prisma.refreshToken.delete({
        where: { id: refreshTokenRecord.id }
      });
      
    } catch (refreshError) {
      console.log(`   ❌ ERRORE in saveRefreshToken: ${refreshError.message}`);
      console.log(`   Stack: ${refreshError.stack}`);
      return;
    }
    
    console.log('');
    console.log('6. 📝 Test updateLastLogin...');
    
    try {
      await prisma.person.update({
        where: { id: person.id },
        data: { lastLogin: new Date() }
      });
      
      console.log('   ✅ LastLogin aggiornato con successo!');
      
    } catch (updateError) {
      console.log(`   ❌ ERRORE in updateLastLogin: ${updateError.message}`);
      console.log(`   Stack: ${updateError.stack}`);
      return;
    }
    
    console.log('');
    console.log('🎉 TUTTI I STEP COMPLETATI CON SUCCESSO!');
    console.log('🔍 Il problema potrebbe essere nel middleware o nella gestione degli errori.');
    
  } catch (error) {
    console.error('❌ Errore generale durante il debug:', error.message);
    console.error('Stack completo:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();