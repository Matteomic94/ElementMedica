/**
 * Test per verificare se admin@example.com esiste nel database
 * e testare le credenziali admin@example.com / Admin123!
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const axios = require('axios');
require('dotenv').config();

const prisma = new PrismaClient();

console.log('🧪 TEST CREDENZIALI ADMIN');
console.log('============================================================');
console.log('');
console.log('🎯 OBIETTIVI:');
console.log('- Verificare se admin@example.com esiste nel database');
console.log('- Testare password Admin123! se l\'utente esiste');
console.log('- Testare login API con admin@example.com / Admin123!');
console.log('');

async function testAdminCredentials() {
  try {
    console.log('1. 🔍 Ricerca admin@example.com nel database...');
    
    const adminUser = await prisma.person.findFirst({
      where: {
        OR: [
          { email: 'admin@example.com' },
          { username: 'admin@example.com' },
          { taxCode: 'admin@example.com' }
        ]
      },
      include: {
        personRoles: {
          where: {
            isActive: true
          }
        }
      }
    });
    
    if (!adminUser) {
      console.log('   ❌ admin@example.com NON TROVATO nel database');
      console.log('');
      console.log('📋 Ricerca utenti con "admin" nel nome/email...');
      
      const adminLikeUsers = await prisma.person.findMany({
        where: {
          OR: [
            { email: { contains: 'admin', mode: 'insensitive' } },
            { username: { contains: 'admin', mode: 'insensitive' } },
            { firstName: { contains: 'admin', mode: 'insensitive' } },
            { lastName: { contains: 'admin', mode: 'insensitive' } }
          ]
        },
        include: {
          personRoles: {
            where: {
              isActive: true
            }
          }
        }
      });
      
      if (adminLikeUsers.length > 0) {
        console.log(`   ✅ Trovati ${adminLikeUsers.length} utenti con "admin":`);
        adminLikeUsers.forEach((user, index) => {
          console.log(`      ${index + 1}. 📧 ${user.email || 'N/A'}`);
          console.log(`         👤 Username: ${user.username || 'N/A'}`);
          console.log(`         🏷️  Nome: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
          console.log(`         🔑 Ruoli: [${user.personRoles.map(r => r.roleType).join(', ') || 'Nessuno'}]`);
          console.log(`         🔒 Password: ${user.password ? 'Presente' : 'Mancante'}`);
          console.log('');
        });
      } else {
        console.log('   ❌ Nessun utente con "admin" trovato');
      }
      
      console.log('📋 Ricerca utenti con ruoli ADMIN...');
      
      const adminRoleUsers = await prisma.person.findMany({
        where: {
          personRoles: {
            some: {
              roleType: {
                in: ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'TENANT_ADMIN']
              },
              isActive: true
            }
          }
        },
        include: {
          personRoles: {
            where: {
              isActive: true
            }
          }
        }
      });
      
      if (adminRoleUsers.length > 0) {
        console.log(`   ✅ Trovati ${adminRoleUsers.length} utenti con ruoli admin:`);
        adminRoleUsers.forEach((user, index) => {
          console.log(`      ${index + 1}. 📧 ${user.email || 'N/A'}`);
          console.log(`         👤 Username: ${user.username || 'N/A'}`);
          console.log(`         🔑 Ruoli: [${user.personRoles.map(r => r.roleType).join(', ')}]`);
          console.log(`         🔒 Password: ${user.password ? 'Presente' : 'Mancante'}`);
          console.log('');
        });
      } else {
        console.log('   ❌ Nessun utente con ruoli admin trovato');
      }
      
    } else {
      console.log('   ✅ admin@example.com TROVATO!');
      console.log(`      📧 Email: ${adminUser.email}`);
      console.log(`      👤 Username: ${adminUser.username || 'N/A'}`);
      console.log(`      🏷️  Nome: ${adminUser.firstName || 'N/A'} ${adminUser.lastName || 'N/A'}`);
      console.log(`      🔑 Ruoli: [${adminUser.personRoles.map(r => r.roleType).join(', ') || 'Nessuno'}]`);
      console.log(`      ✅ Attivo: ${adminUser.isActive}`);
      console.log(`      🔒 Password Hash: ${adminUser.password ? 'Presente' : 'Mancante'}`);
      console.log('');
      
      if (adminUser.password) {
        console.log('2. 🔐 Test password Admin123!...');
        const isValidPassword = await bcrypt.compare('Admin123!', adminUser.password);
        
        if (isValidPassword) {
          console.log('   ✅ Password Admin123! è CORRETTA!');
        } else {
          console.log('   ❌ Password Admin123! è SBAGLIATA');
          console.log('   🔍 Provo altre password comuni...');
          
          const commonPasswords = ['admin', 'Admin123', 'password', 'Password123!', '123456'];
          for (const pwd of commonPasswords) {
            const isValid = await bcrypt.compare(pwd, adminUser.password);
            if (isValid) {
              console.log(`   ✅ Password corretta trovata: ${pwd}`);
              break;
            }
          }
        }
      } else {
        console.log('   ❌ Utente non ha password impostata');
      }
    }
    
    console.log('');
    console.log('3. 🌐 Test login API con admin@example.com / Admin123!...');
    
    try {
      const response = await axios.post('http://localhost:4001/api/v1/auth/login', {
        identifier: 'admin@example.com',
        password: 'Admin123!'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('   ✅ Login API riuscito!');
      console.log(`   📊 Status: ${response.status}`);
      console.log(`   🎫 Access Token: ${response.data.data?.accessToken ? 'Presente' : 'Mancante'}`);
      console.log(`   🔄 Refresh Token: ${response.data.data?.refreshToken ? 'Presente' : 'Mancante'}`);
      console.log(`   👤 User ID: ${response.data.data?.user?.id || 'N/A'}`);
      console.log(`   🔑 Ruoli: [${response.data.data?.user?.roles?.join(', ') || 'N/A'}]`);
      
    } catch (error) {
      console.log('   ❌ Errore login API:');
      console.log(`   📊 Status: ${error.response?.status || 'N/A'}`);
      console.log(`   💬 Messaggio: ${error.response?.data?.message || error.message}`);
      console.log(`   🔍 Dettagli errore:`, error.response?.data || 'Nessun dettaglio');
      
      if (error.response?.status === 401) {
        console.log('');
        console.log('   🔍 ANALISI ERRORE 401:');
        console.log('   - Credenziali non valide');
        console.log('   - admin@example.com potrebbe non esistere');
        console.log('   - Password Admin123! potrebbe essere sbagliata');
      } else if (error.response?.status === 500) {
        console.log('');
        console.log('   🔍 ANALISI ERRORE 500:');
        console.log('   - Errore interno del server');
        console.log('   - Problema con authService o database');
        console.log('   - Verificare i log del server per dettagli');
      }
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminCredentials();