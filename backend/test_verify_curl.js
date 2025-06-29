import jwt from 'jsonwebtoken';

// Genera un token JWT valido per testare l'endpoint /verify
function generateTestToken() {
  const payload = {
    id: 'person-admin-001',
    email: 'mario.rossi@acme-corp.com',
    username: 'mario.rossi',
    firstName: 'Mario',
    lastName: 'Rossi',
    isActive: true,
    companyId: 'company-acme-001',
    tenantId: 'tenant-acme-001'
  };
  
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '24h'
  });
  
  console.log('🔑 Token JWT generato per test:');
  console.log(token);
  console.log('');
  console.log('📋 Comando curl per testare /verify:');
  console.log(`curl -X GET "http://localhost:4001/api/v1/auth/verify" \\`);
  console.log(`  -H "Authorization: Bearer ${token}" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -w "\\nStatus: %{http_code}\\nTime: %{time_total}s\\n"`);
  console.log('');
  console.log('🔍 Per testare tramite proxy (porta 4003):');
  console.log(`curl -X GET "http://localhost:4003/api/v1/auth/verify" \\`);
  console.log(`  -H "Authorization: Bearer ${token}" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -w "\\nStatus: %{http_code}\\nTime: %{time_total}s\\n"`);
}

generateTestToken();