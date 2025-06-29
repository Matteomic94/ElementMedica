const fs = require('fs');

console.log('🔍 TEST JWT SERVICE ISOLATO');
console.log('===========================\n');

async function testJWTService() {
  try {
    // Leggi il token salvato dal test precedente
    const token = fs.readFileSync('/Users/matteo.michielon/project 2.0/backend/debug_token.txt', 'utf8');
    console.log('📋 Token caricato:', token.substring(0, 50) + '...');
    
    console.log('\n📋 Step 1: Import JWT Service...');
    const { JWTService } = await import('./auth/jwt.js');
    console.log('   ✅ JWT Service importato');
    
    console.log('\n📋 Step 2: Test verifyAccessToken con timeout...');
    const startTime = Date.now();
    
    // Test con timeout manuale
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_MANUAL')), 5000);
    });
    
    const verifyPromise = new Promise((resolve, reject) => {
      try {
        const decoded = JWTService.verifyAccessToken(token);
        resolve(decoded);
      } catch (error) {
        reject(error);
      }
    });
    
    try {
      const decoded = await Promise.race([verifyPromise, timeoutPromise]);
      const endTime = Date.now();
      console.log(`   ✅ JWT verification completata in ${endTime - startTime}ms`);
      console.log('   📋 Decoded payload:', {
        userId: decoded.userId,
        personId: decoded.personId,
        email: decoded.email
      });
    } catch (error) {
      const endTime = Date.now();
      if (error.message === 'TIMEOUT_MANUAL') {
        console.log(`   ⏰ TIMEOUT JWT verification dopo ${endTime - startTime}ms`);
        console.log('   🚨 JWT verification si blocca - PROBLEMA IDENTIFICATO!');
      } else {
        console.log('   ❌ Errore JWT verification:', error.message);
      }
    }
    
    console.log('\n📋 Step 3: Test JWT verification sincrono diretto...');
    const jwt = await import('jsonwebtoken');
    const startTime2 = Date.now();
    
    try {
      const decoded2 = jwt.default.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', {
        issuer: 'training-platform',
        audience: 'training-platform-users'
      });
      const endTime2 = Date.now();
      console.log(`   ✅ JWT verification diretta completata in ${endTime2 - startTime2}ms`);
      console.log('   📋 Decoded diretto:', {
        userId: decoded2.userId,
        personId: decoded2.personId
      });
    } catch (error) {
      console.log('   ❌ Errore JWT verification diretta:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Errore nel test JWT:', error.message);
    console.log('Stack:', error.stack);
  }
}

testJWTService();