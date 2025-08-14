import AuthService from './services/authService.js';
import bcrypt from 'bcrypt';

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login...');
    
    // Test finding the person
    const person = await AuthService.findPersonForLogin('admin@example.com');
    console.log('👤 Person found:', {
      id: person?.id,
      email: person?.email,
      firstName: person?.firstName,
      lastName: person?.lastName,
      status: person?.status,
      hasPassword: !!person?.password,
      passwordLength: person?.password?.length,
      roles: person?.personRoles?.map(r => r.roleType),
      tenantId: person?.tenantId,
      companyId: person?.companyId
    });
    
    if (!person) {
      console.log('❌ Person not found!');
      return;
    }
    
    // Test direct password comparison
    console.log('🔐 Testing direct password comparison...');
    const directCompare = await bcrypt.compare('Admin123!', person.password);
    console.log('Direct bcrypt compare result:', directCompare);
    
    // Test password verification through service
    console.log('🔐 Testing password verification through service...');
    const result = await AuthService.verifyCredentials('admin@example.com', 'Admin123!');
    
    console.log('✅ Verification result:', {
      success: result.success,
      error: result.error,
      personId: result.person?.id
    });
    
    // Test token generation if verification succeeds
    if (result.success) {
      console.log('🎫 Testing token generation...');
      const tokens = AuthService.generateTokens(result.person, false);
      console.log('Token generation result:', {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        accessTokenLength: tokens.accessToken?.length
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAdminLogin();