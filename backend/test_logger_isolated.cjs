console.log('🔍 TEST LOGGER ISOLATO');
console.log('======================\n');

async function testLogger() {
  try {
    console.log('📋 Step 1: Import logger...');
    const loggerModule = await import('./utils/logger.js');
    console.log('   ✅ Logger importato');
    
    console.log('\n📋 Step 2: Test logger.info con timeout...');
    const startTime = Date.now();
    
    // Test con timeout manuale
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_MANUAL')), 5000);
    });
    
    const logPromise = new Promise((resolve) => {
      try {
        loggerModule.default.info('Test log message');
        resolve('success');
      } catch (error) {
        resolve(error.message);
      }
    });
    
    try {
      const result = await Promise.race([logPromise, timeoutPromise]);
      const endTime = Date.now();
      console.log(`   ✅ Logger.info completato in ${endTime - startTime}ms`);
    } catch (error) {
      const endTime = Date.now();
      if (error.message === 'TIMEOUT_MANUAL') {
        console.log(`   ⏰ TIMEOUT logger.info dopo ${endTime - startTime}ms`);
        console.log('   🚨 Logger si blocca - PROBLEMA IDENTIFICATO!');
      } else {
        console.log('   ❌ Errore logger:', error.message);
      }
    }
    
    console.log('\n📋 Step 3: Test console.log diretto...');
    const startTime2 = Date.now();
    console.log('   📋 Console.log funziona normalmente');
    const endTime2 = Date.now();
    console.log(`   ✅ Console.log completato in ${endTime2 - startTime2}ms`);
    
    console.log('\n📋 Step 4: Test import middleware senza esecuzione...');
    try {
      const middlewareModule = await import('./auth/middleware.js');
      console.log('   ✅ Middleware importato senza problemi');
      console.log('   📋 Funzioni esportate:', Object.keys(middlewareModule));
    } catch (error) {
      console.log('   ❌ Errore import middleware:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Errore nel test logger:', error.message);
    console.log('Stack:', error.stack);
  }
}

testLogger();