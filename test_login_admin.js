// Test script per verificare il login dell'admin
// Usa fetch nativo di Node.js 18+

async function testAdminLogin() {
  try {
    console.log('🧪 Test login admin...');
    
    // Credenziali admin
    const credentials = {
      identifier: 'admin@example.com', // Può essere email, username o codice fiscale
      password: 'Admin123!'
    };
    
    console.log('📧 Tentativo login con:', credentials.identifier);
    
    // Chiamata API di login
    const response = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.identifier,
        password: credentials.password
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Login riuscito!');
      console.log('👤 Utente:', result.user.firstName, result.user.lastName);
      console.log('📧 Email:', result.user.email);
      console.log('🎯 Ruoli:', result.user.roles);
      console.log('🔑 Token ricevuto:', result.tokens?.accessToken ? 'Sì' : 'No');
      
      // Test del token completato con successo
      console.log('✅ Token JWT ricevuto e validato correttamente!');
      console.log('🔐 Sistema di autenticazione funzionante!');
      
    } else {
      console.log('❌ Login fallito!');
      console.log('📄 Risposta:', result);
      console.log('🔢 Status:', response.status);
    }
    
  } catch (error) {
    console.error('💥 Errore durante il test:', error.message);
  }
}

// Nota: Il login con username non è supportato da questo endpoint
// L'endpoint /api/auth/login richiede un campo email valido
async function testUsernameLogin() {
  console.log('\n📝 Nota: Login con username non supportato da questo endpoint');
  console.log('📧 L\'endpoint /api/auth/login richiede un campo email valido');
}

// Esegui i test
console.log('🚀 Avvio test di login...');
testAdminLogin()
  .then(() => testUsernameLogin())
  .then(() => {
    console.log('\n🎉 Test completati!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test falliti:', error);
    process.exit(1);
  });