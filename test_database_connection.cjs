#!/usr/bin/env node

/**
 * Test per verificare se il database è accessibile e le query funzionano
 * Questo aiuta a capire se il problema è nel database o nel middleware
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
    console.log('🔍 TEST CONNESSIONE DATABASE');
    console.log('========================================');
    
    try {
        // Test 1: Connessione base
        console.log('📝 Test 1: Connessione database...');
        const startTime1 = Date.now();
        await prisma.$connect();
        const duration1 = Date.now() - startTime1;
        console.log(`✅ Connessione OK in ${duration1}ms`);
        
        // Test 2: Query semplice
        console.log('\n📝 Test 2: Query semplice...');
        const startTime2 = Date.now();
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        const duration2 = Date.now() - startTime2;
        console.log(`✅ Query semplice OK in ${duration2}ms:`, result);
        
        // Test 3: Query person (come nel middleware)
        console.log('\n📝 Test 3: Query person (mario.rossi)...');
        const startTime3 = Date.now();
        const person = await prisma.person.findUnique({
            where: { email: 'mario.rossi@acme-corp.com' }
        });
        const duration3 = Date.now() - startTime3;
        console.log(`✅ Query person OK in ${duration3}ms`);
        console.log(`👤 Person found: ${person?.email} (ID: ${person?.id})`);
        
        if (!person) {
            console.log('❌ Person non trovata!');
            return;
        }
        
        // Test 4: Query personRole (come nel middleware)
        console.log('\n📝 Test 4: Query personRole...');
        const startTime4 = Date.now();
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
        const duration4 = Date.now() - startTime4;
        console.log(`✅ Query personRole OK in ${duration4}ms`);
        console.log(`🎭 Roles found: ${personRoles.length}`);
        
        // Test 5: Query company (come nel middleware)
        if (person.companyId) {
            console.log('\n📝 Test 5: Query company...');
            const startTime5 = Date.now();
            const company = await prisma.company.findUnique({
                where: { id: person.companyId }
            });
            const duration5 = Date.now() - startTime5;
            console.log(`✅ Query company OK in ${duration5}ms`);
            console.log(`🏢 Company: ${company?.name}`);
        }
        
        // Test 6: Query tenant (come nel middleware)
        if (person.tenantId) {
            console.log('\n📝 Test 6: Query tenant...');
            const startTime6 = Date.now();
            const tenant = await prisma.tenant.findUnique({
                where: { id: person.tenantId }
            });
            const duration6 = Date.now() - startTime6;
            console.log(`✅ Query tenant OK in ${duration6}ms`);
            console.log(`🏛️ Tenant: ${tenant?.name}`);
        }
        
        // Test 7: Update lastLogin (come nel middleware)
        console.log('\n📝 Test 7: Update lastLogin...');
        const startTime7 = Date.now();
        await prisma.person.update({
            where: { id: person.id },
            data: { lastLogin: new Date() }
        });
        const duration7 = Date.now() - startTime7;
        console.log(`✅ Update lastLogin OK in ${duration7}ms`);
        
        console.log('\n🎉 TUTTI I TEST DATABASE COMPLETATI CON SUCCESSO!');
        console.log('🔍 Il database funziona correttamente');
        console.log('🚨 Il problema è nel MIDDLEWARE, non nel database');
        
    } catch (error) {
        console.log('❌ Errore durante test database:', error.message);
        console.log('🔍 Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Esegui il test
testDatabaseConnection();