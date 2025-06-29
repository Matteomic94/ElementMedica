import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import logger from './utils/logger.js';

const prisma = new PrismaClient();

async function initializeRolesAndAdmin() {
  try {
    console.log('🚀 Inizializzazione ruoli e utente admin...');

    // 1. Creare i ruoli di base se non esistono
    const roles = [
      {
        name: 'global_admin',
        displayName: 'Amministratore Globale',
        description: 'Accesso completo a tutto il sistema',
        isSystemRole: true,
        permissions: JSON.stringify([
          'users.create', 'users.read', 'users.update', 'users.delete',
          'companies.create', 'companies.read', 'companies.update', 'companies.delete',
          'employees.create', 'employees.read', 'employees.update', 'employees.delete',
          'courses.create', 'courses.read', 'courses.update', 'courses.delete',
          'documents.create', 'documents.read', 'documents.update', 'documents.delete',
          'system.admin'
        ])
      },
      {
        name: 'company_admin',
        displayName: 'Amministratore Azienda',
        description: 'Amministratore di una specifica azienda',
        isSystemRole: true,
        permissions: JSON.stringify([
          'employees.create', 'employees.read', 'employees.update', 'employees.delete',
          'courses.read', 'courses.update',
          'documents.create', 'documents.read', 'documents.update'
        ])
      },
      {
        name: 'user',
        displayName: 'Utente Standard',
        description: 'Utente con accesso limitato',
        isSystemRole: true,
        permissions: JSON.stringify([
          'employees.read',
          'courses.read',
          'documents.read'
        ])
      }
    ];

    for (const roleData of roles) {
      const existingRole = await prisma.role.findFirst({
        where: { name: roleData.name, isSystemRole: true }
      });

      if (!existingRole) {
        const role = await prisma.role.create({ data: roleData });
        console.log(`✅ Ruolo creato: ${role.displayName}`);
      } else {
        console.log(`ℹ️  Ruolo già esistente: ${existingRole.displayName}`);
      }
    }

    // 2. Verificare se esiste già un utente admin
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@example.com' },
          { username: 'admin' },
          { globalRole: 'SUPER_ADMIN' }
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
      console.log('✅ Utente admin già esistente!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Username:', existingAdmin.username);
      console.log('🔑 Password: Admin123! (se è l\'admin di default)');
      return existingAdmin;
    }

    // 3. Creare l'utente admin
    const adminPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Trovare il ruolo global_admin
    const globalAdminRole = await prisma.role.findFirst({
      where: { name: 'global_admin', isSystemRole: true }
    });

    if (!globalAdminRole) {
      throw new Error('Ruolo global_admin non trovato');
    }

    // Creare l'utente admin
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        globalRole: 'SUPER_ADMIN',
        isActive: true,
        userRoles: {
          create: {
            roleId: globalAdminRole.id,
            isActive: true
          }
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log('✅ Utente admin creato con successo!');
    console.log('📧 Email: admin@example.com');
    console.log('👤 Username: admin');
    console.log('🔑 Password: Admin123!');
    console.log('🎯 Ruoli assegnati:', adminUser.userRoles.map(ur => ur.role.displayName).join(', '));

    return adminUser;

  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Eseguire lo script
initializeRolesAndAdmin()
  .then(() => {
    console.log('🎉 Inizializzazione completata!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Inizializzazione fallita:', error);
    process.exit(1);
  });