const fs = require('fs');

console.log('🔍 TEST ESECUZIONE MIDDLEWARE ISOLATO');
console.log('====================================\n');

async function testMiddlewareExecution() {
  try {
    // Leggi il token salvato
    const token = fs.readFileSync('/Users/matteo.michielon/project 2.0/backend/debug_token.txt', 'utf8');
    console.log('📋 Token caricato:', token.substring(0, 50) + '...');
    
    console.log('\n📋 Step 1: Import middleware...');
    const { authenticate } = await import('./auth/middleware.js');
    console.log('   ✅ Middleware importato');
    
    console.log('\n📋 Step 2: Creo mock request/response...');
    const mockReq = {
      method: 'GET',
      path: '/verify',
      headers: {
        authorization: `Bearer ${token}`
      },
      cookies: {}
    };
    
    const mockRes = {
      status: (code) => {
        console.log(`   📋 Response status: ${code}`);
        return {
          json: (data) => {
            console.log('   📋 Response data:', data);
            return mockRes;
          }
        };
      }
    };
    
    let nextCalled = false;
    const mockNext = (error) => {
      nextCalled = true;
      if (error) {
        console.log('   ❌ Next chiamato con errore:', error.message);
      } else {
        console.log('   ✅ Next chiamato senza errori');
      }
    };
    
    console.log('\n📋 Step 3: Eseguo middleware con timeout...');
    const startTime = Date.now();
    
    // Test con timeout manuale
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_MANUAL')), 10000);
    });
    
    const middlewarePromise = new Promise((resolve, reject) => {
      try {
        console.log('   📋 Creando middleware function...');
        const middlewareFunction = authenticate();
        console.log('   📋 Middleware function creata, eseguendo...');
        
        // Aggiungi timeout interno al middleware
        const originalNext = mockNext;
        const timedNext = (error) => {
          const endTime = Date.now();
          console.log(`   📋 Middleware completato in ${endTime - startTime}ms`);
          originalNext(error);
          resolve('completed');
        };
        
        middlewareFunction(mockReq, mockRes, timedNext);
        
        // Se il middleware è sincrono e non chiama next, risolvi comunque
        setTimeout(() => {
          if (!nextCalled) {
            console.log('   ⚠️ Middleware non ha chiamato next dopo 1 secondo');
            resolve('no_next_call');
          }
        }, 1000);
        
      } catch (error) {
        console.log('   ❌ Errore sincrono nel middleware:', error.message);
        reject(error);
      }
    });
    
    try {
      const result = await Promise.race([middlewarePromise, timeoutPromise]);
      const endTime = Date.now();
      console.log(`   ✅ Test completato: ${result} in ${endTime - startTime}ms`);
      
      if (mockReq.user) {
        console.log('   📋 User attachato:', {
          userId: mockReq.user.userId,
          email: mockReq.user.email,
          roles: mockReq.user.roles?.length || 0
        });
      } else {
        console.log('   ⚠️ Nessun user attachato alla request');
      }
      
    } catch (error) {
      const endTime = Date.now();
      if (error.message === 'TIMEOUT_MANUAL') {
        console.log(`   ⏰ TIMEOUT middleware execution dopo ${endTime - startTime}ms`);
        console.log('   🚨 Middleware si blocca durante l\'esecuzione - PROBLEMA IDENTIFICATO!');
      } else {
        console.log('   ❌ Errore middleware execution:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Errore nel test middleware execution:', error.message);
    console.log('Stack:', error.stack);
  }
}

testMiddlewareExecution();