/**
 * Test step-by-step del middleware authenticate
 * Questo test modifica temporaneamente il middleware per vedere dove si blocca
 */

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TEST_PORT = 4002;

async function createStepByStepServer() {
    const app = express();
    
    app.use(express.json());
    
    // Logging per debug
    app.use((req, res, next) => {
        console.log(`🔍 [STEP] ${req.method} ${req.path}`);
        next();
    });
    
    // Middleware authenticate modificato per debug step-by-step
    const authenticateStepByStep = async (req, res, next) => {
        console.log('\n🔍 [AUTH DEBUG] ===== AUTHENTICATE START =====');
        console.log(`🔍 [AUTH DEBUG] Request: ${req.method} ${req.path}`);
        console.log(`🔍 [AUTH DEBUG] Timestamp: ${new Date().toISOString()}`);
        
        try {
            // Step 1: Extract token
            console.log('🔍 [AUTH DEBUG] Step 1: Extracting token...');
            const authHeader = req.headers.authorization;
            let token = null;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
            
            console.log(`✅ [AUTH DEBUG] Step 1 completed - Token: ${token ? 'present' : 'missing'}`);
            
            if (!token) {
                console.log('❌ [AUTH DEBUG] No token provided, returning 401');
                return res.status(401).json({
                    error: 'No token provided',
                    code: 'AUTH_TOKEN_MISSING'
                });
            }
            
            // Step 2: Verify JWT (SIMULATO - non facciamo la verifica reale)
            console.log('🔍 [AUTH DEBUG] Step 2: Simulating JWT verification...');
            await new Promise(resolve => setTimeout(resolve, 100)); // Simula delay
            console.log('✅ [AUTH DEBUG] Step 2 completed - JWT verification simulated');
            
            // Step 3: Database query (SIMULATO - non facciamo query reali)
            console.log('🔍 [AUTH DEBUG] Step 3: Simulating database queries...');
            await new Promise(resolve => setTimeout(resolve, 200)); // Simula delay
            console.log('✅ [AUTH DEBUG] Step 3 completed - Database queries simulated');
            
            // Step 4: Attach user
            console.log('🔍 [AUTH DEBUG] Step 4: Attaching user to request...');
            req.user = {
                id: 'debug-user-id',
                personId: 'debug-person-id',
                email: 'debug@test.com',
                username: 'debuguser',
                firstName: 'Debug',
                lastName: 'User',
                companyId: 'debug-company',
                tenantId: 'debug-tenant',
                roles: ['USER'],
                company: { id: 'debug-company', name: 'Debug Company' },
                tenant: { id: 'debug-tenant', name: 'Debug Tenant' },
                isVerified: true
            };
            console.log('✅ [AUTH DEBUG] Step 4 completed - User attached');
            
            console.log('✅ [AUTH DEBUG] ===== AUTHENTICATE SUCCESS =====\n');
            next();
            
        } catch (error) {
            console.log('❌ [AUTH DEBUG] ===== AUTHENTICATE ERROR =====');
            console.log(`❌ [AUTH DEBUG] Error: ${error.message}`);
            console.log('❌ [AUTH DEBUG] ===== AUTHENTICATE ERROR END =====\n');
            
            return res.status(401).json({
                error: 'Authentication failed',
                code: 'AUTH_ERROR'
            });
        }
    };
    
    // Endpoint /verify con middleware debug
    app.get('/api/v1/auth/verify', authenticateStepByStep, async (req, res) => {
        console.log('🔍 [VERIFY HANDLER] Handler chiamato');
        try {
            const user = req.user;
            
            res.json({
                valid: true,
                user: {
                    id: user.id,
                    personId: user.personId,
                    email: user.email,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    companyId: user.companyId,
                    tenantId: user.tenantId,
                    roles: user.roles,
                    company: user.company,
                    tenant: user.tenant,
                    isVerified: user.isVerified
                },
                permissions: user.roles,
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ [VERIFY HANDLER] Risposta inviata');
        } catch (error) {
            console.error('❌ [VERIFY HANDLER] Errore:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    
    return app;
}

async function testStepByStep() {
    console.log('🧪 Test Step-by-Step Middleware Authenticate');
    console.log('============================================\n');
    
    const app = await createStepByStepServer();
    const server = app.listen(TEST_PORT, () => {
        console.log(`🚀 Server step-by-step avviato su porta ${TEST_PORT}\n`);
    });
    
    try {
        // Test 1: Senza token
        console.log('1️⃣ Test /verify senza token...');
        try {
            const response = await axios.get(`http://localhost:${TEST_PORT}/api/v1/auth/verify`, {
                timeout: 10000
            });
            console.log(`   Status: ${response.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ Status: ${error.response.status} - ${error.response.data?.error}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT - Problema anche con middleware simulato!');
            } else {
                console.log(`   ❌ Errore: ${error.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 2: Con token
        console.log('2️⃣ Test /verify con token...');
        try {
            const response = await axios.get(`http://localhost:${TEST_PORT}/api/v1/auth/verify`, {
                headers: {
                    'Authorization': 'Bearer fake-token-for-testing'
                },
                timeout: 10000
            });
            console.log(`   ✅ Status: ${response.status}`);
            console.log('\n🎯 CONCLUSIONE: Il middleware authenticate funziona quando simulato!');
            console.log('🎯 Il problema È nelle query al database o nel JWTService!');
        } catch (error) {
            if (error.response) {
                console.log(`   Status: ${error.response.status} - ${error.response.data?.error}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT - Problema anche con middleware simulato!');
                console.log('\n🎯 CONCLUSIONE: Il problema NON è nel database o JWTService!');
                console.log('🎯 Il problema È nel middleware stesso o nel routing!');
            } else {
                console.log(`   ❌ Errore: ${error.message}`);
            }
        }
        
    } finally {
        server.close();
        console.log('\n🔚 Server step-by-step chiuso');
    }
}

// Esegui il test
testStepByStep().catch(console.error);