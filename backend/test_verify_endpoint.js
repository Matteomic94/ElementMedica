import jwt from 'jsonwebtoken';
import optimizedPrisma from './config/database.js';

// Test dell'endpoint verify simulando il middleware authenticate
async function testVerifyEndpoint() {
  console.log('🔍 Testing verify endpoint simulation...');
  
  try {
    // 1. Genera un token JWT valido
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
    
    console.log('✅ Token generated successfully');
    
    // 2. Verifica il token (come fa il middleware authenticate)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token verified successfully');
    console.log('📊 Decoded payload:', {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username
    });
    
    // 3. Simula la query del middleware authenticate
    console.log('🔍 Testing middleware authenticate query...');
    const startTime = Date.now();
    
    const client = optimizedPrisma.getClient();
    const user = await client.person.findUnique({
      where: { id: decoded.id },
      include: {
        personRoles: {
          include: {
            company: true,
            tenant: true,
            permissions: true
          }
        },
        company: true,
        tenant: true
      }
    });
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ Middleware authenticate query completed in ${queryTime} ms`);
    
    if (user) {
      console.log('👤 User found in authenticate middleware');
      console.log('📊 User data:', {
        id: user.id,
        email: user.email,
        username: user.username,
        isActive: user.isActive,
        isDeleted: user.isDeleted,
        rolesCount: user.personRoles?.length || 0
      });
      
      // 4. Simula la risposta dell'endpoint verify
      const verifyResponse = {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          company: user.company,
          tenant: user.tenant,
          roles: user.personRoles
        }
      };
      
      console.log('✅ Verify endpoint simulation successful');
      console.log('📊 Response would be:', {
        valid: verifyResponse.valid,
        userEmail: verifyResponse.user.email,
        rolesCount: verifyResponse.user.roles?.length || 0
      });
      
    } else {
      console.log('❌ User not found in authenticate middleware');
    }
    
  } catch (error) {
    console.error('❌ Error in verify endpoint simulation:', error.message);
    console.error('📊 Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack?.split('\n')[0]
    });
  } finally {
    await optimizedPrisma.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Esegui il test
testVerifyEndpoint();