#!/usr/bin/env node

/**
 * Test diretto del middleware authenticate per identificare il blocco
 * Simula l'esecuzione step-by-step senza passare attraverso il server
 */

const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const jwt = require('jsonwebtoken');

// Configurazione
const API_BASE_URL = 'http://127.0.0.1:4001';
const CREDENTIALS = {
    identifier: 'mario.rossi@acme-corp.com',
    password: 'Password123!'
};

// Inizializza Prisma
const prisma = new PrismaClient();

// Simula JWTService.verifyAccessToken
function simulateJWTVerify(token) {
    try {
        console.log('🔍 [DIRECT TEST] Simulando verifica JWT...');
        
        // Decodifica senza verifica per vedere il contenuto
        const decoded = jwt.decode(token);
        console.log('✅ [DIRECT TEST] Token decodificato:');
        console.log(`   userId: ${decoded.userId}`);
        console.log(`   personId: ${decoded.personId}`);
        console.log(`   email: ${decoded.email}`);
        
        // Verifica se il token è scaduto
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
            console.log('❌ [DIRECT TEST] Token scaduto!');
            return null;
        }
        
        console.log('✅ [DIRECT TEST] Token valido');
        return decoded;
        
    } catch (error) {
        console.log('❌ [DIRECT TEST] Errore nella decodifica JWT:', error.message);
        return null;
    }
}

// Test diretto delle query database
async function testDatabaseQueries(userId) {
    console.log('\n🔍 [DIRECT TEST] ===== TEST QUERY DATABASE =====');
    
    try {
        // Test 1: Query person
        console.log('🔍 [DIRECT TEST] Step 1: Query person...');
        const startPersonQuery = Date.now();
        
        const person = await prisma.person.findUnique({
            where: { id: userId }
        });
        
        const personQueryTime = Date.now() - startPersonQuery;
        console.log(`✅ [DIRECT TEST] Step 1 completato in ${personQueryTime}ms`);
        
        if (!person) {
            console.log('❌ [DIRECT TEST] Person non trovata');
            return false;
        }
        console.log(`🔍 [DIRECT TEST] Person trovata: ${person.email}`);
        
        // Test 2: Query person roles
        console.log('\n🔍 [DIRECT TEST] Step 2: Query person roles...');
        const startRolesQuery = Date.now();
        
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
        
        const rolesQueryTime = Date.now() - startRolesQuery;
        console.log(`✅ [DIRECT TEST] Step 2 completato in ${rolesQueryTime}ms`);
        console.log(`🔍 [DIRECT TEST] Trovati ${personRoles.length} ruoli`);
        
        // Test 3: Query company
        console.log('\n🔍 [DIRECT TEST] Step 3: Query company...');
        const startCompanyQuery = Date.now();
        
        const company = person?.companyId ? await prisma.company.findUnique({
            where: { id: person.companyId }
        }) : null;
        
        const companyQueryTime = Date.now() - startCompanyQuery;
        console.log(`✅ [DIRECT TEST] Step 3 completato in ${companyQueryTime}ms`);
        
        // Test 4: Query tenant
        console.log('\n🔍 [DIRECT TEST] Step 4: Query tenant...');
        const startTenantQuery = Date.now();
        
        const tenant = person?.tenantId ? await prisma.tenant.findUnique({
            where: { id: person.tenantId }
        }) : null;
        
        const tenantQueryTime = Date.now() - startTenantQuery;
        console.log(`✅ [DIRECT TEST] Step 4 completato in ${tenantQueryTime}ms`);
        
        // Test 5: Update last login (simula quello che fa il middleware)
        console.log('\n🔍 [DIRECT TEST] Step 5: Test update last login...');
        const startUpdateQuery = Date.now();
        
        // NON facciamo l'update reale per non modificare i dati
        // await prisma.person.update({
        //     where: { id: person.id },
        //     data: { lastLogin: new Date() }
        // });
        
        // Simula il tempo di update
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const updateQueryTime = Date.now() - startUpdateQuery;
        console.log(`✅ [DIRECT TEST] Step 5 completato in ${updateQueryTime}ms (simulato)`);
        
        console.log('\n✅ [DIRECT TEST] Tutte le query database completate con successo!');
        return true;
        
    } catch (error) {
        console.log('❌ [DIRECT TEST] Errore nelle query database:', error.message);
        console.log('❌ [DIRECT TEST] Stack:', error.stack);
        return false;
    }
}

// Test connessione database
async function testDatabaseConnection() {
    console.log('🔍 [DIRECT TEST] ===== TEST CONNESSIONE DATABASE =====');
    
    try {
        const startTime = Date.now();
        
        // Test semplice connessione
        await prisma.$queryRaw`SELECT 1 as test`;
        
        const connectionTime = Date.now() - startTime;
        console.log(`✅ [DIRECT TEST] Connessione database OK in ${connectionTime}ms`);
        return true;
        
    } catch (error) {
        console.log('❌ [DIRECT TEST] Errore connessione database:', error.message);
        return false;
    }
}

async function runDirectTest() {
    console.log('🔍 [DIRECT TEST] ===== TEST DIRETTO MIDDLEWARE =====');
    console.log('🔍 [DIRECT TEST] Questo test bypassa il server e testa direttamente le operazioni');
    console.log('========================================\n');
    
    try {
        // Step 1: Test connessione database
        const dbConnected = await testDatabaseConnection();
        if (!dbConnected) {
            console.log('🚨 [DIRECT TEST] PROBLEMA: Database non raggiungibile');
            return;
        }
        
        // Step 2: Ottieni token tramite login
        console.log('\n🔍 [DIRECT TEST] ===== OTTENIMENTO TOKEN =====');
        const axios = require('axios');
        
        const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, CREDENTIALS, {
            timeout: 10000
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ [DIRECT TEST] Login fallito:', loginResponse.data.message);
            return;
        }
        
        const accessToken = loginResponse.data.data.accessToken;
        console.log('✅ [DIRECT TEST] Token ottenuto');
        
        // Step 3: Verifica JWT
        const decoded = simulateJWTVerify(accessToken);
        if (!decoded) {
            console.log('❌ [DIRECT TEST] Verifica JWT fallita');
            return;
        }
        
        // Step 4: Test query database
        const dbQueriesOk = await testDatabaseQueries(decoded.userId);
        
        if (dbQueriesOk) {
            console.log('\n🎯 [DIRECT TEST] CONCLUSIONE:');
            console.log('✅ [DIRECT TEST] Tutte le operazioni del middleware funzionano correttamente');
            console.log('🔍 [DIRECT TEST] Il problema è probabilmente:');
            console.log('   1. Il middleware non viene mai chiamato');
            console.log('   2. C\'è un problema nel routing delle richieste');
            console.log('   3. Il server è bloccato prima di arrivare al middleware');
            console.log('   4. C\'è un deadlock o timeout a livello di connessione HTTP');
        } else {
            console.log('\n🚨 [DIRECT TEST] PROBLEMA IDENTIFICATO nelle query database!');
        }
        
    } catch (error) {
        console.log('❌ [DIRECT TEST] Errore durante il test:', error.message);
        if (error.response) {
            console.log(`📋 [DIRECT TEST] Status: ${error.response.status}`);
            console.log(`📄 [DIRECT TEST] Response: ${JSON.stringify(error.response.data)}`);
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Esegui il test
runDirectTest();