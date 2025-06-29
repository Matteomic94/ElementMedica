/**
 * Test specifico per il middleware authenticate
 * Questo test bypassa il middleware authenticate per vedere se il problema è lì
 */

const express = require('express');
const axios = require('axios');

const TEST_PORT = 4002;

async function createTestServer() {
    const app = express();
    
    app.use(express.json());
    
    // Logging per debug
    app.use((req, res, next) => {
        console.log(`🔍 [TEST] ${req.method} ${req.path}`);
        next();
    });
    
    // Mock del middleware authenticate che NON fa query al database
    const mockAuthenticate = (req, res, next) => {
        console.log('🔍 [MOCK AUTH] Middleware chiamato');
        
        // Simula un utente mock senza fare query al database
        req.user = {
            id: 'test-user-id',
            personId: 'test-person-id',
            email: 'test@test.com',
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            companyId: 'test-company',
            tenantId: 'test-tenant',
            roles: ['USER'],
            company: { id: 'test-company', name: 'Test Company' },
            tenant: { id: 'test-tenant', name: 'Test Tenant' },
            isVerified: true
        };
        
        console.log('✅ [MOCK AUTH] User mock creato, chiamando next()');
        next();
    };
    
    // Endpoint /verify con middleware mock
    app.get('/api/v1/auth/verify', mockAuthenticate, async (req, res) => {
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
    
    // Handler 404
    app.use('*', (req, res) => {
        console.log(`❌ [TEST] 404: ${req.method} ${req.path}`);
        res.status(404).json({ error: 'Not found' });
    });
    
    return app;
}

async function testAuthenticateMiddleware() {
    console.log('🧪 Test Middleware Authenticate (Mock)');
    console.log('=====================================\n');
    
    const app = await createTestServer();
    const server = app.listen(TEST_PORT, () => {
        console.log(`🚀 Server test avviato su porta ${TEST_PORT}\n`);
    });
    
    try {
        // Test con middleware mock
        console.log('1️⃣ Test /verify con middleware mock...');
        try {
            const response = await axios.get(`http://localhost:${TEST_PORT}/api/v1/auth/verify`, {
                timeout: 5000
            });
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   ✅ Response:`, JSON.stringify(response.data, null, 2));
            console.log('\n🎯 CONCLUSIONE: Il problema NON è nel handler /verify');
            console.log('🎯 Il problema È nel middleware authenticate!');
        } catch (error) {
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error:`, error.response.data);
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT - Problema anche con middleware mock!');
                console.log('\n🎯 CONCLUSIONE: Il problema NON è nel middleware authenticate');
                console.log('🎯 Il problema È nel handler /verify o nel routing!');
            } else {
                console.log(`   ❌ Errore: ${error.message}`);
            }
        }
        
    } finally {
        server.close();
        console.log('\n🔚 Server test chiuso');
    }
}

// Esegui il test
testAuthenticateMiddleware().catch(console.error);