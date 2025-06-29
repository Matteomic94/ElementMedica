import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger.js';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists by username or email
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { email: 'admin@example.com' },
          {
            userRoles: {
              some: {
                role: {
                  name: 'global_admin'
                }
              }
            }
          }
        ]
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Username:', existingAdmin.username);
      console.log('🔑 Password: Admin123! (if this is the default admin)');
      console.log('⚠️  If you forgot the password, you can reset it manually in the database.');
      return existingAdmin;
    }

    // Admin credentials
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        globalRole: 'SUPER_ADMIN'
      }
    });

    // Get global_admin role (system role without company)
    const globalAdminRole = await prisma.role.findFirst({
      where: { 
        name: 'global_admin',
        isSystemRole: true
      }
    });

    if (!globalAdminRole) {
      throw new Error('Global admin role not found in database');
    }

    // Assign global_admin role to user
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: globalAdminRole.id
      }
    });

    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  Please change the password after first login!');

    return adminUser;

  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Always run when script is executed directly
console.log('🚀 Starting admin user creation...');
createAdminUser()
  .then(() => {
    console.log('✅ Admin creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Admin creation failed:', error);
    process.exit(1);
  });

export { createAdminUser };