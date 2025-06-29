const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

// Test per verificare se generateTokens funziona correttamente
async function testGenerateTokens() {
  console.log('🔍 ATTEMPT 104 - DEBUG GENERATETOKENS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Trova la persona mario.rossi
    console.log('📋 Step 1: Ricerca persona mario.rossi@acme-corp.com');
    const person = await prisma.person.findFirst({
      where: {
        email: 'mario.rossi@acme-corp.com',
        isActive: true,
        isDeleted: false
      },
      include: {
        personRoles: {
          where: { isActive: true },
          include: {
            company: true,
            tenant: true
          }
        },
        company: true,
        tenant: true
      }
    });
    
    if (!person) {
      console.log('❌ Persona non trovata!');
      return;
    }
    
    console.log('✅ Persona trovata:', {
      id: person.id,
      email: person.email,
      companyId: person.companyId,
      tenantId: person.tenantId,
      rolesCount: person.personRoles.length
    });
    
    // 2. Verifica variabili d'ambiente
    console.log('\n📋 Step 2: Verifica variabili d\'ambiente JWT');
    console.log('JWT_SECRET definito:', !!process.env.JWT_SECRET);
    console.log('JWT_REFRESH_SECRET definito:', !!process.env.JWT_REFRESH_SECRET);
    console.log('JWT_SECRET lunghezza:', process.env.JWT_SECRET?.length || 0);
    console.log('JWT_REFRESH_SECRET lunghezza:', process.env.JWT_REFRESH_SECRET?.length || 0);
    
    // 3. Test manuale generateTokens
    console.log('\n📋 Step 3: Test manuale generateTokens');
    
    const roles = person.personRoles.map(pr => pr.roleType);
    console.log('Roles estratti:', roles);
    
    const tokenPayload = {
      userId: person.id,
      personId: person.id,
      email: person.email,
      username: person.username,
      taxCode: person.taxCode,
      companyId: person.companyId,
      tenantId: person.tenantId,
      roles
    };
    
    console.log('Token payload:', JSON.stringify(tokenPayload, null, 2));
    
    // 4. Genera access token
    console.log('\n📋 Step 4: Generazione access token');
    try {
      const accessToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      console.log('✅ Access token generato:', accessToken.substring(0, 50) + '...');
      console.log('✅ Access token lunghezza:', accessToken.length);
    } catch (error) {
      console.log('❌ Errore generazione access token:', error.message);
      return;
    }
    
    // 5. Genera refresh token
    console.log('\n📋 Step 5: Generazione refresh token');
    try {
      const refreshToken = jwt.sign(
        { personId: person.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      console.log('✅ Refresh token generato:', refreshToken.substring(0, 50) + '...');
      console.log('✅ Refresh token lunghezza:', refreshToken.length);
    } catch (error) {
      console.log('❌ Errore generazione refresh token:', error.message);
      return;
    }
    
    // 6. Test completo generateTokens
    console.log('\n📋 Step 6: Test completo generateTokens (simulazione)');
    try {
      const accessToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const refreshToken = jwt.sign(
        { personId: person.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      
      const tokens = {
        accessToken,
        refreshToken,
        expiresIn: 60 * 60 // 1 hour in seconds
      };
      
      console.log('✅ TOKENS GENERATI CON SUCCESSO!');
      console.log('📋 Struttura tokens:', {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        accessTokenLength: tokens.accessToken.length,
        refreshTokenLength: tokens.refreshToken.length
      });
      
      // 7. Simula la risposta del controller
      console.log('\n📋 Step 7: Simulazione risposta controller');
      const response = {
        success: true,
        message: 'Login successful',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          user: {
            id: person.id,
            email: person.email,
            roles: roles,
            company: person.company ? {
              id: person.company.id
            } : null,
            tenant: person.tenant ? {
              id: person.tenant.id,
              name: person.tenant.name
            } : null
          }
        }
      };
      
      console.log('✅ RISPOSTA SIMULATA COMPLETA!');
      console.log('📋 Keys nella risposta:', Object.keys(response.data));
      console.log('📋 Keys in data:', Object.keys(response.data));
      console.log('📋 Ha accessToken?', !!response.data.accessToken);
      console.log('📋 Ha refreshToken?', !!response.data.refreshToken);
      
    } catch (error) {
      console.log('❌ Errore nel test completo:', error.message);
      console.log('❌ Stack:', error.stack);
    }
    
  } catch (error) {
    console.log('❌ Errore generale:', error.message);
    console.log('❌ Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n🎯 CONCLUSIONI:');
  console.log('Se tutti i test sopra sono ✅, allora generateTokens dovrebbe funzionare.');
  console.log('Se il server API restituisce ancora una risposta senza token,');
  console.log('il problema potrebbe essere:');
  console.log('1. Un\'eccezione non gestita nel controller');
  console.log('2. Un middleware che modifica la risposta');
  console.log('3. Un problema nella serializzazione JSON');
}

testGenerateTokens().catch(console.error);