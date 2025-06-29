import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔄 Resetting admin password...');
    
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('👤 Found admin user:', adminUser.email);
    
    // Hash new password with bcryptjs
    const newPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log('🔐 New password hash:', hashedPassword.substring(0, 20) + '...');
    
    // Update password and unlock account
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { 
        password: hashedPassword,
        lockedUntil: null,
        failedAttempts: 0
      }
    });
    
    console.log('✅ Password updated successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: Admin123!');
    
    // Test the new password
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('🧪 Password verification:', isValid ? '✅ VALID' : '❌ INVALID');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();