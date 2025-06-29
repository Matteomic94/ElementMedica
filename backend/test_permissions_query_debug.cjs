/**
 * Test specifico per debug della query permissions che causa timeout
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4001';
const TEST_USER = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

async function testPermissionsQuery() {
  console.log('🔍 TEST DEBUG QUERY PERMISSIONS');
  console.log('=====================================');
  
  try {
    // Step 1: Login per ottenere token
    console.log('\n1. 🔑 Login per ottenere token...');
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: TEST_USER.identifier,
      password: TEST_USER.password
    }, {
      timeout: 10000
    });
    
    const authToken = loginResponse.data.data.accessToken;
    const userId = loginResponse.data.data.user.id;
    console.log(`   ✅ Login riuscito - User ID: ${userId}`);
    
    // Step 2: Test query personRole diretta
    console.log('\n2. 🔍 Test query personRole diretta...');
    const startTime = Date.now();
    
    const personRoles = await prisma.personRole.findMany({
      where: {
        personId: userId,
        isActive: true
      },
      include: {
        permissions: true
      }
    });
    
    const queryTime = Date.now() - startTime;
    console.log(`   ✅ Query completata in ${queryTime}ms`);
    console.log(`   📋 Ruoli trovati: ${personRoles.length}`);
    
    personRoles.forEach((role, index) => {
      console.log(`   📋 Ruolo ${index + 1}: ${role.roleType} (${role.permissions.length} permissions)`);
    });
    
    // Step 3: Test query senza include permissions
    console.log('\n3. 🔍 Test query personRole SENZA permissions...');
    const startTime2 = Date.now();
    
    const personRolesSimple = await prisma.personRole.findMany({
      where: {
        personId: userId,
        isActive: true
      }
    });
    
    const queryTime2 = Date.now() - startTime2;
    console.log(`   ✅ Query semplice completata in ${queryTime2}ms`);
    console.log(`   📋 Ruoli trovati: ${personRolesSimple.length}`);
    
    // Step 4: Test query permissions separata
    console.log('\n4. 🔍 Test query permissions separata...');
    const startTime3 = Date.now();
    
    const permissions = await prisma.personRolePermission.findMany({
      where: {
        personRole: {
          personId: userId,
          isActive: true
        }
      }
    });
    
    const queryTime3 = Date.now() - startTime3;
    console.log(`   ✅ Query permissions separata completata in ${queryTime3}ms`);
    console.log(`   📋 Permissions trovate: ${permissions.length}`);
    
    // Step 5: Test endpoint permissions con timeout breve
    console.log('\n5. 🔍 Test endpoint permissions con timeout 5s...');
    try {
      const startTime4 = Date.now();
      const permissionsResponse = await axios.get(`${API_BASE}/api/v1/auth/permissions/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      });
      const endpointTime = Date.now() - startTime4;
      console.log(`   ✅ Endpoint permissions funziona! Tempo: ${endpointTime}ms`);
      console.log(`   📋 Risposta:`, permissionsResponse.data);
    } catch (error) {
      console.log(`   ❌ Endpoint permissions timeout: ${error.message}`);
    }
    
    console.log('\n🎉 RISULTATI:');
    console.log(`   📊 Query personRole con include: ${queryTime}ms`);
    console.log(`   📊 Query personRole semplice: ${queryTime2}ms`);
    console.log(`   📊 Query permissions separata: ${queryTime3}ms`);
    
    if (queryTime > 5000) {
      console.log('   🚨 PROBLEMA: Query personRole con include è troppo lenta!');
    } else {
      console.log('   ✅ Query database sono veloci - problema altrove');
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissionsQuery().catch(console.error);