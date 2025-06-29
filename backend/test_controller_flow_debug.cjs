const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

// Simula esattamente il flusso del controller di login
async function testControllerFlow() {
  console.log('🔍 ATTEMPT 104 - DEBUG CONTROLLER FLOW');
  console.log('=' .repeat(60));
  
  const credentials = {
    identifier: 'mario.rossi@acme-corp.com',
    password: 'Password123!',
    remember_me: false
  };
  
  console.log('📋 Simulazione completa del controller di login');
  console.log('📋 Credenziali:', credentials.identifier);
  console.log('');
  
  try {
    // Step 1: Validation (simulata)
    console.log('✅ Step 1: Validation - OK');
    
    // Step 2: Verify credentials using AuthService
    console.log('📋 Step 2: Verify credentials...');
    
    // Simula authService.verifyCredentials
    const person = await prisma.person.findFirst({
      where: {
        OR: [
          { email: credentials.identifier },
          { username: credentials.identifier },
          { taxCode: credentials.identifier }
        ],
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
      console.log('❌ Persona non trovata');
      return;
    }
    
    console.log('✅ Persona trovata:', person.email);
    
    // Verifica password
    const isPasswordValid = await bcrypt.compare(credentials.password, person.password);
    if (!isPasswordValid) {
      console.log('❌ Password non valida');
      return;
    }
    
    console.log('✅ Password valida');
    
    const credentialsResult = {
      success: true,
      person: person
    };
    
    // Step 3: Generate tokens using AuthService
    console.log('📋 Step 3: Generate tokens...');
    
    // Simula authService.generateTokens
    const roles = person.personRoles.map(pr => pr.roleType);
    
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
    
    const accessTokenExpiry = credentials.remember_me ? '7d' : '1h';
    const refreshTokenExpiry = credentials.remember_me ? '30d' : '7d';
    
    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: accessTokenExpiry }
    );
    
    const refreshToken = jwt.sign(
      { personId: person.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshTokenExpiry }
    );
    
    const tokens = {
      accessToken,
      refreshToken,
      expiresIn: credentials.remember_me ? 7 * 24 * 60 * 60 : 60 * 60
    };
    
    console.log('✅ Tokens generati:', {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
    
    // Step 4: Store refresh token (simulato)
    console.log('📋 Step 4: Store refresh token...');
    const expiresAt = new Date(Date.now() + (credentials.remember_me ? 30 : 7) * 24 * 60 * 60 * 1000);
    
    // Simula il salvataggio (senza effettivamente salvare)
    console.log('✅ Refresh token storage simulato');
    
    // Step 5: Update last login (simulato)
    console.log('📋 Step 5: Update last login...');
    console.log('✅ Last login update simulato');
    
    // Step 6: Prepare response
    console.log('📋 Step 6: Prepare response...');
    
    // Simula authService.getPersonRoles
    const personRoles = roles; // Semplificato
    
    const response = {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: person.id,
          personId: person.id,
          email: person.email,
          username: person.username,
          taxCode: person.taxCode,
          firstName: person.firstName,
          lastName: person.lastName,
          companyId: person.companyId,
          tenantId: person.tenantId,
          roles: personRoles,
          company: person.company ? {
            id: person.company.id,
            name: person.company.name,
            type: person.company.type
          } : null,
          tenant: person.tenant ? {
            id: person.tenant.id,
            name: person.tenant.name
          } : null
        }
      }
    };
    
    console.log('✅ RISPOSTA PREPARATA CON SUCCESSO!');
    console.log('');
    console.log('📋 ANALISI RISPOSTA:');
    console.log('- success:', response.success);
    console.log('- message:', response.message);
    console.log('- data keys:', Object.keys(response.data));
    console.log('- ha accessToken?', !!response.data.accessToken);
    console.log('- ha refreshToken?', !!response.data.refreshToken);
    console.log('- expiresIn:', response.data.expiresIn);
    console.log('- user keys:', Object.keys(response.data.user));
    
    console.log('');
    console.log('📋 TOKENS NELLA RISPOSTA:');
    console.log('- accessToken length:', response.data.accessToken.length);
    console.log('- refreshToken length:', response.data.refreshToken.length);
    console.log('- accessToken preview:', response.data.accessToken.substring(0, 50) + '...');
    console.log('- refreshToken preview:', response.data.refreshToken.substring(0, 50) + '...');
    
    // Test serializzazione JSON
    console.log('');
    console.log('📋 TEST SERIALIZZAZIONE JSON:');
    try {
      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);
      
      console.log('✅ Serializzazione JSON riuscita');
      console.log('- JSON length:', jsonString.length);
      console.log('- Parsed ha accessToken?', !!parsed.data.accessToken);
      console.log('- Parsed ha refreshToken?', !!parsed.data.refreshToken);
      
    } catch (jsonError) {
      console.log('❌ Errore serializzazione JSON:', jsonError.message);
    }
    
  } catch (error) {
    console.log('❌ ERRORE NEL FLUSSO:', error.message);
    console.log('❌ Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('');
  console.log('🎯 CONCLUSIONI:');
  console.log('Se tutti i passi sopra sono ✅, il controller dovrebbe funzionare.');
  console.log('Se il server API reale restituisce una risposta diversa,');
  console.log('il problema potrebbe essere:');
  console.log('1. Un middleware che intercetta/modifica la risposta');
  console.log('2. Un problema nel metodo saveRefreshToken che causa un\'eccezione');
  console.log('3. Un problema nel metodo updateLastLogin che causa un\'eccezione');
  console.log('4. Un problema nel metodo getPersonRoles che causa un\'eccezione');
}

testControllerFlow().catch(console.error);