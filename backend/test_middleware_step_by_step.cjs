const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testMiddlewareStepByStep() {
    console.log('🔍 TEST MIDDLEWARE STEP-BY-STEP');
    console.log('=====================================');
    
    try {
        // Legge il token valido dal file
        const fs = require('fs');
        let accessToken;
        try {
            accessToken = fs.readFileSync('./valid_token.txt', 'utf8').trim();
            console.log('✅ Token caricato da valid_token.txt');
        } catch (error) {
            console.log('❌ Impossibile leggere valid_token.txt:', error.message);
            return;
        }
        
        console.log('\n📝 STEP 1: Estrazione token dall\'header Authorization');
        const startStep1 = Date.now();
        
        // Simula req.headers.authorization
        const authHeader = `Bearer ${accessToken}`;
        const token = authHeader.split(' ')[1];
        
        const step1Duration = Date.now() - startStep1;
        console.log(`✅ Token estratto in ${step1Duration}ms`);
        console.log(`✅ Token length: ${token.length}`);
        
        console.log('\n📝 STEP 2: Verifica JWT');
        const startStep2 = Date.now();
        let step2Duration = 0;
        
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            step2Duration = Date.now() - startStep2;
            console.log(`✅ JWT verificato in ${step2Duration}ms`);
            console.log(`✅ User ID: ${decoded.userId}`);
        } catch (error) {
            console.log(`❌ JWT VERIFY FALLITO:`, error.message);
            return;
        }
        
        const personId = decoded.userId || decoded.personId;
        
        // Dichiarazione variabili durata
        let step3Duration = 0, step4Duration = 0, step5Duration = 0, step6Duration = 0, step7Duration = 0, step8Duration = 0, step9Duration = 0, step10Duration = 0;
        
        console.log('\n📝 STEP 3: Query Person con include');
        const startStep3 = Date.now();
        
        const person = await prisma.person.findUnique({
            where: { id: personId },
            include: {
                personRoles: {
                    include: {
                        permissions: true
                    }
                }
            }
        });
        
        step3Duration = Date.now() - startStep3;
        console.log(`✅ Person query completata in ${step3Duration}ms`);
        
        if (!person) {
            console.log('❌ Person non trovata');
            return;
        }
        
        console.log('\n📝 STEP 4: Controlli validazione person');
        const startStep4 = Date.now();
        
        // Controlli dal middleware
        if (!person.isActive) {
            console.log('❌ Person non attiva');
            return;
        }
        
        if (person.isDeleted) {
            console.log('❌ Person cancellata');
            return;
        }
        
        if (person.isLocked) {
            console.log('❌ Person bloccata');
            return;
        }
        
        step4Duration = Date.now() - startStep4;
        console.log(`✅ Controlli person completati in ${step4Duration}ms`);
        
        console.log('\n📝 STEP 5: Query Company');
        const startStep5 = Date.now();
        
        const company = await prisma.company.findUnique({
            where: { id: person.companyId }
        });
        
        step5Duration = Date.now() - startStep5;
        console.log(`✅ Company query completata in ${step5Duration}ms`);
        
        console.log('\n📝 STEP 6: Query Tenant');
        const startStep6 = Date.now();
        
        const tenant = await prisma.tenant.findUnique({
            where: { id: person.tenantId }
        });
        
        step6Duration = Date.now() - startStep6;
        console.log(`✅ Tenant query completata in ${step6Duration}ms`);
        
        console.log('\n📝 STEP 7: Set app.current_user_id');
        const startStep7 = Date.now();
        
        try {
            await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${person.id}, true)`;
            step7Duration = Date.now() - startStep7;
            console.log(`✅ set_config completata in ${step7Duration}ms`);
        } catch (error) {
            step7Duration = Date.now() - startStep7;
            console.log(`❌ set_config FALLITA dopo ${step7Duration}ms:`, error.message);
        }
        
        console.log('\n📝 STEP 8: Update lastLogin');
        const startStep8 = Date.now();
        
        try {
            await prisma.person.update({
                where: { id: person.id },
                data: { lastLogin: new Date() }
            });
            step8Duration = Date.now() - startStep8;
            console.log(`✅ Update lastLogin completata in ${step8Duration}ms`);
        } catch (error) {
            step8Duration = Date.now() - startStep8;
            console.log(`❌ Update lastLogin FALLITA dopo ${step8Duration}ms:`, error.message);
        }
        
        console.log('\n📝 STEP 9: Estrazione ruoli e permessi');
        const startStep9 = Date.now();
        
        const roles = person.personRoles.map(pr => pr.roleType);
        const permissions = person.personRoles.reduce((acc, pr) => {
            return acc.concat(pr.permissions.map(p => p.permission));
        }, []);
        
        step9Duration = Date.now() - startStep9;
        console.log(`✅ Estrazione ruoli/permessi completata in ${step9Duration}ms`);
        console.log(`✅ Roles: ${roles.join(', ')}`);
        console.log(`✅ Permissions count: ${permissions.length}`);
        
        console.log('\n📝 STEP 10: Costruzione oggetto user per req');
        const startStep10 = Date.now();
        
        const user = {
            id: person.id,
            email: person.email,
            firstName: person.firstName,
            lastName: person.lastName,
            roles: roles,
            permissions: permissions,
            company: company,
            tenant: tenant
        };
        
        step10Duration = Date.now() - startStep10;
        console.log(`✅ Oggetto user costruito in ${step10Duration}ms`);
        
        console.log('\n🎯 RIEPILOGO COMPLETO:');
        console.log('========================');
        console.log(`- Step 1 (Token extraction): ${step1Duration}ms`);
        console.log(`- Step 2 (JWT verify): ${step2Duration}ms`);
        console.log(`- Step 3 (Person query): ${step3Duration}ms`);
        console.log(`- Step 4 (Person validation): ${step4Duration}ms`);
        console.log(`- Step 5 (Company query): ${step5Duration}ms`);
        console.log(`- Step 6 (Tenant query): ${step6Duration}ms`);
        console.log(`- Step 7 (set_config): ${step7Duration}ms`);
        console.log(`- Step 8 (Update lastLogin): ${step8Duration}ms`);
        console.log(`- Step 9 (Roles/Permissions): ${step9Duration}ms`);
        console.log(`- Step 10 (User object): ${step10Duration}ms`);
        
        const totalDuration = step1Duration + step2Duration + step3Duration + step4Duration + 
                             step5Duration + step6Duration + step7Duration + step8Duration + 
                             step9Duration + step10Duration;
        
        console.log(`\n⏱️ TEMPO TOTALE: ${totalDuration}ms`);
        
        if (totalDuration < 100) {
            console.log('\n✅ CONCLUSIONE: Il middleware dovrebbe essere velocissimo!');
            console.log('❓ Il problema deve essere altrove (middleware precedenti, configurazione server, etc.)');
        } else {
            console.log('\n⚠️ CONCLUSIONE: Qualche step è più lento del previsto');
        }
        
    } catch (error) {
        console.error('❌ ERRORE GENERALE:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testMiddlewareStepByStep();