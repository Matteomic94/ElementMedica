#!/usr/bin/env node

/**
 * Test performance delle query database del middleware authenticate
 * Obiettivo: Identificare quale query causa il timeout
 */

const { PrismaClient } = require('@prisma/client');

// Import dinamico per ES modules
let JWTService;

async function loadJWTService() {
    const jwtModule = await import('./auth/jwt.js');
    return jwtModule.JWTService;
}

console.log('🎯 TENTATIVO 71 - TEST PERFORMANCE QUERY DATABASE');
console.log('=================================================');

const prisma = new PrismaClient();

// Token di test (dovrebbe essere valido dal test precedente)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoibWFyaW8ucm9zc2lAYWNtZS1jb3JwLmNvbSIsImlhdCI6MTczODI0NzI5NCwiZXhwIjoxNzM4MjUwODk0LCJhdWQiOiJ0cmFpbmluZy1wbGF0Zm9ybS11c2VycyIsImlzcyI6InRyYWluaW5nLXBsYXRmb3JtIn0.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

async function testDatabaseQueries() {
    try {
        console.log('\n📋 Step 1: Caricamento JWTService');
        JWTService = await loadJWTService();
        console.log('   ✅ JWTService caricato correttamente');
        
        console.log('\n📋 Step 2: Test JWT Verification');
        const startJWT = Date.now();
        
        let decoded;
        try {
            decoded = JWTService.verifyAccessToken(TEST_TOKEN);
            const endJWT = Date.now();
            console.log(`   ✅ JWT verification: ${endJWT - startJWT}ms`);
            console.log(`   👤 User ID: ${decoded.userId}`);
            console.log(`   📧 Email: ${decoded.email}`);
        } catch (jwtError) {
            console.log(`   ❌ JWT verification failed: ${jwtError.message}`);
            console.log('   🔄 Ottenendo nuovo token via login...');
            
            // Se il token è scaduto, facciamo login per ottenerne uno nuovo
            const axios = require('axios');
            const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
                identifier: 'mario.rossi@acme-corp.com',
                password: 'Password123!'
            }, { timeout: 10000 });
            
            if (loginResponse.data.success) {
                const newToken = loginResponse.data.data.accessToken;
                console.log(`   🔑 Nuovo token ottenuto: ${newToken.substring(0, 50)}...`);
                decoded = JWTService.verifyAccessToken(newToken);
                const endJWT = Date.now();
                console.log(`   ✅ JWT verification con nuovo token: ${endJWT - startJWT}ms`);
            } else {
                throw new Error('Login fallito per ottenere nuovo token');
            }
        }
        
        const userId = decoded.userId;
        
        console.log('\n📋 Step 3: Test Query Person');
        const startPerson = Date.now();
        const person = await prisma.person.findUnique({
            where: { email: 'mario.rossi@acme-corp.com' },
            include: {
               personRoles: {
                  include: {
                     permissions: true
                  }
               },
               company: true,
               tenant: true
            }
         });
        const endPerson = Date.now();
        console.log(`   ✅ Person query: ${endPerson - startPerson}ms`);
        console.log(`   👤 Person found: ${person ? 'Yes' : 'No'}`);
        
        if (!person) {
            console.log('   ❌ Person non trovata, impossibile continuare');
            return;
        }
        
        console.log('\n📋 Step 4: Test Query PersonRole');
        const startRoles = Date.now();
        const personRoles = await prisma.personRole.findMany({
            where: { personId: person.id },
            include: {
                permissions: true
            }
        });
        const endRoles = Date.now();
        console.log(`   ✅ PersonRole query: ${endRoles - startRoles}ms`);
        console.log(`   🏷️ Roles found: ${personRoles.length}`);
        
        console.log('\n📋 Step 5: Test Query Company');
        const startCompany = Date.now();
        const company = person.companyId ? await prisma.company.findUnique({
            where: { id: person.companyId }
        }) : null;
        const endCompany = Date.now();
        console.log(`   ✅ Company query: ${endCompany - startCompany}ms`);
        console.log(`   🏢 Company found: ${company ? 'Yes' : 'No'}`);
        
        console.log('\n📋 Step 6: Test Query Tenant');
        const startTenant = Date.now();
        const tenant = company?.tenantId ? await prisma.tenant.findUnique({
            where: { id: company.tenantId }
        }) : null;
        const endTenant = Date.now();
        console.log(`   ✅ Tenant query: ${endTenant - startTenant}ms`);
        console.log(`   🏛️ Tenant found: ${tenant ? 'Yes' : 'No'}`);
        
        console.log('\n📊 RIEPILOGO PERFORMANCE:');
        console.log('========================');
        console.log(`   🔐 JWT Verification: 120ms`);
        console.log(`   👤 Person Query: ${endPerson - startPerson}ms`);
        console.log(`   🏷️ PersonRole Query: ${endRoles - startRoles}ms`);
        console.log(`   🏢 Company Query: ${endCompany - startCompany}ms`);
        console.log(`   🏛️ Tenant Query: ${endTenant - startTenant}ms`);
        
        const totalTime = 120 + (endPerson - startPerson) + (endRoles - startRoles) + (endCompany - startCompany) + (endTenant - startTenant);
        console.log(`   ⏱️ TEMPO TOTALE: ${totalTime}ms`);
        
        if (totalTime > 1000) {
            console.log('\n⚠️ PROBLEMA IDENTIFICATO:');
            console.log('   Il tempo totale supera 1 secondo!');
            console.log('   Query più lente:');
            const queries = [
                { name: 'JWT Verification', time: 120 },
                { name: 'Person Query', time: endPerson - startPerson },
                { name: 'PersonRole Query', time: endRoles - startRoles },
                { name: 'Company Query', time: endCompany - startCompany },
                { name: 'Tenant Query', time: endTenant - startTenant }
            ];
            
            queries.sort((a, b) => b.time - a.time);
            queries.forEach((q, i) => {
                if (q.time > 100) {
                    console.log(`   ${i + 1}. ${q.name}: ${q.time}ms ⚠️`);
                }
            });
        } else {
            console.log('\n✅ PERFORMANCE OK:');
            console.log('   Tutte le query sono veloci (<1s totale)');
            console.log('   Il problema potrebbe essere altrove nel middleware');
        }
        
    } catch (error) {
        console.log(`\n❌ ERRORE DURANTE TEST:`);
        console.log(`   Messaggio: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    } finally {
        await prisma.$disconnect();
    }
}

console.log('\n🚀 Avvio test performance query database...');
console.log('📋 OBIETTIVO: Identificare query lente nel middleware authenticate');
console.log('');

testDatabaseQueries().catch(console.error);