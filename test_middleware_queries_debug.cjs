const { prisma } = require('./backend/config/prisma-optimization.js');
const { JWTService } = require('./backend/auth/jwt.js');

// Test per verificare le query del middleware che potrebbero causare timeout
async function testMiddlewareQueries() {
  console.log('🔍 ATTEMPT 107 - TEST MIDDLEWARE QUERIES DEBUG');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Ottieni un token valido
    console.log('\n📝 Step 1: Getting valid token...');
    const axios = require('axios');
    
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const accessToken = loginResponse.data.data?.accessToken;
    console.log('✅ Token obtained:', accessToken.substring(0, 20) + '...');
    
    // Step 2: Verifica il token JWT
    console.log('\n📝 Step 2: Verifying JWT token...');
    const startJWT = Date.now();
    
    const decoded = JWTService.verifyAccessToken(accessToken);
    const jwtTime = Date.now() - startJWT;
    
    console.log('✅ JWT verification time:', jwtTime + 'ms');
    console.log('✅ Decoded userId:', decoded.userId || decoded.personId);
    
    const userId = decoded.userId || decoded.personId;
    
    // Step 3: Query Person (prima query del middleware)
    console.log('\n📝 Step 3: Testing Person query...');
    const startPerson = Date.now();
    
    const person = await prisma.person.findUnique({
      where: { id: userId }
    });
    
    const personTime = Date.now() - startPerson;
    console.log('✅ Person query time:', personTime + 'ms');
    console.log('✅ Person found:', person ? 'Yes' : 'No');
    
    if (!person) {
      throw new Error('Person not found');
    }
    
    // Step 4: Query PersonRole (seconda query del middleware)
    console.log('\n📝 Step 4: Testing PersonRole query...');
    const startRoles = Date.now();
    
    const personRoles = await prisma.personRole.findMany({
      where: { 
        personId: person.id,
        isActive: true 
      },
      include: {
        company: true,
        tenant: true
      }
    });
    
    const rolesTime = Date.now() - startRoles;
    console.log('✅ PersonRole query time:', rolesTime + 'ms');
    console.log('✅ Roles found:', personRoles.length);
    
    // Step 5: Query Company (terza query del middleware)
    console.log('\n📝 Step 5: Testing Company query...');
    const startCompany = Date.now();
    
    const company = person?.companyId ? await prisma.company.findUnique({
      where: { id: person.companyId }
    }) : null;
    
    const companyTime = Date.now() - startCompany;
    console.log('✅ Company query time:', companyTime + 'ms');
    console.log('✅ Company found:', company ? 'Yes' : 'No');
    
    // Step 6: Query Tenant (quarta query del middleware)
    console.log('\n📝 Step 6: Testing Tenant query...');
    const startTenant = Date.now();
    
    const tenant = person?.tenantId ? await prisma.tenant.findUnique({
      where: { id: person.tenantId }
    }) : null;
    
    const tenantTime = Date.now() - startTenant;
    console.log('✅ Tenant query time:', tenantTime + 'ms');
    console.log('✅ Tenant found:', tenant ? 'Yes' : 'No');
    
    // Step 7: Test query di update (se non è verify endpoint)
    console.log('\n📝 Step 7: Testing lastLogin update query...');
    const startUpdate = Date.now();
    
    // Simula l'update che fa il middleware (solo se non è verify endpoint)
    // await prisma.person.update({
    //   where: { id: person.id },
    //   data: { lastLogin: new Date() }
    // });
    
    console.log('⏭️ Update query skipped (verify endpoint optimization)');
    
    // Riepilogo tempi
    const totalTime = jwtTime + personTime + rolesTime + companyTime + tenantTime;
    
    console.log('\n📊 TIMING SUMMARY:');
    console.log('🔍 JWT verification:', jwtTime + 'ms');
    console.log('🔍 Person query:', personTime + 'ms');
    console.log('🔍 PersonRole query:', rolesTime + 'ms');
    console.log('🔍 Company query:', companyTime + 'ms');
    console.log('🔍 Tenant query:', tenantTime + 'ms');
    console.log('🔍 Total time:', totalTime + 'ms');
    
    if (totalTime > 5000) {
      console.log('🚨 SLOW QUERIES DETECTED - Total time > 5 seconds');
    } else {
      console.log('✅ All queries are fast - Problem might be elsewhere');
    }
    
  } catch (error) {
    console.log('\n❌ TEST FAILED!');
    console.log('❌ Error:', error.message);
    console.log('❌ Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il test
testMiddlewareQueries().catch(console.error);