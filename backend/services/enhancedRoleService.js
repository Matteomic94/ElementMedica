import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Servizio per la gestione dei ruoli avanzati nel sistema multi-tenant
 * Week 12: Sistema Utenti Avanzato
 */
class EnhancedRoleService {
  /**
   * Definizione dei tipi di ruolo e relative permissions
   */
  static ROLE_TYPES = {
    GLOBAL_ADMIN: 'global_admin',
    COMPANY_ADMIN: 'company_admin',
    MANAGER: 'manager',
    TRAINER: 'trainer',
    EMPLOYEE: 'employee'
  };

  static ROLE_SCOPES = {
    GLOBAL: 'global',
    TENANT: 'tenant',
    COMPANY: 'company',
    DEPARTMENT: 'department'
  };

  static PERMISSIONS = {
    // User Management
    'users.create': 'Creare utenti',
    'users.read': 'Visualizzare utenti',
    'users.update': 'Modificare utenti',
    'users.delete': 'Eliminare utenti',
    'users.manage_roles': 'Gestire ruoli utenti',
    
    // Company Management
    'companies.create': 'Creare aziende',
    'companies.read': 'Visualizzare aziende',
    'companies.update': 'Modificare aziende',
    'companies.delete': 'Eliminare aziende',
    'companies.manage_settings': 'Gestire impostazioni azienda',
    
    // Course Management
    'courses.create': 'Creare corsi',
    'courses.read': 'Visualizzare corsi',
    'courses.update': 'Modificare corsi',
    'courses.delete': 'Eliminare corsi',
    'courses.assign': 'Assegnare corsi',
    
    // Training Management
    'training.create': 'Creare sessioni formative',
    'training.read': 'Visualizzare formazioni',
    'training.update': 'Modificare formazioni',
    'training.delete': 'Eliminare formazioni',
    'training.conduct': 'Condurre formazioni',
    
    // Reports and Analytics
    'reports.view': 'Visualizzare report',
    'reports.export': 'Esportare report',
    'analytics.view': 'Visualizzare analytics',
    
    // System Administration
    'system.settings': 'Gestire impostazioni sistema',
    'system.billing': 'Gestire fatturazione',
    'system.audit': 'Visualizzare audit logs',
    'system.backup': 'Gestire backup'
  };

  /**
   * Matrice delle permissions per ruolo
   */
  static getDefaultPermissions(roleType) {
    const permissionMatrix = {
      [this.ROLE_TYPES.GLOBAL_ADMIN]: Object.keys(this.PERMISSIONS),
      
      [this.ROLE_TYPES.COMPANY_ADMIN]: [
        'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage_roles',
        'companies.read', 'companies.update', 'companies.manage_settings',
        'courses.create', 'courses.read', 'courses.update', 'courses.delete', 'courses.assign',
        'training.create', 'training.read', 'training.update', 'training.delete',
        'reports.view', 'reports.export', 'analytics.view'
      ],
      
      [this.ROLE_TYPES.MANAGER]: [
        'users.read', 'users.update',
        'companies.read',
        'courses.read', 'courses.assign',
        'training.create', 'training.read', 'training.update',
        'reports.view', 'analytics.view'
      ],
      
      [this.ROLE_TYPES.TRAINER]: [
        'users.read',
        'courses.read',
        'training.read', 'training.conduct',
        'reports.view'
      ],
      
      [this.ROLE_TYPES.EMPLOYEE]: [
        'courses.read',
        'training.read'
      ]
    };

    return permissionMatrix[roleType] || [];
  }

  /**
   * Assegna un ruolo a un utente
   */
  async assignRole(userId, tenantId, roleType, options = {}) {
    try {
      const {
        companyId = null,
        departmentId = null,
        assignedBy = null,
        expiresAt = null,
        customPermissions = null
      } = options;

      // Verifica che l'utente esista e appartenga al tenant
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          OR: [
            { companyId: tenantId },
            { globalRole: 'SUPER_ADMIN' }
          ],
          eliminato: false
        }
      });

      if (!user) {
        throw new Error('User not found or does not belong to this tenant');
      }

      // Determina lo scope del ruolo
      let roleScope = this.ROLE_SCOPES.TENANT;
      if (roleType === this.ROLE_TYPES.GLOBAL_ADMIN) {
        roleScope = this.ROLE_SCOPES.GLOBAL;
      } else if (companyId) {
        roleScope = this.ROLE_SCOPES.COMPANY;
      } else if (departmentId) {
        roleScope = this.ROLE_SCOPES.DEPARTMENT;
      }

      // Ottieni le permissions di default per il ruolo
      const defaultPermissions = this.constructor.getDefaultPermissions(roleType);
      const permissions = customPermissions || defaultPermissions;

      // Verifica se esiste già un ruolo simile
      const existingRole = await prisma.enhancedUserRole.findFirst({
        where: {
          userId,
          tenantId,
          roleType,
          companyId,
          departmentId,
          eliminato: false
        }
      });

      if (existingRole) {
        // Aggiorna il ruolo esistente
        return await prisma.enhancedUserRole.update({
          where: { id: existingRole.id },
          data: {
            permissions: { permissions },
            isActive: true,
            assignedBy,
            assignedAt: new Date(),
            expiresAt
          }
        });
      } else {
        // Crea un nuovo ruolo
        return await prisma.enhancedUserRole.create({
          data: {
            userId,
            tenantId,
            roleType,
            roleScope,
            permissions: { permissions },
            companyId,
            departmentId,
            assignedBy,
            expiresAt
          }
        });
      }
    } catch (error) {
      console.error('[ENHANCED_ROLE_SERVICE] Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Rimuove un ruolo da un utente
   */
  async removeRole(userId, tenantId, roleType, companyId = null) {
    try {
      const result = await prisma.enhancedUserRole.updateMany({
        where: {
          userId,
          tenantId,
          roleType,
          companyId,
          eliminato: false
        },
        data: {
          isActive: false,
          eliminato: true
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('[ENHANCED_ROLE_SERVICE] Error removing role:', error);
      throw error;
    }
  }

  /**
   * Ottiene tutti i ruoli di un utente
   */
  async getUserRoles(userId, tenantId = null) {
    try {
      const where = {
        userId,
        isActive: true,
        eliminato: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      };

      if (tenantId) {
        where.tenantId = tenantId;
      }

      return await prisma.enhancedUserRole.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              ragione_sociale: true,
              slug: true
            }
          },
          company: {
            select: {
              id: true,
              ragione_sociale: true
            }
          }
        },
        orderBy: [
          { roleScope: 'asc' },
          { assignedAt: 'desc' }
        ]
      });
    } catch (error) {
      console.error('[ENHANCED_ROLE_SERVICE] Error getting user roles:', error);
      throw error;
    }
  }

  /**
   * Verifica se un utente ha una specifica permission
   */
  async hasPermission(userId, permission, context = {}) {
    try {
      const { tenantId, companyId, resourceId } = context;

      // Ottieni tutti i ruoli attivi dell'utente
      const userRoles = await this.getUserRoles(userId, tenantId);

      // Verifica se l'utente è global admin
      const hasGlobalAdmin = userRoles.some(role => 
        role.roleType === this.ROLE_TYPES.GLOBAL_ADMIN
      );

      if (hasGlobalAdmin) {
        return true;
      }

      // Verifica le permissions specifiche
      for (const role of userRoles) {
        const rolePermissions = role.permissions?.permissions || [];
        
        if (rolePermissions.includes(permission)) {
          // Verifica il contesto se necessario
          if (role.roleScope === this.ROLE_SCOPES.COMPANY && companyId) {
            if (role.companyId === companyId) {
              return true;
            }
          } else if (role.roleScope === this.ROLE_SCOPES.TENANT && tenantId) {
            if (role.tenantId === tenantId) {
              return true;
            }
          } else if (role.roleScope === this.ROLE_SCOPES.GLOBAL) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('[ENHANCED_ROLE_SERVICE] Error checking permission:', error);
      return false;
    }
  }

  /**
   * Ottiene tutte le permissions di un utente
   */
  async getUserPermissions(userId, tenantId = null) {
    try {
      const userRoles = await this.getUserRoles(userId, tenantId);
      const allPermissions = new Set();

      userRoles.forEach(role => {
        const rolePermissions = role.permissions?.permissions || [];
        rolePermissions.forEach(permission => allPermissions.add(permission));
      });

      return Array.from(allPermissions);
    } catch (error) {
      console.error('[ENHANCED_ROLE_SERVICE] Error getting user permissions:', error);
      throw error;
    }
  }

  /**
   * Lista utenti con un ruolo specifico
   */
  async getUsersByRole(roleType, tenantId, companyId = null) {
    try {
      const where = {
        roleType,
        tenantId,
        isActive: true,
        eliminato: false
      };

      if (companyId) {
        where.companyId = companyId;
      }

      return await prisma.enhancedUserRole.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true
            }
          },
          company: {
            select: {
              id: true,
              ragione_sociale: true
            }
          }
        }
      });
    } catch (error) {
      console.error('[ENHANCED_ROLE_SERVICE] Error getting users by role:', error);
      throw error;
    }
  }

  /**
   * Aggiorna le permissions di un ruolo
   */
  async updateRolePermissions(roleId, permissions) {
    try {
      return await prisma.enhancedUserRole.update({
        where: { id: roleId },
        data: {
          permissions: { permissions }
        }
      });
    } catch (error) {
      console.error('[ENHANCED_ROLE_SERVICE] Error updating role permissions:', error);
      throw error;
    }
  }

  /**
   * Ottiene statistiche sui ruoli per un tenant
   */
  async getRoleStatistics(tenantId) {
    try {
      const stats = await prisma.enhancedUserRole.groupBy({
        by: ['roleType'],
        where: {
          tenantId,
          isActive: true,
          eliminato: false
        },
        _count: {
          userId: true
        }
      });

      const result = {};
      stats.forEach(stat => {
        result[stat.roleType] = stat._count.userId;
      });

      return result;
    } catch (error) {
      console.error('[ENHANCED_ROLE_SERVICE] Error getting role statistics:', error);
      throw error;
    }
  }

  /**
   * Verifica e pulisce ruoli scaduti
   */
  async cleanupExpiredRoles() {
    try {
      const result = await prisma.enhancedUserRole.updateMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      console.log(`[ENHANCED_ROLE_SERVICE] Deactivated ${result.count} expired roles`);
      return result.count;
    } catch (error) {
      console.error('[ENHANCED_ROLE_SERVICE] Error cleaning up expired roles:', error);
      throw error;
    }
  }

  /**
   * Middleware per verificare permissions
   */
  requirePermission(permission, contextExtractor = null) {
    return async (req, res, next) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        let context = {
          tenantId: req.tenantId,
          companyId: req.user?.companyId
        };

        // Estrai contesto aggiuntivo se fornito
        if (contextExtractor && typeof contextExtractor === 'function') {
          const additionalContext = contextExtractor(req);
          context = { ...context, ...additionalContext };
        }

        const hasPermission = await this.hasPermission(userId, permission, context);
        
        if (!hasPermission) {
          return res.status(403).json({ 
            error: 'Insufficient permissions',
            required: permission,
            context
          });
        }

        next();
      } catch (error) {
        console.error('[ENHANCED_ROLE_SERVICE] Permission check error:', error);
        res.status(500).json({ error: 'Permission check failed' });
      }
    };
  }
}

export default new EnhancedRoleService();