const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Test isolato per verificare dove si blocca il middleware
async function testJWTVerifyIsolated() {
    console.log('🔍 ATTEMPT 106 - TEST JWT VERIFY ISOLATO');
    console.log('=' .repeat(60));
    
    const prisma = new PrismaClient();
    
    try {
        // Step 1: Login per ottenere token
        console.log('\n📝 STEP 1: Ottenimento token valido');
        const axios = require('axios');
        
        const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
            identifier: 'mario.rossi@acme-corp.com',
            password: 'Password123!'
        });
        
        const accessToken = loginResponse.data.data.accessToken;
        console.log('✅ Token ottenuto:', accessToken.substring(0, 50) + '...');
        
        // Step 2: Verifica JWT senza database
        console.log('\n📝 STEP 2: Verifica JWT pura (senza database)');
        const startJWT = Date.now();
        let jwtDuration = 0;
        
        try {
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
            jwtDuration = Date.now() - startJWT;
            console.log(`✅ JWT verificato in ${jwtDuration}ms`);
            console.log('✅ Decoded payload:', {
                userId: decoded.userId,
                personId: decoded.personId,
                email: decoded.email,
                exp: new Date(decoded.exp * 1000).toISOString()
            });
        } catch (error) {
            console.log('❌ ERRORE JWT VERIFY:', error.message);
            return;
        }
        
        // Step 3: Test query database singole
        console.log('\n📝 STEP 3: Test query database singole');
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const personId = decoded.userId || decoded.personId;
        
        let personDuration = 0, rolesDuration = 0, companyDuration = 0, tenantDuration = 0, rawDuration = 0, updateDuration = 0;
        
        // Query 1: Person
        console.log('\n🔍 Query 1: Person lookup');
        const startPerson = Date.now();
        const person = await prisma.person.findUnique({
            where: { id: personId }
        });
        personDuration = Date.now() - startPerson;
        console.log(`✅ Person query completata in ${personDuration}ms`);
        console.log('✅ Person found:', person ? 'YES' : 'NO');
        
        if (!person) {
            console.log('❌ Person non trovata, interrompo test');
            return;
        }
        
        // Query 2: PersonRoles
        console.log('\n🔍 Query 2: PersonRoles lookup');
        const startRoles = Date.now();
        const personRoles = await prisma.personRole.findMany({
            where: {
                personId: person.id,
                isActive: true
            },
            include: {
                permissions: true
            }
        });
        rolesDuration = Date.now() - startRoles;
        console.log(`✅ PersonRoles query completata in ${rolesDuration}ms`);
        console.log('✅ Roles found:', personRoles.length);
        console.log('✅ Role types:', personRoles.map(pr => pr.roleType));
        console.log('✅ Permissions count:', personRoles.reduce((acc, pr) => acc + pr.permissions.length, 0));
        
        // Query 3: Company
        console.log('\n🔍 Query 3: Company lookup');
        const startCompany = Date.now();
        const company = await prisma.company.findUnique({
            where: { id: person.companyId }
        });
        companyDuration = Date.now() - startCompany;
        console.log(`✅ Company query completata in ${companyDuration}ms`);
        console.log('✅ Company found:', company ? 'YES' : 'NO');
        
        // Query 4: Tenant
        console.log('\n🔍 Query 4: Tenant lookup');
        const startTenant = Date.now();
        const tenant = await prisma.tenant.findUnique({
            where: { id: person.tenantId }
        });
        tenantDuration = Date.now() - startTenant;
        console.log(`✅ Tenant query completata in ${tenantDuration}ms`);
        console.log('✅ Tenant found:', tenant ? 'YES' : 'NO');
        
        // Query 5: executeRaw (SOSPETTA)
        console.log('\n🔍 Query 5: executeRaw set_config (SOSPETTA)');
        const startRaw = Date.now();
        try {
            await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${person.id}, true)`;
            rawDuration = Date.now() - startRaw;
            console.log(`✅ executeRaw completata in ${rawDuration}ms`);
        } catch (error) {
            rawDuration = Date.now() - startRaw;
            console.log(`❌ executeRaw FALLITA dopo ${rawDuration}ms:`, error.message);
        }
        
        // Query 6: Update lastLogin (SOSPETTA - era lastActivity nel middleware)
        console.log('\n🔍 Query 6: Update lastLogin (SOSPETTA - era lastActivity nel middleware)');
        const startUpdate = Date.now();
        try {
            await prisma.person.update({
                where: { id: person.id },
                data: { lastLogin: new Date() }
            });
            updateDuration = Date.now() - startUpdate;
            console.log(`✅ Update lastLogin completata in ${updateDuration}ms`);
        } catch (error) {
            updateDuration = Date.now() - startUpdate;
            console.log(`❌ Update lastLogin FALLITA dopo ${updateDuration}ms:`, error.message);
        }
        
        console.log('\n🎯 RIEPILOGO TEMPI:');
        console.log(`- JWT Verify: ${jwtDuration}ms`);
        console.log(`- Person Query: ${personDuration}ms`);
        console.log(`- Roles Query: ${rolesDuration}ms`);
        console.log(`- Company Query: ${companyDuration}ms`);
        console.log(`- Tenant Query: ${tenantDuration}ms`);
        console.log(`- ExecuteRaw: ${rawDuration}ms`);
        console.log(`- Update Query: ${updateDuration}ms`);
        
    } catch (error) {
        console.log('❌ ERRORE GENERALE:', error.message);
        console.log('❌ Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Esegui il test
testJWTVerifyIsolated().catch(console.error);