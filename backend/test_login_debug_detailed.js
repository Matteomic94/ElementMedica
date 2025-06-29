/**
 * Test dettagliato per il debug del login
 * Verifica ogni step del processo di autenticazione
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config();

const prisma = new PrismaClient();

async function testLoginDetailed() {
    console.log('🔍 INIZIO TEST LOGIN DETTAGLIATO');
    console.log('================================');
    
    try {
        // 1. Verifica connessione database
        console.log('\n1. 📊 Verifica connessione database...');
        const userCount = await prisma.user.count();
        console.log(`   ✅ Database connesso. Utenti trovati: ${userCount}`);
        
        // 2. Verifica utente admin
        console.log('\n2. 👤 Verifica utente admin...');
        const adminUser = await prisma.user.findUnique({
            where: { email: 'admin@example.com' },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: true
                            }
                        }
                    }
                },
                company: true
            }
        });
        
        if (!adminUser) {
            console.log('   ❌ Utente admin non trovato!');
            return;
        }
        
        console.log(`   ✅ Utente admin trovato:`);
        console.log(`      - ID: ${adminUser.id}`);
        console.log(`      - Email: ${adminUser.email}`);
        console.log(`      - Nome: ${adminUser.firstName} ${adminUser.lastName}`);
        console.log(`      - Attivo: ${adminUser.isActive}`);
        console.log(`      - Password hash: ${adminUser.password.substring(0, 20)}...`);
        console.log(`      - Ruoli: ${adminUser.userRoles.length}`);
        
        // 3. Test verifica password
        console.log('\n3. 🔐 Test verifica password...');
        let testPassword = 'admin123';
        let isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
        console.log(`   Password '${testPassword}' valida: ${isPasswordValid ? '✅' : '❌'}`);
        
        if (!isPasswordValid) {
            // Prova altre password comuni
            const commonPasswords = ['admin', 'password', 'admin123!', 'Admin123', 'Admin123!'];
            console.log('   🔍 Provo altre password comuni...');
            
            for (const pwd of commonPasswords) {
                const isValid = await bcrypt.compare(pwd, adminUser.password);
                console.log(`      - '${pwd}': ${isValid ? '✅' : '❌'}`);
                if (isValid) {
                    console.log(`   ✅ Password corretta trovata: '${pwd}'`);
                    testPassword = pwd; // Usa la password corretta per il test API
                    break;
                }
            }
        }
        
        // 4. Test chiamata API login
        console.log('\n4. 🌐 Test chiamata API login...');
        
        // Verifica se il server API è in esecuzione
        try {
            const healthResponse = await axios.get('http://localhost:4001/health', {
                timeout: 5000
            });
            console.log('   ✅ API Server raggiungibile');
            console.log(`   📊 Health check: ${JSON.stringify(healthResponse.data, null, 2)}`);
        } catch (error) {
            console.log('   ❌ API Server non raggiungibile:');
            console.log(`      Error: ${error.message}`);
            console.log('   💡 Assicurati che il server API sia avviato su porta 4001');
            return;
        }
        
        // Test login con password corretta
        console.log(`\n   🔐 Tentativo login con password: '${testPassword}'...`);
        try {
            const loginResponse = await axios.post('http://localhost:4001/api/auth/login', {
                email: 'admin@example.com',
                password: testPassword,
                rememberMe: false
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('   ✅ Login riuscito!');
            console.log(`   📊 Risposta: ${JSON.stringify(loginResponse.data, null, 2)}`);
            
            // Verifica token
            if (loginResponse.data.tokens) {
                console.log('   🎫 Token ricevuti:');
                console.log(`      - Access Token: ${loginResponse.data.tokens.accessToken ? '✅' : '❌'}`);
                console.log(`      - Refresh Token: ${loginResponse.data.tokens.refreshToken ? '✅' : '❌'}`);
            }
            
        } catch (error) {
            console.log('   ❌ Login fallito:');
            console.log(`      Status: ${error.response?.status}`);
            console.log(`      Error: ${JSON.stringify(error.response?.data, null, 2) || error.message}`);
            
            // Analizza l'errore
            if (error.response?.status === 401) {
                console.log('   🔍 Errore 401: Credenziali non valide');
            } else if (error.response?.status === 500) {
                console.log('   🔍 Errore 500: Errore interno del server');
            }
        }
        
        // 5. Verifica tabella UserSession
        console.log('\n5. 📋 Verifica tabella UserSession...');
        const sessionCount = await prisma.userSession.count();
        console.log(`   📊 Sessioni totali: ${sessionCount}`);
        
        const activeSessions = await prisma.userSession.count({
            where: {
                isActive: true,
                expiresAt: {
                    gt: new Date()
                }
            }
        });
        console.log(`   📊 Sessioni attive: ${activeSessions}`);
        
        // 6. Test diretto del servizio JWT
        console.log('\n6. 🎫 Test servizio JWT...');
        try {
            // Importa dinamicamente il servizio JWT
            const { JWTService } = await import('./auth/jwt.js');
            
            const testPayload = {
                userId: adminUser.id,
                email: adminUser.email,
                companyId: adminUser.companyId,
                roles: adminUser.userRoles.map(ur => ur.role.name),
                permissions: []
            };
            
            const accessToken = JWTService.generateAccessToken(testPayload);
            console.log(`   ✅ Access Token generato: ${accessToken.substring(0, 50)}...`);
            
            // Verifica token
            const decoded = JWTService.verifyAccessToken(accessToken);
            console.log(`   ✅ Token verificato: ${decoded.email}`);
            
        } catch (error) {
            console.log(`   ❌ Errore servizio JWT: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Errore durante il test:', error);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔚 Test completato');
    }
}

// Esegui il test
testLoginDetailed().catch(console.error);