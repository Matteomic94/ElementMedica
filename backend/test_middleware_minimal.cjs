/**
 * Test con middleware authenticate completamente semplificato
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Middleware authenticate semplificato che bypassa tutto
function authenticateSimple(req, res, next) {
  console.log('🔍 Middleware authenticate semplificato chiamato');
  
  // Mock user data
  req.user = {
    id: 'person-admin-001',
    email: 'mario.rossi@acme-corp.com',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN']
  };
  
  console.log('✅ Middleware authenticate semplificato completato');
  next();
}

// Endpoint permissions semplificato
app.get('/api/v1/auth/permissions/:userId', authenticateSimple, (req, res) => {
  console.log('🔍 Endpoint permissions chiamato');
  
  const { userId } = req.params;
  
  // Verifica userId
  if (userId !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied: Cannot access other user permissions',
      code: 'AUTH_ACCESS_DENIED'
    });
  }
  
  res.json({
    success: true,
    permissions: req.user.roles || [],
    role: 'SUPER_ADMIN',
    userId: req.user.id,
    email: req.user.email
  });
  
  console.log('✅ Endpoint permissions completato');
});

// Avvia server di test
const PORT = 4002;
app.listen(PORT, () => {
  console.log(`🚀 Server di test avviato su porta ${PORT}`);
  
  // Test automatico
  setTimeout(async () => {
    try {
      console.log('\n🧪 Esecuzione test automatico...');
      
      const response = await axios.get(`http://localhost:${PORT}/api/v1/auth/permissions/person-admin-001`, {
        timeout: 5000
      });
      
      console.log('✅ Test riuscito!');
      console.log('📋 Risposta:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Test fallito:', error.message);
    } finally {
      process.exit(0);
    }
  }, 1000);
});