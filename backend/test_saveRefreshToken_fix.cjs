const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔧 TEST: Verifica fix saveRefreshToken');
console.log('=====================================');

const testSaveRefreshTokenFix = async () => {
  try {
    console.log('\n1. 🧪 Test login completo con saveRefreshToken...');
    
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!',
      remember_me: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'test-saveRefreshToken-fix/1.0'
      },
      timeout: 10000
    });
    
    console.log('✅ Login Response Status:', loginResponse.status);
    console.log('✅ Response Data Keys:', Object.keys(loginResponse.data));
    
    if (loginResponse.data.data?.accessToken) {
      console.log('✅ AccessToken presente:', loginResponse.data.data.accessToken.length, 'caratteri');
    } else {
      console.log('❌ AccessToken MANCANTE');
    }
    
    if (loginResponse.data.data?.refreshToken) {
      console.log('✅ RefreshToken presente:', loginResponse.data.data.refreshToken.length, 'caratteri');
    } else {
      console.log('❌ RefreshToken MANCANTE');
    }
    
    console.log('\n2. 🔍 Verifica refresh token nel database...');
    
    if (loginResponse.data.data?.refreshToken) {
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: loginResponse.data.data.refreshToken
        },
        include: {
          person: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      if (storedToken) {
        console.log('✅ Token trovato nel database');
        console.log('   - PersonId:', storedToken.personId);
        console.log('   - User:', storedToken.person.firstName, storedToken.person.lastName);
        console.log('   - DeviceInfo:', JSON.stringify(storedToken.deviceInfo, null, 2));
        console.log('   - ExpiresAt:', storedToken.expiresAt);
      } else {
        console.log('❌ Token NON trovato nel database');
      }
    }
    
    console.log('\n3. 📊 Risultato finale:');
    const hasAccessToken = !!loginResponse.data.data?.accessToken;
    const hasRefreshToken = !!loginResponse.data.data?.refreshToken;
    
    if (hasAccessToken && hasRefreshToken) {
      console.log('🎉 SUCCESS: Login restituisce entrambi i token!');
      console.log('✅ Il fix del saveRefreshToken ha funzionato');
      return true;
    } else {
      console.log('❌ FAIL: Token ancora mancanti');
      console.log('   - AccessToken:', hasAccessToken ? 'OK' : 'MANCANTE');
      console.log('   - RefreshToken:', hasRefreshToken ? 'OK' : 'MANCANTE');
      return false;
    }
    
  } catch (error) {
    console.log('❌ ERRORE durante il test:', error.message);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
};

testSaveRefreshTokenFix().then(success => {
  console.log('\n' + '='.repeat(50));
  console.log(success ? '🎯 TEST COMPLETATO CON SUCCESSO' : '💥 TEST FALLITO');
  process.exit(success ? 0 : 1);
});